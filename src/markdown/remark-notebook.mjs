/**
 * Native Markdown, notebook flavour:
 *   - a blockquote whose last paragraph starts with —— becomes a quote with its source line
 *   - footnotes [^1] become margin notes, the same markup as :note[…]
 */
import { DEFAULT_LABELS, el, noteElement, walk } from './directives.mjs';

const SOURCE_PREFIX = /^(?:——|—|--)\s*/;

export default function remarkNotebook({ labels, footnotes = true } = {}) {
  const resolved = { ...DEFAULT_LABELS, ...labels };
  return tree => {
    walk(tree, node => {
      if (node.type !== 'blockquote' || node.children.length < 2) return;
      const last = node.children[node.children.length - 1];
      const first = last.type === 'paragraph' ? last.children[0] : undefined;
      if (first?.type !== 'text' || !SOURCE_PREFIX.test(first.value)) return;
      first.value = first.value.replace(SOURCE_PREFIX, '');
      last.data = { hName: 'p', hProperties: { className: ['quote-source'] } };
    });
    if (!footnotes) return;
    const definitions = new Map();
    walk(tree, (node, index, parent) => {
      if (node.type !== 'footnoteDefinition') return;
      definitions.set(node.identifier, node);
      parent.children.splice(index, 1);
    });
    if (definitions.size === 0) return;
    walk(tree, (node, index, parent) => {
      if (node.type !== 'footnoteReference' || !definitions.has(node.identifier)) return;
      const children = definitions.get(node.identifier).children.flatMap((block, i) => {
        const inline = block.type === 'paragraph' ? block.children : [{ type: 'text', value: toText(block) }];
        return i === 0 ? inline : [el('br'), ...inline];
      });
      const note = { type: 'notebookElement', children }; // not a directive: remark-directives must not wrap it again
      noteElement(note, resolved);
      parent.children[index] = note;
    });
  };
}

function toText(node) {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(toText).join('');
}
