import test from 'node:test';
import assert from 'node:assert/strict';
import { interactionsSchema, commentsReady } from '../src/utils/interactions.mjs';
import { makeCmsConfig } from '../cms.config.mjs';

test('cleared CMS settings never load giscus; explicit switches stay false', () => {
  const complete = { enabled: true, repo: 'owner/site', repoId: 'R_example', category: 'Announcements', categoryId: 'DIC_example' };
  assert.equal(commentsReady(interactionsSchema.parse({ comments: complete }).comments), true);
  for (const key of ['repo', 'repoId', 'category', 'categoryId']) {
    for (const value of ['', null, undefined, '  ']) {
      const settings = interactionsSchema.parse({ comments: { ...complete, [key]: value } });
      assert.equal(commentsReady(settings.comments), false);
    }
  }
  const disabled = interactionsSchema.parse({ autoHideHeader: false, comments: { ...complete, enabled: false } });
  assert.equal(disabled.autoHideHeader, false);
  assert.equal(commentsReady(disabled.comments), false);
  assert.equal(commentsReady(interactionsSchema.parse({}).comments), false);
  assert.equal(interactionsSchema.safeParse({ comments: { ...complete, repo: 'https://github.com/owner/site' } }).success, false);
  const cms = makeCmsConfig({ repo: 'owner/site', siteUrl: 'https://example.com' });
  const fields = cms.collections.find(c => c.name === 'settings').files.find(f => f.name === 'interactions').fields;
  assert.equal(fields.find(f => f.name === 'autoHideHeader').default, true);
  assert.equal(fields.find(f => f.name === 'comments').fields.find(f => f.name === 'enabled').default, true);
});
