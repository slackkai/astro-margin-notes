import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentSchemas } from './utils/content-schemas.mjs';

// Entries are Markdown files anywhere below the collection folder: either flat files
// (dailies/2026-09-18-x.md) or bundles (projects/arm/index.md). A bundle keeps its
// images, videos and HTML embeds in a sibling attachments/ folder, which never holds entries.
const pattern = ['**/[^_]*.{md,mdx}', '!**/attachments/**'];

// Keep the schemas independently importable so tests exercise exactly the
// same validation used by Astro's real content loaders.
const academic = defineCollection({
  loader: glob({ pattern, base: './src/content/academic' }),
  schema: contentSchemas.academic,
});
const insight = defineCollection({
  loader: glob({ pattern, base: './src/content/insight' }),
  schema: contentSchemas.insight,
});
const dailies = defineCollection({
  loader: glob({ pattern, base: './src/content/dailies' }),
  schema: contentSchemas.dailies,
});
const library = defineCollection({
  loader: glob({ pattern, base: './src/content/library' }),
  schema: contentSchemas.library,
});
const projects = defineCollection({
  loader: glob({ pattern, base: './src/content/projects' }),
  schema: contentSchemas.projects,
});
const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content/about' }),
  schema: contentSchemas.about,
});
const now = defineCollection({
  loader: glob({ pattern: 'now.md', base: './src/content/now' }),
  schema: contentSchemas.now,
});

export const collections = { academic, insight, dailies, library, now, projects, about };
