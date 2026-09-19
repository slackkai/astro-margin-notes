import { readFile, writeFile, unlink, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { tagSlug } from '../src/utils/base-path.mjs';

// Real production-build regression: use unique temporary fixtures and always restore them.
const marker = `regression-${process.pid}`;
const file = `src/content/insight/${marker}.md`;
const published = `src/content/library/${marker}.md`;
const original = await readFile('src/config.ts', 'utf8');
const env = { ...process.env, BASE_PATH: '/test-site', SITE_URL: 'https://example.org' };
const build = () => execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { env, stdio: 'pipe' });
const missing = async path => { try { await access(path); return false; } catch { return true; } };
try {
  await writeFile(file, `---\ntitle: ${marker}\ndate: 2026-01-01\ntags: [${marker}]\ndraft: true\n---\nSecret draft fixture.\n`, { flag: 'wx' });
  await writeFile(published, `---\ntitle: Published fixture\ndate: 2026-01-01\ntags: [${marker}-public, "中文", "C++", "C#", "AI/ML", "..", "con"]\n---\n[Home](/)\n![Icon](/favicon.svg)\n`, { flag: 'wx' });
  build();
  assert.ok(await missing(`dist/insight/${marker}/index.html`), 'draft page leaked');
  assert.ok(await missing(`dist/tags/${marker}/index.html`), 'draft tag leaked');
  assert.ok(await missing('dist/drafts/index.html'), 'draft list leaked');
  const rss = await readFile('dist/rss.xml', 'utf8');
  assert.ok(!rss.includes(`<title>${marker}</title>`), 'draft leaked to RSS');
  assert.ok(rss.includes(`/test-site/library/${marker}/`), 'library missing from RSS or base lost');
  const page = await readFile(`dist/library/${marker}/index.html`, 'utf8');
  assert.ok(page.includes('href="/test-site/"'), 'Markdown link base lost');
  assert.ok(page.includes('src="/test-site/favicon.svg"'), 'Markdown image base lost');
  assert.ok(!(await missing(`dist/tags/${marker}-public/index.html`)), 'library tag route missing');
  for (const tag of ['中文', 'C++', 'C#', 'AI/ML', '..', 'con']) assert.ok(!(await missing(`dist/tags/${tagSlug(tag)}/index.html`)), `tag route missing: ${tag}`);

  let disabled = original.replace('library: { enabled: true', 'library: { enabled: false');
  for (const key of ['readingProgress', 'toc', 'postMeta', 'relatedPosts', 'heatmap', 'guestbook', 'nowCard']) disabled = disabled.replace(`${key}: true`, `${key}: false`);
  disabled = disabled.replace("defaultPalette: 'blue'", "defaultPalette: 'green'");
  await writeFile('src/config.ts', disabled);
  build();
  assert.ok(await missing(`dist/library/${marker}/index.html`), 'disabled content still built');
  assert.ok(await missing('dist/library/rss.xml'), 'disabled feed still built');
  assert.ok(await missing(`dist/tags/${marker}-public/index.html`), 'disabled tag still built');
  const home = await readFile('dist/index.html', 'utf8');
  assert.ok(!home.includes('href="/test-site/library/"'), 'disabled section still linked');
  assert.ok(home.includes('data-default-palette="green"'), 'default palette ignored');
  const article = await readFile('dist/academic/attention-is-all-you-need/index.html', 'utf8');
  for (const id of ['read-progress', 'toc']) assert.ok(!article.includes(`id="${id}"`), `${id} toggle ignored`);
  console.log('Production regression passed: drafts, RSS, tags, Markdown assets, disabled sections and feature switches.');
} catch (error) {
  if (error.stdout) console.error(error.stdout.toString().slice(-5000));
  if (error.stderr) console.error(error.stderr.toString().slice(-5000));
  throw error;
} finally {
  await writeFile('src/config.ts', original);
  await unlink(file);
  await unlink(published);
}
