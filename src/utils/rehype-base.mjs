import { prefixBase } from './base-path.mjs';

/** Also make Markdown links and uploaded images work on project Pages sites. */
export default function rehypeBase({ base = '/' } = {}) {
  return (tree) => {
    const walk = (node) => {
      if (node.properties) {
        for (const key of ['href', 'src', 'poster']) {
          const value = node.properties[key];
          if (typeof value === 'string') node.properties[key] = prefixBase(value, base);
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}
