/* global CMS, katex */
// Editor components for the notebook Markdown syntax (docs/SYNTAX.md). Every family in
// src/markdown/directives.mjs has a component here; tests/markdown.test.mjs checks the ids.
// Inline families are toolbar buttons, block families live in the Insert menu. Everything is
// stored as plain Markdown, so the rich text and Markdown modes round-trip without changes.

const inlineText = String.raw`(?<text>(?:[^\[\]]|\[[^\[\]]*\])*)`;
const oneLine = text => String(text ?? '').replace(/\s*\n\s*/g, ' ').trim();
const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const bracket = title => (oneLine(title) ? `[${oneLine(title)}]` : '');
// {key=value flag} in remark-directive syntax; values with spaces, quotes or = are quoted.
const attrs = pairs => {
  const list = pairs.map(([key, value]) => {
    if (value === true) return key;
    if (value === undefined || value === null || value === '' || value === false) return '';
    return /^[\w./:@%+~-]+$/.test(String(value)) ? `${key}=${value}` : `${key}="${String(value).replace(/"/g, '&quot;')}"`;
  }).filter(Boolean);
  return list.length ? `{${list.join(' ')}}` : '';
};
const parseAttrs = source => {
  const out = {};
  for (const m of String(source ?? '').matchAll(/([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s}]+)))?/g)) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? true;
  return out;
};
const choice = (name, label, options, extra = {}) => ({ name, label, widget: 'select', options, ...extra });
const body = (label = '内容', hint) => ({ name: 'body', label, widget: 'markdown', hint });
const container = (name, title, attributes, content) => `:::${name}${bracket(title)}${attributes}\n${String(content ?? '').trim()}\n:::`;
const containerPattern = (name, extra = '') => new RegExp(String.raw`^:::${name}(?:\[(?<title>[^\]\n]*)\])?${extra}\n(?<body>[\s\S]*?)\n:::$`, 'm');
// Blank lines let the preview renderer parse the body as Markdown inside the wrapper element.
const wrap = (open, content, close) => `${open}\n\n${String(content ?? '')}\n\n${close}`;
const KIND_LABELS = { tip: '💡 提示', warn: '⚠️ 注意', info: '📌 说明', question: '❓ 疑问' };

/* ---------- inline: toolbar buttons ---------- */
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
  fields: [
    { name: 'text', label: '高亮文字' },
    choice('color', '颜色（留空为默认色）', [{ label: '绿', value: 'green' }, { label: '粉', value: 'pink' }, { label: '黄', value: 'yellow' }], { required: false }),
  ],
  pattern: new RegExp(String.raw`:mark\[${inlineText}\](?:\{(?<color>green|pink|yellow)\})?`),
  toBlock: ({ text = '', color }) => `:mark[${oneLine(text)}]${color ? `{${color}}` : ''}`,
  toPreview: ({ text = '', color }) => `<span class="mark${color ? ` mark-${color}` : ''}">${text}</span>`,
});

CMS.registerEditorComponent({
  id: 'pen',
  label: '红笔',
  icon: 'draw',
  trigger: 'button',
  mode: 'dialog',
  summary: '{{text}}',
  fields: [
    { name: 'text', label: '文字' },
    choice('kind', '笔迹', [
      { label: '圈出来', value: 'circle' }, { label: '波浪线', value: 'wavy' }, { label: '方框', value: 'box' },
      { label: '划掉', value: 'strike' }, { label: '涂掉，点击才显示', value: 'hide' },
    ], { default: 'circle' }),
  ],
  pattern: new RegExp(String.raw`:pen\[${inlineText}\](?:\{(?<kind>circle|wavy|box|strike|hide)\})?`),
  toBlock: ({ text = '', kind = 'circle' }) => `:pen[${oneLine(text)}]${kind === 'circle' ? '' : `{${kind}}`}`,
  toPreview: ({ text = '', kind = 'circle' }) => (kind === 'hide'
    ? `<span class="pen pen-hide"><span class="pen-hidden">${text}</span></span>`
    : `<span class="pen pen-${kind}">${text}</span>`),
});

