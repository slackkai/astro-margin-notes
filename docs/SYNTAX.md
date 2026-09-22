# 笔记本语法速查

这个站点的正文是普通 Markdown（含 GFM 表格、任务清单、脚注）加 KaTeX 公式（`$…$` 与 `$$ … $$`）。在此之上有一组“指令”，每个名字对应页面上的一种手绘物件。后台工具栏有同名按钮，所见即所存，富文本与 Markdown 模式互切无损。

## 写法规则

| 冒号数 | 位置 | 形式 |
| --- | --- | --- |
| `:name[文字]{参数}` | 行内，夹在句子里 | 荧光笔、红笔、印章、行内批注 |
| `::name[说明]{参数}` | 独占一行 | 视频、嵌入、链接卡 |
| `:::name[标题]{参数}` … `:::` | 包住若干段落 | 便利贴、块级批注、相片、折页、步骤、版式 |

- 方括号放内容或标题，可以含 **加粗**、链接、`$公式$`，允许一层 `[…]`。
- 花括号放参数：裸词选变体（`{warn}`、`{green}`），`key=value` 给数值和路径，含空格时加引号（`desc="一句 说明"`）。
- 所有指令都接受 `{#id}`、`{.class}` 和 `{tilt=-2}`（纸片类物件的倾斜角，单位度）。
- `:` 后紧跟字母的普通文字（`key:value`、`10:30`）不受影响；只有登记过的名字才会被识别，其余原样保留。

## 附件

每篇文章旁边有一个 `attachments/` 文件夹，图片、视频、PDF、HTML 页面都放在里面，正文用相对路径引用：`./attachments/photo.webp`。学术、洞见、项目每篇一个文件夹（`insight/<slug>/index.md`），日常、资料库整个板块共用 `dailies/attachments/`。发布地址与源码路径相同：`src/content/projects/arm/attachments/demo/` 发布为 `/projects/arm/attachments/demo/`。草稿文章的附件不会发布。

项目文件夹里可以再放文档：`projects/arm/log/index.md` 的地址是 `/projects/arm/log/`，它有自己的 `attachments/`，项目页底部会列出这些文档。相对链接同样按文件位置解析，`[日志](log/index.md)` 会变成页面链接。

## 页边 `note`

```md
正文里的一句话。:note[行内批注，宽屏浮在右侧页边并编号，窄屏点击上标展开。]

:::note[标题（可省略）]
块级批注，可以放多段、列表、图片和公式。
宽屏时贴在右侧页边，不编号；窄屏显示为虚线卡片。
:::
```

脚注 `[^1]` 也会变成页边批注，编号与 `:note[]` 连续。

## 荧光笔 `mark`

```md
:mark[默认色] :mark[绿]{green} :mark[粉]{pink} :mark[黄]{yellow}
```

默认色随当前配色变化，其余三色对应站点的便利贴色。

## 红笔 `pen`

```md
:pen[圈出来]{circle}  :pen[波浪线]{wavy}  :pen[方框]{box}  :pen[划掉]{strike}  :pen[涂掉的答案]{hide}
```

`circle` 是默认笔迹。`hide` 用铅笔涂掉，点击才显示，适合自测题和剧透。

## 印章 `stamp`

```md
:stamp[待验证]{red}  :stamp[已复现]{green}  :stamp[存疑]{blue}
```

`red`（默认）、`blue`、`green` 三色，斜着盖在文字旁边。

## 便利贴 `postit`

```md
:::postit[标题]{tip}
内容。类型有 tip 提示、warn 注意、info 说明、question 疑问；不写类型就是素便利贴。
:::
```

## 相片 `photos`

```md
:::photos{cols=3 scatter}
![图注写在这里](./attachments/a.webp)
![](./attachments/b.webp "也可以写在引号里")
:::
```

图片变成贴了胶带的相片，alt 文字或标题成为图注。一张时居中，多张默认两列；`cols=` 指定列数，`scatter` 让它们散落得更随意。

## 折页 `fold`

```md
:::fold[长清单]{open}
折起来的内容。`open` 表示默认展开。
:::
```

## 步骤 `steps`

```md
:::steps
1. 第一步
2. 第二步
:::

:::steps{timeline}
1. **2026-09** 每条以加粗开头，会显示成日期标签
2. **2026-10** 第二件事
:::
```

内容必须是一个有序列表；`timeline` 变体用圆点代替编号。

## 版式 `layout`

```md
:::layout{wide}
宽屏时溢出正文栏，放宽表格和大图。
:::

:::layout{cols=2}
第一栏

第二栏
:::
```

`cols=` 取 2 到 4，手机上自动变回单栏。

## 视频 `video`

```md
::video[说明]{src=./attachments/run.mp4 poster=./attachments/poster.webp loop}
::video[YouTube]{youtube=dQw4w9WgXcQ}
::video[Bilibili]{bilibili=BV1GJ411x7h7}
```

本地视频放在附件里，`loop` 表示静音自动循环。YouTube 和 Bilibili 只显示一个封面，点击后才加载播放器，页面打开时不会向站外发请求；`poster=` 可指定封面图。

## 嵌入 HTML `embed`

```md
::embed[说明]{page=./attachments/demo}
::embed[说明]{page=./attachments/demo height=480}
::embed[说明]{snippet=./attachments/figure.html}
```

- `page=` 指向附件里的一个文件夹（内含 `index.html`，可带自己的脚本、样式和资源），以同源 iframe 嵌入，与站点样式和脚本互不干扰。iframe 高度随页面内容自动调整，除非给了 `height=`。站点会把当前配色的 CSS 变量（`--paper`、`--pencil`、`--marker` 等）和 `data-theme`、`data-palette` 属性同步到页面根元素，页面里用 `var(--marker)` 就能跟随配色。
- `snippet=` 指向一个 HTML 文件，构建时原样嵌进正文，共享站点字体和颜色。只放静态内容；带脚本的交互一律用 `page=`，因为站内翻页使用客户端过渡，片段里的脚本不保证重新执行。
- 两种形式都只读取仓库里的文件，后台字段里写不了 HTML。引用不存在的文件会让构建失败。

## 链接卡 `bookmark`

```md
::bookmark[标题]{url=https://example.com/post desc="一句话说明" image=./attachments/thumb.webp}
```

回形针夹着的卡片，显示标题、说明和域名；站外链接在新标签页打开。

## 原生 Markdown 的重绘

不需要新语法，这些写法在页面上会长成手绘样子：

- 引用块带手写引号；最后一段以 `——` 开头就是出处，会右对齐显示。
- 有序列表编号是手绘圈号，无序列表是铅笔点。
- 任务清单 `- [ ]` / `- [x]` 是铅笔方框，勾选的用马克笔打勾。
- 代码块右上角贴一个胶带小标签显示语言名。
- 表格表头是便利贴色。
- 脚注 `[^1]` 进页边。
- 标题、分割线沿用站点原有的虚线。

## 在代码里扩展

- 指令表：`src/markdown/directives.mjs`，一个名字一条记录，含变体列表和渲染函数。
- 样式：`src/styles/markdown.css`，后台预览样式由 `scripts/prepare-cms.mjs` 从它生成。
- 后台组件：`public/admin/components.js`。
- 测试 `npm test` 会检查每个指令都有后台组件并出现在本文档里。
