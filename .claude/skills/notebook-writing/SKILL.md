---
name: notebook-writing
description: 在这个手绘笔记本风格的 Astro 站点（latentk.com，Margin Notes 主题）上写作和更新内容：板块与文件夹结构、frontmatter 字段、附件放置、笔记本 Markdown 语法（:note、:::postit、::video 等）、检查与发布流程。当被要求新增或修改文章、日常、资料库条目、项目与项目文档、关于页、Now 卡片或站点设置时使用。
---

# 在这个站点上写作

站点是 Astro 静态站，内容是 `src/content/` 下的 Markdown，推送到 `main` 后 GitHub Actions 自动部署。作者平时用 Sveltia 后台（`/admin/`）编辑；你直接改文件，效果相同。先读本文件，细节再看 `docs/SYNTAX.md`（语法全集）和 `docs/CONTENT-EDITING.md`（后台与附件规则）。

## 板块与文件位置

| 板块 | 文件 | 页面地址 | 附件放在 |
| --- | --- | --- | --- |
| academic 学术 | `src/content/academic/<slug>/index.md` | `/academic/<slug>/` | `academic/<slug>/attachments/` |
| insight 洞见 | `src/content/insight/<slug>/index.md` | `/insight/<slug>/` | `insight/<slug>/attachments/` |
| projects 项目 | `src/content/projects/<slug>/index.md` | `/projects/<slug>/` | `projects/<slug>/attachments/` |
| 项目文档 | `src/content/projects/<slug>/<doc>/index.md` | `/projects/<slug>/<doc>/` | `projects/<slug>/<doc>/attachments/` |
| dailies 日常 | `src/content/dailies/YYYY-MM-DD-<slug>.md` | `/dailies/YYYY-MM-DD-<slug>/` | `dailies/attachments/`（板块共用） |
| library 资料库 | `src/content/library/<slug>.md` | `/library/<slug>/` | `library/attachments/`（板块共用） |

- `<slug>` 用小写英文、数字、连字符；文件夹名就是 URL，发布后不要改。资料库允许中文文件名，但新建时优先用英文 slug。
- 项目文档只在项目页底部列出，不进项目卡片网格；项目是草稿时它的文档也不发布。
- `attachments/` 里不要放 `index.md`（会被当成文章）。附件按源码路径发布：`src/content/projects/x/attachments/a.webp` 就是 `/projects/x/attachments/a.webp`。草稿文章的附件不发布。
- 站点级文件（关于页图片等）放 `public/uploads/`，正文写 `/uploads/文件名`。

## 新建一篇

```sh
npm run new -- insight my-first-post "文章标题"      # 学术 / 洞见 / 项目生成 <slug>/index.md
npm run new -- dailies morning-run "晨跑"            # 日常自动加日期前缀
```

生成的文件 `draft: true`。写完把它改成 `false` 才会出现在网站上。手工创建也行，照下面的 frontmatter 写。

## Frontmatter

所有板块共有：`title`（日常可省略）、`date`（`YYYY-MM-DD`）、`updated`（可选）、`description`（可选摘要，列表和 RSS 用）、`tags`（字符串数组）、`draft`（布尔，默认 false，后台新建默认 true）、`comments`（布尔，默认 true；关闭写 `comments: false`，不要写字符串 `"false"`）。可选字段留空就整行删掉，不要写空字符串。校验规则在 `src/utils/content-schemas.mjs`。

### 评论与导航

- 五个板块及项目子文档均支持评论。已有文章未填写 `comments` 时默认开启；更新内容时保留作者已有的 `comments: false`。草稿不加载评论。
- CMS 每篇的“允许评论”对应 `comments`；“站点设置 → 导航与评论”对应 `src/data/interactions.json`，可配置导航自动隐藏、全站评论开关和 giscus 仓库/分类 ID。不要把公开 ID 当作密钥，也不要在这里放 token。
- 评论使用 `specific` 严格匹配 `板块/文章ID`，如 `projects/arm/log`。改标题或部署 base 不影响评论；改 slug、移动到其他板块会改变讨论关联，操作前说明这个影响。关闭页面评论不删除 GitHub 讨论，重新开启会恢复关联。
- giscus 的安装与配置见 `docs/COMMENTS.md`。配置未完整时页面不加载评论；应区分代码验证通过与 GitHub App 已安装、真实评论已成功提交，不代作者发测试评论。
- 评论配色与网站共用 `src/styles/tokens.css`，iframe 的笔记本样式在 `src/styles/giscus.css`。修改视觉样式时检查深浅色、四套配色和手机宽度；同步主题仓库时保留其空评论仓库配置。

### CMS 内容预览

五个板块的右侧预览由 `public/admin/previews.js` 组织为文章布局；正文、封面和相册用原生 `widgetFor`，保留编辑器组件、相对路径与异步图片加载能力。`scripts/prepare-cms.mjs` 生成预览 CSS，复用网站样式并应用 `src/styles/cms-preview.css` 的窄栏调整。新增可见 frontmatter 字段时检查是否应加入模板；不要把所有空字段和后台开关逐项展示。预览不加载真实评论、站点导航或可执行嵌入，完整交互仍需在站点验证。

