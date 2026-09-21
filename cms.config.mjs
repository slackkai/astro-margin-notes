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
const body = field('body', '正文', 'markdown', { required: false, hint: '工具栏可插入页边批注、荧光笔和独立公式；Markdown 写法为 :note[批注]、:mark[高亮]、$ 公式 $。' });
const listing = {
  sortable_fields: { fields: ['date', 'title', 'updated'], default: { field: 'date', direction: 'descending' } },
  view_filters: { filters: [{ name: 'drafts', label: '草稿', field: 'draft', eq: true }, { name: 'published', label: '已发布', field: 'draft', ne: true }] },
};
const collection = (name, label, icon, extra, { fields = common, slug = '{{slug}}' } = {}) => ({
  name, label, icon, folder: `src/content/${name}`, create: true, extension: 'md', format: 'yaml-frontmatter',
  slug, preview_path: `${name}/{{slug}}/`, ...listing,
  fields: [...fields, ...extra, body],
});

export function makeCmsConfig({ repo, siteUrl, base = '/' }) {
  const root = new URL(base.replace(/\/$/, '') + '/', siteUrl);
  return {
    backend: { name: 'github', repo, branch: 'main', auth_methods: ['token'] },
    output: { omit_empty_optional_fields: true },
    site_url: root.href,
    display_url: root.href,
    logo: { src: new URL('favicon.svg', root).pathname },
    media_folder: 'public/uploads',
    public_folder: '/uploads',
    // Uploaded photos are resized and converted to WebP before they reach the repository.
    media_libraries: { default: { config: { transformations: { raster_image: { format: 'webp', quality: 85, width: 2048, height: 2048 }, svg: { optimize: true } } } } },
    collections: [
      collection('academic', '学术', 'school', [
        select('kind', '类型', ['note', 'paper', 'talk', 'course', 'project'], { default: 'note' }),
        series, optional('venue', '会议 / 期刊 / 课程'), list('authors', '作者'), optional('year', '年份', 'number', { value_type: 'int' }),
        links(['pdf', 'arxiv', 'doi', 'code', 'slides', 'site']), optional('bibtex', 'BibTeX', 'text'),
      ]),
      collection('insight', '洞见', 'edit_note', [optional('cover', '封面', 'image'), field('pinned', '置顶', 'boolean', { default: false }), series]),
      collection('dailies', '日常', 'photo_camera', [
        optional('mood', '心情'), optional('location', '地点'),
        optional('images', '图片', 'list', { field: field('image', '图片', 'image'), default: [] }),
      ], { fields: common.map(f => f.name === 'title' ? { ...f, required: false } : f), slug: "{{fields.date | date('YYYY-MM-DD')}}-{{slug}}" }),
      collection('library', '资料库', 'library_books', [
        select('type', '类型', ['book', 'paper', 'tool', 'course', 'article', 'video', 'dataset', 'other'], { default: 'other' }),
        optional('url', '原文链接', 'string', { pattern: ['^https?://.+', '请输入完整的 http(s) 链接'] }), optional('author', '作者'),
        optional('rating', '评分', 'number', { value_type: 'int', min: 1, max: 5 }),
        select('status', '阅读状态', ['todo', 'reading', 'done'], { required: false }),
        optional('summary', '一句话评价', 'text'), optional('cover', '封面', 'image'),
      ]),
      collection('projects', '项目', 'construction', [
        select('status', '状态', ['active', 'done', 'archived', 'idea'], { default: 'active' }),
        optional('cover', '封面', 'image'), optional('video', '短视频', 'file'), list('stack', '技术栈'),
        links(['github', 'demo', 'paper', 'docs']), field('featured', '精选', 'boolean', { default: false }),
      ]),
      { name: 'settings', label: '站点设置', icon: 'settings', files: [
        { name: 'site', label: '基本信息', file: 'src/data/site.json', format: 'json', fields: [
          field('title', '站点名称'), field('tagline', '副标题'), field('description', '站点简介', 'text'),
          field('author', '作者'), field('url', '域名', 'string', { hint: '自定义域名在此设置；GitHub Pages 地址由部署自动识别。', pattern: ['^https?://.+', '请输入完整 URL'] }),
          optional('github', 'GitHub 链接'), optional('email', '联系邮箱'),
        ] },
        { name: 'now', label: '最近在做', file: 'src/content/now/now.md', fields: [date('updated', '更新日期'), list('doing', '在做'), list('reading', '在读'), list('listening', '在听')] },
        { name: 'about', label: '关于页', icon: 'person', file: 'src/content/about/about.md', fields: [{ ...body, label: '自我介绍', hint: '显示在关于页左侧；板块列表、联系方式和工作台由配置自动生成。' }] },
      ] },
    ],
  };
}
