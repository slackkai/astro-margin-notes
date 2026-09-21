import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkDirective from 'remark-directive';
import remarkNotes from '../src/utils/remark-notes.mjs';

const processor = await createMarkdownProcessor({
  remarkPlugins: [remarkMath, remarkDirective, [remarkNotes, { expandLabel: '展开批注' }]],
  rehypePlugins: [rehypeKatex],
  syntaxHighlight: false,
});
const render = async markdown => (await processor.render(markdown)).code;

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
  assert.ok(html.includes('d_k</annotation>'));
  assert.equal((html.match(/class="note-wrap"/g) ?? []).length, 1);
});

test('notes work inside list items and next to display math', async () => {
  const html = await render('- 列表 :note[批注]\n\n$$\nx^2\n$$\n');
  assert.ok(html.includes(`<li>列表 ${note('批注')}</li>`), html);
  assert.ok(html.includes('class="katex-display"'));
});

test('other directives are restored as literal text instead of becoming empty elements', async () => {
  assert.equal(await render('时间 10:30，key:value，表情 :tada: 结尾。'), '<p>时间 10:30，key:value，表情 :tada: 结尾。</p>');
  assert.equal(await render('未知 :callout[内容]{.x} 结尾。'), '<p>未知 :callout[内容]{.x} 结尾。</p>');
  assert.equal(await render('::leaf[x]\n\n:::box\n内容\n:::\n'), '<p>::leaf[x]</p>\n<p>:::box\n内容\n:::</p>');
  assert.ok(!(await render('a :value b ::x c')).includes('<div'));
});

test('code spans and code blocks are untouched', async () => {
  assert.equal(await render('用 `:note[原样]` 写。'), '<p>用 <code>:note[原样]</code> 写。</p>');
  assert.ok((await render('```md\n:mark[原样]\n```\n')).includes(':mark[原样]'));
});
