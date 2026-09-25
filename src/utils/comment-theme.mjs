export const palettes = ['blue', 'classic', 'green', 'mono'];
export const modes = ['light', 'dark'];

// tokens.css is shared with the page, so future palette changes stay in sync.
export function commentTokens(source, palette, mode) {
  if (!palettes.includes(palette) || !modes.includes(mode)) throw new Error('Unknown comment theme');
  const selectors = [':root'];
  if (mode === 'dark') selectors.push("html[data-theme='dark']");
  if (palette !== 'blue') selectors.push(`html[data-palette='${palette}']`);
  if (mode === 'dark' && palette !== 'blue') selectors.push(`html[data-theme='dark'][data-palette='${palette}']`);
  const rules = new Map([...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => [selector.trim(), body]));
  return selectors.map(selector => {
    if (!rules.has(selector)) throw new Error(`Missing palette rule: ${selector}`);
    return `:root {${rules.get(selector)}}`;
  }).join('\n');
}