CMS.registerEditorComponent({
  id: 'stamp',
  label: '印章',
  icon: 'approval',
  trigger: 'button',
  mode: 'dialog',
  summary: '{{text}}',
  fields: [
    { name: 'text', label: '印章文字' },
    choice('color', '颜色', [{ label: '红', value: 'red' }, { label: '蓝', value: 'blue' }, { label: '绿', value: 'green' }], { default: 'red' }),
  ],
  pattern: new RegExp(String.raw`:stamp\[${inlineText}\](?:\{(?<color>red|blue|green)\})?`),
  toBlock: ({ text = '', color = 'red' }) => `:stamp[${oneLine(text)}]${color === 'red' ? '' : `{${color}}`}`,
  toPreview: ({ text = '', color = 'red' }) => `<span class="stamp stamp-${color}">${text}</span>`,
});

/* ---------- blocks: Insert menu ---------- */
CMS.registerEditorComponent({
  id: 'postit',
  label: '便利贴',
  icon: 'sticky_note_2',
  mode: 'dialog',
  summary: '{{title}}',
  fields: [
    choice('kind', '类型（留空为素便利贴）', [
      { label: '💡 提示', value: 'tip' }, { label: '⚠️ 注意', value: 'warn' }, { label: '📌 说明', value: 'info' }, { label: '❓ 疑问', value: 'question' },
    ], { required: false }),
    { name: 'title', label: '标题', required: false },
    body('内容'),
  ],
  pattern: containerPattern('postit', String.raw`(?:\{(?<kind>tip|warn|info|question)\})?`),
  toBlock: ({ kind, title, body }) => container('postit', title, kind ? `{${kind}}` : '', body),
  toPreview: ({ kind, title, body }) => wrap(
    `<aside class="sticky${kind ? ` sticky-${kind}` : ''}">${kind ? `<span class="sticky-kind">${KIND_LABELS[kind]}</span>` : ''}${title ? `<p class="sticky-title">${escapeHtml(title)}</p>` : ''}`,
    body, '</aside>'),
});

CMS.registerEditorComponent({
  id: 'note-block',
  label: '页边批注（多段）',
  icon: 'edit_note',
  mode: 'dialog',
  summary: '{{title}}',
  fields: [{ name: 'title', label: '标题', required: false }, body('内容', '可以放多段文字、列表、图片和公式；宽屏时浮在右侧页边。')],
  pattern: containerPattern('note'),
  toBlock: ({ title, body }) => container('note', title, '', body),
  toPreview: ({ title, body }) => wrap(`<aside class="note-block">${title ? `<p class="note-block-title">${escapeHtml(title)}</p>` : ''}`, body, '</aside>'),
});

CMS.registerEditorComponent({
  id: 'photos',
  label: '相片',
  icon: 'photo_library',
  mode: 'dialog',
  summary: '{{photos.length}} 张相片',
  fields: [
    { name: 'photos', label: '照片', widget: 'list', fields: [{ name: 'image', label: '图片', widget: 'image' }, { name: 'caption', label: '图注', required: false }] },
    { name: 'cols', label: '每行几张', widget: 'number', value_type: 'int', min: 1, max: 4, required: false, hint: '留空：一张居中，多张两列。' },
    { name: 'scatter', label: '随意散落', widget: 'boolean', default: false, required: false },
  ],
  pattern: /^:::photos(?:\{(?<attributes>[^}\n]*)\})?\n(?<lines>(?:!\[[^\]\n]*\]\([^)\n]*\)\n+)+):::$/m,
  fromBlock: ({ groups: { attributes, lines } }) => {
    const a = parseAttrs(attributes);
    return {
      photos: [...lines.matchAll(/!\[([^\]]*)\]\(([^)\s]*)(?:\s+"([^"]*)")?\)/g)].map(([, alt, image, title]) => ({ image, caption: title || alt })),
      cols: a.cols ? Number(a.cols) : undefined,
      scatter: a.scatter === true,
    };
  },
  toBlock: ({ photos = [], cols, scatter }) => `:::photos${attrs([['cols', cols], ['scatter', !!scatter]])}\n${photos.map(p => `![${oneLine(p.caption).replace(/[[\]]/g, '')}](${p.image ?? ''})`).join('\n')}\n:::`,
  toPreview: ({ photos = [], cols }) => `<div class="photos${photos.length === 1 ? ' photos-single' : ''}" style="--cols:${cols || (photos.length === 1 ? 1 : 2)}">${photos.map(p =>
    `<figure class="photo"><img src="${escapeHtml(p.image)}" alt="">${p.caption ? `<figcaption>${escapeHtml(p.caption)}</figcaption>` : ''}</figure>`).join('')}</div>`,
});

