import { z } from 'astro/zod';

// CMS optional text can be cleared to null. Keep false meaningful.
const text = z.preprocess(v => v == null ? '' : v, z.string().trim().default(''));
export const interactionsSchema = z.object({
  autoHideHeader: z.boolean().default(true),
  comments: z.object({
    enabled: z.boolean().default(true),
    repo: text.pipe(z.string().regex(/^$|^[\w.-]+\/[\w.-]+$/)),
    repoId: text,
    category: text,
    categoryId: text,
  }).default({ enabled: true, repo: '', repoId: '', category: '', categoryId: '' }),
});

export const commentsReady = (settings) => settings.enabled &&
  [settings.repo, settings.repoId, settings.category, settings.categoryId].every(v => typeof v === 'string' && v.trim().length > 0);
