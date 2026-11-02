# Proposal: adopt-cnode-markdown-pipeline

## Why

主题详情与评论正文目前直接渲染 CNode API `mdrender=true` 返回的 HTML，存在明显观感缺陷：代码块无容器视觉（与正文混排）、无语法高亮、引用/表格未适配深色主题。CNode Next 官网（github.com/cnodejs/cnode-next，apps/web）对同类内容使用 unified/remark 管线 + highlight.js 渲染，效果是本 App"严格遵循 CNode Next 设计"诉求的最彻底答案。经源码逆向验证，其管线核心库全部为纯 JS、与框架无关，可完整移植到 uni-app Vue3 页面（H5/APP）。

## What Changes

- 正文/评论数据获取改为 `mdrender=false`：从 CNode API 获取原始 Markdown（而非服务端预渲染 HTML）
- 新增客户端 Markdown 渲染管线（与 CNode Next 同款库）：`remark-parse` → `remark-gfm` → `remark-rehype(allowDangerousHtml)` → `rehype-raw` → `rehype-sanitize` → `rehype-highlight`（highlight.js core + 按需注册常用语言）→ `rehype-stringify` 输出 HTML
- mp-html 继续作为最终渲染组件，新增 `tag-style` 深色定制（pre 代码块容器、行内 code、blockquote、table、img），`.hljs-*` 高亮配色以页面 CSS 提供（从 CNode Next 的 hljs 主题变量移植）
- 相对路径后处理：`/user/xxx` 链接经 mp-html `linktap` 拦截转为 App 内用户主页路由；表情等站内图片 URL 补全 `https://cnodejs.org` 前缀
- 回复正文同管线复用（评论渲染质量同步提升）
- **BREAKING（内部契约）**：`GET /topic/:id` 的消费方式从消费 `content`（HTML）改为消费原始 Markdown；`getTopicDetail` 返回类型相应调整

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `topic-browsing`: 「查看主题详情」「评论列表展示」两条需求的渲染实现变更为客户端 Markdown 管线（原始 markdown → unified 管线 → mp-html），外部可见行为新增语法高亮与深色代码块容器；浏览/回复/点赞等既有场景行为不变

## Impact

- **依赖**：新增纯 JS 包 `unified`、`remark-parse`、`remark-gfm`、`remark-rehype`、`rehype-raw`、`rehype-sanitize`、`rehype-highlight`、`rehype-stringify`、`highlight.js`（core + 按需语言注册，控制包体 ≈100KB gzip）；全部无 DOM/框架依赖，uni-app Vue3 页面（H5/APP）可运行
- **代码**：新增 `src/utils/markdown.ts`（管线封装 + 路径后处理）；`src/api/topic.ts`（mdrender=false + 类型调整）；详情页 `MpHtml` 调用处（tag-style + hljs CSS）；`app.css`（hljs 深色主题变量，从 CNode Next CSS 移植）
- **外部 API**：`GET /topic/:id` 参数 `mdrender=false`（接口契约不变，仅消费方式变化）
- **风险面**：sanitize 白名单需覆盖 CNode 内容的内联 HTML（br/b/img/a）；小程序端 rich-text 对 hljs class 样式的作用受限（H5/APP 为主战场，可接受）
