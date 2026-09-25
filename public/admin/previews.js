/* global CMS, createClass, h */
// Use Sveltia's supported template API; widgetFor keeps Markdown components and
// getAsset keeps unsaved uploads/entry-relative paths in the CMS asset lifecycle.
(() => {
  const sections = { academic: '学术', insight: '洞见', dailies: '日常', library: '资料库', projects: '项目' };
  const labels = {
    active: '进行中', done: '已完成', archived: '已归档', idea: '构想中',
    todo: '待读', reading: '在读', book: '书籍', paper: '论文', tool: '工具',
    course: '课程', article: '文章', video: '视频', dataset: '数据集', other: '其他',
    note: '笔记', talk: '报告', project: '项目',
  };
  const text = value => value == null ? '' : String(value).trim();
  const date = value => value instanceof Date ? value.toISOString().slice(0, 10) : text(value).slice(0, 10);
  const list = value => Array.isArray(value) ? value.filter(v => text(v)) : [];
  const externalUrl = value => /^https?:\/\//i.test(text(value)) ? text(value) : undefined;
  const tag = (value, className = '') => h('span', { className: `cms-chip ${className}`, key: value }, value);
  const compactLine = values => values.filter(Boolean).join(' · ');

  Object.entries(sections).forEach(([section, label]) => {
    CMS.registerPreviewTemplate(section, createClass({
      render() {
        const { entry, widgetFor, getAsset } = this.props;
        const d = entry.get('data')?.toJS() ?? {};
        const title = text(d.title) || (section === 'dailies' ? date(d.date) : '') || '未命名文章';
        const asset = path => {
          if (!text(path)) return undefined;
          return getAsset(text(path))?.url || externalUrl(path);
        };
        const cover = asset(d.cover);
        const video = asset(d.video);
        const meta = compactLine([
          date(d.date), d.updated && `更新于 ${date(d.updated)}`,
          text(d.author) || list(d.authors).join('、'), text(d.venue),
          d.year && `${d.year} 年`,
          text(d.mood), text(d.location),
        ]);
        const status = section === 'library' && d.status === 'done' ? '已读' : labels[d.status];
        const chips = [labels[d.kind || d.type], status,
          Number.isInteger(d.rating) && d.rating >= 1 && d.rating <= 5 ? '★'.repeat(d.rating) : '',
          d.series?.name ? `${d.series.name}${d.series.order ? ` · 第 ${d.series.order} 篇` : ''}` : '',
          ...list(d.stack),
        ].filter(Boolean);
        const links = Object.entries(d.links || {}).filter(([, url]) => externalUrl(url));
        if (externalUrl(d.url)) links.unshift(['原文', d.url]);
        return h('article', { className: 'cms-entry', 'data-preview-collection': section },
          h('header', { className: 'cms-entry-header' },
            h('div', { className: 'cms-entry-kicker' },
              tag(label, 'cms-section'),
              d.draft === true && tag('草稿 · 不公开', 'cms-draft'),
              d.featured === true && tag('★ 精选'),
              d.pinned === true && tag('置顶'),
              d.comments === false && tag('评论关闭'),
            ),
            h('h1', { className: 'cms-entry-title' }, title),
            text(d.description) && h('p', { className: 'cms-entry-description' }, text(d.description)),
            meta && h('p', { className: 'cms-entry-meta' }, meta),
            chips.length > 0 && h('div', { className: 'cms-entry-chips' }, ...chips.map(value => tag(value))),
            list(d.tags).length > 0 && h('div', { className: 'cms-entry-tags' }, ...list(d.tags).map(value => tag(`#${value}`))),
            links.length > 0 && h('nav', { className: 'cms-entry-links', 'aria-label': '相关链接' },
              ...links.map(([name, url]) => h('a', { key: name, href: url, target: '_blank', rel: 'noopener noreferrer' }, `${name} ↗`))),
          ),
          video ? h('video', { className: 'cms-entry-cover', src: video, poster: cover, controls: true, preload: 'metadata' })
            : cover && h('img', { className: 'cms-entry-cover', src: cover, alt: title }),
          text(d.summary) && h('aside', { className: 'cms-entry-summary' }, text(d.summary)),
          text(d.body) ? h('div', { className: 'cms-entry-body' }, widgetFor('body'))
            : h('p', { className: 'cms-entry-empty' }, '正文尚未填写，在左侧开始写作即可实时预览。'),
          section === 'dailies' && list(d.images).length > 0 && h('div', { className: 'cms-entry-gallery' },
            ...list(d.images).map((path, i) => asset(path) && h('img', { key: `${path}-${i}`, src: asset(path), alt: `照片 ${i + 1}` }))),
          text(d.bibtex) && h('details', { className: 'cms-entry-bibtex' }, h('summary', {}, 'BibTeX'), h('pre', {}, text(d.bibtex))),
        );
      },
    }));
  });
})();
