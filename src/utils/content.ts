import { getCollection, type CollectionEntry } from 'astro:content';

type PostCollection = 'academic' | 'insight' | 'dailies' | 'library' | 'projects';

/** 开发环境显示草稿，生产环境隐藏 */
export function isPublished(entry: { data: { draft?: boolean } }): boolean {
  return import.meta.env.DEV || !entry.data.draft;
}

export function byDateDesc<T extends { data: { date: Date } }>(a: T, b: T): number {
  return b.data.date.valueOf() - a.data.date.valueOf();
}

export async function getPosts<C extends PostCollection>(
  collection: C,
): Promise<CollectionEntry<C>[]> {
  const entries = await getCollection(collection, isPublished);
  return entries.sort(byDateDesc);
}

export type TaggedEntry =
  | CollectionEntry<'academic'>
  | CollectionEntry<'insight'>
  | CollectionEntry<'dailies'>;

/** 汇总带标签的三个板块，用于标签页与 RSS */
export async function getAllTagged(): Promise<TaggedEntry[]> {
  const [academic, insight, dailies] = await Promise.all([
    getPosts('academic'),
    getPosts('insight'),
    getPosts('dailies'),
  ]);
  return [...academic, ...insight, ...dailies].sort(byDateDesc);
}

export function collectTags(entries: { data: { tags: string[] } }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    for (const t of e.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return new Map([...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

export function entryHref(entry: { collection: string; id: string }): string {
  return `/${entry.collection}/${entry.id}/`;
}

export function formatDate(date: Date, style: 'long' | 'short' | 'month' = 'long'): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (style === 'month') return `${y}年${date.getMonth() + 1}月`;
  if (style === 'short') return `${m}-${d}`;
  return `${y}-${m}-${d}`;
}

/* ------------------------------------------------------------------
   阅读统计：中文按字、英文按词，分别按 400 字/分、200 词/分估算
   ------------------------------------------------------------------ */
export function readingStats(body: string | undefined): { words: number; minutes: number } {
  if (!body) return { words: 0, minutes: 0 };
  const text = body
    .replace(/```[\s\S]*?```/g, ' ') // 代码块不计
    .replace(/\$\$[\s\S]*?\$\$/g, ' ') // 公式不计
    .replace(/<[^>]+>/g, ' ')
    .replace(/^---[\s\S]*?---/, ' ');
  const cjk = (text.match(/[一-鿿㐀-䶿]/g) ?? []).length;
  const latin = (text.replace(/[一-鿿㐀-䶿]/g, ' ').match(/[A-Za-z0-9]+/g) ?? []).length;
  const minutes = Math.max(1, Math.round(cjk / 400 + latin / 200));
  return { words: cjk + latin, minutes };
}

/* ------------------------------------------------------------------
   最后修改时间：构建时读 git 提交时间；没有 git 历史时回退到 frontmatter
   ------------------------------------------------------------------ */
export async function gitLastModified(filePath: string | undefined): Promise<Date | null> {
  if (!filePath) return null;
  try {
    const { execSync } = await import('node:child_process');
    const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return out ? new Date(out) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------
   相关文章：标签重合度 + 同板块加权，排除自身
   ------------------------------------------------------------------ */
export function relatedTo<T extends { collection: string; id: string; data: { tags: string[]; date: Date } }>(
  current: T,
  pool: T[],
  limit = 3,
): T[] {
  const mine = new Set(current.data.tags);
  return pool
    .filter((e) => !(e.collection === current.collection && e.id === current.id))
    .map((e) => {
      const shared = e.data.tags.filter((t) => mine.has(t)).length;
      const same = e.collection === current.collection ? 0.5 : 0;
      return { e, score: shared + same };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || byDateDesc(a.e, b.e))
    .slice(0, limit)
    .map(({ e }) => e);
}

/* ------------------------------------------------------------------
   合集
   ------------------------------------------------------------------ */
export type SeriesEntry = CollectionEntry<'academic'> | CollectionEntry<'insight'>;

export async function getSeries(name: string): Promise<SeriesEntry[]> {
  const [a, i] = await Promise.all([getPosts('academic'), getPosts('insight')]);
  return [...a, ...i]
    .filter((e) => e.data.series?.name === name)
    .sort((x, y) => (x.data.series!.order ?? 0) - (y.data.series!.order ?? 0));
}

export async function getAllSeries(): Promise<Map<string, SeriesEntry[]>> {
  const [a, i] = await Promise.all([getPosts('academic'), getPosts('insight')]);
  const map = new Map<string, SeriesEntry[]>();
  for (const e of [...a, ...i]) {
    const s = e.data.series;
    if (!s) continue;
    if (!map.has(s.name)) map.set(s.name, []);
    map.get(s.name)!.push(e);
  }
  for (const list of map.values()) list.sort((x, y) => x.data.series!.order - y.data.series!.order);
  return map;
}

/* ------------------------------------------------------------------
   归档：全站按年 / 月分组
   ------------------------------------------------------------------ */
export type ArchiveEntry = TaggedEntry | CollectionEntry<'library'> | CollectionEntry<'projects'>;

export async function getArchive(): Promise<Map<number, Map<number, ArchiveEntry[]>>> {
  const [tagged, library, projects] = await Promise.all([getAllTagged(), getPosts('library'), getPosts('projects')]);
  const all: ArchiveEntry[] = [...tagged, ...library, ...projects].sort(byDateDesc);
  const years = new Map<number, Map<number, ArchiveEntry[]>>();
  for (const e of all) {
    const y = e.data.date.getFullYear(), m = e.data.date.getMonth() + 1;
    if (!years.has(y)) years.set(y, new Map());
    const months = years.get(y)!;
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(e);
  }
  return years;
}
