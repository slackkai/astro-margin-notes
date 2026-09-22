import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkDirective from 'remark-directive';
import remarkAttachments from '../src/markdown/remark-attachments.mjs';
import remarkNotebook from '../src/markdown/remark-notebook.mjs';
import remarkDirectives from '../src/markdown/remark-directives.mjs';
import { directives } from '../src/markdown/directives.mjs';

const warnings = [];
const processor = await createMarkdownProcessor({
  remarkPlugins: [remarkMath, remarkDirective, remarkAttachments, remarkNotebook, [remarkDirectives, { warn: message => warnings.push(message) }]],
  rehypePlugins: [rehypeKatex],
  syntaxHighlight: false,
});
// A pretend content file: relative URLs resolve against its folder exactly as in the site.
const temp = await mkdtemp(path.join(tmpdir(), 'notebook-'));
const entryDir = path.join(temp, 'src', 'content', 'projects', 'demo');
await mkdir(path.join(entryDir, 'attachments'), { recursive: true });
await writeFile(path.join(entryDir, 'attachments', 'figure.html'), '<figure><img src="attachments/plot.svg" alt=""><figcaption>Plot</figcaption></figure>\n');
const entryFile = pathToFileURL(path.join(entryDir, 'index.md'));
test.after(() => rm(temp, { recursive: true, force: true }));

const render = async (markdown, fileURL = entryFile) => (await processor.render(markdown, { fileURL })).code;
const block = (name, body, head = '') => `:::${name}${head}\n${body}\n:::\n`;

// The exact markup produced by src/components/mdx/Note.astro and Mark.astro.
const note = inner => `<label class="note-wrap"><input type="checkbox" class="note-toggle" aria-label="展开批注"><span class="note-ref"></span><span class="note">${inner}</span></label>`;
const mark = inner => `<span class="mark">${inner}</span>`;

test(':note[] and :mark[] render exactly like the MDX components', async () => {
  assert.equal(await render('正文 :mark[重点] 与 :note[一条批注]。'), `<p>正文 ${mark('重点')} 与 ${note('一条批注')}。</p>`);
});

test('notes keep inline Markdown, links, math and nested highlights', async () => {
  const html = await render('见 :note[**加粗** [链接](https://example.com/a_b) 与 :mark[高亮]，以及 $d_k$。]');
  const opening = note('').replace('</span></label>', '');
  assert.ok(html.startsWith(`<p>见 ${opening}<strong>加粗</strong> <a href="https://example.com/a_b">链接</a> 与 ${mark('高亮')}，以及 <span class="katex">`), html);
  assert.ok(html.endsWith('。</span></label></p>'), html);
  assert.equal((html.match(/class="note-wrap"/g) ?? []).length, 1);
});

test('notes work inside list items and next to display math', async () => {
  const html = await render('- 列表 :note[批注]\n\n$$\nx^2\n$$\n');
  assert.ok(html.includes(`<li>列表 ${note('批注')}</li>`), html);
  assert.ok(html.includes('class="katex-display"'));
});

test('unknown directives are restored as literal text; block forms are reported', async () => {
  assert.equal(await render('时间 10:30，key:value，表情 :tada: 结尾。'), '<p>时间 10:30，key:value，表情 :tada: 结尾。</p>');
  assert.equal(await render('未知 :callout[内容]{.x} 结尾。'), '<p>未知 :callout[内容]{.x} 结尾。</p>');
  warnings.length = 0;
  assert.equal(await render('::leaf[x]\n\n:::box\n内容\n:::\n'), '<p>::leaf[x]</p>\n<p>:::box\n内容\n:::</p>');
  assert.equal(warnings.length, 2, warnings.join('\n'));
  assert.ok(warnings[0].includes('::leaf') && warnings[1].includes(':::box'));
  assert.ok(!(await render('a :value b ::x c')).includes('<div'));
});

test('code spans and code blocks are untouched', async () => {
  assert.equal(await render('用 `:note[原样]` 写。'), '<p>用 <code>:note[原样]</code> 写。</p>');
  assert.ok((await render('```md\n:mark[原样]\n```\n')).includes(':mark[原样]'));
});

