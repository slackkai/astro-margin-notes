/**
 * Relative URLs in Markdown point next to the file: ./attachments/photo.webp, ../other-post/.
 * They are rewritten to site-rooted URLs before Astro sees them, so attachments are served from
 * the published copy of the attachments folder and links to sibling Markdown files become page URLs.
 */
import { walk } from './directives.mjs';
import { contentDir, resolveContentUrl, rewriteHtmlUrls } from '../utils/content-urls.mjs';

export default function remarkAttachments() {
  return (tree, file) => {
    const dir = contentDir(file?.path);
    if (dir === undefined) return;
    walk(tree, node => {
      if ((node.type === 'image' || node.type === 'link' || node.type === 'definition') && typeof node.url === 'string') node.url = resolveContentUrl(node.url, dir);
      else if (node.type === 'html') node.value = rewriteHtmlUrls(node.value, dir);
    });
  };
}
