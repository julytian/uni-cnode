import type { HttpError, RequestOptions } from './types'
import { fetcher } from './fetcher'

let BASE_URL = import.meta.env.VITE_SERVER_BASEURL || ''
// #ifdef H5
// H5 开发期经 vite 代理转发规避 CNode API 的 CORS 限制（仅代理环境生效；生产 H5 直连或由部署层反代）
if (import.meta.env.VITE_APP_PROXY_ENABLE === 'true') {
  BASE_URL = '/cnode-api'
}
// #endif

/** token 提供者：由 user store 启动时注册，避免 http 层反向依赖 store */
let tokenProvider: () => string = () => ''

/**
 * 注册 token 提供者（App 启动时调用一次）。
 * 返回当前登录态的 accesstoken，未登录返回空字符串。
 */
export function setTokenProvider(fn: () => string) {
  tokenProvider = fn
}

/** 鉴权失效全局降级回调（清登录态、引导重新登录），由 App 启动时注册 */
let unauthorizedHandler: () => void = () => {}

export function setUnauthorizedHandler(fn: () => void) {
  unauthorizedHandler = fn
}

/** URL 组装：非 http 开头拼 baseUrl；query 序列化（值做 encodeURIComponent） */
function buildUrl(path: string, query?: Record<string, any>): string {
  const url = path.startsWith('http')
    ? path
    : `${BASE_URL}${path}`
  if (query && Object.keys(query).length > 0) {
    const qs = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (qs) {
      return `${url}${url.includes('?')
        ? '&'
        : '?'}${qs}`
    }
  }
  return url
}

async function request<T>(method: 'GET' | 'POST', path: string, params?: Record<string, any>, options?: RequestOptions, raw = false): Promise<T> {
  const token = tokenProvider()

  let url: string
  let data: Record<string, any> | undefined

  if (method === 'GET') {
    // CNode 契约：GET 请求 accesstoken 走 query；显式传入的参数优先
    const query = token
      ? { accesstoken: token, ...params }
      : params
    url = buildUrl(path, query)
    data = undefined
  }
  else {
    // POST 请求 accesstoken 走 body；显式传入优先（如登录页验证 token）
    data = token
      ? {
          accesstoken: token,
          ...(params || {}),
        }
      : params
    url = buildUrl(path, options?.query)
  }

  try {
    const res = await fetcher({
      url,
      method,
      data,
      header: options?.header,
      authOptional: options?.authOptional,
    })
    // raw：返回完整响应体（/accesstoken 等接口的成功字段为顶层平铺，无 data 包裹）
    return (raw ? res.body : res.body.data) as T
  }
  catch (err) {
    const httpError = err as HttpError

    // 鉴权失效且非预期场景：触发全局降级（清登录态 + 引导重新登录）
    if (httpError?.type === 'auth' && !options?.authOptional) {
      unauthorizedHandler()
    }

    if (!options?.hideErrorToast) {
      uni.showToast({ icon: 'none', title: httpError?.message || '请求失败' })
    }
    throw err
  }
}

export const http = {
  get: <T = any>(path: string, query?: Record<string, any>, options?: RequestOptions) =>
    request<T>('GET', path, query, options),
  post: <T = any>(path: string, data?: Record<string, any>, options?: RequestOptions) =>
    request<T>('POST', path, data, options),
  /** 返回完整响应体（不拆包 data），用于 accesstoken 验证等顶层平铺响应的接口 */
  rawPost: <T = any>(path: string, data?: Record<string, any>, options?: RequestOptions) =>
    request<T>('POST', path, data, options, true),
}
