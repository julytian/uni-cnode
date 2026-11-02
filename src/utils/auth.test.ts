import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureLogin } from './auth'

const mockUserStore = {
  isLogged: false,
}

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockUserStore.isLogged = false
})

describe('ensureLogin', () => {
  it('已登录：放行，不跳转', () => {
    mockUserStore.isLogged = true

    expect(ensureLogin('/pages/topic/detail?id=t1')).toBe(true)
    expect(uni.navigateTo).not.toHaveBeenCalled()
  })

  it('未登录：toast 引导并跳转登录页，携带 redirect', () => {
    expect(ensureLogin('/pages/topic/detail?id=t1')).toBe(false)

    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '请先登录' }))
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: `/pages/login/index?redirect=${encodeURIComponent('/pages/topic/detail?id=t1')}`,
    })
  })

  it('未登录且无 redirect：直接跳登录页', () => {
    expect(ensureLogin()).toBe(false)

    expect(uni.navigateTo).toHaveBeenCalledWith({ url: '/pages/login/index' })
  })
})