test('highlighter colours, pen marks and stamps', async () => {
  assert.ok((await render(':mark[绿]{green} :mark[粉]{.pink} :mark[黄]{yellow}')).includes('class="mark mark-green">绿</span> <span class="mark mark-pink pink">粉</span> <span class="mark mark-yellow">黄</span>'));
  assert.equal(await render(':pen[默认] :pen[波浪]{wavy} :pen[框]{box} :pen[删]{strike}'),
    '<p><span class="pen pen-circle">默认</span> <span class="pen pen-wavy">波浪</span> <span class="pen pen-box">框</span> <span class="pen pen-strike">删</span></p>');
  assert.equal(await render(':pen[答案]{hide}'), '<p><label class="pen pen-hide"><input type="checkbox" class="pen-toggle" aria-label="显示被遮住的内容"><span class="pen-hidden">答案</span></label></p>');
  assert.equal(await render(':stamp[待验证] :stamp[通过]{green}'), '<p><span class="stamp stamp-red">待验证</span> <span class="stamp stamp-green">通过</span></p>');
});

test('sticky notes carry their kind label and title', async () => {
  const html = await render(block('postit', '内容 :mark[高亮]', '[标题]{warn}'));
  assert.ok(html.startsWith('<aside class="sticky sticky-warn" role="note"><span class="sticky-kind">⚠️ 注意</span><p class="sticky-title">标题</p>'), html);
  assert.ok(html.includes(`<p>内容 ${mark('高亮')}</p></aside>`), html);
  assert.equal(await render(block('postit', '素的')), '<aside class="sticky" role="note"><p>素的</p></aside>');
});

test('block margin notes accept several paragraphs and a title', async () => {
  const html = await render(block('note', '第一段\n\n- 列表', '[看这里]'));
  assert.equal(html, '<aside class="note-block"><p class="note-block-title">看这里</p><p>第一段</p><ul>\n<li>列表</li>\n</ul></aside>');
});

test('photos become taped figures with captions and attachment URLs', async () => {
  const html = await render(block('photos', '![机械臂](./attachments/arm.svg)\n![](./attachments/dog.svg "四足")', '{cols=3 scatter}'));
  assert.equal(html, '<div class="photos photos-scatter" style="--cols:3"><figure class="photo"><img src="/projects/demo/attachments/arm.svg" alt="机械臂"><figcaption>机械臂</figcaption></figure><figure class="photo"><img src="/projects/demo/attachments/dog.svg" alt="" title="四足"><figcaption>四足</figcaption></figure></div>');
  assert.ok((await render(block('photos', '![](a.png)'))).startsWith('<div class="photos photos-single" style="--cols:1">'));
  warnings.length = 0;
  assert.equal(await render(block('photos', '没有图片')), '<p>:::photos\n没有图片\n:::</p>');
  assert.equal(warnings.length, 1);
});

test('folds, steps and layouts', async () => {
  assert.equal(await render(block('fold', '内容', '[标题]{open}')), '<details class="fold" open><summary class="fold-summary">标题</summary><div class="fold-body"><p>内容</p></div></details>');
  assert.ok((await render(block('fold', '内容'))).startsWith('<details class="fold"><summary class="fold-summary">展开</summary>'));
  assert.equal(await render(block('steps', '1. 一\n2. 二', '{timeline}')), '<div class="steps steps-timeline"><ol class="steps-list">\n<li>一</li>\n<li>二</li>\n</ol></div>');
  assert.equal(await render(block('layout', '左\n\n右', '{cols=2}')), '<div class="layout layout-cols" style="--cols:2"><p>左</p><p>右</p></div>');
  assert.equal(await render(block('layout', '宽', '{wide}')), '<div class="layout layout-wide"><p>宽</p></div>');
  warnings.length = 0;
  assert.ok((await render(block('steps', '没有列表'))).startsWith('<p>:::steps'));
  assert.ok((await render(block('layout', '无参数'))).startsWith('<p>:::layout'));
  assert.equal(warnings.length, 2);
});

test('videos: local files, click-to-load YouTube and Bilibili', async () => {
  assert.equal(await render('::video[演示]{src=./attachments/run.mp4 poster=./attachments/poster.webp loop}'),
    '<figure class="media taped media-video"><video src="/projects/demo/attachments/run.mp4" poster="/projects/demo/attachments/poster.webp" controls playsinline preload="metadata" loop muted autoplay></video><figcaption>演示</figcaption></figure>');
  const youtube = await render('::video{youtube=dQw4w9WgXcQ}');
  assert.ok(youtube.includes('<a class="media-facade" href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" data-embed="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1" target="_blank" rel="noopener"><span class="media-play">▶ 播放 · YouTube</span></a>'), youtube);
  assert.ok((await render('::video{bilibili=BV1GJ411x7h7}')).includes('data-embed="https://player.bilibili.com/player.html?bvid=BV1GJ411x7h7&#x26;autoplay=1'));
  warnings.length = 0;
  assert.equal(await render('::video{youtube="<script>"}'), '<p>::video{youtube="&#x3C;script>"}</p>');
  assert.equal(warnings.length, 1);
});

