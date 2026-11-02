import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/http'
import { collectTopic, deCollectTopic, getCollectTopics } from './collect'

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

describe('collect service', () => {
  it('collectTopic：POST /topic_collect/collect', async () => {
    mockedPost.mockResolvedValueOnce({ success: true } as any)

    await collectTopic('t1')

    expect(mockedPost).toHaveBeenCalledWith('/topic_collect/collect', { topic_id: 't1' })
  })

  it('deCollectTopic：POST /topic_collect/de_collect', async () => {
    mockedPost.mockResolvedValueOnce({ success: true } as any)

    await deCollectTopic('t1')

    expect(mockedPost).toHaveBeenCalledWith('/topic_collect/de_collect', { topic_id: 't1' })
  })

  it('getCollectTopics：GET /topic_collect/:loginname', async () => {
    mockedGet.mockResolvedValueOnce([
      { id: 't1' },
    ] as any)

    const data = await getCollectTopics('someuser')

    expect(mockedGet).toHaveBeenCalledWith('/topic_collect/someuser')
    expect(data).toEqual([
      { id: 't1' },
    ])
  })
})
