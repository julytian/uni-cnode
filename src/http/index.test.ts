import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetcher } from './fetcher'

import { http, setTokenProvider, setUnauthorizedHandler } from './index'

/**
 * http 层：baseUrl 注入、accesstoken 参数注入、CNode 契约拆包、错误 toast、401/403 全局降级。
 * mock 底层 fetcher（模块级），专注断言 http 层自己的组装与语义。
 */

vi.mock('./fetcher', () => ({
  fetcher: vi.fn(),
}))

const mockedFetcher = vi.mocked(fetcher)

/** 让 fetcher 按给定响应体/状态码行动 */
function fetcherResponds(body: unknown, statusCode = 200) {
  mockedFetcher.mockResolvedValueOnce({ statusCode, body } as any)
}
function fetcherRejects(err: any) {
  mockedFetcher.mockRejectedValueOnce(err)
}

const TOKEN = 'tok-123'
let unauthorizedCalls: number

beforeEach(() => {
  vi.clearAllMocks()
  unauthorizedCalls = 0
  setTokenProvider(() => TOKEN)
  setUnauthorizedHandler(() => {
    unauthorizedCalls++
  })
})

afterEach(() => {
  // 还原默认 provider，避免影响其他测试文件
  setTokenProvider(() => '')
})

describe('http：URL 组装', () => {
  it('gET：拼接 baseUrl 与 query（含 accesstoken）', async () => {
    fetcherResponds({ success: true, data: [] })

    await http.get('/topics', { page: 1, tab: 'ask' })

    expect(mockedFetcher).toHaveBeenCalledWith(expect.objectContaining({
      method: 'GET',
      url: expect.stringContaining('https://api.cnodejs.org/api/v1/topics?'),
    }))
    const url = mockedFetcher.mock.calls[0][0].url
    expect(url).toContain('page=1')
    expect(url).toContain('tab=ask')
    expect(url).toContain('accesstoken=tok-123')
  })

  it('pOST：accesstoken 注入 body，显式传入优先不被覆盖', async () => {
    fetcherResponds({
      success: true,
      data: { topic_id: 'x' },
    })

    await http.post('/accesstoken', { accesstoken: 'explicit-token' })

    const options = mockedFetcher.mock.calls[0][0]
    expect(options.method).toBe('POST')
    expect(options.data).toMatchObject({ accesstoken: 'explicit-token' })
    // 显式验证场景不应再把 store token 注入 query
    expect(options.url).not.toContain('accesstoken=')
  })

  it('未登录（provider 返回空）时不注入 accesstoken', async () => {
    setTokenProvider(() => '')
    fetcherResponds({ success: true, data: [] })

    await http.get('/topics')

    expect(mockedFetcher.mock.calls[0][0].url).not.toContain('accesstoken')
  })
})

describe('http：CNode 契约拆包与错误', () => {
  it('success=true 拆包 resolve data', async () => {
    fetcherResponds({
      success: true,
      data: { id: 't1' },
    })

    const data = await http.get<{ id: string }>('/topic/t1')
    expect(data).toEqual({ id: 't1' })
  })

  it('success=false reject business 错误并 toast error_msg', async () => {
    fetcherRejects({ type: 'business', message: '主题不存在', statusCode: 200 })

    await expect(http.get('/topic/t1')).rejects.toMatchObject({ message: '主题不存在' })
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '主题不存在' }))
  })

  it('hideErrorToast 时不弹 toast', async () => {
    fetcherRejects({ type: 'business', message: '静默失败' })

    await expect(http.get('/topic/t1', undefined, { hideErrorToast: true })).rejects.toBeTruthy()
    expect(uni.showToast).not.toHaveBeenCalled()
  })
})

describe('http：鉴权失效全局降级', () => {
  it.each([401, 403])('auth 错误触发全局降级回调（HTTP %i）', async (statusCode) => {
    fetcherRejects({ type: 'auth', message: 'invalid accesstoken', statusCode })

    await expect(http.get('/messages')).rejects.toMatchObject({ type: 'auth' })
    expect(unauthorizedCalls).toBe(1)
  })

  it.each([401, 403])('authOptional 时 %i 不触发全局降级，按业务错误 toast', async (statusCode) => {
    fetcherRejects({ type: 'auth', message: '验证失败', statusCode })

    await expect(http.post('/accesstoken', { accesstoken: 'bad' }, { authOptional: true })).rejects.toMatchObject({
      message: '验证失败',
    })
    expect(unauthorizedCalls).toBe(0)
    expect(uni.showToast).toHaveBeenCalledWith(expect.objectContaining({ title: '验证失败' }))
  })

  it('非 auth 错误不触发全局降级', async () => {
    fetcherRejects({ type: 'http', message: 'server error', statusCode: 500 })

    await expect(http.get('/topics')).rejects.toBeTruthy()
    expect(unauthorizedCalls).toBe(0)
  })
})
