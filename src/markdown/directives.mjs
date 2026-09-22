/**
 * Notebook directives for Markdown, one family per visual object (remark-directive syntax):
 *   :name[text]{variant key=value}   inline        ::name[label]{…}   block on a line of its own
 *   :::name[label]{…} … :::          container
 * Bare words in {…} pick a variant, key=value sets numbers and paths; {#id}, {.class} and
 * {tilt=-2} work everywhere. Each family renders to plain HTML that src/styles/markdown.css
 * styles. public/admin/components.js and docs/SYNTAX.md list the same names; tests keep them in sync.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { isRelativeUrl, rewriteHtmlUrls } from '../utils/content-urls.mjs';

export const DEFAULT_LABELS = {
  note: '展开批注',
  reveal: '显示被遮住的内容',
  fold: '展开',
  postit: { tip: '💡 提示', warn: '⚠️ 注意', info: '📌 说明', question: '❓ 疑问' },
  play: '播放',
  embed: '嵌入页面',
  bookmark: '打开链接 →',
};

const CLIP_SVG = '<svg class="clip" viewBox="0 0 24 48" aria-hidden="true"><path d="M8 44 V10 a4 4 0 0 1 8 0 V38 a2 2 0 0 1 -4 0 V14" /></svg>';

export const el = (hName, hProperties = {}, children = []) => ({ type: 'notebookElement', data: { hName, hProperties }, children });
export const text = value => ({ type: 'text', value });
const html = value => ({ type: 'html', value });
const flag = (attrs, names) => names.find(name => name in attrs) ?? String(attrs.class ?? '').split(/\s+/).find(name => names.includes(name));
const int = (value, min, max, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
/** The [label] of a container directive, removed from its children. */
const takeLabel = node => (node.children[0]?.data?.directiveLabel ? node.children.shift() : undefined);
const set = (node, hName, hProperties, children) => {
  node.data = { hName, hProperties };
  if (children) node.children = children;
};
const collectImages = (nodes, out = []) => {
  for (const node of nodes) {
    if (node.type === 'image') out.push(node);
    else if (node.children) collectImages(node.children, out);
  }
  return out;
};
const withClass = (node, className) => {
  node.data = { ...(node.data ?? {}), hProperties: { ...(node.data?.hProperties ?? {}), className } };
};

/** The margin-note markup shared by :note[…], footnotes and the MDX <Note> component. */
export function noteElement(node, labels) {
  set(node, 'label', { className: ['note-wrap'] }, [
    el('input', { type: 'checkbox', className: ['note-toggle'], ariaLabel: labels.note }),
    el('span', { className: ['note-ref'] }),
    el('span', { className: ['note'] }, node.children),
  ]);
}

const facade = ({ href, embed, site, poster, labels }) => el('a', { className: ['media-facade'], href, dataEmbed: embed, target: '_blank', rel: 'noopener' }, [
  ...(poster ? [el('img', { src: poster, alt: '', loading: 'lazy' })] : []),
  el('span', { className: ['media-play'] }, [text(`▶ ${labels.play} · ${site}`)]),
]);

/**
 * name → { variants, text | leaf | container }. A renderer mutates the node in place and
 * returns false to reject it (the plugin then keeps the source text and warns).
 */
