# Tasks: add-cnode-client

## 1. 脚手架与基础配置

- [x] 1.1 用 create-uni CLI 创建项目（`pnpm create uni _scaffold --ts -m pinia -m vitest -m zPaging -u wot2 -c tailwindcss -e`）并合并到项目根、安装依赖，验证 `pnpm dev:h5` 能启动出默认首页
- [x] 1.2 验证 Wot UI 2.x 组件渲染：模板 WotV2Resolver 已内置，在首页放置示例组件（如 wd-button）确认 H5 正常渲染与类型提示
- [x] 1.3 配置环境变量：创建 `.env` 写入 `VITE_SERVER_BASEURL=https://cnodejs.org/api/v1` 与调试预置 `VITE_ACCESS_TOKEN`，验证 env 在代码中可读取且已被 gitignore
- [x] 1.4 配置 `src/pages.json`：原生 TabBar（首页/消息/我的）、全部 8 个页面路由、导航栏样式（navigationStyle: default），验证 H5 启动无路由告警
- [x] 1.5 配置 `src/manifest.json` App 基本信息（名称 CNode、图标占位），验证 H5 运行无 manifest 告警
- [x] 1.6 调整 vitest 单测基建：`vitest.config.ts` 改 jsdom 环境 + `test/setup.ts` 全局 uni mock，模板 e2e 示例改为单元测试，`pnpm test:run` 基线全绿

## 2. 请求层与 Service 层（TDD）

- [x] 2.1 TDD 实现统一错误类型与 CNode 类型定义（`src/http/types.ts`、`src/api/types.ts`：主题/回复/用户/消息等接口类型），测试先行验证错误对象构造语义
- [x] 2.2 TDD 实现请求层 `src/http/`（fetcher + http.get/post）：断言 baseUrl 拼接、query 序列化、accesstoken 注入规则（GET→query/POST→body/显式优先/未登录不注入）、`success=true` 拆包、`success=false` reject(error_msg) + toast、HTTP 401/403 鉴权降级（清登录态+跳登录）、`authOptional` 按业务错误处理、网络失败 reject，至测试全绿
- [x] 2.3 TDD 实现 `src/api/topic.ts`（列表/详情/新建/编辑）：先写单测断言 URL、方法、参数组装与拆包，再实现至测试通过
- [x] 2.4 TDD 实现 `src/api/user.ts`（用户详情/验证 token）与 `src/api/message.ts`（未读数/消息列表/全部已读/单条已读）：测试先行至全部通过
- [x] 2.5 TDD 实现 `src/api/collect.ts`（收藏/取消收藏/收藏列表）与回复/点赞接口：测试先行至全部通过，`pnpm test:run` 全绿

## 3. 状态管理与登录降级

- [x] 3.1 TDD 实现 `useUserStore`（login 验证并持久化/logout/isLogged/预置 token 生效），测试先行至通过
- [x] 3.2 TDD 实现 `useMessageStore`（未读数刷新/全部已读后角标同步 uni.setTabBarBadge），测试先行至通过
- [x] 3.3 App.vue onLaunch 接入：预置 token 自动登录与未读数初始化，验证单测覆盖与手动场景一致

## 4. TabBar 三页

- [x] 4.1 首页：分类 Tab（全部/精华/分享/问答/招聘/客户端测试）+ 列表卡片（标题/作者/分类/回复数/置顶精华标识）+ z-paging 分页加载 + 失败重试，按 specs/topic-browsing 场景 H5 验收
- [x] 4.2 消息页：未读/已读分组、全部标记已读（确认弹窗）、点击单条已读并跳转详情、角标同步，按 specs/message-notification 场景 H5 验收
- [x] 4.3 我的页：登录态双态展示（登录引导/个人资料+功能入口+退出登录），按 specs/user-profile 场景 H5 验收

## 5. 详情与互动

- [x] 5.1 主题详情页：安装 `mp-html`，正文 mp-html 渲染 + 元信息 + 评论列表（楼层号/点赞态），未登录与已登录双态，H5 验收
- [x] 5.2 收藏/取消收藏与评论点赞切换（未登录拦截→登录页带 redirect），H5 验收
- [x] 5.3 回复功能：底部输入条 + 回复指定评论，成功后刷新定位，H5 验收

## 6. 登录、用户主页与发布

- [x] 6.1 登录页：token 粘贴 + 校验提示 + 登录成功回跳 redirect，无效 token 报错，H5 验收
- [x] 6.2 用户主页：资料展示 + 最近主题/最近回复区块 + 条目跳转，我的页"我的主题/我的回复"入口复用，H5 验收
- [x] 6.3 我的收藏列表页：列表展示 + 空状态 + 条目跳转，H5 验收
- [x] 6.4 发布/编辑页：表单校验（标题≥10 字/分类必选/内容必填）+ 编辑态预填 + 发布成功跳详情，H5 验收

## 7. 集成验收与交付

- [x] 7.1 全量测试与构建：`pnpm test:run` 全绿、`pnpm build:h5` 构建成功、`pnpm type-check` 与 `pnpm lint` 通过
- [x] 7.2 按 5 个能力规格的场景清单做 H5 端到端手动验收（含未登录/已登录双态），记录验收结果
- [x] 7.3 交付文档：README 补充（启动/测试/构建命令）+ App 双端 HBuilderX 打包说明（Android APK / iOS IPA 步骤与注意事项）
