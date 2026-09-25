# 导航与 giscus 评论

导航默认下滚隐藏、上滚显示。菜单展开、搜索框打开、导航内部持有键盘焦点时保持可见；移动菜单支持 Escape 和点击外部关闭。系统偏好减少动画时取消滑动过渡。后台“站点设置 → 导航与评论”可关闭自动隐藏。

## 接入 GitHub

评论使用你选择的公开仓库的 Discussions，建议分类为 `Announcements`。可以使用网站源码仓库，也可以使用独立评论仓库；主题默认留空，配置完整后才加载。

1. 仓库 Settings → General → Features 中开启 Discussions。
2. 安装 [giscus GitHub App](https://github.com/apps/giscus)，选择 **Only select repositories** 并选中自己的评论仓库。仓库公开和 Discussions 开启并不能替代 App 安装。
3. 在 [giscus 配置页](https://giscus.app/zh-CN) 输入仓库，确认检查通过并选择 Announcements 分类。
4. 后台“站点设置 → 导航与评论”填写仓库名、仓库 ID、分类名、分类 ID，开启全站评论。对应 `src/data/interactions.json`；公开 ID 不是凭据，不需要 GitHub token。

主题仓库提供空的仓库配置，启用时填入自己的仓库，避免评论写入其他站点。

## 按文章开关

每篇内容的 CMS “允许评论”默认打开。直接编辑 Markdown 可写：

```yaml
comments: false
```

字段省略、留空时默认开启；明确的布尔 `false` 会保留，不可写成字符串 `"false"`。五个板块及项目子文档均适用。草稿不显示评论；全站关闭或仓库配置不完整时，不显示评论区、不请求 giscus。

关闭开关只隐藏站内评论区，GitHub 上的讨论仍可访问；如需禁止在 GitHub 继续回复，在对应 Discussion 上锁定对话。重新打开开关会关联原讨论。

## 关联与加载

- 采用 `specific` + 严格匹配，标识为 `板块/文章ID`，如 `insight/hello-world`、`projects/arm/log`。
- 文章标题、站点域名和 GitHub Pages base 改变不影响关联；修改 slug、移动文章板块或更换评论仓库/分类前，需要规划评论迁移。不要直接重命名 giscus 创建的 Discussion。
- 滚动接近评论区后才下载官方 Web Component 和加载 iframe，随网站四套配色和深浅色同步，切页时清理旧组件、监听和定时器。
- 评论沿用文楷字体、纸张底色、铅笔描边和硬阴影；隐藏主帖表情栏，保留评论及回复。`src/styles/tokens.css` 是网站、CMS 预览和评论共用的设计变量；`src/styles/giscus.css` 控制 iframe 内布局。构建时生成八套 `/giscus/<配色>-<light|dark>.css`，字体仍使用网站自己的分片资源。
- 自定义 CSS 使用 giscus 官方的主题 URL 接口。GitHub Pages 允许跨域读取静态资源；本地请用生产构建后的 `npm run preview` 检查（已仅对 giscus origin 开放预览资源）。浏览器若阻止 HTTPS iframe 读取本地 HTTP 资源，以部署后的实际加载为准。其他托管平台需给主题 CSS 和字体设置允许 `https://giscus.app` 跨域读取的响应头。
- 访客可以阅读评论；发表评论需 GitHub 登录授权。首次评论或回应时 giscus 自动创建 Discussion。
- 加载失败有提示和 GitHub 讨论入口；浏览器禁用 JavaScript 时仍保留 GitHub 链接。讨论回链使用文章 canonical URL，避免从本地预览评论时留下 localhost 地址。

## 检查

运行 `npm test`、`npm run check`、`npm run test:production`，再 `npm run build && npm run verify`。生产回归覆盖默认开启、逐篇关闭、项目子文档、全站关闭、未配置及带 base 的构建。浏览器还应检查上下滚动、移动菜单、切页与后退、深浅色切换、giscus 实际加载。

构建通过不代表已完成 App 安装或真实评论提交；验证加载无需代作者发送测试评论。
