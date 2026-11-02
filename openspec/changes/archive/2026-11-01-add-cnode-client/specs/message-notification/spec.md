# Spec Delta: message-notification

## Purpose

提供站内消息通知能力：未读消息数 TabBar 角标提醒、未读/已读消息列表展示、标记已读（全部/单条）。消息产生自他人回复或 @ 用户，需登录态。

## ADDED Requirements

### Requirement: 未读消息角标
系统 SHALL 在已登录状态下通过 `GET /message/count` 获取未读消息数，并 MUST 将其展示在消息 Tab 角标；未读数为 0 时 MUST 清除角标。未读数 MUST 在进入消息页、标记已读等时机刷新。

#### Scenario: 有未读消息
- **WHEN** 已登录用户存在 3 条未读消息
- **THEN** 消息 Tab 角标显示 3

#### Scenario: 未读清零
- **WHEN** 用户将全部未读消息标记为已读
- **THEN** 消息 Tab 角标清除

#### Scenario: 未登录不展示
- **WHEN** 用户未登录
- **THEN** 消息 Tab 不展示角标

### Requirement: 消息列表展示
消息页 SHALL 分"未读消息"与"已读消息"两组展示（数据来自 `GET /messages`），每条 MUST 展示消息类型标识（回复/at）、发起人昵称与头像、关联主题标题、时间，且 MUST 支持渲染消息正文摘要。

#### Scenario: 查看消息列表
- **WHEN** 已登录用户进入消息页
- **THEN** 页面展示未读与已读两组消息，未读组在前且有区分样式

#### Scenario: 拉取失败
- **WHEN** 消息接口请求失败
- **THEN** 页面展示错误提示与重试入口

### Requirement: 标记全部已读
系统 SHALL 提供"全部标记已读"操作（`POST /message/mark_all`），成功后 MUST 清空未读分组、将消息移入已读分组并清除角标。

#### Scenario: 一键已读
- **WHEN** 用户点击"全部标记已读"并确认
- **THEN** 未读分组清空（消息移入已读组），角标清除

### Requirement: 单条消息已读与跳转
系统 SHALL 在用户点击未读消息时调用 `POST /message/mark_one/:msg_id` 标记该条已读，然后 MUST 跳转到消息关联的主题详情页；返回消息页时该消息 MUST 移入已读组且未读角标同步更新。

#### Scenario: 点击未读消息
- **WHEN** 用户点击一条未读消息
- **THEN** 系统标记该条已读并跳转到关联主题详情

#### Scenario: 返回后状态同步
- **WHEN** 用户从主题详情返回消息页
- **THEN** 该消息显示在已读组，未读角标数量减一
