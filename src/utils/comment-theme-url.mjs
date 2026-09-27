/** Local previews reuse the deployed theme; public HTTPS previews use their own CSS. */
export function commentThemeUrl({ pageUrl, siteUrl, themePath, palette, mode, version }) {
  const page = new URL(pageUrl);
  const local = page.protocol === 'http:' || page.hostname === 'localhost'
    || page.hostname.endsWith('.localhost') || page.hostname === '[::1]'
    || /^127\./.test(page.hostname) || page.hostname === '0.0.0.0';
  const origin = local ? new URL(siteUrl).origin : page.origin;
  const url = new URL(`${themePath}${palette}-${mode}.css`, origin);
  url.searchParams.set('v', version);
  return url.href;
}
