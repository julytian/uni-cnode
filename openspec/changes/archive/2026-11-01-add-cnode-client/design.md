# Design: add-cnode-client

## Context

全新项目，目标平台 Android/iOS App（开发验收以 H5 为主）。技术基线（2026-11 用户更新）：create-uni CLI 脚手架（vitesse 基础模板 + pinia/vitest/z-paging 模块 + wot2 UI + tailwindcss）+ Wot UI 2.x UI 库（`@wot-ui/ui`，模板内置 WotV2Resolver 自动按需引入）+ tailwindcss v4（weapp-tailwindcss 适配小程序端）。CNode v1 API 基址 `https://api.cnodejs.org/api/v1`（CNode Next 新站，与旧 cnodejs.org/api/v1 接口路径与 {success, error_msg, data} 契约完全兼容，已实测 accesstoken/鉴权传参方式一致），共 15 个接口，均为 REST/JSON，鉴权方式为请求参数携带 `accesstoken`（非 header），响应契约 `{success, error_msg, data}`。模板不内置请求封装与登录拦截，二者按本设计自建。

## Goals / Non-Goals

**Goals:**
- 分层架构：页面 → Pinia Store / 页面状态 → Service 层（`src/api/`）→ 请求层（`src/http/`）→ uni.request
- Service 层与请求层为纯函数（fetcher 可注入），在 Node/jsdom 环境用 vitest 直接单测
- 单一请求出口：统一注入 accesstoken、统一 `{success, error_msg}` 契约处理与 401/403 登录失效降级
- H5 全功能可验收；App 双端构建路径明确（HBuilderX）

**Non-Goals:**
- 不做小程序端专项适配（tailwindcss 经 weapp-tailwindcss 已兼容，但不作为验收目标）
- 不做离线缓存、主题换肤、i18n 多语言
- 不实现 GitHub OAuth / 扫码登录（CNode 官方登录依赖网页端，App 端采用 token 粘贴）
- 不做推送通知（消息红点为拉取式，进入 App/关键页面时刷新）
- 不做自动化端到端测试（模板的 vitest-environment-uniapp + miniprogram-automator 环境保留但不启用，页面走 H5 手动验收）

## Decisions

### D1: Service 层模式（独立 `src/api/` 纯函数）—— 已获用户批准
页面与 Store 不直接发起请求，全部调用 `src/api/` 下的模块函数（topic / user / message / collect）。
- **为什么**：与所选测试策略（Service 层单测）直接匹配；API 契约集中一处，字段类型一目了然。
- **备选**：hooks 直连页面（代码最少但请求逻辑散落、难单测）；混合模式（风格不一致）。已否决。
- **形态**：Service 函数接收显式业务参数（token 由请求层拦截注入，签名不透传），返回 `Promise<T>` 的业务数据部分（拆包 `success/data`），失败 reject 统一错误对象。

### D2: UI 库与 CSS（Wot UI 2.x + tailwindcss v4）
- **Wot UI 2.x**（用户指定 "wot-ui v2"）：npm 包 `@wot-ui/ui@2.3+`；create-uni 模板已配置 `WotV2Resolver`（`@uni-helper/vite-plugin-uni-components`），SFC 中直接写 `<wd-xxx>` 即可，无需手动注册；Toast/Message 等命令式组件需在页面显式放置 `<wd-toast />`（uni-app 不支持全局挂载）。
- **tailwindcss v4**（用户指定）：模板内置 `weapp-tailwindcss` Vite 插件（`rem2rpx: true` 保证小程序尺寸）；入口 `src/app.css`（`@import "tailwindcss"`）；原子类直接用于页面布局，与 Wot 组件样式共存。
- **备选**：wot-design-uni 1.x（旧包，已否决）；UnoCSS（用户改选 tailwindcss，已否决）。

### D3: 请求层（自建 `src/http/`，fetcher 可注入）
create-uni 模板不含请求封装，自建轻量层替代：
- `src/http/fetcher.ts`：唯一 `uni.request` 出口，Promise 化，HTTP 语义（2xx/401/403/5xx/网络失败）映射为统一 `HttpError { type: 'business' | 'auth' | 'http' | 'network', message, statusCode }`
- `src/http/index.ts`：`http.get/post(url, params, options)`——注入 baseUrl（env `VITE_SERVER_BASEURL`）、query 序列化；已登录时注入 `accesstoken` 参数（GET → query，POST → body；显式传入优先，支持登录页验证 token）；CNode 契约处理：`success=true` 拆包 resolve，`success=false` reject（message 取 `error_msg`）并 toast；401/403 视为鉴权失效（清登录态 + toast + 引导登录），`authOptional` 标记的请求（如登录验证）按业务错误处理
- **为什么不用 alova/vue-query**：本项目接口面小且固定，纯 Promise 封装可测性最好、零抽象成本；hooks 风格与 D1 冲突。
- **备选**：@uni-helper/uni-network（create-uni 可选模块，API 面较大）、luch-request。已否决。

