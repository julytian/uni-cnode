# Design: adopt-cnode-markdown-pipeline

## Context

现状：详情/评论正文直接渲染 CNode API `mdrender=true` 的 HTML（mp-html 默认样式），代码块无容器视觉、无语法高亮。逆向结论（见探索记录）：CNode Next 官网（apps/web）使用 `react-markdown + remark-gfm + rehype-raw + rehype-sanitize + rehype-highlight(highlight.js ^11)` 渲染同一份 Markdown 内容，其中除 `react-markdown`（React 渲染层）外全部为纯 JS 管线，与框架无关。已实测：`mdrender=false` 时 @提及/表情均为标准 Markdown 形态（`[@xxx](/user/xxx)`、`![](path)`），remark 管线天然支持。

## Goals / Non-Goals

**Goals:**
- 客户端复刻 CNode Next 的 Markdown 管线（同款库、同款处理顺序），渲染结果与官网一致（GFM、内联 HTML 白名单保留、hljs 语法高亮）
- mp-html 深色 tag-style：代码块/引用/表格获得容器视觉
- 相对路径在 App 内正确行为：`/user/xxx` 链接转站内路由、站内图片补全域名
- hljs 深色配色从 CNode Next CSS 移植，视觉 1:1

**Non-Goals:**
- 不更换 mp-html（继续作为最终 HTML 渲染组件；不 vendor mp-html 完整源码/uni_modules，不启用其 highlight 插件）
- 不做编辑器/实时预览（管线仅用于展示）
- 不做小程序端 hljs class 样式的完全兼容（H5/APP 为验收平台；小程序端回退为无高亮纯文本样式，不阻塞）
- 不改 API 契约（仅消费侧从 mdrender=true 切到 false）

## Decisions

### D1: 管线封装为单一模块 `src/utils/markdown.ts`（纯函数）
```ts
renderMarkdown(md: string): string
  = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)                      // CNode 内容含 <br>/<b> 等内联 HTML
      .use(rehypeSanitize, CNODE_SCHEMA)   // 白名单：默认 schema + img/a 全属性 + class（hljs/language-*)
      .use(rehypeHighlight, { detect: false, ignoreMissing: true })  // language-* class 已由 CNode 提供
      .use(rehypeStringify)
      .processSync(md)
      .toString()
```
- `processSync` 同步执行（单篇正文 <1ms 级），页面 `computed` 直接调用，无异步竞态
- hljs 用 `highlight.js/lib/core` + 按需注册：bash/js/ts/typescript/json/xml(html)/css/yaml/markdown/diff——控制包体
- **备选**：异步管线/worker（无必要，同步够快）；markdown-it 方案（GFM/ sanitize 生态不如 unified 与 CNode Next 同源）。已否决。

### D2: 数据获取切 `mdrender=false`
- `getTopicDetail`：请求参数 `mdrender: false`；返回类型 `content: string`（原始 Markdown）；`replies[].content` 同为原始 Markdown
- 类型：`TopicDetail.content` 注释从"渲染后的 HTML"改为"原始 Markdown"；评论卡与正文卡统一调用 `renderMarkdown()`
- **理由**：管线输入必须是原始 Markdown（服务端 HTML 会与 remarkParse 冲突且丢失高亮语言 class 的处理时机）

### D3: 相对路径后处理（渲染后 DOM 级，正则不做）
- 站内图片：`/public/...` → `https://cnodejs.org/public/...`——在 HTML 字符串交给 mp-html 前，用一次正则替换 `src="/` 属性（形态有限：表情图与用户上传图两类，实测确认）
- 站内链接：`<a href="/user/xxx">` **不改写 URL**，mp-html 的 `@linktap` 事件拦截：`href` 以 `/` 开头 → `uni.navigateTo` 站内路由（`/user/xxx` → 用户主页），返回 `true` 阻止默认行为；外链 `copy`/`setClipboardData` 或 `#` 锚点按 mp-html 默认
- **备选**：rehype 自定义插件改写 href（把 App 路由知识混进管线，耦合）。已否决。

### D4: sanitize 白名单（CNODE_SCHEMA）
- 基于 `rehype-sanitize` 默认 schema 扩展：允许 `className`（hljs 与 language-*）、`img[src|alt|title]`（src 放开站内相对路径）、`a[href|title]`、`input[disabled|type|checked]`（GFM 任务列表）
- 与 CNode Next 的 sanitize 配置对齐（其 `rehype-sanitize` 默认 + 修正项，见 apps/web 源码 `components/markdown` 相关文件——实施时以官网 schema 为准逐项核对）

### D5: hljs 深色主题与 mp-html tag-style
- hljs 配色：从 CNode Next 构建产物 CSS 移植 `.hljs-*` 类定义（其深色主题已与整体设计调过），追加到 `app.css`；mp-html 渲染的节点处于页面文档流，class 样式天然生效（H5/APP）
- tag-style（mp-html prop，深色容器层）：
  - `pre`: 深色底 `#172813`、圆角 8px、内边距 12px、`white-space: pre-wrap`（移动端折行，pre 非 scroll-view 溢出不可滚）、字号 12px
  - `code`: 等宽字体栈、继承 hljs 配色（行内 code 与块内 code 同 tag-style 限制下的妥协：块内底色由 pre 提供）
  - `blockquote`: 亮绿左缘 + `#172813` 底 + 圆角
  - `table/th/td`: `border-collapse` + `white/8%` 边框 + 内边距
  - `img`: 圆角 8px
- **备选**：hljs 内联 style 输出（`useBR`/inline 模式）——颜色硬编码进 HTML，主题切换不灵活。已否决。

### D6: 复用与放置
- `renderMarkdown` 纯函数放 `src/utils/markdown.ts`；详情页正文卡与评论卡 `computed` 调用；单测（vitest）：管线输出断言（GFM 表格、hljs class、sanitize 过滤 script、图片域名补全）——无 uni 依赖，纯 Node 可测

## Risks / Trade-offs

- [包体增长 ≈100KB gzip（unified 管线 + hljs core/按需语言）] → 按需注册语言；App 端非关键路径可接受；构建分析插件确认无意外拉入
- [rehype-raw + sanitize 处理用户输入 HTML 的安全性] → sanitize 白名单是唯一放行通道，与官网同构；不添加 `dangerousAllowRaw` 类旁路
- [小程序端 hljs class 样式可能不生效] → Non-Goal 明示；回退样式（tag-style 的 pre/code 深色容器）保证可读
- [CNode 特有格式遗漏（如站内引用块、任务列表）] → GFM + raw 覆盖实测样例；实施时用本站高热主题做渲染快照比对
- [mdrender=false 后 @提及链接为相对路径] → linktap 拦截已覆盖（D3）

## Migration Plan

实施顺序：依赖安装 → `markdown.ts` 管线 + 单测（先 TDD）→ `getTopicDetail` 切 mdrender=false + 类型调整 → 详情页接入（tag-style + hljs CSS + linktap）→ 渲染快照比对（与官网同主题对照）→ 回归验收（评论/回复/收藏/点赞场景不受影响）。回滚：恢复 mdrender=true 与移除 tag-style 即回到现状（管线模块独立、无侵入）。

## Open Questions

- 无阻塞项。实施时唯一需对照源码确认的细节：CNode Next 的 sanitize schema 具体扩展项（D4 已给出核对路径）。
