import { readFile, writeFile, unlink, access, mkdir, rm, cp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { tagSlug } from '../src/utils/base-path.mjs';

// Real production-build regression: use unique temporary fixtures and always restore them.
const marker = `regression-${process.pid}`;
const file = `src/content/insight/${marker}.md`;
const published = `src/content/library/${marker}.md`;
const projectDir = `src/content/projects/${marker}`;
const project = `${projectDir}/index.md`;
const aboutFile = 'src/content/about/about.md';
const created = [];
const originalAbout = await readFile(aboutFile, 'utf8').catch(() => undefined);
const original = await readFile('src/config.ts', 'utf8');
const env = { ...process.env, BASE_PATH: '/test-site', SITE_URL: 'https://example.org' };
const build = () => execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { env, stdio: 'pipe' });
const missing = async path => { try { await access(path); return false; } catch { return true; } };
try {
  await writeFile(file, `---\ntitle: ${marker}\ndate: 2026-01-01\ntags: [${marker}]\ndraft: true\n---\nSecret draft fixture.\n`, { flag: 'wx' });
  created.push(file);
  await writeFile(published, `---\ntitle: Published fixture\ndate: 2026-01-01\nupdated: ''\nurl: ''\nauthor: null\nrating: null\nstatus: ''\ncover: ''\nsummary: null\ntags: [${marker}-public, "中文", "C++", "C#", "AI/ML", "..", "con"]\n---\n[Home](/)\n![Icon](/favicon.svg)\n`, { flag: 'wx' });
  created.push(published);
  // A project bundle as the CMS writes it: index.md, attachments next to it, and a document of its own.
  const cmsProject = (await readFile('tests/fixtures/cms-project.md', 'utf8')).replace('/uploads/cover.png', './attachments/cover.svg')
    + '\n![封面](./attachments/cover.svg)\n\n::embed[演示]{page=./attachments/demo}\n\n[文档](note/index.md)\n';
  await mkdir(`${projectDir}/attachments/demo`, { recursive: true });
  await mkdir(`${projectDir}/note/attachments`, { recursive: true });
  await cp('public/favicon.svg', `${projectDir}/attachments/cover.svg`);
  await writeFile(`${projectDir}/attachments/demo/index.html`, '<!doctype html><title>demo</title><p>embedded</p>\n');
  await writeFile(project, cmsProject, { flag: 'wx' });
  await cp('public/favicon.svg', `${projectDir}/note/attachments/figure.svg`);
  await writeFile(`${projectDir}/note/index.md`, `---\ntitle: Project note\ndate: 2026-01-02\ntags: [${marker}-note]\ndraft: false\n---\n![图](./attachments/figure.svg)\n`);
  await mkdir('src/content/about', { recursive: true });
  await writeFile(aboutFile, ['---', 'highlights:', '  - title: 自定义板块', '    desc: 来自 about.md', 'workbench:', '  tools:', '    - name: 测试工具', '  hardware: []', '  questions: []', '---', '', '自我介绍来自 Markdown，:mark[可在后台编辑]。', ''].join(String.fromCharCode(10)));
  build();
  assert.ok(await missing(`dist/insight/${marker}/index.html`), 'draft page leaked');
  assert.ok(await missing(`dist/tags/${marker}/index.html`), 'draft tag leaked');
  assert.ok(await missing('dist/drafts/index.html'), 'draft list leaked');
  assert.ok(await missing(`dist/projects/${marker}/index.html`), 'CMS draft project leaked');
  assert.ok(await missing(`dist/projects/${marker}/attachments`), 'attachments of a draft project were published');
  assert.ok(await missing(`dist/projects/${marker}/note/index.html`), 'document of a draft project leaked');
  assert.ok(await missing(`dist/tags/${marker}-note/index.html`), 'tag of a hidden document leaked');
  const rss = await readFile('dist/rss.xml', 'utf8');
  assert.ok(!rss.includes(`<title>${marker}</title>`), 'draft leaked to RSS');
  assert.ok(rss.includes(`/test-site/library/${marker}/`), 'library missing from RSS or base lost');
  assert.ok(rss.includes('note-wrap'), 'RSS full text missing rendered margin notes'); // attribute quotes are XML-escaped
  assert.ok(rss.includes('https://example.org/test-site/favicon.svg'), 'RSS full text lost site origin or base');
  const page = await readFile(`dist/library/${marker}/index.html`, 'utf8');
  assert.ok(page.includes('href="/test-site/"'), 'Markdown link base lost');
  assert.ok(page.includes('src="/test-site/favicon.svg"'), 'Markdown image base lost');
  assert.ok(!(await missing(`dist/tags/${marker}-public/index.html`)), 'library tag route missing');
  for (const tag of ['中文', 'C++', 'C#', 'AI/ML', '..', 'con']) assert.ok(!(await missing(`dist/tags/${tagSlug(tag)}/index.html`)), `tag route missing: ${tag}`);

  let disabled = original.replace('library: { enabled: true', 'library: { enabled: false');
  for (const key of ['readingProgress', 'toc', 'postMeta', 'relatedPosts', 'heatmap', 'guestbook', 'nowCard']) disabled = disabled.replace(`${key}: true`, `${key}: false`);
  disabled = disabled.replace("defaultPalette: 'blue'", "defaultPalette: 'green'");
  await writeFile('src/config.ts', disabled);
  await writeFile(project, cmsProject.replace('draft: true', 'draft: false'));
  build();
  const projectPage = await readFile(`dist/projects/${marker}/index.html`, 'utf8');
  assert.ok(projectPage.includes(`src="/test-site/projects/${marker}/attachments/cover.svg"`), 'bundle cover not resolved next to the entry (or base lost)');
  assert.ok(!(await missing(`dist/projects/${marker}/attachments/demo/index.html`)), 'published attachments not copied');
  assert.ok(projectPage.includes(`<iframe class="embed-page" src="/test-site/projects/${marker}/attachments/demo/"`), 'embedded page not rendered as a same-origin iframe');
  assert.ok(projectPage.includes(`href="/test-site/projects/${marker}/note/"`), 'link to a sibling Markdown file not turned into a page URL');
  assert.ok(projectPage.includes('project-docs') && projectPage.includes('Project note'), 'project page does not list its documents');
  assert.ok(!projectPage.includes('1970-01-01'), 'empty updated became the Unix epoch');
  assert.ok(projectPage.includes('https://github.com/example/project'), 'valid link lost while clearing other links');
  const docPage = await readFile(`dist/projects/${marker}/note/index.html`, 'utf8');
  assert.ok(docPage.includes(`src="/test-site/projects/${marker}/note/attachments/figure.svg"`), 'document attachment not resolved');
  assert.ok(docPage.includes(`href="/test-site/projects/${marker}/"`) && docPage.includes('doc-parent'), 'document page lacks the link back to its project');
  const projectsIndex = await readFile('dist/projects/index.html', 'utf8');
  assert.ok(projectsIndex.includes(`/projects/${marker}/"`) && !projectsIndex.includes(`/projects/${marker}/note/`), 'documents must not appear as projects');
  assert.ok((await readFile('dist/projects/rss.xml', 'utf8')).includes(`/test-site/projects/${marker}/`), 'published CMS project missing from feed');
  assert.ok(await missing(`dist/library/${marker}/index.html`), 'disabled content still built');
  assert.ok(await missing('dist/library/rss.xml'), 'disabled feed still built');
  assert.ok(await missing(`dist/tags/${marker}-public/index.html`), 'disabled tag still built');
  const home = await readFile('dist/index.html', 'utf8');
  assert.ok(!home.includes('href="/test-site/library/"'), 'disabled section still linked');
  assert.ok(home.includes('data-default-palette="green"'), 'default palette ignored');
  const article = await readFile('dist/academic/attention-is-all-you-need/index.html', 'utf8');
  for (const id of ['read-progress', 'toc']) assert.ok(!article.includes(`id="${id}"`), `${id} toggle ignored`);
  assert.equal((article.match(/class="note-wrap"/g) ?? []).length, 3, 'Markdown margin notes missing');
  assert.equal((article.match(/class="mark"/g) ?? []).length, 2, 'Markdown highlights missing');
  assert.ok(!article.includes(':note[') && !article.includes(':mark['), 'directive syntax leaked into the page');
  // The syntax showcase project exercises every directive family (docs/SYNTAX.md).
  const showcase = await readFile('dist/projects/syntax-showcase/index.html', 'utf8');
  for (const needle of ['class="sticky sticky-tip"', 'class="note-block"', 'class="photos photos-scatter"', 'class="fold"', 'class="steps-list"', 'class="layout layout-wide"',
    'class="pen pen-hide"', 'class="stamp stamp-green"', 'class="mark mark-yellow"', 'class="media-frame taped media-video"', 'class="media-facade"', 'class="embed-snippet"', 'class="bookmark hand-card is-link"',
    'src="/test-site/projects/syntax-showcase/attachments/ik-arm/"', 'src="/test-site/projects/syntax-showcase/attachments/arm-demo.mp4"']) {
    assert.ok(showcase.includes(needle), `showcase page missing ${needle}`);
  }
  assert.ok(!/:::|::video|::embed|:pen\[/.test(showcase.replace(/<code>[\s\S]*?<\/code>/g, '')), 'directive syntax leaked into the showcase page');
  assert.ok(!(await missing('dist/projects/syntax-showcase/attachments/ik-arm/index.html')), 'showcase embed page not published');
  const about = await readFile('dist/about/index.html', 'utf8');
  assert.ok(about.includes('自我介绍来自 Markdown'), 'About intro from src/content/about not rendered');
  assert.ok(about.includes('自定义板块') && about.includes('来自 about.md'), 'About highlights from about.md not rendered');
  assert.ok(about.includes('测试工具') && about.includes('bench-title'), 'About workbench from about.md not rendered');
  console.log('Production regression passed: bundles and attachments, project documents, Markdown directives, CMS empty fields, draft/published projects, covers, RSS, tags, Markdown assets, disabled sections and feature switches.');
} catch (error) {
  if (error.stdout) console.error(error.stdout.toString().slice(-5000));
  if (error.stderr) console.error(error.stderr.toString().slice(-5000));
  throw error;
} finally {
  await writeFile('src/config.ts', original);
  if (originalAbout === undefined) await unlink(aboutFile).catch(() => {}); else await writeFile(aboutFile, originalAbout);
  for (const path of created) await unlink(path);
  await rm(projectDir, { recursive: true, force: true });
}
