import type { AccessTokenResult, UserDetail } from '@/api/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getUser, verifyAccessToken } from '@/api/user'

/** 登录用户的资料（验证 token 的基本字段 + 用户详情扩展字段） */
export interface UserInfo extends AccessTokenResult {
  score?: number
  create_at?: string
  githubUsername?: string
}

/** 持久化初始化状态 */
const initState: { token: string, userInfo: UserInfo | null } = {
  token: '',
  userInfo: null,
}

export const useUserStore = defineStore('user', () => {
  const token = ref(initState.token)
  const userInfo = ref<UserInfo | null>(initState.userInfo)

  /** 登录态：token 与用户标识同时存在 */
  const isLogged = computed(() => !!token.value && !!userInfo.value?.loginname)

  /** 直接写入会话（登录成功后调用） */
  function setSession(val: { token: string, loginname: string, id: string, avatar_url: string }) {
    token.value = val.token
    userInfo.value = {
      loginname: val.loginname,
      id: val.id,
      avatar_url: val.avatar_url,
      ...(userInfo.value ?? {}),
    }
  }

  /**
   * Token 登录：验证并持久化。
   * 验证失败时抛出错误（登录页展示），不保存任何登录态。
   */
  async function login(accessToken: string) {
    const res = await verifyAccessToken(accessToken)
    const { loginname, id, avatar_url } = res
    token.value = accessToken
    userInfo.value = {
      ...(userInfo.value ?? {}),
      loginname,
      id,
      avatar_url,
    }
    uni.showToast({ icon: 'success', title: '登录成功' })
    return res
  }

  /** 拉取当前用户详情（积分/注册时间），未登录时不发起请求 */
  async function fetchUserDetail() {
    if (!isLogged.value || !userInfo.value) {
      return
    }
    const detail: UserDetail = await getUser(userInfo.value.loginname)
    userInfo.value = {
      ...(userInfo.value ?? {}),
      score: detail.score,
      create_at: detail.create_at,
      githubUsername: detail.githubUsername,
    }
    return detail
  }

  /** 登出：清空登录态 */
  function logout() {
    token.value = ''
    userInfo.value = null
  }

  return {
    token,
    userInfo,
    isLogged,
    setSession,
    login,
    fetchUserDetail,
    logout,
  }
}, {
  persist: true,
})
