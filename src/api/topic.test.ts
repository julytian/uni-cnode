import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/http'
import { createTopic, getTopicDetail, getTopics, replyTopic, updateTopic, upReply } from './topic'

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

describe('topic service：列表与详情', () => {
  it('getTopics：GET /topics，携带分页与分类参数', async () => {
    mockedGet.mockResolvedValueOnce([
      { id: 't1' },
    ] as any)

    const data = await getTopics({ page: 2, tab: 'good', limit: 15 })

    expect(mockedGet).toHaveBeenCalledWith('/topics', { page: 2, tab: 'good', limit: 15 })
    expect(data).toEqual([
      { id: 't1' },
    ])
  })

  it('getTopics：默认参数（第 1 页、每页 20、全部）', async () => {
    mockedGet.mockResolvedValueOnce([] as any)

    await getTopics()

    expect(mockedGet).toHaveBeenCalledWith('/topics', { page: 1, limit: 20 })
  })

  it('getTopicDetail：GET /topic/:id', async () => {
    mockedGet.mockResolvedValueOnce({ id: 't1', replies: [] } as any)

    const data = await getTopicDetail('t1')

    expect(mockedGet).toHaveBeenCalledWith('/topic/t1', { mdrender: false })
    expect(data).toMatchObject({ id: 't1' })
  })
})

describe('topic service：发布与编辑', () => {
  it('createTopic：POST /topics，返回 topic_id', async () => {
    mockedPost.mockResolvedValueOnce({ topic_id: 'new-id' } as any)

    const data = await createTopic({ title: '标题标题标题标题', tab: 'share', content: '内容' })

    expect(mockedPost).toHaveBeenCalledWith('/topics', { title: '标题标题标题标题', tab: 'share', content: '内容' })
    expect(data).toEqual({ topic_id: 'new-id' })
  })

  it('updateTopic：POST /topics/update', async () => {
    mockedPost.mockResolvedValueOnce({ topic_id: 't1' } as any)

    await updateTopic({
      topic_id: 't1',
      title: '新标题新标题新标题',
      tab: 'ask',
      content: '新内容',
    })

    expect(mockedPost).toHaveBeenCalledWith('/topics/update', {
      topic_id: 't1',
      title: '新标题新标题新标题',
      tab: 'ask',
      content: '新内容',
    })
  })
})

describe('topic service：回复与点赞', () => {
  it('replyTopic：POST /topic/:id/replies，直答时不带 reply_id', async () => {
    mockedPost.mockResolvedValueOnce({ reply_id: 'r1' } as any)

    await replyTopic('t1', { content: '好文' })

    expect(mockedPost).toHaveBeenCalledWith('/topic/t1/replies', { content: '好文' })
  })

  it('replyTopic：回复指定评论时携带 reply_id', async () => {
    mockedPost.mockResolvedValueOnce({ reply_id: 'r2' } as any)

    await replyTopic('t1', { content: '赞同', reply_id: 'r1' })

    expect(mockedPost).toHaveBeenCalledWith('/topic/t1/replies', { content: '赞同', reply_id: 'r1' })
  })

  it('upReply：POST /reply/:id/ups，返回动作', async () => {
    mockedPost.mockResolvedValueOnce({ action: 'up' } as any)

    const data = await upReply('r1')

    expect(mockedPost).toHaveBeenCalledWith('/reply/r1/ups')
    expect(data).toEqual({ action: 'up' })
  })
})
