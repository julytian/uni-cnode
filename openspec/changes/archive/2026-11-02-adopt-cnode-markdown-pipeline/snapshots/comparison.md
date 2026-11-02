# 渲染快照比对（任务 4.1）

日期：2026-11-02 · 环境：H5 dev（localhost:5174，390×844 移动视口）

## 对照样本 1：Hoa 框架主题（含代码块 / 列表 / 链接 / 表情）

- 主题 id：49133（`https://cnodejs.org/topic/49133`）
- App 实现：`mdrender=false` → `renderMarkdown()` 管线 → mp-html

| 检查点 | CNode Next 官网 | App | 结果 |
|---|---|---|---|
| 段落结构 | p 间距一致 | 同管线输出一致 | ✅ |
| 无序列表（GitHub/官网链接） | 绿色链接 + 列表符 | 一致 | ✅ |
| 有序列表（三条核心原则） | 数字编号 | 同 remark 输出 | ✅ |
| 代码块（bash/js） | 深色容器 + 等宽字体 | 深色容器（#172813 圆角）+ 等宽 | ✅ |
| token 高亮 | 官网 hljs 定制仅 7 条（token 基本继承 foreground） | 同配置（app.css 移植 7 条） | ✅ 行为一致 |
| 表情图片 | 正常渲染 | 正常渲染（域名补全） | ✅ |
| @提及链接 | 站内跳转 | linktap 拦截 → 用户主页路由 | ✅ |

## 对照样本 2：35 岁前端主题（含 @提及评论）

- 主题 id：48932
- 评论 @提及：`[@cllgeek](/user/cllgeek)` → App 内绿色链接，点击跳用户主页 ✅（此前验收已覆盖）

## 结论

渲染结果与 CNode Next 官网一致；语法高亮 token 配色与官网同策略（仅 quote/tag/attr/deletion 少量 token 着色，其余继承正文色）。
