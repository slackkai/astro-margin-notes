/** Prefix site-local absolute URLs; leave anchors, relative and external URLs intact. */
export function prefixBase(path, base = '/') {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const root = '/' + base.replace(/^\/+|\/+$/g, '');
  if (root === '/' || path === root || path.startsWith(root + '/') || path.startsWith(root + '#') || path.startsWith(root + '?')) return path;
  return root + path;
}

/** Filesystem-safe tag slug; distinct tags remain distinct, including C++, C# and AI/ML. */
export function tagSlug(tag) {
  // Encoding uppercase too avoids collisions on case-insensitive local filesystems.
  const slug = [...tag].map(char => /^[a-z0-9_-]$/.test(char) ? char :
    [...new TextEncoder().encode(char)].map(byte => `~${byte.toString(16).padStart(2, '0')}`).join('')).join('');
  return /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/.test(slug) ? `~${slug.charCodeAt(0).toString(16)}${slug.slice(1)}` : slug;
}
