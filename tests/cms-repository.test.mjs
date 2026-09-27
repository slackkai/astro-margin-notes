import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCmsRepository } from '../scripts/lib/cms-repository.mjs';

test('CMS uses explicit configuration, then workflow repository, then GitHub remote', () => {
  assert.equal(resolveCmsRepository({ configured: 'writer/content', workflow: 'owner/site', remote: 'git@github.com:other/theme.git' }), 'writer/content');
  assert.equal(resolveCmsRepository({ workflow: 'owner/site', remote: 'git@github.com:other/theme.git' }), 'owner/site');
  for (const remote of ['https://github.com/owner/site.git', 'git@github.com:owner/site.git', 'ssh://git@github.com/owner/site.git', 'https://github.com/owner/site/']) {
    assert.equal(resolveCmsRepository({ remote }), 'owner/site');
  }
});

test('CMS refuses to silently target an unrelated repository', () => {
  for (const options of [{}, { remote: 'https://gitlab.com/owner/site.git' },
    { configured: 'https://github.com/owner/site', workflow: 'owner/valid' },
    { configured: 'owner/..' }]) {
    assert.throws(() => resolveCmsRepository(options), /CMS_REPOSITORY/);
  }
});
