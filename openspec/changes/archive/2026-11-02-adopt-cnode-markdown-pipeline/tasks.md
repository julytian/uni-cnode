# Tasks: adopt-cnode-markdown-pipeline

## 1. 管线模块（TDD）

- [x] 1.1 安装依赖（unified/remark-parse/remark-gfm/remark-rehype/rehype-raw/rehype-sanitize/rehype-highlight/rehype-stringify/highlight.js core+按需语言），验证 `pnpm build:h5` 无包体异常拉入
- [x] 1.2 TDD 实现 `src/utils/markdown.ts` `renderMarkdown()`：测试先行断言 GFM 表格/任务列表输出、`language-*` → hljs 高亮 span、`<script>` 被 sanitize 过滤、内联 `<br>/<b>` 保留、`processSync` 同步返回，至测试全绿
- [x] 1.3 TDD 实现路径后处理：站内图片 `src="/..."` 补全域名、输出 HTML 断言（同测试文件），至测试全绿

## 2. 数据获取切换

- [x] 2.1 `getTopicDetail` 请求参数改 `mdrender: false`，`TopicDetail.content` 与 `replies[].content` 类型/注释改为原始 Markdown，`pnpm test:run` 全绿（既有 topic.test.ts 断言同步更新）

## 3. 详情页接入

- [x] 3.1 正文卡与评论卡 `computed` 接入 `renderMarkdown()`；mp-html 新增 `tag-style` 深色定制（pre 深色容器/pre-wrap、code 等宽、blockquote 亮绿左缘、table 边框、img 圆角）
- [x] 3.2 `app.css` 移植 CNode Next 的 `.hljs-*` 深色配色类（从官网构建产物 CSS 提取）；mp-html 绑定 `@linktap`：`/user/xxx` → 站内用户主页路由、外链默认行为
- [x] 3.3 回复定位回归：提交回复后 `scroll-into-view` 仍定位最新评论（管线替换不破坏既有行为）

## 4. 验收与收尾

- [x] 4.1 渲染快照比对：选 2 个高热主题（含代码块/表格/图片/@提及），H5 截图与 cnodejs.org 同主题对照记录到 change 目录
- [x] 4.2 全量验证：`pnpm test:run` / `type-check` / `lint` / `build:h5` 全绿；H5 回归验收（正文/评论渲染、收藏/点赞/回复场景不受影响）
