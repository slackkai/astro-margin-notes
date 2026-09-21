import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE, SECTIONS, ENABLED_SECTIONS, config, type SectionKey } from '../../config';
import { getPosts, entryHref, formatDate } from '../../utils/content';
import { renderEntryHtml } from '../../utils/feed';

export function getStaticPaths() {
  return ENABLED_SECTIONS.map(({ key: section }) => ({ params: { section } }));
}

export async function GET({ params, site }: APIContext) {
  const section = params.section as SectionKey;
  const sec = SECTIONS[section];
  const entries = await getPosts(section);
  return rss({
    title: `${SITE.title} · ${sec.label}`,
    description: sec.desc,
    site: site!,
    items: await Promise.all(entries.map(async (e) => ({
      title: ('title' in e.data && e.data.title) || `${sec.label} · ${formatDate(e.data.date)}`,
      pubDate: e.data.date,
      description: ('description' in e.data && e.data.description) || ('summary' in e.data ? e.data.summary : undefined),
      content: await renderEntryHtml(e, site!),
      link: entryHref(e),
      categories: [section, ...e.data.tags],
    }))),
    customData: `<language>${config.lang}</language>`,
  });
}
