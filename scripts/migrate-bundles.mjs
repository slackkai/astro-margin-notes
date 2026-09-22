/**
 * One-time migration to the bundle layout. Safe to re-run; pass --dry-run to only print the plan.
 *   academic/insight/projects:  <collection>/<slug>.md      →  <collection>/<slug>/index.md
 *   every collection:           /uploads/<file> references  →  ./attachments/<file> next to the entry
 * Uploads referenced by several entries are copied to each of them; the original is then removed.
 */
import { access, copyFile, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const root = path.resolve('src/content');
const uploads = path.resolve('public/uploads');
const BUNDLED = ['academic', 'insight', 'projects'];
const SHARED = ['dailies', 'library'];
const exists = async file => access(file).then(() => true, () => false);
const rel = file => path.relative(process.cwd(), file).split(path.sep).join('/');
const log = message => console.log(`${dryRun ? '[dry-run] ' : ''}${message}`);

// 1. Flat files in bundled collections become folders.
for (const collection of BUNDLED) {
  const dir = path.join(root, collection);
  if (!(await exists(dir))) continue;
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const match = item.isFile() && item.name.match(/^([^_].*)\.(md|mdx)$/);
    if (!match) continue;
    const target = path.join(dir, match[1], `index.${match[2]}`);
    if (await exists(target)) { console.error(`Both ${item.name} and ${match[1]}/index.${match[2]} exist; resolve by hand.`); process.exitCode = 1; continue; }
    log(`move ${rel(path.join(dir, item.name))} → ${rel(target)}`);
    if (dryRun) continue;
    await mkdir(path.dirname(target), { recursive: true });
    await rename(path.join(dir, item.name), target);
  }
}

// 2. Referenced uploads move next to the entries that use them.
const used = new Map(); // upload file → entries referencing it
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) { if (item.name !== 'attachments') await walk(full); continue; }
    if (!/\.(md|mdx)$/.test(item.name) || item.name.startsWith('_')) continue;
    const source = await readFile(full, 'utf8');
    for (const [, file] of source.matchAll(/\/uploads\/([^\s"')\]]+)/g)) used.set(file, [...new Set([...(used.get(file) ?? []), full])]);
  }
}
for (const collection of [...BUNDLED, ...SHARED]) if (await exists(path.join(root, collection))) await walk(path.join(root, collection));
const removable = [];
for (const [file, entries] of used) {
  const original = path.join(uploads, file);
  if (!(await exists(original))) { console.warn(`Referenced but missing: public/uploads/${file} (left as is)`); continue; }
  for (const entry of entries) {
    const target = path.join(path.dirname(entry), 'attachments', path.basename(file));
    log(`copy ${rel(original)} → ${rel(target)}; rewrite ${rel(entry)}`);
    if (dryRun) continue;
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(original, target);
    await writeFile(entry, (await readFile(entry, 'utf8')).split(`/uploads/${file}`).join(`./attachments/${path.basename(file)}`));
  }
  removable.push(original);
}
for (const original of removable) { log(`remove ${rel(original)}`); if (!dryRun) await rm(original); }
log(`done: ${used.size} upload${used.size === 1 ? '' : 's'} relocated`);
