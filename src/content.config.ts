import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentSchemas } from './utils/content-schemas.mjs';

// Keep the schemas independently importable so tests exercise exactly the
// same validation used by Astro's real content loaders.
const academic = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/academic' }),
  schema: contentSchemas.academic,
});
const insight = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/insight' }),
  schema: contentSchemas.insight,
});
const dailies = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/dailies' }),
  schema: contentSchemas.dailies,
});
const library = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/library' }),
  schema: contentSchemas.library,
});
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/projects' }),
  schema: contentSchemas.projects,
});
const now = defineCollection({
  loader: glob({ pattern: 'now.md', base: './src/content/now' }),
  schema: contentSchemas.now,
});

export const collections = { academic, insight, dailies, library, now, projects };
