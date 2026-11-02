import type { CollectTopicItem } from './types'
import { http } from '@/http'

/** 收藏主题 */
export function collectTopic(topicId: string) {
  return http.post<{ success: boolean }>('/topic_collect/collect', { topic_id: topicId })
}

/** 取消收藏 */
export function deCollectTopic(topicId: string) {
  return http.post<{ success: boolean }>('/topic_collect/de_collect', { topic_id: topicId })
}

/** 用户收藏的主题列表 */
export function getCollectTopics(loginname: string) {
  return http.get<CollectTopicItem[]>(`/topic_collect/${loginname}`)
}
