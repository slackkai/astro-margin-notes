/**
 * Attachments live next to the Markdown that uses them and are published at the same path:
 *   src/content/projects/arm/attachments/demo/index.html  →  /projects/arm/attachments/demo/
 * The dev server streams them straight from src/content; the build copies them into dist.
 * Attachments of a draft entry (a folder whose index.md has draft: true) are not published.
 */
import { createReadStream } from 'node:fs';
import { cp, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ATTACHMENTS = 'attachments';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mov': 'video/quicktime', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.pdf': 'application/pdf',
  '.wasm': 'application/wasm', '.woff': 'font/woff', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.stl': 'model/stl',
};

/** Content-relative path for an attachment URL, or undefined when the URL is not an attachment. */
export function attachmentPath(pathname, base = '/') {
  const root = '/' + base.replace(/^\/+|\/+$/g, '');
  let local = pathname;
  if (root !== '/') {
    if (!local.startsWith(root + '/')) return undefined;
    local = local.slice(root.length);
  }
  let segments;
  try { segments = decodeURIComponent(local).split('/').filter(Boolean); } catch { return undefined; }
  if (segments.indexOf(ATTACHMENTS) < 1 || segments.some(s => s === '.' || s === '..')) return undefined;
  return segments.join('/');
}

/** Frontmatter check that does not need the content collections: `draft: true` in the YAML block. */
export function isDraftSource(source) {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return !!frontmatter && /^draft:\s*true\s*$/m.test(frontmatter[1]);
}

/** Every attachments folder below a directory, with whether its owning entry is published. */
export async function findAttachmentDirs(contentRoot) {
  const found = [];
  async function isPublished(entryDir) {
    for (const name of ['index.md', 'index.mdx']) {
      try { return !isDraftSource(await readFile(path.join(entryDir, name), 'utf8')); } catch { /* not a bundle */ }
    }
    return true; // Section-level attachments (e.g. dailies/attachments) are shared and always published.
  }
  async function walk(dir) {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      if (!item.isDirectory() || item.name.startsWith('.')) continue;
      const full = path.join(dir, item.name);
      if (item.name === ATTACHMENTS) found.push({ dir: full, published: await isPublished(dir) });
      else await walk(full);
    }
  }
  await walk(contentRoot);
  return found;
}

export default function attachments() {
  let contentRoot = path.resolve('src/content');
  let base = '/';
  return {
    name: 'attachments',
    hooks: {
      'astro:config:setup': ({ config }) => {
        contentRoot = path.join(fileURLToPath(config.srcDir), 'content');
        base = config.base;
      },
      'astro:server:setup': ({ server }) => {
        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url ?? '/', 'http://localhost');
          const rel = attachmentPath(url.pathname, base);
          if (!rel) return next();
          let file = path.join(contentRoot, rel);
          if (!file.startsWith(contentRoot + path.sep)) return next();
          let info;
          try { info = await stat(file); } catch { return next(); }
          if (info.isDirectory()) {
            if (!url.pathname.endsWith('/')) {
              res.statusCode = 301;
              res.setHeader('Location', url.pathname + '/' + url.search);
              return res.end();
            }
            file = path.join(file, 'index.html');
            try { info = await stat(file); } catch { return next(); }
          }
          res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
          res.setHeader('Content-Length', info.size);
          res.setHeader('Cache-Control', 'no-cache');
          createReadStream(file).pipe(res);
        });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        let count = 0;
        for (const { dir: source, published } of await findAttachmentDirs(contentRoot)) {
          if (!published) continue;
          await cp(source, path.join(out, path.relative(contentRoot, source)), {
            recursive: true, filter: file => !path.basename(file).startsWith('.'),
          });
          count++;
        }
        logger.info(`Published ${count} attachments folder${count === 1 ? '' : 's'}.`);
      },
    },
  };
}
