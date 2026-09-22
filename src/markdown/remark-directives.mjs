/**
 * Renders the notebook directives (src/markdown/directives.mjs) after remark-directive has parsed
 * them. Anything unknown is restored to literal text, so `key:value` in ordinary prose is never
 * swallowed; unknown block forms (::x / :::x) are reported because they are never accidental.
 */
import { DEFAULT_LABELS, directives, walk } from './directives.mjs';
import { contentDir, resolveContentUrl } from '../utils/content-urls.mjs';

const KIND = { textDirective: 'text', leafDirective: 'leaf', containerDirective: 'container' };
const MARK = { text: ':', leaf: '::', container: ':::' };

export default function remarkDirectives({ labels, warn = message => console.warn(message) } = {}) {
  const resolved = { ...DEFAULT_LABELS, ...labels, postit: { ...DEFAULT_LABELS.postit, ...labels?.postit } };
  return (tree, file) => {
    const source = String(file ?? '');
    const filePath = file?.path;
    const dir = contentDir(filePath);
    const ctx = { labels: resolved, dir, file: filePath, resolve: url => resolveContentUrl(url, dir) };
    walk(tree, (node, index, parent) => {
      if (!node.type.endsWith('Directive')) return;
      const kind = KIND[node.type];
      const attrs = { ...(node.attributes ?? {}) };
      const render = directives[node.name]?.[kind];
      if (render && render(node, attrs, ctx) !== false) {
        applyCommon(node, attrs);
        return;
      }
      if (kind !== 'text') warn(`Unknown or incomplete directive ${MARK[kind]}${node.name}${filePath ? ` in ${filePath}` : ''}; kept as text.`);
      const { start, end } = node.position ?? {};
      const value = start && end ? source.slice(start.offset, end.offset) : `${MARK[kind]}${node.name}`;
      parent.children[index] = kind === 'text' ? { type: 'text', value } : { type: 'paragraph', children: [{ type: 'text', value }] };
    });
  };
}

/** {#id}, {.class} and {tilt=-2} apply to every directive. */
function applyCommon(node, attrs) {
  const props = node.data.hProperties;
  if (attrs.id) props.id = String(attrs.id);
  const extra = String(attrs.class ?? '').split(/\s+/).filter(Boolean);
  if (extra.length) props.className = [...(props.className ?? []), ...extra];
  const tilt = Number.parseFloat(attrs.tilt);
  if (Number.isFinite(tilt)) props.style = [props.style, `--tilt:${tilt}deg`].filter(Boolean).join(';');
}
