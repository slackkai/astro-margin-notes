import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { contentSchemas } from '../src/utils/content-schemas.mjs';
import { makeCmsConfig } from '../cms.config.mjs';

const base = { title: 'A note', date: '2026-09-18' };
const postCollections = ['academic', 'insight', 'dailies', 'library', 'projects'];
const blankValues = ['', ' \t ', null, undefined];

test('real CMS-shaped YAML with empty updated and link fields parses without editing the entry', async () => {
  const source = await readFile(new URL('./fixtures/cms-project.md', import.meta.url), 'utf8');
  const { frontmatter } = parseFrontmatter(source);
  const data = contentSchemas.projects.parse(frontmatter);
  assert.equal(data.updated, undefined);
  assert.equal(data.links.paper, undefined);
  assert.equal(data.links.docs, undefined);
  assert.equal(data.links.github, frontmatter.links.github);
  assert.equal(data.cover, frontmatter.cover);
  assert.equal(data.video, undefined);
  assert.deepEqual(data.stack, frontmatter.stack);
  assert.equal(data.draft, true);
  assert.equal(data.featured, false);
});

test('cleared optional dates are absent, never invalid dates or 1970 timestamps', () => {
  for (const name of postCollections) {
    for (const value of blankValues) assert.equal(contentSchemas[name].parse({ ...base, updated: value }).updated, undefined, name);
    assert.equal(contentSchemas[name].parse({ ...base, updated: '2026-09-20' }).updated.toISOString(), '2026-09-20T00:00:00.000Z');
    for (const invalid of ['not-a-date', {}, [], false, 0]) assert.equal(contentSchemas[name].safeParse({ ...base, updated: invalid }).success, false);
  }
});

test('every configured academic and project link accepts empty values but rejects invalid nonempty URLs', () => {
  const config = makeCmsConfig({ repo: 'example/site', siteUrl: 'https://example.com' });
  for (const name of ['academic', 'projects']) {
    const fields = config.collections.find(c => c.name === name).fields.find(f => f.name === 'links').fields;
    for (const field of fields) {
      for (const value of blankValues) assert.equal(contentSchemas[name].parse({ ...base, links: { [field.name]: value } }).links, undefined);
      const url = 'https://example.com/note';
      assert.equal(contentSchemas[name].parse({ ...base, links: { [field.name]: ` ${url} ` } }).links[field.name], url);
      assert.equal(contentSchemas[name].safeParse({ ...base, links: { [field.name]: 'broken url' } }).success, false);
      assert.equal(contentSchemas[name].safeParse({ ...base, links: { [field.name]: {} } }).success, false);
    }
    for (const value of [...blankValues, {}]) assert.equal(contentSchemas[name].parse({ ...base, links: value }).links, undefined);
  }
  for (const value of blankValues) assert.equal(contentSchemas.library.parse({ ...base, url: value }).url, undefined);
  assert.equal(contentSchemas.library.safeParse({ ...base, url: 'broken' }).success, false);
});

test('all-blank series may be cleared but incomplete or invalid nonempty series must fail', () => {
  for (const name of ['academic', 'insight']) {
    for (const value of [...blankValues, {}, { name: '', order: null }]) assert.equal(contentSchemas[name].parse({ ...base, series: value }).series, undefined);
    assert.deepEqual(contentSchemas[name].parse({ ...base, series: { name: 'Series', order: 1 } }).series, { name: 'Series', order: 1 });
    for (const series of [{ name: 'Series' }, { name: 'Series', order: null }, { name: '', order: 1 }, { name: 'Series', order: 0 }, { name: 'Series', order: 1.5 }]) assert.equal(contentSchemas[name].safeParse({ ...base, series }).success, false);
  }
});

