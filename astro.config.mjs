// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import remarkNotes from './src/utils/remark-notes.mjs';
import rehypeKatex from 'rehype-katex';
import rehypeBase from './src/utils/rehype-base.mjs';
import { config, isEnabled } from './src/config';
import { t } from './src/i18n';
import { unified } from '@astrojs/markdown-remark';

const base = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
  // GitHub Actions supplies the actual Pages origin and base path.
  site: process.env.SITE_URL || config.site.url,
  base,
  trailingSlash: 'always',
  compressHTML: true,
  integrations: [mdx(), sitemap({ filter: (url) => {
    const section = new URL(url).pathname.slice(base.replace(/\/$/, '').length).split('/')[1];
    return section !== 'admin' && section !== '404' &&
      !(section === 'guestbook' && !config.features.guestbook) &&
      !(Object.hasOwn(config.sections, section) && !isEnabled(section));
  } })],
  markdown: {
    processor: unified({
      // remarkNotes turns :note[] / :mark[] into the same markup as the MDX components.
      remarkPlugins: [remarkMath, remarkDirective, [remarkNotes, { expandLabel: t.post.expandNote }]],
      rehypePlugins: [rehypeKatex, [rehypeBase, { base }]],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
