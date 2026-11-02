import { useUserStore } from '@/stores/user'

/**
 * 未登录操作拦截（specs/auth）：
 * 已登录返回 true；未登录 toast 引导并跳转登录页（携带 redirect 以便登录后回跳），返回 false。
 *
 * @example
 * if (!ensureLogin(`/pages/topic/detail?id=${id}`)) return
 * // ...继续需登录的操作
 */
export function ensureLogin(redirect?: string): boolean {
  const userStore = useUserStore()
  if (userStore.isLogged) {
    return true
  }
  uni.showToast({ icon: 'none', title: '请先登录' })
  const query = redirect
    ? `?redirect=${encodeURIComponent(redirect)}`
    : ''
  uni.navigateTo({ url: `/pages/login/index${query}` })
  return false
}
