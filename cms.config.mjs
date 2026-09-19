// Sveltia configuration is generated at /admin/config.yml for each deployment.
const field = (name, label, widget = 'string', extra = {}) => ({ name, label, widget, ...extra });
const optional = (name, label, widget = 'string', extra = {}) => field(name, label, widget, { required: false, ...extra });
const date = (name, label, required = true) => field(name, label, 'datetime', { format: 'YYYY-MM-DD', date_format: 'YYYY-MM-DD', time_format: false, required });
const list = (name, label) => optional(name, label, 'list', { field: field('item', '内容'), default: [] });
const select = (name, label, options, extra = {}) => field(name, label, 'select', { options, ...extra });
const links = (names) => optional('links', '相关链接', 'object', {
  fields: names.map(name => optional(name, name, 'string', { pattern: ['^https?://.+', '请输入完整的 http(s) 链接'] })),
});
const common = [
  field('title', '标题'), date('date', '日期'), date('updated', '更新日期', false),
  optional('description', '摘要', 'text'), list('tags', '标签'),
  field('draft', '草稿（开启时不出现在网站上）', 'boolean', { default: true }),
];
const series = optional('series', '合集', 'object', { fields: [field('name', '合集名称'), field('order', '篇目顺序', 'number', { value_type: 'int', min: 1 })] });
const body = field('body', '正文', 'markdown', { required: false });
const collection = (name, label, extra, fields = common) => ({
  name, label, folder: `src/content/${name}`, create: true, extension: 'md', format: 'yaml-frontmatter',
  slug: '{{slug}}', preview_path: `${name}/{{slug}}/`,
  fields: [...fields, ...extra, body],
});

export function makeCmsConfig({ repo, siteUrl, base = '/' }) {
  return {
    backend: { name: 'github', repo, branch: 'main', auth_methods: ['token'] },
    site_url: new URL(base.replace(/\/$/, '') + '/', siteUrl).href,
    display_url: new URL(base.replace(/\/$/, '') + '/', siteUrl).href,
    media_folder: 'public/uploads',
    public_folder: '/uploads',
    collections: [
      collection('academic', '学术', [
        select('kind', '类型', ['note', 'paper', 'talk', 'course', 'project'], { default: 'note' }),
        series, optional('venue', '会议 / 期刊 / 课程'), list('authors', '作者'), optional('year', '年份', 'number', { value_type: 'int' }),
        links(['pdf', 'arxiv', 'doi', 'code', 'slides', 'site']), optional('bibtex', 'BibTeX', 'text'),
      ]),
      collection('insight', '洞见', [optional('cover', '封面', 'image'), field('pinned', '置顶', 'boolean', { default: false }), series]),
      collection('dailies', '日常', [
        optional('mood', '心情'), optional('location', '地点'),
        optional('images', '图片', 'list', { field: field('image', '图片', 'image'), default: [] }),
      ], common.map(f => f.name === 'title' ? { ...f, required: false } : f)),
      collection('library', '资料库', [
        select('type', '类型', ['book', 'paper', 'tool', 'course', 'article', 'video', 'dataset', 'other'], { default: 'other' }),
        optional('url', '原文链接', 'string', { pattern: ['^https?://.+', '请输入完整的 http(s) 链接'] }), optional('author', '作者'),
        optional('rating', '评分', 'number', { value_type: 'int', min: 1, max: 5 }),
        select('status', '阅读状态', ['todo', 'reading', 'done'], { required: false }),
        optional('summary', '一句话评价', 'text'), optional('cover', '封面', 'image'),
      ]),
      collection('projects', '项目', [
        select('status', '状态', ['active', 'done', 'archived', 'idea'], { default: 'active' }),
        optional('cover', '封面', 'image'), optional('video', '短视频', 'file'), list('stack', '技术栈'),
        links(['github', 'demo', 'paper', 'docs']), field('featured', '精选', 'boolean', { default: false }),
      ]),
      { name: 'settings', label: '站点设置', files: [
        { name: 'site', label: '基本信息', file: 'src/data/site.json', format: 'json', fields: [
          field('title', '站点名称'), field('tagline', '副标题'), field('description', '站点简介', 'text'),
          field('author', '作者'), field('url', '域名', 'string', { hint: '自定义域名在此设置；GitHub Pages 地址由部署自动识别。', pattern: ['^https?://.+', '请输入完整 URL'] }),
          optional('github', 'GitHub 链接'), optional('email', '联系邮箱'),
        ] },
        { name: 'now', label: '最近在做', file: 'src/content/now/now.md', fields: [date('updated', '更新日期'), list('doing', '在做'), list('reading', '在读'), list('listening', '在听')] },
      ] },
    ],
  };
}
