import type { APIRoute } from 'astro';
import tokens from '../../styles/tokens.css?raw';
import theme from '../../styles/giscus.css?raw';
import fonts from 'lxgw-wenkai-screen-webfont/lxgwwenkaiscreen.css?inline';
import { commentTokens, palettes, modes } from '../../utils/comment-theme.mjs';

export function getStaticPaths() {
  return palettes.flatMap(palette => modes.map(mode => ({
    params: { theme: `${palette}-${mode}` }, props: { palette, mode },
  })));
}

export const GET: APIRoute = ({ props }) => new Response(
  `${fonts}\n${commentTokens(tokens, props.palette, props.mode)}\n${theme}`,
  { headers: { 'Content-Type': 'text/css; charset=utf-8', 'Access-Control-Allow-Origin': '*' } },
);
