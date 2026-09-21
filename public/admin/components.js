/* global CMS, katex */
// Rich text editor components for the Markdown syntax this theme adds:
//   :note[…]  margin note   :mark[…]  highlighter   $$ … $$  display math
// The site renders them with src/utils/remark-notes.mjs and remark-math.

const inlineText = String.raw`(?<text>(?:[^\[\]]|\[[^\[\]]*\])*)`;
const oneLine = text => text.replace(/\s*\n\s*/g, ' ').trim();

CMS.registerEditorComponent({
  id: 'note',
  label: '页边批注',
  icon: 'sticky_note_2',
  trigger: 'button',
  mode: 'dialog',
  summary: '{{text}}',
  fields: [{ name: 'text', label: '批注内容', widget: 'text', hint: '支持 **加粗**、[链接](url) 和 $行内公式$。' }],
  pattern: new RegExp(String.raw`:note\[${inlineText}\]`),
  toBlock: ({ text = '' }) => `:note[${oneLine(text)}]`,
  toPreview: ({ text = '' }) => `<label class="note-wrap"><span class="note-ref"></span><span class="note">${text}</span></label>`,
});

CMS.registerEditorComponent({
  id: 'mark',
  label: '荧光笔',
  icon: 'ink_highlighter',
  trigger: 'button',
  mode: 'dialog',
  summary: '{{text}}',
  fields: [{ name: 'text', label: '高亮文字' }],
  pattern: new RegExp(String.raw`:mark\[${inlineText}\]`),
  toBlock: ({ text = '' }) => `:mark[${oneLine(text)}]`,
  toPreview: ({ text = '' }) => `<span class="mark">${text}</span>`,
});

CMS.registerEditorComponent({
  id: 'math-block',
  label: '公式（独立一行）',
  icon: 'function',
  mode: 'dialog',
  summary: '{{tex}}',
  fields: [{ name: 'tex', label: 'LaTeX', widget: 'text', hint: '行内公式直接在正文中写 $…$。' }],
  pattern: /^\$\$\n(?<tex>[\s\S]+?)\n\$\$$/m,
  toBlock: ({ tex = '' }) => `$$\n${tex.trim()}\n$$`,
  toPreview: ({ tex = '' }) => {
    const element = document.createElement('div');
    element.className = 'math-display';
    if (typeof katex === 'undefined') element.textContent = tex;
    else element.innerHTML = katex.renderToString(tex, { displayMode: true, output: 'mathml', throwOnError: false });
    return element;
  },
});

CMS.registerPreviewStyle('./preview.css');
