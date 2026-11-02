# uni-cnode

CNode 社区移动端客户端（Android / iOS / H5），基于 **create-uni** 脚手架（uni-app + Vue3 + TypeScript + Vite）+ **Wot UI 2.x**（`@wot-ui/ui`）+ **tailwindcss v4**（weapp-tailwindcss 适配小程序端）开发。

规范驱动开发：[OpenSpec](https://github.com/Fission-AI/OpenSpec)（openspec/）+ superpowers 技能链，规格与验收记录见 `openspec/changes/add-cnode-client/`。

## 功能

- **首页**：主题列表（全部/精华/分享/问答/招聘/客户端测试分类）、下拉刷新、上拉分页
- **主题详情**：Markdown 正文（服务端渲染 + mp-html）、评论列表、评论点赞、回复（支持回复指定评论）
- **互动**：收藏/取消收藏、发布主题、编辑主题（仅作者）
- **消息**：未读角标（TabBar）、未读/已读分组、全部/单条标记已读
- **我的**：个人资料、我的收藏、我的主题/回复（复用用户主页）、退出登录
- **登录**：accessToken 粘贴登录（与网页版账号通用），登录态持久化，未登录操作拦截与登录回跳

## 快速开始

```bash
pnpm install

# H5 开发（默认平台；API 经 vite 代理规避 CORS）
pnpm dev:h5        # 或 pnpm dev

# 单元测试（请求层 / Service 层 / Store）
pnpm test:run

# 类型检查 / 代码检查
pnpm type-check
pnpm lint

# H5 生产构建
pnpm build:h5
```

开发期浏览器访问 `http://localhost:5174`。

## 环境变量

| 文件 | 变量 | 说明 |
|---|---|---|
| `.env` | `VITE_SERVER_BASEURL` | CNode API 基址（`https://api.cnodejs.org/api/v1`，CNode Next 新站） |
| `.env.local` | `VITE_ACCESS_TOKEN` | 调试预置 accessToken（已被 gitignore，**勿提交**；生产构建不提供时以未登录启动） |
| `.env.development` | `VITE_APP_PROXY_ENABLE` | H5 开发代理开关（规避 CORS；App 端原生请求无 CORS，不受影响） |

复制 `.env.example` 为 `.env.local` 并填入你自己的 accessToken 即可本地调试。

## 主题设计

主题**逐值对齐 CNode Next（cnodejs.org）深色模式**的设计变量（oklch → sRGB），主色 `#9de330` 即 CNode Next 深色 `--primary`（oklch(83.85% .209 129.52)）：

| Token | 值 | 用途 |
|---|---|---|
| `page` | `#071207` | 页面背景（CNode dark `--background`） |
| `card` | `#0d1a0b` | 卡片/列表容器（CNode dark `--card`） |
| `ink-900` | `#edf8e7` | 一级文字（CNode dark `--foreground`） |
| `ink-600` / `ink-400` | `#9eb092` / `#6a7664` | 次要/弱化文字（muted-foreground 系） |
| `primary` | `#9de330` | 主按钮底/tab 选中 pill/标签/链接（品牌亮绿） |
| `primary-fg` | `#071207` | 亮绿上的文字（= background） |
| `primary-soft` / `muted` | `#1e3516` / `#172813` | 选中弱化背景/标签与输入底 |
| `line` | `rgba(255,255,255,.08)` | 分隔线（CNode border = white/10 收敛） |
| `danger` | `#f26d5f` | 深底可读危险红 |

- **tailwind 语义类**：`bg-page`、`bg-card`、`text-ink-900/700/600/400`、`bg-primary`、`text-primary-fg`、`bg-muted`、`border-line` 等（定义于 `src/app.css` 的 `@theme`）
- **wot-ui 深色覆盖**：`--wot-primary-1~10` 刻度、`--wot-button-*`、输入框 `--wot-input-*`/`--wot-textarea-*`（深底浅字）全局生效（`page/:root`）
- **组件语言**（对齐 CNode Next）：分类 tab 为胶囊 pill（选中绿底深字）、列表为大圆角深色卡片容器 + 无边框条目、置顶/精华标签为亮绿 pill、元信息行（作者/回复/浏览/时间）
- **App 规范**（better-ui）：主提交按钮 44px（size=large）、条目点击区 ≥56px、正文 14px/标题 15-16px/辅助 12px/标签 11px 字号阶梯、头像白色 10% 描边、按压反馈 scale 0.96-0.98

## API 说明

CNode v1 API（CNode Next 版本），接口清单与契约见 `openspec/changes/add-cnode-client/proposal.md`。两个特殊点已适配：

- `POST /accesstoken` 成功响应为顶层平铺（无 `data` 包裹），走 `http.rawPost`
- 鉴权方式为请求参数携带 `accesstoken`（GET → query，POST → body），非 Authorization header

## App 打包（Android / iOS）

见 [docs/app-build.md](docs/app-build.md)。

## 目录结构

```
src/
├── api/          # Service 层：CNode API 封装（topic/user/message/collect）+ 类型
├── http/         # 请求层：fetcher（HTTP 语义）+ http（baseUrl/accesstoken 注入/契约拆包）
├── stores/       # Pinia：user（登录态持久化）/ message（未读数与角标）
├── pages/        # 页面：index/message/my/topic/publish/login/user/collect
├── components/   # TopicCard 等通用组件
├── utils/        # timeAgo/tabLabel、ensureLogin 登录拦截
└── test …        # 测试与全局 uni mock（test/setup.ts）
```
