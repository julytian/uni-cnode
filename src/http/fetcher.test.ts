import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetcher } from './fetcher'

/**
 * fetcher：uni.request 的 Promise 化 + HTTP 语义到统一错误类型的映射。
 * test-setup 已全局 mock uni.request。
 */

function respondWith(body: unknown, statusCode = 200) {
  vi.mocked(uni.request).mockImplementationOnce(((options: any) => {
    options.success({ data: body, statusCode })
  }) as any)
}

function failWith(errMsg: string) {
  vi.mocked(uni.request).mockImplementationOnce(((options: any) => {
    options.fail({ errMsg })
  }) as any)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetcher：成功路径', () => {
  it('2xx + success=true 时 resolve 完整响应体（拆包交给上层）', async () => {
    respondWith({
      success: true,
      data: [
        { id: 't1' },
      ],
    }, 200)

    const res = await fetcher({ url: 'https://cnodejs.org/api/v1/topics', method: 'GET' })

    expect(res.body.data).toEqual([
      { id: 't1' },
    ])
    expect(res.statusCode).toBe(200)
    expect(uni.request).toHaveBeenCalledTimes(1)
  })

  it('透传 method/data/header/timeout', async () => {
    respondWith({ success: true, data: {} }, 200)

    await fetcher({
      url: 'https://x/api',
      method: 'POST',
      data: { a: 1 },
      header: { 'x-h': 'v' },
    })

    expect(uni.request).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://x/api',
      method: 'POST',
      data: { a: 1 },
      header: expect.objectContaining({ 'x-h': 'v' }),
    }))
  })
})

describe('fetcher：CNode 业务失败', () => {
  it('2xx + success=false 时 reject business 错误，message 取 error_msg', async () => {
    respondWith({ success: false, error_msg: '主题不存在' }, 200)

    await expect(fetcher({ url: 'https://x/topic', method: 'GET' })).rejects.toMatchObject({
      type: 'business',
      message: '主题不存在',
      statusCode: 200,
    })
  })

  it('2xx 但响应体无 success 字段时，按 http 错误处理（非 CNode 契约）', async () => {
    respondWith({ foo: 'bar' }, 200)

    await expect(fetcher({ url: 'https://x/other', method: 'GET' })).rejects.toMatchObject({
      type: 'http',
      statusCode: 200,
    })
  })
})

describe('fetcher：HTTP 状态与网络错误', () => {
  it.each([401, 403])('hTTP %i reject auth 错误', async (statusCode) => {
    respondWith({ success: false, error_msg: 'invalid accesstoken' }, statusCode)

    await expect(fetcher({ url: 'https://x/messages', method: 'GET' })).rejects.toMatchObject({
      type: 'auth',
      statusCode,
      message: 'invalid accesstoken',
    })
  })

  it('500 reject http 错误', async () => {
    respondWith({ message: 'boom' }, 500)

    await expect(fetcher({ url: 'https://x/topics', method: 'GET' })).rejects.toMatchObject({
      type: 'http',
      statusCode: 500,
    })
  })

  it('网络失败 reject network 错误', async () => {
    failWith('request:fail timeout')

    await expect(fetcher({ url: 'https://x/topics', method: 'GET' })).rejects.toMatchObject({
      type: 'network',
    })
  })
})
