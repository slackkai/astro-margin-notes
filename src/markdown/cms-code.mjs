import { createShikiHighlighter } from '@astrojs/internal-helpers/shiki';

// Use Astro's own highlighter, including its aliases, fallback and wrapping rules.
// esbuild splits the grammars into local chunks; only requested languages are loaded.
const highlighter = createShikiHighlighter({ themes: { light: 'github-light', dark: 'github-dark' } });
const pending = new WeakSet();

export async function highlight(root) {
  await Promise.all([...root.querySelectorAll('pre > code')].map(async code => {
    const pre = code.parentElement;
    if (pending.has(pre) || pre.classList.contains('astro-code')) return;
    pending.add(pre);
    const language = [...code.classList].find(name => name.startsWith('language-'))?.slice(9) || 'plaintext';
    try {
      const html = await (await highlighter).codeToHtml(code.textContent, language, { wrap: true });
      // The author may have typed again or navigated away while a grammar was loading.
      if (!root.contains(pre)) return;
      const template = root.ownerDocument.createElement('template');
      template.innerHTML = html;
      const rendered = template.content.querySelector('pre');
      const badge = root.ownerDocument.createElement('span');
      badge.className = 'code-copy cms-code-label';
      badge.textContent = rendered.dataset.language || 'plain';
      rendered.prepend(badge);
      pre.replaceWith(rendered);
    } catch {
      // Offline or failed chunk requests must not blank the rest of the preview.
      pending.delete(pre);
    }
  }));
}