CMS.registerEditorComponent({
  id: 'fold',
  label: '折页',
  icon: 'unfold_more',
  mode: 'dialog',
  summary: '{{title}}',
  fields: [{ name: 'title', label: '标题' }, { name: 'open', label: '默认展开', widget: 'boolean', default: false, required: false }, body('折起来的内容')],
  pattern: containerPattern('fold', String.raw`(?<open>\{open\})?`),
  fromBlock: ({ groups: { title, open, body } }) => ({ title, open: !!open, body }),
  toBlock: ({ title, open, body }) => container('fold', title, open ? '{open}' : '', body),
  toPreview: ({ title, open, body }) => wrap(`<details class="fold"${open ? ' open' : ''}><summary class="fold-summary">${escapeHtml(title || '展开')}</summary><div class="fold-body">`, body, '</div></details>'),
});

CMS.registerEditorComponent({
  id: 'steps',
  label: '步骤 / 时间线',
  icon: 'format_list_numbered',
  mode: 'dialog',
  summary: '步骤',
  fields: [
    { name: 'timeline', label: '时间线样式（每条以 **日期** 开头）', widget: 'boolean', default: false, required: false },
    body('步骤', '写一个有序列表，每步一条。'),
  ],
  pattern: containerPattern('steps', String.raw`(?<timeline>\{timeline\})?`),
  fromBlock: ({ groups: { timeline, body } }) => ({ timeline: !!timeline, body }),
  toBlock: ({ timeline, body }) => container('steps', '', timeline ? '{timeline}' : '', body),
  toPreview: ({ timeline, body }) => wrap(`<div class="steps${timeline ? ' steps-timeline' : ''}">`, body, '</div>'),
});

CMS.registerEditorComponent({
  id: 'layout',
  label: '版式：加宽 / 分栏',
  icon: 'view_column',
  mode: 'dialog',
  summary: '{{mode}}',
  fields: [
    choice('mode', '版式', [{ label: '加宽，溢出正文栏', value: 'wide' }, { label: '分栏', value: 'cols' }], { default: 'wide' }),
    { name: 'cols', label: '栏数', widget: 'number', value_type: 'int', min: 2, max: 4, default: 2, required: false },
    body(),
  ],
  pattern: containerPattern('layout', String.raw`\{(?<attributes>[^}\n]*)\}`),
  fromBlock: ({ groups: { attributes, body } }) => {
    const a = parseAttrs(attributes);
    return { mode: a.cols ? 'cols' : 'wide', cols: a.cols ? Number(a.cols) : undefined, body };
  },
  toBlock: ({ mode = 'wide', cols, body }) => container('layout', '', mode === 'cols' ? `{cols=${cols || 2}}` : '{wide}', body),
  toPreview: ({ mode, cols, body }) => wrap(`<div class="layout ${mode === 'cols' ? 'layout-cols' : 'layout-wide'}" style="--cols:${cols || 2}">`, body, '</div>'),
});

CMS.registerEditorComponent({
  id: 'video',
  label: '视频',
  icon: 'smart_display',
  mode: 'dialog',
  summary: '{{caption}}',
  fields: [
    choice('source', '来源', [{ label: '上传的视频文件', value: 'file' }, { label: 'YouTube', value: 'youtube' }, { label: 'Bilibili', value: 'bilibili' }], { default: 'file' }),
    { name: 'file', label: '视频文件', widget: 'file', required: false, hint: '来源为“上传的视频文件”时使用；文件放进这篇文章的 attachments 文件夹。' },
    { name: 'id', label: '视频 ID', required: false, hint: 'YouTube 地址里 v= 后面的部分，或 Bilibili 的 BV 号。播放器在点击后才加载。' },
    { name: 'caption', label: '说明', required: false },
    { name: 'poster', label: '封面图', widget: 'image', required: false },
    { name: 'loop', label: '静音自动循环', widget: 'boolean', default: false, required: false },
  ],
  pattern: /^::video(?:\[(?<caption>[^\]\n]*)\])?\{(?<attributes>[^}\n]*)\}$/m,
  fromBlock: ({ groups: { caption, attributes } }) => {
    const a = parseAttrs(attributes);
    return { source: a.youtube ? 'youtube' : a.bilibili ? 'bilibili' : 'file', file: a.src, id: a.youtube ?? a.bilibili, caption, poster: a.poster, loop: a.loop === true };
  },
  toBlock: ({ source = 'file', file, id, caption, poster, loop }) =>
    `::video${bracket(caption)}${attrs([[source === 'file' ? 'src' : source, source === 'file' ? file : oneLine(id)], ['poster', poster], ['loop', !!loop]])}`,
  toPreview: ({ source = 'file', file, id, caption, poster }) =>
    `<figure class="media-frame"><div class="media-facade" style="aspect-ratio:16/9">${poster ? `<img src="${escapeHtml(poster)}" alt="">` : ''}<span class="media-play">▶ ${source === 'file' ? escapeHtml(file || '视频') : `${source} · ${escapeHtml(id || '')}`}</span></div>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`,
});

