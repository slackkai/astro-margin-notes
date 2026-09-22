import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { attachmentPath, findAttachmentDirs, isDraftSource } from '../src/integrations/attachments.mjs';
import { contentDir, isRelativeUrl, resolveContentUrl, rewriteHtmlUrls } from '../src/utils/content-urls.mjs';

test('attachment URLs map to src/content paths, with and without a deployment base', () => {
  assert.equal(attachmentPath('/projects/arm/attachments/demo/index.html'), 'projects/arm/attachments/demo/index.html');
  assert.equal(attachmentPath('/site/dailies/attachments/a%20b.webp', '/site/'), 'dailies/attachments/a b.webp');
  assert.equal(attachmentPath('/dailies/attachments/x.webp', '/site/'), undefined, 'base is required');
  assert.equal(attachmentPath('/attachments/x.webp'), undefined, 'must be inside a section');
  assert.equal(attachmentPath('/projects/arm/index.html'), undefined, 'only attachment folders are served');
  assert.equal(attachmentPath('/projects/attachments/../../package.json'), undefined, 'no traversal');
  assert.equal(attachmentPath('/projects/attachments/%zz'), undefined, 'bad escapes are ignored');
});

test('draft detection reads only the YAML block', () => {
  assert.equal(isDraftSource('---\ntitle: x\ndraft: true\n---\nbody'), true);
  assert.equal(isDraftSource('---\r\ntitle: x\r\ndraft: true\r\n---\r\nbody'), true);
  assert.equal(isDraftSource('---\ntitle: x\ndraft: false\n---\ndraft: true'), false);
  assert.equal(isDraftSource('no frontmatter\ndraft: true'), false);
});

test('attachments folders are found for bundles and sections; draft bundles stay unpublished', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'attachments-'));
  try {
    const make = async (dir, index) => {
      await mkdir(path.join(root, dir, 'attachments'), { recursive: true });
      if (index !== undefined) await writeFile(path.join(root, dir, 'index.md'), index);
    };
    await make('projects/live', '---\ndraft: false\n---\n');
    await make('projects/hidden', '---\ndraft: true\n---\n');
    await make('projects/live/doc', '---\ntitle: doc\n---\n');
    await make('dailies');
    await mkdir(path.join(root, '.git', 'attachments'), { recursive: true });
    const found = (await findAttachmentDirs(root)).map(({ dir, published }) => [path.relative(root, dir).split(path.sep).join('/'), published]).sort();
    assert.deepEqual(found, [['dailies/attachments', true], ['projects/hidden/attachments', false], ['projects/live/attachments', true], ['projects/live/doc/attachments', true]]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('content directories and relative URL resolution', () => {
  assert.equal(contentDir('D:\\site\\src\\content\\projects\\arm\\index.md'), 'projects/arm');
  assert.equal(contentDir('/home/k/site/src/content/dailies/2026-09-18-x.md'), 'dailies');
  assert.equal(contentDir('src/content/about/about.md'), 'about');
  assert.equal(contentDir('/elsewhere/README.md'), undefined);
  assert.equal(contentDir(undefined), undefined);
  assert.equal(isRelativeUrl('./a.png'), true);
  for (const url of ['/a.png', 'https://x.test/a', 'mailto:a@b.c', '#top', '?q=1', '', 'data:image/png;base64,AAAA']) assert.equal(isRelativeUrl(url), false, url);
  assert.equal(resolveContentUrl('./attachments/a.webp', 'projects/arm'), '/projects/arm/attachments/a.webp');
  assert.equal(resolveContentUrl('attachments/a.webp?v=2#x', 'dailies'), '/dailies/attachments/a.webp?v=2#x');
  assert.equal(resolveContentUrl('../other/', 'projects/arm'), '/projects/other/');
  assert.equal(resolveContentUrl('log/index.md', 'projects/arm'), '/projects/arm/log/');
  assert.equal(resolveContentUrl('../../insight/post.mdx', 'projects/arm'), '/insight/post/');
  assert.equal(resolveContentUrl('../../../../etc/passwd', 'projects/arm'), '/etc/passwd', 'normalised, never escapes the site root');
  assert.equal(resolveContentUrl('/uploads/a.webp', 'projects/arm'), '/uploads/a.webp');
  assert.equal(resolveContentUrl('https://x.test/a', 'projects/arm'), 'https://x.test/a');
  assert.equal(resolveContentUrl('./a.png', undefined), './a.png');
  assert.equal(rewriteHtmlUrls('<img src="attachments/a.png"> <a href=\'../x/\'>x</a> <video poster="/p.png" src="https://x.test/v.mp4">', 'dailies'),
    '<img src="/dailies/attachments/a.png"> <a href=\'/x/\'>x</a> <video poster="/p.png" src="https://x.test/v.mp4">');
});
