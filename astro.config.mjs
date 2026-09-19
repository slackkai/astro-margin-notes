// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
export default defineConfig({
  // 部署到自定义域名时保持如下；若先部署到 https://<user>.github.io/<repo>/
  // 则改为 site: 'https://<user>.github.io', base: '/<repo>'
  site: 'https://latentk.com',
  integrations: [mdx(), sitemap()],
  vite: {
    build: {
      rollupOptions: {
        // Pagefind 索引在 astro build 之后才生成，运行时按需加载
        external: ['/pagefind/pagefind.js'],
      },
    },
  },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
