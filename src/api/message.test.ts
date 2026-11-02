import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/http'
import { getMessages, getUnreadCount, markAllRead, markOneRead } from './message'

vi.mock('@/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const mockedGet = vi.mocked(http.get)
const mockedPost = vi.mocked(http.post)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('message service', () => {
  it('getUnreadCount：GET /message/count，返回数字', async () => {
    mockedGet.mockResolvedValueOnce(3 as any)

    const count = await getUnreadCount()

    expect(mockedGet).toHaveBeenCalledWith('/message/count')
    expect(count).toBe(3)
  })

  it('getMessages：GET /messages（mdrender 关闭，客户端只做摘要）', async () => {
    mockedGet.mockResolvedValueOnce({ has_read_messages: [], hasnot_read_messages: [] } as any)

    await getMessages()

    expect(mockedGet).toHaveBeenCalledWith('/messages', { mdrender: false })
  })

  it('markAllRead：POST /message/mark_all', async () => {
    mockedPost.mockResolvedValueOnce({ marked_msgs: [] } as any)

    await markAllRead()

    expect(mockedPost).toHaveBeenCalledWith('/message/mark_all')
  })

  it('markOneRead：POST /message/mark_one/:msg_id', async () => {
    mockedPost.mockResolvedValueOnce({ marked_msg_id: 'm1' } as any)

    await markOneRead('m1')

    expect(mockedPost).toHaveBeenCalledWith('/message/mark_one/m1')
  })
})
