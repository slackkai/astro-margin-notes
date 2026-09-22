import path from 'node:path';

/** A URL that points next to the current file: no scheme, not rooted, not a fragment or query. */
export function isRelativeUrl(url) {
  return typeof url === 'string' && url !== '' && !/^[a-z][a-z0-9+.-]*:/i.test(url) &&
    !url.startsWith('/') && !url.startsWith('#') && !url.startsWith('?');
}

/**
 * Directory of a content file relative to src/content, e.g. "projects/arm-grasp" or "dailies".
 * Returns undefined for files outside src/content, whose relative URLs are then left alone.
 */
export function contentDir(filePath) {
  if (!filePath) return undefined;
  const file = String(filePath).replace(/\\/g, '/');
  const marker = '/src/content/';
  const index = file.lastIndexOf(marker);
  const rel = index >= 0 ? file.slice(index + marker.length) : file.startsWith('src/content/') ? file.slice('src/content/'.length) : undefined;
  return rel === undefined ? undefined : rel.split('/').slice(0, -1).join('/');
}

/**
 * Turn a file-relative URL into a site-rooted one. Attachments are published at the same path
 * they have under src/content, so "./attachments/a.webp" in projects/arm/index.md becomes
 * "/projects/arm/attachments/a.webp". Links to Markdown files become page URLs.
 */
export function resolveContentUrl(url, dir) {
  if (dir === undefined || !isRelativeUrl(url)) return url;
  const [, pathPart, suffix] = url.match(/^([^?#]*)(.*)$/);
  const pathname = path.posix.normalize('/' + (dir ? dir + '/' : '') + pathPart)
    .replace(/\/index\.mdx?$/, '/').replace(/\.mdx?$/, '/');
  return pathname + suffix;
}

/** Rewrite relative src/href/poster attributes in raw HTML (snippets and inline HTML in Markdown). */
export function rewriteHtmlUrls(html, dir) {
  if (dir === undefined) return html;
  return html.replace(/(\s(?:src|href|poster)\s*=\s*)(["'])([^"']*)\2/g, (match, prefix, quote, url) => `${prefix}${quote}${resolveContentUrl(url, dir)}${quote}`);
}
