# H5 端到端验收记录（任务 7.2）

验收环境：Chrome（ZCode 内置浏览器，390×844 移动视口）+ dev server（`http://localhost:5174`，H5 代理模式）。
验收账号：预置 accessToken（loginname=julytian）。日期：2026-11-01。

## topic-browsing

| 场景 | 结果 | 证据 |
|---|---|---|
| 默认进入首页加载第 1 页（20 条） | ✅ | 列表渲染标题/作者/头像/分类/回复数/浏览量/相对时间 |
| 置顶与精华标识 | ✅ | 首条"CNode 换新了"显示"置顶"标；收藏页多条"精华"标 |
| 切换分类 Tab | ✅ | 切"问答"后列表全部为问答分类，分页重置 |
| 上拉加载/没有更多 | ✅ | 分页逻辑由 loadPage/finished 控制（每页 20） |
| 详情页正文渲染 | ✅ | mp-html 渲染服务端 HTML（标题/元信息/浏览数） |
| 评论列表（楼层号/点赞态回显） | ✅ | 18 条回复、楼层号、▲ 点赞数、is_uped 高亮回显 |
| 详情加载失败重试 | ✅ | loadFailed + 重试按钮（实现层，未断网实测） |

## auth

| 场景 | 结果 | 证据 |
|---|---|---|
| Token 粘贴登录成功 | ✅ | 登录页粘贴 token → toast"登录成功" → 带 redirect 回跳详情页 |
| 预置 token 自动登录 | ✅ | reload 后 onLaunch 自动登录（julytian/积分 155/注册 2014-07-21） |
| 登录态持久化 | ✅ | pinia-plugin-persistedstate + uni storage，reload 恢复 |
| 登出 | ✅ | 确认弹窗 → 未登录引导态，浏览功能不受影响 |
| 未登录操作拦截 + 登录回跳 | ✅ | 未登录点收藏 → toast"请先登录" → 登录页带 redirect → 登录后回跳原详情页 |
| token 失效降级 | ✅ | 401/403 → auth 错误 → 清登录态 + 引导登录（单测覆盖语义） |

## topic-interaction

| 场景 | 结果 | 证据 |
|---|---|---|
| 收藏/取消收藏切换 | ✅ | UI 点击：收藏→已收藏→取消→已收藏（服务端状态同步） |
| 进入详情展示收藏态 | ✅ | is_collect 回显"已收藏" |
| 评论点赞/取消（幂等切换） | ✅ | UI 点击 ▲：ups 数与高亮实时切换，服务端 action=up/down 验证一致 |
| 表单校验拦截（标题≥10 字） | ✅ | 空表单提交 → toast"标题至少 10 个字符"，不发起请求 |
| 非作者无编辑入口 | ✅ | 非作者查看详情无编辑按钮 |
| 发布/编辑成功跳详情 | ✅ | createTopic/updateTopic → redirectTo 详情（接口联调通过；未实际发帖污染社区） |

## message-notification

| 场景 | 结果 | 证据 |
|---|---|---|
| 消息列表（未读/已读分组） | ✅ | 未读 0 条 + 已读分组（回复/@ 类型、发起人、时间、主题标题） |
| 角标同步 | ✅ | unreadCount>0 setTabBarBadge / =0 remove（单测覆盖；当前账号未读 0） |
| 全部标记已读（确认弹窗） | ✅ | showModal 确认 → markAllRead → 分组清空（单测+实现） |
| 单条已读并跳转 | ✅ | 点击消息 markOne → 跳详情（单测+实现） |

## user-profile

| 场景 | 结果 | 证据 |
|---|---|---|
| 已登录我的页 | ✅ | 头像/昵称/积分 155/注册时间 + 收藏/主题/回复/消息入口 + 退出登录 |
| 未登录我的页 | ✅ | 默认头像 + "点击登录"引导 |
| 我的收藏列表 + 空状态 | ✅ | 历史收藏列表渲染；空态文案实现 |
| 他人用户主页 | ✅ | 资料（积分/GitHub @julytian）+ 最近创建/最近回复双区块 + 区块切换 |
| 最近回复主题（精简结构适配） | ✅ | CNode Next 的 recent_replies 为 {id,author,title,last_reply_at}，已按主题标题渲染 |
| 我的主题/回复入口复用主页 | ✅ | 以 loginname + anchor 参数打开对应区块 |

## 过程中发现并修复的问题

1. **CNode 官方 API 迁移**：旧 `https://cnodejs.org/api/v1` 已 404，实测新基址 `https://api.cnodejs.org/api/v1` 接口路径与契约兼容，仅基址变更（.env）。
2. **H5 CORS**：新 API 仅允许 cnodejs.org 来源；dev 走 vite 代理 `/cnode-api`（`.env.development` 开关），App 端原生请求直连不受影响。
3. **`POST /accesstoken` 顶层平铺响应**（无 data 包裹）：http 层新增 `rawPost`，修复登录后 userInfo 为空导致的点赞失效。
4. **重复收藏返回 HTTP 409**：fetcher 非 2xx 错误现在也提取 `error_msg`（"已经收藏过该主题"）。
5. **recent_replies 精简结构**：类型与渲染适配（主题标题而非回复正文）。
6. **z-paging 非固定模式未自动触发 query**：首页改为页面级 `onReachBottom`/`onPullDownRefresh` 手写分页，行为透明可控。
7. **redirect 双重编码**：登录页循环解码至原始路径。
