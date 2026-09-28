/**
 * Interactive bits of the Markdown extensions (docs/SYNTAX.md):
 *   - ::video{youtube=…|bilibili=…} renders a facade; the player loads only after a click
 *   - ::embed{page=…} iframes are same-origin, so they get the site's colour tokens and theme
 *     attributes and grow to the height of their content unless a height was given
 *   - code blocks get a language tag that turns into a copy button on hover
 */
const TOKENS = [
  '--paper', '--paper-2', '--erased', '--pencil', '--pencil-60', '--pencil-45', '--pencil-25', '--pencil-12',
  '--marker', '--pen', '--postit', '--postit-2', '--postit-3', '--tape', '--font-body', '--font-mono',
  '--shadow-soft', '--shadow-hand', '--shadow-hand-sm', '--radius-wobble', '--radius-wobble-sm', '--radius-pill',
];

function loadFacade(link: HTMLAnchorElement) {
  const src = link.dataset.embed;
  if (!src) return;
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.title = link.textContent?.trim() || 'video';
  link.replaceWith(frame);
}

function syncTheme(frame: HTMLIFrameElement) {
  const root = frame.contentDocument?.documentElement;
  if (!root) return;
  const style = getComputedStyle(document.documentElement);
  for (const name of TOKENS) root.style.setProperty(name, style.getPropertyValue(name));
  for (const name of ['data-theme', 'data-palette']) {
    const value = document.documentElement.getAttribute(name);
    if (value) root.setAttribute(name, value);
  }
}

function fit(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  if (!doc?.documentElement || frame.dataset.fixed) return;
  // 量 body 的内容高度：documentElement.scrollHeight 被 iframe 视口钳住，高度只能涨不能跌。
  // 再加 2px 缓冲：高度恰好卡在分界上时纵向滚动条会一闪一灭，它占掉的 ~15px 宽度又反过来
  // 改变折行高度，高度和滚动条互相追逐，嵌入页会持续闪烁。
  const body = doc.body;
  const content = body ? Math.max(body.scrollHeight, body.getBoundingClientRect().height) : doc.documentElement.scrollHeight;
  const height = Math.ceil(content) + 2;
  if (height > 0 && frame.style.height !== `${height}px`) frame.style.height = `${height}px`;
}

function attach(frame: HTMLIFrameElement) {
  if (frame.dataset.bound) return;
  frame.dataset.bound = '1';
  const ready = () => {
    // 自动高度模式不需要滚动条：让它根本不出现，切断「滚动条宽度 ⇄ 内容高度」的反馈回路。
    const root = frame.contentDocument?.documentElement;
    if (root && !frame.dataset.fixed) root.style.overflow = 'hidden';
    syncTheme(frame);
    fit(frame);
    const body = frame.contentDocument?.body;
    if (body && !frame.dataset.fixed && 'ResizeObserver' in window) new ResizeObserver(() => fit(frame)).observe(body);
  };
  frame.addEventListener('load', ready);
  const doc = frame.contentDocument;
  if (doc && doc.readyState === 'complete' && doc.location.href !== 'about:blank') ready();
}

const COPY = { copy: 'Copy', done: 'Copied', fail: 'Failed' };

function languageName(lang: string | undefined) {
  return lang || 'plain';
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;opacity:0';
  document.body.append(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('copy failed');
}

function addCopyButton(pre: HTMLPreElement) {
  if (pre.querySelector(':scope > .code-copy')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'code-copy';
  button.setAttribute('aria-label', COPY.copy);
  // 所有文字叠在同一格里，胶带宽度固定为最长的那个，切换时不会伸缩
  const label = (cls: string, text: string) => {
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    return span;
  };
  button.append(
    label('code-copy-lang', languageName(pre.dataset.language)),
    label('code-copy-copy', COPY.copy),
    label('code-copy-done', COPY.done),
    label('code-copy-fail', COPY.fail),
  );
  let timer: number | undefined;
  button.addEventListener('click', async () => {
    const code = pre.querySelector('code') ?? pre;
    const clone = code.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.code-copy').forEach((el) => el.remove());
    try {
      await copyText((clone.textContent ?? '').replace(/\s+$/, ''));
      button.dataset.state = 'done';
    } catch {
      button.dataset.state = 'fail';
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => delete button.dataset.state, 1600);
  });
  pre.prepend(button);
}

function init() {
  document.querySelectorAll<HTMLIFrameElement>('iframe.embed-page').forEach(attach);
  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach(addCopyButton);
}

document.addEventListener('click', (event) => {
  const link = (event.target as Element | null)?.closest?.('a.media-facade');
  if (!(link instanceof HTMLAnchorElement)) return;
  event.preventDefault();
  loadFacade(link);
});
new MutationObserver(() => document.querySelectorAll<HTMLIFrameElement>('iframe.embed-page').forEach(syncTheme))
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-palette'] });
init();
document.addEventListener('astro:page-load', init);
