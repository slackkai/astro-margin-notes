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

/** 合集：多篇文章串成系列。name 相同即同一系列，order 决定顺序 */
const series = z
  .object({
    name: z.string(),
    order: z.number(),
  })
  .optional();

/** 学术：论文笔记、研究、发表、讲座 */
const academic = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/academic' }),
  schema: z.object({
    ...common,
    kind: z.enum(['note', 'paper', 'talk', 'course', 'project']).default('note'),
    series,
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
    series,
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

/** 项目：机器人 / 软件 / 硬件项目卡片 */
const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    ...common,
    status: z.enum(['active', 'done', 'archived', 'idea']).default('active'),
    cover: z.string().optional(), // 图片或 GIF
    video: z.string().optional(), // mp4/webm 短视频，优先于 cover
    stack: z.array(z.string()).default([]), // 技术栈
    links: z
      .object({
        github: z.string().url().optional(),
        demo: z.string().url().optional(),
        paper: z.string().url().optional(),
        docs: z.string().url().optional(),
      })
      .optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { academic, insight, dailies, library, now, projects };
