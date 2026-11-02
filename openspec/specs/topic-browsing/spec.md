# topic-browsing Specification

## Purpose
提供 CNode 社区主题的浏览能力：按分类浏览主题列表并分页加载，查看主题详情（Markdown 渲染正文与全部评论）。这是 App 的核心只读能力，无登录要求。

## Requirements

### Requirement: 主题列表展示
系统 SHALL 在首页按分页方式展示主题列表，每项 MUST 展示标题、作者昵称与头像、所属分类、回复数、访问量、最后回复时间，并 MUST 用标识区分置顶（top）与精华（good）主题。

#### Scenario: 默认进入首页
- **WHEN** 用户打开 App 进入首页
- **THEN** 系统从 CNode API 加载第 1 页主题列表（tab=全部，每页 20 条）并渲染列表

#### Scenario: 切换分类 Tab
- **WHEN** 用户切换分类（全部/精华/分享/问答/招聘/客户端测试）
- **THEN** 系统重新加载该分类的第 1 页列表并重置分页状态

#### Scenario: 列表加载失败
- **WHEN** 列表请求失败（网络错误或接口异常）
- **THEN** 系统 MUST 展示错误提示并提供重试入口，不展示空数据页面

### Requirement: 上拉加载更多
系统 SHALL 在列表滚动到底部时自动加载下一页并追加渲染，加载中 MUST 展示加载状态；没有更多数据时 MUST 展示"没有更多"提示且不再发起请求。

#### Scenario: 滚动到底加载下一页
- **WHEN** 列表滚动到底部且还有更多数据
- **THEN** 系统加载下一页并追加到列表末尾

#### Scenario: 已无更多数据
- **WHEN** 列表滚动到底部且当前页返回数量小于每页限制
- **THEN** 系统展示"没有更多"且后续滚动不再发起新请求

### Requirement: 下拉刷新
系统 SHALL 支持下拉刷新当前分类列表，刷新后 MUST 回到第 1 页并替换现有列表数据。

#### Scenario: 下拉刷新
- **WHEN** 用户在首页下拉
- **THEN** 系统重新加载第 1 页数据并替换列表，刷新完成后停止刷新动画

### Requirement: 查看主题详情
系统 SHALL 在用户点击列表项时进入主题详情页，详情页 MUST 展示标题、作者信息、分类、发布时间、访问/回复数、渲染后的 Markdown 正文，并支持收藏与点赞等互动入口（互动行为由 topic-interaction 能力定义）。正文渲染 SHALL 采用客户端 Markdown 管线：以 `mdrender=false` 获取原始 Markdown，经 unified/remark 管线（GFM 扩展、内联 HTML 白名单保留、highlight.js 语法高亮）生成 HTML 后交由 mp-html 渲染，与 CNode Next 官网渲染行为对齐。管线 MUST 对站内相对路径做适配：`/user/xxx` 链接转为 App 内用户主页路由，站内图片路径补全域名。

#### Scenario: 进入详情
- **WHEN** 用户点击某主题列表项
- **THEN** 系统跳转到详情页并展示该主题完整内容

#### Scenario: 详情加载失败
- **WHEN** 详情请求失败
- **THEN** 系统展示错误提示与重试入口

#### Scenario: 代码块语法高亮与容器
- **WHEN** 主题正文包含 ``` 代码块（CNode 提供 language-* 标注）
- **THEN** 正文渲染出带深色容器背景的代码块，代码按语言做语法高亮配色，与 CNode Next 官网呈现一致

#### Scenario: 站内链接与图片路径处理
- **WHEN** 正文或评论包含 `/user/xxx` 站内链接或 `/public/...` 站内图片
- **THEN** 图片正常加载（补全域名），点击用户链接跳转 App 内用户主页而非外部浏览器

### Requirement: 评论列表展示
详情页 SHALL 按时间顺序展示主题全部评论，每条 MUST 展示评论人昵称与头像、楼层序号、评论正文、点赞数；已登录时 MUST 标识当前用户已点赞的评论。评论正文 SHALL 与正文使用同一客户端 Markdown 管线渲染（原始 Markdown 输入）。

#### Scenario: 展示评论与点赞态
- **WHEN** 已登录用户打开含评论的主题详情
- **THEN** 每条评论显示楼层号、内容与点赞数，当前用户点过赞的评论有高亮标识

#### Scenario: 未登录查看评论
- **WHEN** 未登录用户查看评论
- **THEN** 评论正常展示但无个人点赞标识

#### Scenario: 评论中的站内链接跳转
- **WHEN** 用户点击评论中 @提及产生的 `/user/xxx` 链接
- **THEN** 系统跳转到该用户的 App 内用户主页