CMS.registerEditorComponent({
  id: 'embed',
  label: '嵌入 HTML',
  icon: 'code_blocks',
  mode: 'dialog',
  summary: '{{path}}',
  fields: [
    choice('kind', '形式', [{ label: '独立页面（iframe，可带脚本和交互）', value: 'page' }, { label: '片段（直接嵌进正文，只放静态 HTML）', value: 'snippet' }], { default: 'page' }),
    { name: 'path', label: '路径', hint: '相对这篇文章：独立页面写文件夹，如 ./attachments/demo（里面放 index.html）；片段写文件，如 ./attachments/figure.html。' },
    { name: 'caption', label: '说明', required: false },
    { name: 'height', label: '固定高度（像素）', widget: 'number', value_type: 'int', min: 80, max: 4000, required: false, hint: '留空则随页面内容自动调整。' },
  ],
  pattern: /^::embed(?:\[(?<caption>[^\]\n]*)\])?\{(?<attributes>[^}\n]*)\}$/m,
  fromBlock: ({ groups: { caption, attributes } }) => {
    const a = parseAttrs(attributes);
    return { kind: a.snippet ? 'snippet' : 'page', path: a.page ?? a.snippet, caption, height: a.height ? Number(a.height) : undefined };
  },
  toBlock: ({ kind = 'page', path, caption, height }) => `::embed${bracket(caption)}${attrs([[kind, path], ['height', kind === 'page' ? height : undefined]])}`,
  toPreview: ({ kind = 'page', path, caption }) =>
    `<figure class="media-frame"><div class="media-facade" style="aspect-ratio:16/6"><span class="media-play">${kind === 'snippet' ? '片段' : '嵌入页面'} · ${escapeHtml(path || '')}</span></div>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ''}</figure>`,
});

CMS.registerEditorComponent({
  id: 'bookmark',
  label: '链接卡片',
  icon: 'bookmark',
  mode: 'dialog',
  summary: '{{title}}',
  fields: [
    { name: 'title', label: '标题' },
    { name: 'url', label: '链接', pattern: ['^(https?://|/|\\./).+', '请输入完整的 http(s) 链接或站内��径'] },
    { name: 'desc', label: '一句话说明', required: false },
    { name: 'image', label: '缩略图', widget: 'image', required: false },
  ],
  pattern: /^::bookmark(?:\[(?<title>[^\]\n]*)\])?\{(?<attributes>[^}\n]*)\}$/m,
  fromBlock: ({ groups: { title, attributes } }) => {
    const a = parseAttrs(attributes);
    return { title, url: a.url, desc: a.desc, image: a.image };
  },
  toBlock: ({ title, url, desc, image }) => `::bookmark${bracket(title)}${attrs([['url', url], ['desc', desc], ['image', image]])}`,
  toPreview: ({ title, url, desc, image }) =>
    `<a class="bookmark hand-card" href="${escapeHtml(url)}">${image ? `<img class="bookmark-image" src="${escapeHtml(image)}" alt="">` : ''}<span class="bookmark-title">${escapeHtml(title || url)}</span>${desc ? `<span class="bookmark-desc">${escapeHtml(desc)}</span>` : ''}<span class="bookmark-host">${escapeHtml(url)}</span></a>`,
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

CMS.registerPreviewStyle('./preview.css?v=preview-3');
