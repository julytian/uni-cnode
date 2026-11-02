import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getUser, verifyAccessToken } from '@/api/user'
import { useUserStore } from './user'

vi.mock('@/api/user', () => ({
  getUser: vi.fn(),
  verifyAccessToken: vi.fn(),
}))

const mockedVerify = vi.mocked(verifyAccessToken)
const mockedGetUser = vi.mocked(getUser)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useUserStore', () => {
  it('初始状态：未登录，token 为空', () => {
    const store = useUserStore()

    expect(store.isLogged).toBe(false)
    expect(store.token).toBe('')
    expect(store.userInfo).toBeNull()
  })

  describe('login', () => {
    it('验证成功：保存 token 与用户标识，isLogged 为 true', async () => {
      mockedVerify.mockResolvedValueOnce({ loginname: 'u1', id: 'i1', avatar_url: 'http://a.png' })

      const store = useUserStore()
      await store.login('tok-valid')

      expect(mockedVerify).toHaveBeenCalledWith('tok-valid')
      expect(store.token).toBe('tok-valid')
      expect(store.userInfo).toMatchObject({ loginname: 'u1', id: 'i1' })
      expect(store.isLogged).toBe(true)
    })

    it('验证失败：不保存任何登录态并向上抛错', async () => {
      mockedVerify.mockRejectedValueOnce({ type: 'business', message: '验证失败' })

      const store = useUserStore()
      await expect(store.login('tok-bad')).rejects.toMatchObject({ message: '验证失败' })

      expect(store.token).toBe('')
      expect(store.isLogged).toBe(false)
    })
  })

  describe('fetchUserDetail', () => {
    it('以当前 loginname 拉取积分/注册时间等扩展信息并合并', async () => {
      const store = useUserStore()
      store.setSession({
        token: 't',
        loginname: 'u1',
        id: 'i1',
        avatar_url: 'a',
      })

      mockedGetUser.mockResolvedValueOnce({
        loginname: 'u1',
        avatar_url: 'a',
        score: 233,
        create_at: '2020-01-01',
        recent_topics: [],
        recent_replies: [],
      } as any)

      await store.fetchUserDetail()

      expect(mockedGetUser).toHaveBeenCalledWith('u1')
      expect(store.userInfo).toMatchObject({ loginname: 'u1', score: 233, create_at: '2020-01-01' })
    })

    it('未登录时不发起请求', async () => {
      const store = useUserStore()

      await store.fetchUserDetail()

      expect(mockedGetUser).not.toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    it('清除 token 与用户信息，回到未登录', async () => {
      const store = useUserStore()
      store.setSession({
        token: 't',
        loginname: 'u1',
        id: 'i1',
        avatar_url: 'a',
      })
      expect(store.isLogged).toBe(true)

      store.logout()

      expect(store.token).toBe('')
      expect(store.userInfo).toBeNull()
      expect(store.isLogged).toBe(false)
    })
  })
})
