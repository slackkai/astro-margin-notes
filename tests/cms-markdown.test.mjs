import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { bundlePreviewRenderer } from '../scripts/lib/bundle-cms-preview.mjs';

// Exercise the actual browser bundle, including browser-specific HTML/MathML parsing
// and sanitisation. A Node-only remark test cannot catch these preview regressions.
test('CMS browser renderer preserves math and notebook markup without running embedded code', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'cms-render-test-'));
  const dom = new JSDOM('<!doctype html>', { runScripts: 'outside-only' });
  try {
    const bundle = join(directory, 'renderer.js');
    await bundlePreviewRenderer(bundle);
    dom.window.eval(await readFile('node_modules/katex/dist/katex.min.js', 'utf8'));
    dom.window.eval((await readFile(bundle, 'utf8')) + '\nwindow.NotebookMarkdown = NotebookMarkdown;');
    const render = markdown => {
      dom.window.document.body.innerHTML = dom.window.NotebookMarkdown.render(markdown);
      return dom.window.document.body;
    };
    const body = render(String.raw`Inline $\sqrt{d_k}$.

$$
A=\begin{bmatrix}1 & 2 \\ 3 & 4\end{bmatrix}
$$

:note[Dimension $d_k$] and footnote[^1].

[^1]: A **bold** margin note.

:::postit[Title]{tip}
:mark[Highlighted] and $x^2$.
:::

:::fold[Details]
Inside.
:::

![Relative](./attachments/image.webp)

![Uploaded](/uploads/image.webp)
`);
    assert.equal(body.querySelectorAll('.katex').length, 4);
    assert.equal(body.querySelectorAll('.katex-display').length, 1);
    assert.equal(body.querySelectorAll('.katex math').length, 4);
    assert.equal(body.querySelectorAll('.katex-html[aria-hidden="true"]').length, 4);
    assert.equal(body.querySelectorAll('.note-wrap .note-toggle').length, 2);
    assert.equal(body.querySelector('.note strong').textContent, 'bold');
    assert.ok(body.querySelector('.sticky-tip .mark'));
    assert.equal(body.querySelector('.fold summary').textContent, 'Details');
    assert.deepEqual([...body.querySelectorAll('img')].map(img => img.getAttribute('src')), ['./attachments/image.webp', '/uploads/image.webp']);
    assert.equal(body.querySelector('.cms-render-error'), null);
    const invalid = render('$\\frac{1}{$\n\nThe rest still renders.');
    assert.ok(invalid.querySelector('.katex-error'));
    assert.ok(invalid.textContent.includes('The rest still renders.'));
    const unsafe = render('<script>window.compromised=true</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">bad</a>\n\n<iframe src="/admin/" srcdoc="unsafe"></iframe>\n\n::embed{snippet=./demo.html}\n\n::embed{page=./demo/}');
    assert.equal(unsafe.querySelector('script, iframe, [onerror], [srcdoc], [href^="javascript:"]'), null);
    assert.equal(unsafe.querySelectorAll('.cms-snippet').length, 3);
    assert.equal(unsafe.querySelector('.cms-render-error'), null);
    assert.equal(render('').textContent, '');
  } finally {
    dom.window.close();
    await rm(directory, { recursive: true, force: true });
  }
});
