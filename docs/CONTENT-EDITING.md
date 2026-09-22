# 可视化更新网站

## 线上编辑（推荐）

后台入口是网站地址后面的 `admin/`。主题演示的入口是：

<https://slackkai.github.io/astro-margin-notes/admin/>

1. 第一次使用，点击 **Sign In Using Access Token**。在 GitHub 创建 fine-grained personal access token：只选择你要编辑的仓库，授予 **Contents: Read and write**，设置到期时间。Metadata 读取权限会自动附带。将 token 粘贴到后台登录框；不要写入代码、文章或发到聊天里。
2. 选择“学术 / 洞见 / 日常 / 资料库 / 项目”，点击 **Create New Entry**。
3. 填标题、日期等字段，用富文本编辑器编写正文；也可切换到 Markdown。封面和正文图片可以直接上传，文件进入这篇文章旁边的 `attachments/` 文件夹。
4. 新文章默认开启“草稿”。关闭它才会出现在网站上，再点击 **Save**。
5. CMS 会提交到仓库 `main`；GitHub Actions 检查、构建并部署。连续保存多次时只会构建最新一次，等待仓库 Actions 中 **Deploy to GitHub Pages** 成功，再刷新网站。

**Save 表示内容已存入 GitHub，部署完成后网站才会更新。** 构建失败时旧网站继续服务，错误详情在 Actions 日志中。

后台的“站点设置 → 基本信息”可改站名、副标题、简介、作者、邮箱、GitHub 链接和页脚随机结束语；“最近在做”编辑首页 Now 卡片；“关于页”编辑自我介绍、“这个站点有什么”列表和工作台（工具 / 硬件 / 正在追的问题）；列表留空时自动列出已启用板块，工作台全部留空则不显示，联系方式来自“基本信息”。功能开关、配色、机械臂等设计配置仍在 `src/config.ts`。

新建日常也建议填一个短标题，便于后台生成 URL；本地 Markdown 日常可以不填标题。

## 附件：图片、视频和嵌入页面放在哪

每篇文章和它的附件住在一起，仓库里长这样：

```
src/content/
├─ projects/
│  └─ arm-grasp/               ← 一个项目
│     ├─ index.md              ← 项目页  /projects/arm-grasp/
│     ├─ attachments/          ← 这篇文章的图片、视频、PDF、HTML 页面
│     └─ log-2026-09/          ← 项目里的一篇文档  /projects/arm-grasp/log-2026-09/
│        ├─ index.md
│        └─ attachments/
├─ academic/、insight/           ← 同样每篇一个文件夹
├─ dailies/                     ← 整个板块共用一个 attachments/
│  ├─ attachments/
│  └─ 2026-09-18-blog-up.md
└─ library/                     ← 同 dailies
```

- 在后台上传的文件自动进入正确的 `attachments/`，正文里的引用是相对路径 `./attachments/photo.webp`。删除文章时，它的附件一起删除。
- 发布地址与源码路径相同：`src/content/projects/arm-grasp/attachments/demo/` 发布为 `/projects/arm-grasp/attachments/demo/`。草稿文章的附件不会发布，但公开仓库里仍能看到。
- “项目”在侧栏显示为文件夹树。打开一个项目再点新建，新文章就成为这个项目的文档，项目页底部会列出它们；改项目名或移动项目时，文档和附件一起走。
- 上传的图片会在浏览器里压缩为 WebP（最长边 2048 像素）再提交，避免把几 MB 的截图放进仓库。视频、PDF 和 HTML 页面原样提交，请自行控制体积。
- 站点级的文件（比如关于页的图片）仍在 `public/uploads/`，写 `/uploads/文件名`。

## 草稿的含义

未填写的更新日期、论文/文档链接、封面等可选字段可以直接留空。CMS 会省略这些字段；以前保存的空字符串或 `null` 也能正常构建，无需逐篇删除。必填日期和非空但格式错误的链接仍需修正。草稿同样会经过字段校验，但不会生成公开页面。

`draft: true` 只阻止静态网页、RSS、标签、归档和搜索索引发布，**不会隐藏公开 GitHub 仓库中的源文件**。私密笔记不要提交到公开仓库。开发服务器 `npm run dev` 会显示草稿，`npm run preview` 只预览生产构建，不显示草稿。

## 本地可视化编辑

```sh
npm ci
npm run dev
```

