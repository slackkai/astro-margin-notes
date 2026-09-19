# latentk.com

基于 [Astro](https://astro.build) 的个人静态博客，手绘笔记本风格，部署在 GitHub Pages。

## 板块

| 板块 | 目录 | 说明 |
|---|---|---|
| Academic | `src/content/academic/` | 论文笔记、研究记录、发表（支持 venue / links / bibtex，kind: paper 的条目进入 Publications 列表） |
| Insight | `src/content/insight/` | 长文、观点（支持置顶、封面） |
| Dailies | `src/content/dailies/` | 短记、日志，按月时间线展示（标题可省略），顶部有热力图 |
| Library | `src/content/library/` | 书 / 论文 / 工具 / 课程收藏，卡片 + 筛选 + 搜索 + 排序 |
| Projects | `src/content/projects/` | 项目卡片：状态、技术栈、链接，封面可为图片 / GIF / 短视频 |

各板块的字段定义见 `src/content.config.ts`。

### 合集

Academic 与 Insight 的文章可以串成系列，frontmatter 里写：

```yaml
series:
  name: '从零搭四足控制器'
  order: 1
```

文章顶部会出现合集导航（第几篇、全部篇目、上下篇）。

### 页边批注与荧光笔

`.mdx` 文件里引入后使用：

```mdx
import Note from '../../components/mdx/Note.astro';
import Mark from '../../components/mdx/Mark.astro';

正文……<Mark>高亮</Mark>……<Note>旁注内容</Note>
```

宽屏时旁注浮在正文右侧页边，窄屏点上标展开。

### 文章页自动附带

目录（≥1200px 贴左侧）、字数与阅读时长、git 最后修改时间、按标签推荐的相关文章、右侧可拖动的阅读进度。

## 本地开发

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
npm run preview  # 预览构建结果
```

## 写内容

在对应目录新建 `.md` 或 `.mdx` 文件，文件名即 URL slug。例如 `src/content/insight/hello.md` 会生成 `/insight/hello/`。

frontmatter 示例（Insight）：

```yaml
---
title: '标题'
date: 2026-09-18
description: '一句话摘要'
tags: ['tag1', 'tag2']
pinned: false
draft: false     # true 时仅在本地 dev 可见
---
```

支持：Markdown / MDX、KaTeX 公式（`$...$` 与 `$$...$$`）、代码高亮、深浅色主题、RSS（`/rss.xml`）、站点地图、标签页。

## 站点配置

- 站点名、作者、导航：`src/consts.ts`
- 研究方向卡片、工作台、页脚结束语：同样在 `src/consts.ts`（`RESEARCH_TOPICS` `WORKBENCH` `SIGNOFFS`）
- 主题色：`src/styles/global.css` 顶部的 CSS 变量（`--paper` `--pencil` `--marker` `--pen` `--postit`）
- 字体：全站使用 [霞鹜文楷 Screen](https://github.com/lxgw/LxgwWenKai-Screen)，通过 npm 包 `lxgw-wenkai-screen-webfont` 自托管。它被拆成 97 个按 unicode-range 划分的子集，浏览器只下载页面实际用到的块。
- Now 卡片：`src/content/now/now.md`
- 域名：`astro.config.mjs` 的 `site`

## 原型试验场

`src/pages/lab/` 是仅在 `npm run dev` 下可见的页面（http://localhost:4321/lab/），用于在并入主站前预览个性化设计。生产构建不会生成它。

## 搜索

全站搜索由 [Pagefind](https://pagefind.app) 在 `npm run build` 结束时生成静态索引到 `dist/pagefind/`。本地 dev 想试搜索，先跑一次：

```bash
npm run search:dev   # 构建并把索引复制到 public/pagefind（已 gitignore）
```

## 其他本地页面

- `/drafts/`：所有 `draft: true` 的内容列表，仅 dev 可见。
- `/<板块>/rss.xml`：分板块订阅，例如 `/insight/rss.xml`。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库，把本项目推上去（分支 `main`）。
2. 仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
3. 每次推送到 `main`，`.github/workflows/deploy.yml` 会自动构建并发布。

### 自定义域名（latentk.com）

1. 在 `public/` 下新建 `CNAME` 文件，内容一行：`latentk.com`。
2. DNS 添加记录：
   - `A` 记录指向 GitHub Pages IP：`185.199.108.153`、`185.199.109.153`、`185.199.110.153`、`185.199.111.153`
   - 可选 `CNAME` 记录 `www` 指向 `<用户名>.github.io`
3. 仓库 Settings → Pages → Custom domain 填 `latentk.com`，勾选 Enforce HTTPS。

### 如果先用 `<用户名>.github.io/<仓库名>` 访问

把 `astro.config.mjs` 改为：

```js
site: 'https://<用户名>.github.io',
base: '/<仓库名>',
```

并把站内绝对链接（`/academic/` 等）改为带 base 的形式，或改回自定义域名后再去掉 `base`。
