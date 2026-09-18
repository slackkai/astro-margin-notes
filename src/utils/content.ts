import { getCollection, type CollectionEntry } from 'astro:content';

type PostCollection = 'academic' | 'insight' | 'dailies' | 'library';

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

export function entryHref(entry: TaggedEntry): string {
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
