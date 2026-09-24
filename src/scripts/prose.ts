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
  const height = Math.ceil(doc.documentElement.scrollHeight);
  if (height > 0) frame.style.height = `${height}px`;
}

function attach(frame: HTMLIFrameElement) {
  if (frame.dataset.bound) return;
  frame.dataset.bound = '1';
  const ready = () => {
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
  const lang = document.createElement('span');
  lang.className = 'code-copy-lang';
  lang.textContent = languageName(pre.dataset.language);
  const action = document.createElement('span');
  action.className = 'code-copy-action';
  action.textContent = COPY.copy;
  button.append(lang, action);
  let timer: number | undefined;
  button.addEventListener('click', async () => {
    const code = pre.querySelector('code') ?? pre;
    const clone = code.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.code-copy').forEach((el) => el.remove());
    try {
      await copyText((clone.textContent ?? '').replace(/\s+$/, ''));
      button.dataset.state = 'done';
      action.textContent = COPY.done;
    } catch {
      button.dataset.state = 'fail';
      action.textContent = COPY.fail;
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      delete button.dataset.state;
      // 等 Copied 淡出后再换回 Copy，避免离开时闪一下 Copy
      timer = window.setTimeout(() => {
        if (!button.dataset.state) action.textContent = COPY.copy;
      }, 200);
    }, 1600);
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
