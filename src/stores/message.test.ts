import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getUnreadCount, markAllRead, markOneRead } from '@/api/message'
import { useMessageStore } from './message'

vi.mock('@/api/message', () => ({
  getUnreadCount: vi.fn(),
  markAllRead: vi.fn(),
  markOneRead: vi.fn(),
}))

const mockUserStore = {
  isLogged: true,
  logout: vi.fn(),
}

vi.mock('@/stores/user', () => ({
  useUserStore: () => mockUserStore,
}))

const mockedGetCount = vi.mocked(getUnreadCount)
const mockedMarkAll = vi.mocked(markAllRead)
const mockedMarkOne = vi.mocked(markOneRead)

beforeEach(() => {
  vi.clearAllMocks()
  mockUserStore.isLogged = true
})

describe('useMessageStore', () => {
  it('refreshCount：拉取未读数并同步角标（消息 tab 为 index 1）', async () => {
    mockedGetCount.mockResolvedValueOnce(5)

    const store = useMessageStore()
    await store.refreshCount()

    expect(store.unreadCount).toBe(5)
    expect(uni.setTabBarBadge).toHaveBeenCalledWith({ index: 1, text: '5' })
  })

  it('refreshCount：未读数为 0 时清除角标', async () => {
    mockedGetCount.mockResolvedValueOnce(0)

    const store = useMessageStore()
    await store.refreshCount()

    expect(store.unreadCount).toBe(0)
    expect(uni.removeTabBarBadge).toHaveBeenCalledWith({ index: 1 })
    expect(uni.setTabBarBadge).not.toHaveBeenCalled()
  })

  it('refreshCount：未登录时清零并清角标，不发起请求', async () => {
    mockUserStore.isLogged = false

    const store = useMessageStore()
    await store.refreshCount()

    expect(mockedGetCount).not.toHaveBeenCalled()
    expect(store.unreadCount).toBe(0)
    expect(uni.removeTabBarBadge).toHaveBeenCalledWith({ index: 1 })
  })

  it('markAllRead：调用接口后清零并清角标', async () => {
    const store = useMessageStore()
    store.unreadCount = 7

    await store.markAllRead()

    expect(mockedMarkAll).toHaveBeenCalled()
    expect(store.unreadCount).toBe(0)
    expect(uni.removeTabBarBadge).toHaveBeenCalledWith({ index: 1 })
  })

  it('markOne：单条已读后未读数减一并同步角标', async () => {
    const store = useMessageStore()
    store.unreadCount = 3

    await store.markOne('m1')

    expect(mockedMarkOne).toHaveBeenCalledWith('m1')
    expect(store.unreadCount).toBe(2)
    expect(uni.setTabBarBadge).toHaveBeenCalledWith({ index: 1, text: '2' })
  })

  it('markOne：未读数已为 0 时不再下探为负数', async () => {
    const store = useMessageStore()
    store.unreadCount = 0

    await store.markOne('m1')

    expect(store.unreadCount).toBe(0)
    expect(uni.removeTabBarBadge).toHaveBeenCalledWith({ index: 1 })
  })
})
