# 可视化更新网站

## 线上编辑（推荐）

后台入口是网站地址后面的 `admin/`。主题演示的入口是：

<https://slackkai.github.io/astro-margin-notes/admin/>

1. 第一次使用，点击 **Sign In Using Access Token**。在 GitHub 创建 fine-grained personal access token：只选择你要编辑的仓库，授予 **Contents: Read and write**，设置到期时间。Metadata 读取权限会自动附带。将 token 粘贴到后台登录框；不要写入代码、文章或发到聊天里。
2. 选择“学术 / 洞见 / 日常 / 资料库 / 项目”，点击 **Create New Entry**。
3. 填标题、日期等字段，用富文本编辑器编写正文；也可切换到 Markdown。封面和正文图片可以直接上传，文件进入 `public/uploads/`。
4. 新文章默认开启“草稿”。关闭它才会出现在网站上，再点击 **Save**。
5. CMS 会提交到仓库 `main`；GitHub Actions 检查、构建并部署。等待仓库 Actions 中 **Deploy to GitHub Pages** 成功，再刷新网站。

**Save 表示内容已存入 GitHub，部署完成后网站才会更新。** 构建失败时旧网站继续服务，错误详情在 Actions 日志中。

后台的“站点设置 → 基本信息”可改站名、副标题、简介、作者、邮箱和 GitHub 链接；“最近在做”编辑首页 Now 卡片。功能开关、配色、机械臂等设计配置仍在 `src/config.ts`。

新建日常也建议填一个短标题，便于后台生成 URL；本地 Markdown 日常可以不填标题。

## 草稿的含义

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

## Markdown 与 MDX

后台管理 `.md` 文件，适合普通文章和图片。带 Astro 组件、页边批注的 `.mdx` 保留在代码编辑器中维护，避免富文本编辑器重写组件代码。两种文件会一起出现在前台。

命令行新建文章也可用：

```sh
npm run new -- insight my-first-post "我的第一篇文章"
```

命令会生成草稿，不会覆盖同名文件。文件名决定 URL，发布后尽量保持不变。

普通 Markdown 站内链接写 `/insight/my-first-post/`，图片写 `/uploads/example.png`，构建时自动加上 GitHub Pages 仓库路径。MDX 的自定义组件中动态拼接 URL 时，请使用 `withBase()`。

## 以后换成 GitHub 按钮登录

当前选用 token 登录，网站和后台都直接放在 GitHub Pages。若以后需要多人使用或 OAuth 按钮登录，可按 [Sveltia GitHub 后端文档](https://sveltiacms.app/en/docs/backends/github) 部署官方 Authenticator 到 Cloudflare Workers，再在 `cms.config.mjs` 配置 `base_url` 与 `auth_methods: ['oauth']`。这是可选升级，现有编辑流程无需它。

后台 UI 语言随浏览器和 Sveltia 用户设置；内容字段已使用中文。Token 保存在该浏览器的本地存储中，用完公共电脑应退出后台。
