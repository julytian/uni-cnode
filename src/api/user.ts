import type { AccessTokenResult, UserDetail } from './types'
import { http } from '@/http'

/** 用户详情（含最近主题/回复） */
export function getUser(loginname: string) {
  return http.get<UserDetail>(`/user/${loginname}`)
}

/**
 * 验证 accessToken，返回 { loginname, id, avatar_url }。
 * 注意：该接口成功响应为顶层平铺（{success, loginname, id, avatar_url}），无 data 包裹，须用 rawPost。
 * - 显式传入 token（登录页场景，此时登录态尚未建立，不能依赖注入）
 * - authOptional：token 无效（403）属预期业务结果，按业务错误处理，不触发全局降级
 * - hideErrorToast：错误提示由登录页表单展示，避免双重提示
 */
export function verifyAccessToken(accessToken: string) {
  return http.rawPost<AccessTokenResult>(
    '/accesstoken',
    { accesstoken: accessToken },
    { authOptional: true, hideErrorToast: true },
  )
}
