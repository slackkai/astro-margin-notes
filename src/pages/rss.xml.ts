import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE, config } from '../config';
import { getAllTagged, entryHref, formatDate } from '../utils/content';

export async function GET(context: APIContext) {
  const entries = await getAllTagged();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site!,
    items: entries.map((e) => ({
      title: e.data.title ?? `日常 · ${formatDate(e.data.date)}`,
      pubDate: e.data.date,
      description: e.data.description,
      link: entryHref(e),
      categories: [e.collection, ...e.data.tags],
    })),
    customData: `<language>${config.lang}</language>`,
  });
}
