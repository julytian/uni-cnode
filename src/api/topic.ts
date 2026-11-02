import type { TopicDetail, TopicListItem, TopicTab } from './types'
import { http } from '@/http'

/** 主题列表参数 */
export interface GetTopicsParams {
  page?: number
  tab?: TopicTab
  limit?: number
}

/** 主题列表（服务端已渲染 markdown） */
export function getTopics(params: GetTopicsParams = {}) {
  const { page = 1, limit = 20, ...rest } = params
  return http.get<TopicListItem[]>('/topics', { page, limit, ...rest })
}

/** 主题详情（含回复；content 为原始 Markdown，由客户端管线渲染；已登录时带 is_collect 与回复 is_uped） */
export function getTopicDetail(id: string) {
  return http.get<TopicDetail>(`/topic/${id}`, { mdrender: false })
}

/** 新建主题参数 */
export interface CreateTopicParams {
  title: string
  tab: string
  content: string
}

/** 新建主题，返回 { topic_id } */
export function createTopic(params: CreateTopicParams) {
  return http.post<{ topic_id: string }>('/topics', params)
}

/** 编辑主题参数 */
export interface UpdateTopicParams extends CreateTopicParams {
  topic_id: string
}

/** 编辑主题，返回 { topic_id } */
export function updateTopic(params: UpdateTopicParams) {
  return http.post<{ topic_id: string }>('/topics/update', params)
}

/** 回复参数；回复指定评论时携带 reply_id */
export interface ReplyParams {
  content: string
  reply_id?: string
}

/** 回复主题，返回 { reply_id } */
export function replyTopic(topicId: string, params: ReplyParams) {
  const { content, reply_id } = params
  const data: Record<string, string> = { content }
  if (reply_id) {
    data.reply_id = reply_id
  }
  return http.post<{ reply_id: string }>(`/topic/${topicId}/replies`, data)
}

/** 评论点赞（幂等切换），返回 { action: 'up' | 'down' } */
export function upReply(replyId: string) {
  return http.post<{ action: 'up' | 'down' }>(`/reply/${replyId}/ups`)
}
