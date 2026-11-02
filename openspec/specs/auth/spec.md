# auth Specification

## Purpose
提供基于 accessToken 的登录认证能力：用户粘贴个人 accessToken 完成登录验证，登录态持久化保存；支撑收藏、回复、发布、消息等需登录能力，并在未登录访问受保护操作时进行拦截引导。

## Requirements

### Requirement: Token 登录
系统 SHALL 提供登录页，用户输入 accessToken 后系统调用 CNode `POST /accesstoken` 接口验证：验证成功 MUST 保存 token 与返回的用户标识（loginname、id、avatar_url）并跳转回来源页或我的页；验证失败（如 403）MUST 展示明确的错误提示且不保存任何登录态。

#### Scenario: 有效 token 登录成功
- **WHEN** 用户在登录页输入有效 accessToken 并提交
- **THEN** 系统验证通过，保存登录态并跳转，页面展示登录成功提示

#### Scenario: 无效 token 登录失败
- **WHEN** 用户输入无效或过期的 accessToken 并提交
- **THEN** 系统展示验证失败提示，停留登录页，不保存登录态

#### Scenario: 输入为空提交
- **WHEN** 用户未输入任何内容直接提交
- **THEN** 系统展示表单校验提示，不发起请求

### Requirement: 登录态持久化
系统 SHALL 将登录态（token、用户标识）持久化到本地存储，App 重启后 MUST 自动恢复登录态并可用于需要鉴权的请求。

#### Scenario: 重启后保持登录
- **WHEN** 已登录用户关闭并重新打开 App
- **THEN** 登录态自动恢复，无需重新登录

#### Scenario: token 失效降级
- **WHEN** 持久化的 token 在请求中被 CNode API 判定失效（401/403）
- **THEN** 系统清除登录态、提示重新登录，后续未登录可见功能不受影响

### Requirement: 登出
系统 SHALL 提供登出入口，登出后 MUST 清除本地登录态并回到未登录状态，未登录可见的浏览功能 MUST 保持可用。

#### Scenario: 登出
- **WHEN** 已登录用户在我的页点击退出登录
- **THEN** 系统清除登录态，我的页回到未登录引导状态，首页浏览正常

### Requirement: 未登录操作拦截
系统 SHALL 对需登录的操作（收藏、回复、点赞、发布、查看消息）进行拦截：未登录时 MUST 引导用户进入登录页，登录成功后 MUST 返回原操作场景。

#### Scenario: 未登录点击收藏
- **WHEN** 未登录用户在详情页点击收藏
- **THEN** 系统跳转登录页并提示需要登录

#### Scenario: 登录后返回继续操作
- **WHEN** 用户从拦截进入登录页并登录成功
- **THEN** 系统返回之前的页面，用户可继续原操作

### Requirement: 调试预置 Token
系统 SHALL 支持通过环境变量注入预置调试 accessToken，用于开发与验收阶段直接以该账号运行；预置 token MUST 只存在于环境配置文件中，业务代码 MUST NOT 硬编码。

#### Scenario: 开发环境自动登录
- **WHEN** 开发环境配置了预置 accessToken 且用户未手动登录
- **THEN** 系统可用预置 token 调用需鉴权接口

#### Scenario: 生产构建不注入
- **WHEN** 以生产模式构建且未提供预置 token 环境变量
- **THEN** App 以未登录状态启动，通过登录页手动登录
