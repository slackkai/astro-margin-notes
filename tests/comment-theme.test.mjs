import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { commentTokens, palettes, modes } from '../src/utils/comment-theme.mjs';
const source = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
test('all eight comment themes inherit page tokens, with dark overrides last', () => {
  for (const palette of palettes) for (const mode of modes) {
    const css = commentTokens(source, palette, mode);
    const variables = Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v]));
    assert.ok(variables['--paper']);
    assert.ok(variables['--font-body'].includes('LXGW WenKai Screen'));
    assert.ok(variables['--radius-wobble-sm']);
    const colorScheme = [...css.matchAll(/color-scheme:\s*(\w+)/g)].at(-1)[1];
    assert.equal(colorScheme, mode);
    assert.ok(!css.includes('html['), 'giscus does not carry site data attributes');
  }
  assert.throws(() => commentTokens(source, 'invalid', 'light'));
  assert.throws(() => commentTokens('', 'blue', 'light'), /Missing palette/);
});