### D4: Markdown 渲染（服务端 mdrender + mp-html）
CNode API 默认 `mdrender=true` 返回渲染好的 HTML，客户端用 `mp-html` uni-app 组件渲染（支持图片懒加载、链接点击、代码块），不引入 markdown-it 在端内解析。
- **为什么**：CNode 的 Markdown 含 GFM 扩展（@提及、表情、代码高亮），服务端渲染保真度最高且省端内体积。
- **备选**：端内 marked 解析（需自行处理 GFM 扩展与 XSS，成本高）。已否决。
- 详情页容器对 `img`/`pre`/`code` 做约束样式（tailwindcss 的 typography 手段或少量 scoped CSS）。

### D5: 页面与路由（静态 pages.json + 原生 TabBar）
- create-uni 为静态 `src/pages.json`（无约定式路由插件），直接维护页面清单。
- 原生 TabBar 三项：`pages/index/index`（首页）、`pages/message/index`（消息）、`pages/my/index`（我的）；起步用纯文字图标（iconPath 可选），未读角标用 `uni.setTabBarBadge`/`removeTabBarBadge`（原生 API，比自定义 tabbar 组件简单可靠）。
- 非 Tab 页：`pages/topic/detail?id=`、`pages/publish/index`（发布与编辑复用，携带 `id` 即编辑）、`pages/login/index`（支持 `redirect` 参数回跳，满足 auth 规格）、`pages/user/index?loginname=`、`pages/collect/index`（我的收藏）。
- 页面导航栏：全局 `navigationStyle: default`（模板默认 custom，改回系统导航栏降低各页适配成本）。

### D6: 状态管理（pinia + 持久化，仅两个全局 store）
- `useUserStore`：token、id、loginname、avatar_url、积分/注册时间等扩展信息；`login(token)`（验证+持久化）、`logout()`、`isLogged`。持久化用 `pinia-plugin-persistedstate` + uni storage 适配。
- `useMessageStore`：未读数；`refreshCount()`、`markAllRead()`，角标同步（`uni.setTabBarBadge`）内聚在 store 的 `syncBadge()`。
- 消息列表、列表分页等为页面局部状态，不进全局 store（最小全局状态原则）。

### D7: 测试（vitest 4：jsdom + uni mock；页面 H5 手动验收）
- 模板 vitest 默认 environment 是 `uniapp`（miniprogram-automator 端到端，需微信开发者工具）。单测改用 **jsdom 环境 + 全局 uni mock**（`test/setup.ts`），覆盖：
  - 请求层：accesstoken 注入规则、baseUrl 拼接、CNode success 拆包、401/403 降级、authOptional、网络失败（mock fetcher/uni.request）
  - Service 层：mock `@/http`，逐接口断言 URL/方法/参数组装与拆包
  - Store：登录/登出/持久化逻辑、未读数角标同步
- 模板 `test/index.test.ts`（automator e2e）改写为不依赖开发者工具的单元测试；`vitest-environment-uniapp` 依赖保留，留作后续 e2e 扩展。
- **备选**：@vue/test-utils 组件测试（uni-app 组件生态弱、维护成本高）。已否决，与用户决策一致。

### D8: 双端与构建
- 开发/验收：`pnpm dev:h5`（unh CLI 封装）浏览器验证。
- App：`src/manifest.json` 配置 App 基本信息（名称、图标占位）；交付 HBuilderX 导入 → 云打包（Android APK / iOS IPA）操作说明文档。
- CNode API 为 HTTPS 公网接口，App 端原生请求无跨域；H5 开发期若浏览器 CORS 受限，用 vite devServer proxy 转发（App 端直连）。

## Risks / Trade-offs

- [CNode v1 API 为社区老接口，无 SLA，可能限流或停服] → Service 层统一错误对象包含可读 message；列表/详情失败均提供重试入口；接口契约测试以 mock 为准不依赖线上。
- [预置 accessToken 是个人凭据] → 只放 env 文件（确认 `.gitignore` 覆盖），业务代码不硬编码；文档提醒勿提交。生产构建不带预置 token，走登录页。
- [H5 端 CORS] → dev 用 vite proxy；App 端原生请求无跨域问题，主交付路径不受影响。
- [tailwindcss v4 较新，uni-app 生态兼容依赖 weapp-tailwindcss] → 模板已内置集成与 rem2rpx；复杂布局优先用 Wot 组件自带样式，原子类用于间距/排版。
- [mp-html 渲染他人产出的 HTML 存在注入面] → mp-html 自带标签白名单过滤；不在正文执行脚本，风险低。
- [原生 TabBar 无图标显示纯文字，观感朴素] → 起步阶段可接受；图标可通过后续补充 tabbar 图片资源升级，不影响行为规格。

## Migration Plan

全新项目无存量迁移。实施顺序：脚手架（已完成）→ env/路由/manifest 配置 → 请求层 TDD → Service 层 TDD → Store TDD → 页面（Tab 三页 → 详情互动 → 登录/用户页 → 发布收藏）→ H5 验收 → 打包文档。回滚不适用（新增仓库）。

## Open Questions

（无——关键分叉已由用户确认：功能范围完整版、Token 粘贴登录、Service 层单测、H5 验收；2026-11-01 用户更新技术栈为 create-uni + wot-ui v2 + tailwindcss，能力规格不受影响。）
