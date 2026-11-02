import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/http'
import { getUser, verifyAccessToken } from './user'

vi.mock('@/http', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    rawPost: vi.fn(),
  },
}))

const mockedGet = vi.mocked(http.get)
const mockedRawPost = vi.mocked(http.rawPost)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('user service', () => {
  it('getUser：GET /user/:loginname', async () => {
    const mockUser = { loginname: 'alsotang', score: 100, recent_topics: [] }
    mockedGet.mockResolvedValueOnce(mockUser as any)

    const data = await getUser('alsotang')

    expect(mockedGet).toHaveBeenCalledWith('/user/alsotang')
    expect(data).toMatchObject({ loginname: 'alsotang' })
  })

  it('verifyAccessToken：rawPost /accesstoken（顶层平铺响应），显式传 token 且 authOptional', async () => {
    mockedRawPost.mockResolvedValueOnce({
      success: true,
      loginname: 'u',
      id: 'i',
      avatar_url: 'a',
    } as any)

    const data = await verifyAccessToken('my-token')

    expect(mockedRawPost).toHaveBeenCalledWith(
      '/accesstoken',
      { accesstoken: 'my-token' },
      expect.objectContaining({ authOptional: true, hideErrorToast: true }),
    )
    expect(data).toMatchObject({ loginname: 'u', id: 'i' })
  })
})