在 Chrome / Edge 打开终端显示的本地地址后加 `admin/`，点击 **Work with Local Repository**，选择项目根目录（包含 `package.json` 的目录），按浏览器提示授予目录访问权限。

这个方式无需 GitHub token。保存直接更新本地文件；另开前台页即可预览。完成后用 GitHub Desktop 提交并推送，或执行：

```sh
git add src/content src/data public/uploads
git commit -m "content: update notes"
git push
```

线上后台也在使用时，本地写作前先拉取最新提交，避免两处同时修改同一篇文章。CMS 本地模式不代替 Git，也不会自动推送。

## 笔记本语法：批注、便利贴、相片、视频与嵌入

正文工具栏有四个行内按钮：**页边批注**、**荧光笔**、**红笔**、**印章**；“插入”菜单里有 **便利贴**、**页边批注（多段）**、**相片**、**折页**、**步骤 / 时间线**、**版式**、**视频**、**嵌入 HTML**、**链接卡片** 和 **公式（独立一行）**。点击后在弹窗里填内容即可；已有的元素在富文本里显示为可点击的块，点开可修改或删除。它们保存为普通 Markdown，富文本和 Markdown 两种模式来回切换不会改写内容：

```md
正文中的 :mark[一个重点]{green}，:pen[圈出来的词]，:stamp[待验证]。:note[页边批注，支持 **加粗**、[链接](https://example.com) 和 $d_k$。]

:::postit[标题]{tip}
便利贴里的内容。
:::

:::photos{cols=2}
![图注](./attachments/a.webp)
![图注](./attachments/b.webp)
:::

::video[说明]{src=./attachments/demo.mp4 loop}
::embed[说明]{page=./attachments/demo}
```

批注在宽屏浮到右侧页边并自动编号，窄屏点击上标展开；脚注 `[^1]` 也会进页边。全部写法、参数和原生 Markdown 的手绘样式见[笔记本语法](SYNTAX.md)，站内的《笔记本语法演示》项目把它们全部用了一遍。

嵌入的 HTML 页面放在附件里的一个文件夹中（如 `attachments/demo/index.html`），可以带自己的脚本和样式；后台的“嵌入 HTML”组件只填这个路径，不需要在正文里写 HTML。页面文件在代码编辑器或 GitHub 网页里维护。

行内公式直接写 `$…$`，后台预览按原文显示，独立公式在预览里实时渲染。`:` 后紧跟字母的普通文字（如 `key:value`）不受影响。

“日常”新建时文件名自动带日期，如 `2026-09-21-标题.md`；不填标题则用日期加随机后缀。列表默认按日期倒序，右上角筛选可只看草稿或已发布。

## Markdown 与 MDX

后台管理 `.md` 文件，以上写法已经覆盖批注、便利贴、相片、公式、图片、视频和嵌入页面。只有需要自定义 Astro 组件的 `.mdx` 才保留在代码编辑器中维护，后台不会列出它们；把 `<Note>…</Note>` 改写为 `:note[…]`、删除 import 并把扩展名改为 `.md`，即可转为后台可编辑。两种文件会一起出现在前台。

命令行新建文章也可用：

```sh
npm run new -- insight my-first-post "我的第一篇文章"
```

命令会生成草稿 `src/content/insight/my-first-post/index.md`，不会覆盖同名文件。文件夹名决定 URL，发布后尽量保持不变。旧的平铺布局用 `node scripts/migrate-bundles.mjs` 迁移。

普通 Markdown 站内链接写 `/insight/my-first-post/`，图片写 `./attachments/example.webp`，构建时自动加上 GitHub Pages 仓库路径。链接到旁边的 Markdown 文件（如 `[日志](log/index.md)`）会自动变成页面地址。MDX 的自定义组件中动态拼接 URL 时，请使用 `withBase()`。

## 以后换成 GitHub 按钮登录

当前选用 token 登录，网站和后台都直接放在 GitHub Pages。若以后需要多人使用或 OAuth 按钮登录，可按 [Sveltia GitHub 后端文档](https://sveltiacms.app/en/docs/backends/github) 部署官方 Authenticator 到 Cloudflare Workers，再在 `cms.config.mjs` 配置 `base_url` 与 `auth_methods: ['oauth']`。这是可选升级，现有编辑流程无需它。

后台 UI 语言随浏览器和 Sveltia 用户设置；内容字段已使用中文。Token 保存在该浏览器的本地存储中，用完公共电脑应退出后台。
