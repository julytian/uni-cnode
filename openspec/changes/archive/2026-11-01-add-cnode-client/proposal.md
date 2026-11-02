# Proposal: add-cnode-client

## Why

CNode 社区目前只有网页端（https://cnodejs.org），移动端用户缺少原生的浏览与互动体验。需要基于 CNode 官方 v1 API（https://api.cnodejs.org/api/v1）开发一个同时支持 Android 与 iOS 的跨平台 App 客户端，覆盖网页端全部核心功能。

## What Changes

- 通过 create-uni CLI（`pnpm create uni`，vitesse 基础模板）创建全新项目脚手架：uni-app + Vue3 + TypeScript + Vite，集成功能模块 pinia / vitest / z-paging，无需 HBuilderX 即可命令行开发，最终可打包 Android/iOS App
- UI 库采用 Wot UI 2.x（npm 包 `@wot-ui/ui`，wot-design-uni 的升级品牌），create-uni 模板已内置 WotV2Resolver 组件自动按需引入
- CSS 框架采用 tailwindcss v4（小程序端经 weapp-tailwindcss 适配，rem2rpx 保证尺寸表现）
- 新增 8 个页面与 3 个原生 TabBar 入口：首页（主题列表）、消息、我的；主题详情、发布/编辑主题、Token 登录、用户主页、我的收藏
- 新增自建请求层（`src/http/`，可注入 fetcher 的轻量封装）与 Service 层（`src/api/`）封装 CNode v1 API 全部 15 个接口：统一注入 accesstoken（CNode 以请求参数鉴权）、统一 `{success, error_msg, data}` 契约处理、401/403 登录失效降级
- 新增 Pinia 全局状态（持久化）：登录态（token/用户信息）、未读消息数与 TabBar 角标
- 登录采用 Token 粘贴方式（`POST /accesstoken` 验证），开发调试预置固定 accessToken（环境变量注入）
- Markdown 正文采用服务端渲染（`mdrender=true`）+ mp-html 富文本组件展示
- 建立 vitest 单元测试覆盖请求层语义、Service 层与核心 Store 逻辑（jsdom + uni mock）；页面通过 H5 浏览器手动验收
- 提供 App 双端（Android/iOS）HBuilderX 打包说明；开发期以 H5 浏览器为验收平台

## Capabilities

### New Capabilities

- `topic-browsing`: 主题浏览——首页主题列表（全部分类 Tab 筛选、上拉分页、下拉刷新）、主题详情（Markdown 正文渲染、评论列表、评论点赞）
- `auth`: 登录认证——Token 粘贴登录与验证、登录态持久化、登出、需登录操作的登录拦截
- `topic-interaction`: 主题互动——发布新主题、编辑主题、回复主题、收藏/取消收藏
- `message-notification`: 消息通知——未读消息数角标、未读/已读消息列表、标记已读（全部/单条）
- `user-profile`: 用户资料——我的页（个人信息、我的收藏、我的发布/回复入口）、他人用户主页

### Modified Capabilities

（无——全新项目，不涉及已有能力变更）

## Impact

- **代码**：全新仓库（create-uni 脚手架）。新增 `src/http/`（请求层）、`src/api/`（Service 层）、`src/stores/`（user/message store）、`src/pages/`（8 个页面）、`src/pages.json`（原生 TabBar 与路由）
- **外部 API**：CNode v1 API（`https://api.cnodejs.org/api/v1`），共 15 个接口（主题列表/详情、新建/编辑主题、收藏、回复、点赞、用户详情、token 验证、消息 4 个）
- **凭据**：调试用 accessToken 由用户提供，写入 env 文件（不硬编码进业务代码）
- **依赖**：create-uni 模板内置依赖；新增 `mp-html`（Markdown 渲染）；测试沿用模板 vitest（4.x）
- **平台**：H5 开发验收；App 端 Android/iOS 依赖 HBuilderX 云打包或离线打包（交付说明文档）
