import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const common = {
  title: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
};

/** 学术：论文笔记、研究、发表、讲座 */
const academic = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/academic' }),
  schema: z.object({
    ...common,
    kind: z.enum(['note', 'paper', 'talk', 'course', 'project']).default('note'),
    venue: z.string().optional(), // 会议 / 期刊 / 课程名
    authors: z.array(z.string()).optional(),
    year: z.number().optional(),
    links: z
      .object({
        pdf: z.string().url().optional(),
        arxiv: z.string().url().optional(),
        doi: z.string().url().optional(),
        code: z.string().url().optional(),
        slides: z.string().url().optional(),
        site: z.string().url().optional(),
      })
      .optional(),
    bibtex: z.string().optional(),
  }),
});

/** 洞见：长文、观点、方法论 */
const insight = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/insight' }),
  schema: z.object({
    ...common,
    cover: z.string().optional(),
    pinned: z.boolean().default(false),
  }),
});

/** 日常：短记、日志 */
const dailies = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/dailies' }),
  schema: z.object({
    ...common,
    title: z.string().optional(),
    mood: z.string().optional(),
    location: z.string().optional(),
    images: z.array(z.string()).default([]),
  }),
});

/** 资料库：书、论文、工具、课程、链接 */
const library = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/library' }),
  schema: z.object({
    ...common,
    type: z
      .enum(['book', 'paper', 'tool', 'course', 'article', 'video', 'dataset', 'other'])
      .default('other'),
    url: z.string().url().optional(),
    author: z.string().optional(),
    rating: z.number().min(1).max(5).optional(),
    status: z.enum(['todo', 'reading', 'done']).optional(),
    summary: z.string().optional(), // 一句话评价
    cover: z.string().optional(),
  }),
});

/** Now：首页索引卡，单文件 src/content/now/now.md */
const now = defineCollection({
  loader: glob({ pattern: 'now.md', base: './src/content/now' }),
  schema: z.object({
    updated: z.coerce.date(),
    doing: z.array(z.string()).default([]),
    reading: z.array(z.string()).default([]), // 手填，会与资料库 status: reading 合并
    listening: z.array(z.string()).default([]),
  }),
});

export const collections = { academic, insight, dailies, library, now };