test('embeds: same-origin pages and inlined snippets', async () => {
  assert.equal(await render('::embed[交互演示]{page=./attachments/demo height=320}'),
    '<figure class="media taped media-page"><iframe class="embed-page" src="/projects/demo/attachments/demo/" loading="lazy" title="嵌入页面" style="height:320px" data-fixed="true"></iframe><figcaption>交互演示</figcaption></figure>');
  assert.ok((await render('::embed{page=./attachments/demo/index.html}')).includes('src="/projects/demo/attachments/demo/index.html" loading="lazy" title="嵌入页面"></iframe>'));
  assert.equal(await render('::embed[图]{snippet=./attachments/figure.html}'),
    '<div class="embed-snippet"><figure><img src="/projects/demo/attachments/plot.svg" alt=""><figcaption>Plot</figcaption></figure>\n<p class="embed-caption">图</p></div>');
  await assert.rejects(render('::embed{snippet=./attachments/missing.html}'), /Embed snippet not found/);
});

test('bookmarks show the host and open external links in a new tab', async () => {
  const html = await render('::bookmark[Astro 文档]{url=https://docs.astro.build/en/guides/ desc="内容集合与 Markdown"}');
  assert.ok(html.startsWith('<a class="bookmark hand-card is-link" href="https://docs.astro.build/en/guides/" target="_blank" rel="noopener"><svg class="clip"'), html);
  assert.ok(html.includes('<span class="bookmark-title">Astro 文档</span><span class="bookmark-desc">内容集合与 Markdown</span><span class="bookmark-host">docs.astro.build</span></a>'), html);
  assert.ok((await render('::bookmark{url=../other/}')).includes('href="/projects/other/"'));
  warnings.length = 0;
  assert.ok((await render('::bookmark{url=javascript:alert(1)}')).startsWith('<p>::bookmark'));
  assert.equal(warnings.length, 1);
});

test('{#id}, {.class} and {tilt=} work on every directive', async () => {
  assert.equal(await render(':stamp[x]{#s .big tilt=-2}'), '<p><span class="stamp stamp-red big" id="s" style="--tilt:-2deg">x</span></p>');
  assert.ok((await render(block('postit', '内', '{tip #note-1 tilt=1.5}'))).startsWith('<aside class="sticky sticky-tip" role="note" id="note-1" style="--tilt:1.5deg">'));
});

test('relative URLs resolve against the entry folder; links to Markdown files become pages', async () => {
  const html = await render('![图](./attachments/a.webp) [兄弟](../other/) [文档](log/index.md) [绝对](/about/) [外部](https://x.test/a) <img src="attachments/b.png">\n\n[定义][ref]\n\n[ref]: ./attachments/paper.pdf');
  for (const expected of ['src="/projects/demo/attachments/a.webp"', 'href="/projects/other/"', 'href="/projects/demo/log/"', 'href="/about/"', 'href="https://x.test/a"', 'src="/projects/demo/attachments/b.png"', 'href="/projects/demo/attachments/paper.pdf"']) assert.ok(html.includes(expected), expected + '\n' + html);
  // Outside src/content nothing is rewritten.
  assert.ok((await render('![图](./attachments/a.webp)', pathToFileURL(path.join(temp, 'README.md')))).includes('./attachments/a.webp'));
});

test('quote sources and footnotes in the margin', async () => {
  assert.equal(await render('> 简单胜于复杂。\n>\n> —— 某人'), '<blockquote>\n<p>简单胜于复杂。</p>\n<p class="quote-source">某人</p>\n</blockquote>');
  assert.equal(await render('> 只有一段 —— 不是出处'), '<blockquote>\n<p>只有一段 —— 不是出处</p>\n</blockquote>');
  const html = await render('正文[^a]。\n\n[^a]: 脚注 **内容**\n\n    第二段\n');
  assert.equal(html, `<p>正文${note('脚注 <strong>内容</strong><br>第二段')}。</p>`);
});

test('every directive has a CMS component and a docs entry', async () => {
  const components = await readFile(new URL('../public/admin/components.js', import.meta.url), 'utf8');
  const ids = new Set([...components.matchAll(/^\s*id: '([\w-]+)'/gm)].map(m => m[1]));
  const docs = await readFile(new URL('../docs/SYNTAX.md', import.meta.url), 'utf8');
  for (const name of Object.keys(directives)) {
    assert.ok(ids.has(name), `public/admin/components.js lacks a component with id '${name}'`);
    assert.ok(docs.includes(`:${name}`), `docs/SYNTAX.md does not document :${name}`);
    for (const variant of directives[name].variants) assert.ok(docs.includes(variant), `docs/SYNTAX.md does not mention ${name} variant ${variant}`);
  }
});