test('optional strings, lists, numbers and enum fields match cleared CMS values', () => {
  for (const value of blankValues) {
    const academic = contentSchemas.academic.parse({ ...base, authors: value, year: value, venue: value, bibtex: value });
    assert.equal(academic.authors, undefined); assert.equal(academic.year, undefined);
    assert.equal(academic.venue, undefined); assert.equal(academic.bibtex, undefined);
    const library = contentSchemas.library.parse({ ...base, rating: value, status: value, author: value, summary: value, cover: value });
    for (const key of ['rating', 'status', 'author', 'summary', 'cover']) assert.equal(library[key], undefined);
    const daily = contentSchemas.dailies.parse({ ...base, title: value, location: value, mood: value, images: value, tags: value });
    assert.equal(daily.title, undefined); assert.equal(daily.location, undefined); assert.equal(daily.mood, undefined);
    assert.deepEqual(daily.images, []); assert.deepEqual(daily.tags, []);
    const now = contentSchemas.now.parse({ updated: base.date, doing: value, reading: value, listening: value });
    assert.deepEqual(now.doing, []); assert.deepEqual(now.reading, []); assert.deepEqual(now.listening, []);
    assert.deepEqual(contentSchemas.projects.parse({ ...base, stack: value }).stack, []);
  }
  assert.equal(contentSchemas.library.parse({ ...base, rating: 5 }).rating, 5);
  assert.equal(contentSchemas.academic.parse({ ...base, year: 0 }).year, 0);
  for (const invalid of [0, 6, 1.5, '5']) assert.equal(contentSchemas.library.safeParse({ ...base, rating: invalid }).success, false);
  assert.equal(contentSchemas.library.safeParse({ ...base, status: 'finished' }).success, false);
  assert.equal(contentSchemas.projects.safeParse({ ...base, stack: {} }).success, false);
});

test('required fields and boolean false remain strict and do not get silently normalized', () => {
  for (const name of postCollections) {
    for (const date of ['', ' ', null, undefined, false, 0, {}, 'not-a-date']) assert.equal(contentSchemas[name].safeParse({ ...base, date }).success, false, name);
    if (name !== 'dailies') for (const title of ['', ' ', null, undefined]) assert.equal(contentSchemas[name].safeParse({ ...base, title }).success, false, name);
    assert.equal(contentSchemas[name].parse({ ...base, draft: false }).draft, false);
    assert.equal(contentSchemas[name].safeParse({ ...base, draft: 'false' }).success, false);
  }
  assert.equal(contentSchemas.projects.parse({ ...base, featured: false }).featured, false);
  assert.equal(contentSchemas.insight.parse({ ...base, pinned: false }).pinned, false);
  assert.equal(contentSchemas.now.safeParse({ updated: null }).success, false);
});

test('CMS omits cleared optional fields and retains the draft default', () => {
  const config = makeCmsConfig({ repo: 'example/site', siteUrl: 'https://example.com' });
  assert.equal(config.output.omit_empty_optional_fields, true);
  for (const collection of config.collections.filter(c => c.folder)) assert.equal(collection.fields.find(f => f.name === 'draft').default, true);
});

test('About page fields: empty highlights fall back, cleared workbench hides, partial workbench keeps valid lists', () => {
  const about = contentSchemas.about;
  for (const value of blankValues) {
    const data = about.parse({ highlights: value, workbench: value });
    assert.deepEqual(data.highlights, []); assert.equal(data.workbench, undefined);
  }
  assert.deepEqual(about.parse({ highlights: [] }).highlights, []);
  assert.equal(about.parse({ workbench: { tools: [], hardware: '', questions: null } }).workbench, undefined);
  const data = about.parse({ highlights: [{ title: '学术', desc: '' }], workbench: { tools: [{ name: 'MuJoCo', note: null }], hardware: [], questions: ['为什么？'] } });
  assert.deepEqual(data.highlights, [{ title: '学术', desc: undefined }]);
  assert.deepEqual(data.workbench, { tools: [{ name: 'MuJoCo', note: undefined }], hardware: [], questions: ['为什么？'] });
  assert.equal(about.safeParse({ highlights: [{ title: '' }] }).success, false);
  assert.equal(about.safeParse({ workbench: { tools: [{ note: 'x' }], hardware: [], questions: [] } }).success, false);
});
