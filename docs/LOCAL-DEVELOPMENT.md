# 本地预览与外部服务

## 选择预览方式

- `npm run dev:full`：先构建搜索索引并复制到开发服务器，再启动 Astro 热更新。适合日常改页面。修改文章后，搜索仍使用上次索引；运行 `npm run search:dev` 更新索引并刷新页面。
- `npm run preview:site`：构建网站、检查站内链接，再启动生产预览。搜索直接使用此次构建的索引，适合发布前验收。内容或代码变更后需重新运行。
- `npm run dev`：快速开发，首次启动不生成搜索索引。搜索提示仅在开发模式说明如何生成索引；线上加载失败显示普通访客能理解的提示。

预览服务已运行时，重新构建会更新它读取的 `dist`。修改端口或 base 前，先用 `npm run preview -- stop` 停止旧服务。以上命令不会推送 Git、部署站点或提交评论。

## 配置来源

| 项目 | 来源与优先级 | 本地使用的行为 |
| --- | --- | --- |
| 正式站点地址、canonical、评论回链 | `SITE_URL` → `src/data/site.json` 的 `url`；路径由 `BASE_PATH` 决定 | 仍指向配置的正式站点，不自动改成 localhost |
| 评论数据与“在 GitHub 查看讨论” | `src/data/interactions.json` 的仓库、仓库 ID、分类、分类 ID | 与线上共享配置仓库的真实 Discussions |
| 评论主题样式 | 本地使用配置的正式站点地址；公开 HTTPS 页面使用自身域名 | 使用已部署 CSS，本地改主题后需 HTTPS 预览部署验证 |
| 后台写入仓库 | `CMS_REPOSITORY` → `GITHUB_REPOSITORY` → GitHub `origin` | 不是本地文件编辑器；登录后台并保存会写入指定 GitHub 仓库 |
| 留言投递服务 | `src/config.ts` 的 `guestbook.web3formsKey` | 提交会调用该标识对应的真实 Web3Forms 服务 |

后台无法确定仓库时，会停止准备步骤并给出配置说明，不默认使用作者的个人仓库。评论仓库和后台仓库彼此独立：修改 `CMS_REPOSITORY` 不会迁移或重定向评论。

## 在独立副本中测试服务

默认本地预览沿用当前连接配置，不自动创建测试后端。只检查排版、筛选、搜索时不需要提交任何表单。

需要隔离写入时，在独立测试副本中：

1. 后台指定测试仓库 `CMS_REPOSITORY`。
2. 评论关闭全站开关，或同时换成测试仓库及其匹配的仓库/分类 ID。
3. 留言清空 `web3formsKey` 以显示未配置状态，或替换成测试投递标识。

PowerShell 中可为当前终端指定后台仓库：

```powershell
$env:CMS_REPOSITORY = 'your-account/test-site'
npm run dev:full
```

撤销覆盖：`Remove-Item Env:CMS_REPOSITORY`。这些构建脚本读取进程环境变量，不应假定仅创建 `.env` 文件就会设置脚本中的变量。不要将测试连接配置提交到正式发布分支。
