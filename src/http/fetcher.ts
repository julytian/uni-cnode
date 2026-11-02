import type { CnodeResponse, FetcherOptions } from './types'
import { createHttpError } from './types'

export interface FetcherResult {
  statusCode: number
  body: CnodeResponse
}

/** 从 CNode 响应体提取可读错误信息 */
function extractMessage(body: any, fallback = '请求错误'): string {
  return body?.error_msg || body?.msg || body?.message || fallback
}

/**
 * fetcher：uni.request 的 Promise 化，把 HTTP 语义映射为统一 HttpError：
 * - 401/403 → auth（鉴权失效）
 * - 2xx + CNode success=false → business（业务失败，message 取 error_msg）
 * - 2xx 但响应体不符合 CNode 契约 / 其他非 2xx → http
 * - uni.request fail → network
 * 拆包（success=true 取 data）交由上层 http 函数处理，本层只做语义分类。
 */
export function fetcher(options: FetcherOptions): Promise<FetcherResult> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: options.url,
      method: options.method,
      data: options.data,
      header: options.header,
      timeout: 30000,
      success: (res) => {
        const statusCode = res.statusCode
        const body = res.data as CnodeResponse

        // CNode 对无效 accesstoken 返回 401/403
        if (statusCode === 401 || statusCode === 403) {
          return reject(createHttpError({
            type: 'auth',
            statusCode,
            message: extractMessage(body, '登录已过期，请重新登录'),
            data: body,
            raw: res,
          }))
        }

        if (statusCode >= 200 && statusCode < 300) {
          if (body && typeof body === 'object' && 'success' in body) {
            if (body.success === true) {
              return resolve({ statusCode, body })
            }
            return reject(createHttpError({
              type: 'business',
              statusCode,
              message: extractMessage(body),
              data: body?.data,
              raw: body,
            }))
          }
          return reject(createHttpError({
            type: 'http',
            statusCode,
            message: '响应格式错误',
            data: body,
            raw: res,
          }))
        }

        return reject(createHttpError({
          type: 'http',
          statusCode,
          message: extractMessage(body, `请求失败(${statusCode})`),
          data: body,
          raw: res,
        }))
      },
      fail: err => reject(createHttpError({
        type: 'network',
        message: '网络错误，请检查网络后重试',
        raw: err,
      })),
    })
  })
}
