import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { parse } from 'parse5';

const root = resolve('dist');
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const site = new URL(process.env.SITE_URL || 'https://example.com');
const errors = [];
const pages = new Map();
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, item.name);
    if (item.isDirectory()) await walk(file);
    else if (item.name.endsWith('.html')) {
      const rel = relative(root, file).split(sep).join('/');
      const pathname = '/' + rel.replace(/index\.html$/, '');
      const html = await readFile(file, 'utf8');
      const doc = parse(html);
      const links = [], ids = new Set();
      const visit = node => {
        const attrs = Object.fromEntries((node.attrs || []).map(a => [a.name, a.value]));
        if (attrs.id) ids.add(attrs.id);
        for (const key of ['href', 'src', 'poster']) if (attrs[key]) links.push(attrs[key]);
        for (const child of node.childNodes || []) visit(child);
      };
      visit(doc);
      pages.set(file, { pathname, links, ids });
      if (/\/(?:drafts|lab)\//.test(pathname)) errors.push(`Development-only route leaked: ${pathname}`);
    }
  }
}
await walk(root);
let count = 0;
for (const { pathname, links } of pages.values()) {
  for (const link of links) {
    if (/^(?:mailto:|tel:|data:|javascript:)/i.test(link)) continue;
    const url = new URL(link, new URL(base + pathname, site));
    if (url.origin !== site.origin) continue;
    count++;
    if (base && !url.pathname.startsWith(base + '/') && url.pathname !== base) {
      errors.push(`${pathname}: missing base in ${link}`); continue;
    }
    const local = decodeURIComponent(url.pathname.slice(base.length));
    let target = resolve(root, '.' + local);
    if (target !== root && !target.startsWith(root + sep)) { errors.push(`Escaping URL: ${link}`); continue; }
    try {
      if ((await stat(target)).isDirectory()) target = join(target, 'index.html');
      await stat(target);
    } catch { errors.push(`${pathname}: missing target ${link}`); continue; }
    if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) {
      errors.push(`${pathname}: missing anchor ${link}`);
    }
  }
}
const cms = JSON.parse(await readFile(join(root, 'admin/config.yml'), 'utf8'));
if (!cms.backend.repo || cms.collections.length !== 6) errors.push('CMS configuration missing collections/repository');
if (!cms.media_libraries?.default?.config?.transformations?.raster_image) errors.push('CMS upload optimization missing');
for (const name of ['admin/index.html', 'admin/components.js', 'admin/preview.css', 'admin/vendor/sveltia-cms.js', 'admin/vendor/katex.min.js']) {
  await stat(join(root, name)).catch(() => errors.push(`CMS asset missing: ${name}`));
}
await stat(join(root, 'pagefind/pagefind.js'));
for (const name of ['rss.xml', 'sitemap-0.xml']) {
  const xml = await readFile(join(root, name), 'utf8');
  if (base && xml.includes(`${site.origin}/insight/`)) errors.push(`${name}: missing deployment base`);
}
const feed = await readFile(join(root, 'rss.xml'), 'utf8');
if (!feed.includes('<content:encoded>')) errors.push('rss.xml: full-text content missing');
// Full-text bodies are entity-escaped; every internal href/src must already be absolute.
if (/(?:href|src)=&quot;\/(?!\/)/.test(feed)) errors.push('rss.xml: relative URL inside full-text content');
if (!(await readFile(join(root, 'about/index.html'), 'utf8')).includes('about-text')) errors.push('about page missing intro');
if (errors.length) {
  console.error(errors.join('\n')); process.exitCode = 1;
} else console.log(`Verified ${pages.size} HTML pages, ${count} local links/assets, RSS, sitemap and CMS configuration (base: ${base || '/'}).`);
