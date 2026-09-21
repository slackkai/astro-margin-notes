import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { render } from 'astro:content';
import type { TaggedEntry } from './content';

let container: AstroContainer | undefined;

/**
 * 把文章正文渲染成可放进 RSS <content:encoded> 的 HTML：
 * 站内链接和图片改为绝对地址（含部署 base），其余与网页一致。
 */
export async function renderEntryHtml(entry: TaggedEntry, site: URL): Promise<string | undefined> {
  if (!entry.body?.trim()) return undefined;
  container ??= await AstroContainer.create();
  const { Content } = await render(entry);
  const html = await container.renderToString(Content);
  const origin = site.origin;
  // rehype-base 已经加上 base，这里只补域名；协议相对地址（//）保持不变。
  return html.replace(/\b(href|src|poster)="\/(?!\/)/g, `$1="${origin}/`);
}