export const directives = {
  note: {
    variants: [],
    text: (node, attrs, ctx) => noteElement(node, ctx.labels),
    container(node) {
      const label = takeLabel(node);
      set(node, 'aside', { className: ['note-block'] }, [...(label ? [el('p', { className: ['note-block-title'] }, label.children)] : []), ...node.children]);
    },
  },
  mark: {
    variants: ['green', 'pink', 'yellow'],
    text(node, attrs) {
      const color = flag(attrs, directives.mark.variants);
      set(node, 'span', { className: ['mark', ...(color ? [`mark-${color}`] : [])] });
    },
  },
  pen: {
    variants: ['circle', 'wavy', 'box', 'strike', 'hide'],
    text(node, attrs, ctx) {
      const kind = flag(attrs, directives.pen.variants) ?? 'circle';
      if (kind === 'hide') {
        set(node, 'label', { className: ['pen', 'pen-hide'] }, [
          el('input', { type: 'checkbox', className: ['pen-toggle'], ariaLabel: ctx.labels.reveal }),
          el('span', { className: ['pen-hidden'] }, node.children),
        ]);
      } else set(node, 'span', { className: ['pen', `pen-${kind}`] });
    },
  },
  stamp: {
    variants: ['red', 'blue', 'green'],
    text(node, attrs) {
      const color = flag(attrs, directives.stamp.variants) ?? 'red';
      set(node, 'span', { className: ['stamp', `stamp-${color}`] });
    },
  },
  postit: {
    variants: ['tip', 'warn', 'info', 'question'],
    container(node, attrs, ctx) {
      const kind = flag(attrs, directives.postit.variants);
      const label = takeLabel(node);
      set(node, 'aside', { className: ['sticky', ...(kind ? [`sticky-${kind}`] : [])], role: 'note' }, [
        ...(kind ? [el('span', { className: ['sticky-kind'] }, [text(ctx.labels.postit[kind])])] : []),
        ...(label ? [el('p', { className: ['sticky-title'] }, label.children)] : []),
        ...node.children,
      ]);
    },
  },
  photos: {
    variants: ['scatter'],
    container(node, attrs) {
      const images = collectImages(node.children);
      if (images.length === 0) return false;
      const cols = int(attrs.cols, 1, 4, images.length === 1 ? 1 : 2);
      const figures = images.map(image => {
        const caption = image.title || image.alt;
        return el('figure', { className: ['photo'] }, [image, ...(caption ? [el('figcaption', {}, [text(caption)])] : [])]);
      });
      set(node, 'div', {
        className: ['photos', ...(images.length === 1 ? ['photos-single'] : []), ...('scatter' in attrs ? ['photos-scatter'] : [])],
        style: `--cols:${cols}`,
      }, figures);
    },
  },
  fold: {
    variants: ['open'],
    container(node, attrs, ctx) {
      const label = takeLabel(node);
      set(node, 'details', { className: ['fold'], open: 'open' in attrs ? true : undefined }, [
        el('summary', { className: ['fold-summary'] }, label ? label.children : [text(ctx.labels.fold)]),
        el('div', { className: ['fold-body'] }, node.children),
      ]);
    },
  },
  steps: {
    variants: ['timeline'],
    container(node, attrs) {
      const list = node.children.find(child => child.type === 'list');
      if (!list) return false;
      withClass(list, ['steps-list']);
      set(node, 'div', { className: ['steps', ...('timeline' in attrs ? ['steps-timeline'] : [])] });
    },
  },
  layout: {
    variants: ['wide'],
    container(node, attrs) {
      const cols = attrs.cols !== undefined ? int(attrs.cols, 2, 4, 2) : undefined;
      if (!cols && !('wide' in attrs)) return false;
      set(node, 'div', {
        className: ['layout', ...('wide' in attrs ? ['layout-wide'] : []), ...(cols ? ['layout-cols'] : [])],
        style: cols ? `--cols:${cols}` : undefined,
      });
    },
  },
  video: {
    variants: ['loop'],
    leaf(node, attrs, ctx) {
      const caption = node.children.length ? [el('figcaption', {}, node.children)] : [];
      const youtube = String(attrs.youtube ?? '').trim();
      const bilibili = String(attrs.bilibili ?? '').trim();
      const poster = attrs.poster ? ctx.resolve(String(attrs.poster)) : undefined;
      let media;
      let kind = 'media-video';
      if (attrs.src) {
        const loop = 'loop' in attrs;
        media = el('video', { src: ctx.resolve(String(attrs.src)), poster, controls: true, playsInline: true, preload: 'metadata', loop, muted: loop, autoPlay: loop });
      } else if (/^[\w-]{6,}$/.test(youtube)) {
        kind = 'media-embed';
        media = facade({ href: `https://www.youtube.com/watch?v=${youtube}`, embed: `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1`, site: 'YouTube', poster, labels: ctx.labels });
      } else if (/^BV\w+$/.test(bilibili)) {
        kind = 'media-embed';
        media = facade({ href: `https://www.bilibili.com/video/${bilibili}/`, embed: `https://player.bilibili.com/player.html?bvid=${bilibili}&autoplay=1&high_quality=1&danmaku=0`, site: 'Bilibili', poster, labels: ctx.labels });
      } else return false;
      set(node, 'figure', { className: ['media', 'taped', kind] }, [media, ...caption]);
    },
  },
  embed: {
    variants: [],
    leaf(node, attrs, ctx) {
      const caption = node.children.length ? [el('figcaption', {}, node.children)] : [];
      if (attrs.snippet) {
        if (!ctx.file) return false;
        const file = path.resolve(path.dirname(ctx.file), String(attrs.snippet));
        let source;
        try { source = readFileSync(file, 'utf8'); } catch { throw new Error(`Embed snippet not found: ${attrs.snippet} (referenced from ${ctx.file})`); }
        set(node, 'div', { className: ['embed-snippet'] }, [html(rewriteHtmlUrls(source, ctx.dir)), ...(caption.length ? [el('p', { className: ['embed-caption'] }, node.children)] : [])]);
        return;
      }
      if (!attrs.page) return false;
      let src = ctx.resolve(String(attrs.page));
      if (!/\.[a-z0-9]+$/i.test(src) && !src.endsWith('/')) src += '/';
      const height = attrs.height !== undefined ? int(attrs.height, 80, 4000, 480) : undefined;
      set(node, 'figure', { className: ['media', 'taped', 'media-page'] }, [
        el('iframe', { className: ['embed-page'], src, loading: 'lazy', title: attrs.title ? String(attrs.title) : ctx.labels.embed, style: height ? `height:${height}px` : undefined, dataFixed: height ? 'true' : undefined }),
        ...caption,
      ]);
    },
  },
  bookmark: {
    variants: [],
    leaf(node, attrs, ctx) {
      const url = String(attrs.url ?? '').trim();
      const external = /^https?:\/\//i.test(url);
      if (!external && !url.startsWith('/') && !isRelativeUrl(url)) return false;
      let host = '';
      if (external) try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return false; }
      set(node, 'a', { className: ['bookmark', 'hand-card', 'is-link'], href: external ? url : ctx.resolve(url), target: external ? '_blank' : undefined, rel: external ? 'noopener' : undefined }, [
        html(CLIP_SVG),
        ...(attrs.image ? [el('img', { className: ['bookmark-image'], src: ctx.resolve(String(attrs.image)), alt: '', loading: 'lazy' })] : []),
        el('span', { className: ['bookmark-title'] }, node.children.length ? node.children : [text(host || url)]),
        ...(attrs.desc ? [el('span', { className: ['bookmark-desc'] }, [text(String(attrs.desc))])] : []),
        el('span', { className: ['bookmark-host'] }, [text(host || ctx.labels.bookmark)]),
      ]);
    },
  },
};

/** Depth-first walk that tolerates the visitor replacing children. */
export function walk(node, visitor) {
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let index = 0; index < children.length; index++) {
    const before = children.length;
    visitor(children[index], index, node);
    const removed = before - children.length;
    if (removed > 0) { index -= removed; continue; } // the visitor spliced nodes out: revisit this index
    if (children[index]) walk(children[index], visitor);
  }
}
