import { z } from 'astro/zod';

// Sveltia can serialize cleared optional fields as '' or null. Never use a
// truthiness check here: false and 0 must keep their original meaning.
const cleared = value => value == null || (typeof value === 'string' && value.trim() === '');
const emptyToUndefined = value => cleared(value) ? undefined : value;

/** @template {import('astro/zod').ZodType} T @param {T} schema */
function optionalField(schema) {
  return z.preprocess(emptyToUndefined, schema.optional());
}

/** @template {import('astro/zod').ZodType} T @param {T} schema */
function optionalObject(schema) {
  return z.preprocess(value => {
    if (cleared(value)) return undefined;
    // Entirely cleared groups are absent; partially populated groups still
    // need to pass their normal validation (e.g. a series requires an order).
    if (value && typeof value === 'object' && !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype && Object.values(value).every(cleared)) return undefined;
    return value;
  }, schema.optional());
}

const optionalText = optionalField(z.string());
const optionalUrl = optionalField(z.string().trim().pipe(z.url()));
// Date coercion alone accepts null/false/0 as dates near 1970. Limit the input
// types before conversion, while retaining Date objects from YAML loaders.
const date = z.union([z.date(), z.string().trim().min(1)]).pipe(z.coerce.date());
const optionalDate = optionalField(date);
const strings = z.array(z.string().trim().min(1));
const stringList = z.preprocess(emptyToUndefined, strings.default([]));
const common = {
  title: z.string().trim().min(1),
  date,
  updated: optionalDate,
  description: optionalText,
  tags: stringList.transform(tags => [...new Set(tags)]),
  draft: z.boolean().default(false),
};
const series = optionalObject(z.object({ name: z.string().trim().min(1), order: z.number().int().min(1) }));

export const contentSchemas = {
  academic: z.object({
    ...common,
    kind: z.enum(['note', 'paper', 'talk', 'course', 'project']).default('note'),
    series,
    venue: optionalText,
    authors: optionalField(strings),
    year: optionalField(z.number().int()),
    links: optionalObject(z.object({ pdf: optionalUrl, arxiv: optionalUrl, doi: optionalUrl, code: optionalUrl, slides: optionalUrl, site: optionalUrl })),
    bibtex: optionalText,
  }),
  insight: z.object({ ...common, cover: optionalText, pinned: z.boolean().default(false), series }),
  dailies: z.object({ ...common, title: optionalText, mood: optionalText, location: optionalText, images: stringList }),
  library: z.object({
    ...common,
    type: z.enum(['book', 'paper', 'tool', 'course', 'article', 'video', 'dataset', 'other']).default('other'),
    url: optionalUrl,
    author: optionalText,
    rating: optionalField(z.number().int().min(1).max(5)),
    status: optionalField(z.enum(['todo', 'reading', 'done'])),
    summary: optionalText,
    cover: optionalText,
  }),
  projects: z.object({
    ...common,
    status: z.enum(['active', 'done', 'archived', 'idea']).default('active'),
    cover: optionalText,
    video: optionalText,
    stack: stringList,
    links: optionalObject(z.object({ github: optionalUrl, demo: optionalUrl, paper: optionalUrl, docs: optionalUrl })),
    featured: z.boolean().default(false),
  }),
  now: z.object({ updated: date, doing: stringList, reading: stringList, listening: stringList }),
  // The About page intro is body-only; Sveltia may write it with or without a front matter block.
  about: z.object({}),
};