| 板块 | 额外字段 |
| --- | --- |
| academic | `kind: note \| paper \| talk \| course \| project`（默认 note）、`series: { name, order }`、`venue`、`authors: []`、`year`、`links: { pdf, arxiv, doi, code, slides, site }`（都是完整 http 链接）、`bibtex`（多行用 `\|`） |
| insight | `cover: ./attachments/cover.webp`、`pinned: true`、`series: { name, order }` |
| projects | `status: active \| done \| archived \| idea`（默认 active）、`cover`、`video: ./attachments/demo.mp4`（有视频时卡片播放视频）、`stack: []`、`links: { github, demo, paper, docs }`、`featured: true` |
| dailies | `mood`、`location`、`images: [./attachments/a.webp, …]` |
| library | `type: book \| paper \| tool \| course \| article \| video \| dataset \| other`、`url`、`author`、`rating: 1–5`、`status: todo \| reading \| done`、`summary`（一句话评价，列表里显示）、`cover` |

示例（洞见）：

```yaml
---
title: 写作是思考的压缩
date: 2026-08-20
description: 把一个想法写清楚，比把它想清楚更难，也更有用。
tags: [writing, thinking]
cover: ./attachments/cover.webp
draft: false
---
```

## 正文语法速查

标准 Markdown（GFM：表格、任务清单、脚注）加 KaTeX（`$…$`、`$$ … $$`），再加下面的指令。冒号数决定尺寸：`:` 行内，`::` 独占一行，`:::` 包住段落；`[…]` 放内容或标题，`{…}` 放参数，裸词是变体，`key=value` 是数值或路径。

```md
句子里：:note[页边批注，宽屏浮在右侧] :mark[荧光笔]{green} :pen[圈出来]{circle} :pen[涂掉]{hide} :stamp[待验证]{green}

:::postit[标题]{tip}            类型 tip / warn / info / question，可不写
便利贴内容。
:::

:::note[标题]                    块级页边批注，可放多段、列表、图片
内容。
:::

:::photos{cols=3 scatter}       图片变成贴胶带的相片，alt 是图注
![图注](./attachments/a.webp)
:::

:::fold[标题]{open}              折页
:::steps{timeline}               有序列表变步骤 / 时间线（每条以 **日期** 开头）
:::layout{wide}  或 {cols=2}     加宽 / 分栏

::video[说明]{src=./attachments/demo.mp4 loop}       本地视频；youtube=ID / bilibili=BV 号 则点击后加载
::embed[说明]{page=./attachments/demo}               同源 iframe，文件夹里放 index.html，可带脚本
::embed[说明]{snippet=./attachments/figure.html}     静态片段直接嵌入
::bookmark[标题]{url=https://… desc="一句话"}         链接卡片
```

规则：
- 方括号里允许一层 `[…]`（链接可以，再嵌套不行）；容器指令不要互相嵌套。
- 只有登记过的名字会被识别，`key:value`、`10:30` 这类普通文字不受影响；不要发明新指令，新增指令要改 `src/markdown/directives.mjs` 并同步后台组件与文档（测试会检查）。
- 相对路径按文件所在文件夹解析：`./attachments/x`、`../other-post/`、`[文档](log/index.md)` 都会变成正确地址；站外链接照常。
- 正文不写 HTML，交互内容用 `::embed{page=…}`。脚注 `[^1]` 会自动进页边。
- 引用块最后一段以 `——` 开头会显示为出处。图片优先 WebP，宽度不超过 2048。

## 站点级内容

| 内容 | 文件 |
| --- | --- |
| 站名、副标题、简介、作者、域名、GitHub、邮箱、页脚结束语 `signoffs` | `src/data/site.json` |
| 首页 Now 卡片：`updated`、`doing`、`reading`、`listening` 列表 | `src/content/now/now.md`（只有 frontmatter） |
| 关于页：正文（frontmatter 后的 Markdown）、`highlights`、`workbench: { tools, hardware, questions }` | `src/content/about/about.md` |
| 板块开关、功能开关、默认配色、首页机械臂、研究方向卡片 | `src/config.ts` |
| 导航自动隐藏、giscus 全站开关与仓库/分类配置 | `src/data/interactions.json` |

## 检查与发布

1. 本地看效果：`npm run dev`，草稿也显示；`/drafts/` 列出全部草稿。
2. 提交前：`npm test`（含语法与附件测试），`npm run build && npm run verify`（构建并检查每个链接、图片、iframe 指向的文件存在）。改了主题代码再跑 `npm run check` 和 `npm run test:production`。
3. 提交信息沿用后台的风格：`Create 洞见 “标题”`、`Update 项目 “标题”`、`Delete 日常 “标题”`。
4. `git push origin main` 后 Actions 自动部署，几分钟后生效；构建失败时旧站继续服务，错误在 Actions 日志里。
5. 内容只属于个人站仓库 `origin`。改了主题层代码（组件、插件、样式、脚本、测试、文档）还要同步到主题仓库 `theme`，做法见 README 的“个人站与主题”。

## 常见问题

- 页面没出现：`draft` 还是 true，或板块在 `src/config.ts` 里关闭了。
- 构建报缺文件：正文引用的附件名写错，或文件不在这篇文章自己的 `attachments/` 里。
- 日期写成字符串带引号也可以，但必须是 `YYYY-MM-DD`；`updated` 不能早于 `date` 的语义上没有限制，但显示为“更新于”。
- 项目文档想放在项目公共附件里：写 `../attachments/x.webp` 也能用，但后台上传只会进文档自己的文件夹。
- 富文本后台会把 `![](x "标题")` 写成 `![标题](x)`，两种写法等价；文件里保持后一种最省事。
