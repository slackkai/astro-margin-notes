import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { dirname } from 'node:path';

/**
 * The site's own remark/rehype pipeline for the preview iframe (src/markdown/cms-preview.mjs).
 * Build-time-only imports are replaced: KaTeX comes from the vendored global, file access is
 * never reached without a file path, and only the interface language is taken from config.ts.
 */
export async function bundlePreviewRenderer(outfile = 'public/admin/vendor/notebook-markdown.js') {
  const source = await readFile(new URL('../../src/config.ts', import.meta.url), 'utf8');
  const lang = source.match(/\blang:\s*'(\w+)'/)?.[1] ?? 'zh';
  const stubs = {
    katex: 'export default { renderToString: (...args) => globalThis.katex.renderToString(...args) };',
    'node:fs': 'export function readFileSync() { throw new Error("No file access in the CMS preview"); }',
    'node:path': 'const unavailable = () => { throw new Error("No file paths in the CMS preview"); };\nexport default { resolve: unavailable, dirname: unavailable, posix: { normalize: unavailable } };',
    config: `export const config = { lang: ${JSON.stringify(lang)} };`,
  };
  await build({
    entryPoints: ['src/markdown/cms-preview.mjs'],
    outfile,
    bundle: true, format: 'iife', globalName: 'NotebookMarkdown', minify: true, target: 'es2022',
    legalComments: 'none', logLevel: 'warning',
    plugins: [{
      name: 'cms-preview-stubs',
      setup(b) {
        b.onResolve({ filter: /^\.\/cms-code\.mjs$/ }, () => ({ path: './notebook-code.js', external: true }));
        b.onResolve({ filter: /^(katex|node:fs|node:path)$/ }, args => ({ path: args.path, namespace: 'stub' }));
        b.onResolve({ filter: /^\.\.\/config$/ }, args => (/[\\/]i18n[\\/]/.test(args.importer) ? { path: 'config', namespace: 'stub' } : undefined));
        b.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ contents: stubs[args.path], loader: 'js' }));
      },
    }],
  });
  await build({
    entryPoints: { 'notebook-code': 'src/markdown/cms-code.mjs' }, outdir: dirname(outfile),
    bundle: true, format: 'esm', splitting: true, chunkNames: 'code/[name]-[hash]',
    minify: true, target: 'es2022', legalComments: 'none', logLevel: 'warning',
  });
}

