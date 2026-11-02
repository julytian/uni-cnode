import type { MessagesResult } from './types'
import { http } from '@/http'

/** 未读消息数 */
export function getUnreadCount() {
  return http.get<number>('/message/count')
}

/** 已读与未读消息列表（客户端做正文摘要，不需要服务端渲染） */
export function getMessages() {
  return http.get<MessagesResult>('/messages', { mdrender: false })
}

/** 标记全部消息为已读 */
export function markAllRead() {
  return http.post<{ marked_msgs: { id: string }[] }>('/message/mark_all')
}

/** 标记单条消息为已读 */
export function markOneRead(msgId: string) {
  return http.post<{ marked_msg_id: string }>(`/message/mark_one/${msgId}`)
}
