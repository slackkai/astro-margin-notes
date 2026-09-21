import test from 'node:test';
import assert from 'node:assert/strict';
import { prefixBase, tagSlug } from '../src/utils/base-path.mjs';
import rehypeBase from '../src/utils/rehype-base.mjs';
import { makeCmsConfig } from '../cms.config.mjs';

test('project Pages URLs preserve assets, anchors and queries without double prefixes', () => {
  assert.equal(prefixBase('/insight/hello/?a=1#note', '/theme/'), '/theme/insight/hello/?a=1#note');
  assert.equal(prefixBase('/theme/rss.xml', '/theme'), '/theme/rss.xml');
  assert.equal(prefixBase('/themes/', '/theme'), '/theme/themes/');
  assert.equal(prefixBase('/', '/theme'), '/theme/');
  for (const url of ['https://example.org/a', '//cdn.test/img.png', 'mailto:a@b.com', '#note', '../img.png']) assert.equal(prefixBase(url, '/theme'), url);
  assert.equal(prefixBase('/uploads/a.png', '/'), '/uploads/a.png');
});

test('Markdown image and internal link rewriting handles nested nodes', () => {
  const tree = { children: [{ children: [{ properties: { href: '/insight/test/' } }, { properties: { src: '/uploads/a.png' } }, { properties: { href: 'https://astro.build/' } }] }] };
  rehypeBase({ base: '/blog' })(tree);
  assert.deepEqual(tree.children[0].children.map(n => n.properties), [{ href: '/blog/insight/test/' }, { src: '/blog/uploads/a.png' }, { href: 'https://astro.build/' }]);
});

test('CMS targets the generated repository and defaults new content to drafts', () => {
  const cms = makeCmsConfig({ repo: 'owner/notes', siteUrl: 'https://owner.github.io', base: '/notes' });
  assert.equal(cms.backend.repo, 'owner/notes');
  assert.equal(cms.site_url, 'https://owner.github.io/notes/');
  assert.equal(cms.media_folder, 'public/uploads');
  assert.equal(cms.logo.src, '/notes/favicon.svg');
  assert.equal(cms.media_libraries.default.config.transformations.raster_image.format, 'webp');
  for (const collection of cms.collections.filter(c => c.folder)) {
    assert.equal(collection.fields.find(f => f.name === 'draft').default, true);
    assert.ok(collection.fields.find(f => f.name === 'body'));
    assert.deepEqual(collection.sortable_fields.default, { field: 'date', direction: 'descending' });
    assert.ok(collection.icon);
  }
  assert.equal(cms.collections.find(c => c.name === 'dailies').slug, "{{fields.date | date('YYYY-MM-DD')}}-{{slug}}");
  assert.equal(makeCmsConfig({ repo: 'o/n', siteUrl: 'https://example.com' }).logo.src, '/favicon.svg');
});

test('tag URLs handle reserved characters and cannot collide with encoded slugs', () => {
  const tags = ['中文', 'C++', 'C#', 'AI/ML', 'AI~2FML', 'a%b', 'a?b', '.', '..', 'tool', 'Tool', 'con'];
  const slugs = tags.map(tagSlug);
  assert.equal(new Set(slugs).size, tags.length);
  assert.equal(new Set(slugs.map(s => s.toLowerCase())).size, tags.length);
  for (const slug of slugs) assert.ok(!/[/%?#\\]/.test(slug));
  for (const slug of slugs) assert.ok(!['.', '..', 'con'].includes(slug));
  assert.equal(tagSlug('tool'), 'tool');
});
