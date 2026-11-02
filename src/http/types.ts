/**
 * CNode v1 API 统一响应契约：https://cnodejs.org/api/v1
 * 成功：{ success: true, data }
 * 失败：{ success: false, error_msg }
 */
export interface CnodeResponse<T = any> {
  success: boolean
  data: T
  error_msg?: string
}

/** 统一错误类型：请求层所有失败都以该结构 reject */
export type HttpErrorType = 'business' | 'auth' | 'http' | 'network'

export interface HttpError {
  type: HttpErrorType
  /** CNode 业务码（本 API 无业务码，保留扩展位） */
  code?: number
  /** HTTP 状态码 */
  statusCode?: number
  message: string
  data?: any
  raw?: unknown
}

export function createHttpError(params: HttpError): HttpError {
  return params
}

/** http 层请求选项 */
export interface RequestOptions {
  /** URL 查询参数（GET 拼接；accesstoken 注入也走这里） */
  query?: Record<string, any>
  /** 请求体（POST） */
  data?: Record<string, any>
  header?: Record<string, any>
  /** 出错时是否隐藏错误 toast（默认弹） */
  hideErrorToast?: boolean
  /** 鉴权失败（401/403）是否属预期业务结果（如登录页验证 token）：按业务错误处理，不触发全局降级 */
  authOptional?: boolean
}

/** fetcher 层原始请求选项（http 层组装完毕后传给 fetcher） */
export interface FetcherOptions extends RequestOptions {
  url: string
  method: 'GET' | 'POST'
}
