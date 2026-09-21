/**
 * Margin notes and highlighter for plain Markdown, so the CMS can edit them.
 *
 *   :note[批注内容]    →  the same markup as <Note> in MDX
 *   :mark[要强调的词]  →  the same markup as <Mark> in MDX
 *
 * Requires remark-directive for parsing. Any other directive (for example
 * `key:value` accidentally parsed as `:value`) is restored to literal text so
 * ordinary prose is never swallowed.
 */
export default function remarkNotes({ expandLabel = '展开批注' } = {}) {
  return (tree, file) => {
    const source = String(file ?? '');
    walk(tree, (node, index, parent) => {
      if (!node.type.endsWith('Directive')) return;
      if (node.type === 'textDirective' && node.name === 'note') {
        const element = (type, tagName, properties, children = []) => ({ type, children, data: { hName: tagName, hProperties: properties } });
        node.data = { hName: 'label', hProperties: { className: ['note-wrap'] } };
        node.children = [
          element('noteToggle', 'input', { type: 'checkbox', className: ['note-toggle'], ariaLabel: expandLabel }),
          element('noteRef', 'span', { className: ['note-ref'] }),
          element('noteBody', 'span', { className: ['note'] }, node.children),
        ];
        return;
      }
      if (node.type === 'textDirective' && node.name === 'mark') {
        node.data = { hName: 'span', hProperties: { className: ['mark'] } };
        return;
      }
      const { start, end } = node.position ?? {};
      const value = start && end ? source.slice(start.offset, end.offset) : `:${node.name}`;
      const text = { type: 'text', value };
      parent.children[index] = node.type === 'textDirective' ? text : { type: 'paragraph', children: [text] };
    });
  };
}

function walk(node, visitor) {
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    visitor(child, index, node);
    walk(children[index], visitor);
  }
}
