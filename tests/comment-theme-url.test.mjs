import test from 'node:test';
import assert from 'node:assert/strict';
import { commentThemeUrl } from '../src/utils/comment-theme-url.mjs';

const settings = {
  siteUrl: 'https://example.org/', themePath: '/giscus/',
  palette: 'blue', mode: 'light', version: 'notebook-6',
};

test('local dev and built previews reuse the configured deployed theme', () => {
  for (const pageUrl of ['http://localhost:4321/article/', 'http://127.0.0.1:4322/',
    'http://[::1]:4321/', 'https://localhost:4321/', 'https://dev.localhost/',
    'http://192.168.1.2:4321/']) {
    assert.equal(commentThemeUrl({ ...settings, pageUrl }),
      'https://example.org/giscus/blue-light.css?v=notebook-6');
  }
});

test('public HTTPS deployments and previews keep their own styles', () => {
  assert.equal(commentThemeUrl({ ...settings, pageUrl: 'https://preview.example.org/post/' }),
    'https://preview.example.org/giscus/blue-light.css?v=notebook-6');
});

test('project Pages base, palette, mode and version survive local fallback', () => {
  assert.equal(commentThemeUrl({ ...settings, pageUrl: 'http://localhost:4321/blog/post/',
    siteUrl: 'https://someone.github.io/blog/', themePath: '/blog/giscus/',
    palette: 'green', mode: 'dark', version: 'next' }),
  'https://someone.github.io/blog/giscus/green-dark.css?v=next');
});
