/**
 * Interactive bits of the Markdown extensions (docs/SYNTAX.md):
 *   - ::video{youtube=…|bilibili=…} renders a facade; the player loads only after a click
 *   - ::embed{page=…} iframes are same-origin, so they get the site's colour tokens and theme
 *     attributes and grow to the height of their content unless a height was given
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

function init() {
  document.querySelectorAll<HTMLIFrameElement>('iframe.embed-page').forEach(attach);
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
