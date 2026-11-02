/**
 * CNode v1 API 数据类型（https://cnodejs.org/api/v1）
 */

export type TopicTab = 'ask' | 'share' | 'job' | 'good' | 'dev'

export interface Author {
  loginname: string
  avatar_url: string
}

export interface TopicListItem {
  id: string
  author_id: string
  tab: TopicTab
  content: string
  title: string
  last_reply_at: string
  /** 精华 */
  good: boolean
  /** 置顶 */
  top: boolean
  reply_count: number
  visit_count: number
  create_at: string
  author: Author
}

export interface TopicReply {
  id: string
  author: Author
  /** 渲染后的 HTML（mdrender=true） */
  content: string
  /** 点赞用户 id 列表 */
  ups: string[]
  create_at: string
  /** 回复目标评论 id，直答主题时为 null */
  reply_id: string | null
  /** 已登录时：当前用户是否已点赞 */
  is_uped?: boolean
}

export interface TopicDetail extends TopicListItem {
  /** 原始 Markdown（mdrender=false），由客户端管线渲染 */
  content: string
  replies: TopicReply[]
  /** 已登录时：是否已收藏 */
  is_collect?: boolean
}

/** POST /accesstoken 验证成功返回 */
export interface AccessTokenResult {
  loginname: string
  id: string
  avatar_url: string
}

export interface UserDetail {
  loginname: string
  avatar_url: string
  githubUsername?: string
  create_at: string
  score: number
  recent_topics: UserTopicItem[]
  /** 回复过的主题（精简结构） */
  recent_replies: UserTopicItem[]
}

/** 用户主页「最近创建/回复的话题」条目（CNode Next 精简结构，统计字段可选） */
export interface UserTopicItem {
  id: string
  author: Author
  title: string
  last_reply_at: string
  tab?: TopicTab
  good?: boolean
  top?: boolean
  reply_count?: number
  visit_count?: number
}

export type MessageType = 'at' | 'reply'

export interface MessageItem {
  id: string
  type: MessageType
  has_read: boolean
  author: Author
  topic: {
    id: string
    title: string
    last_reply_at: string
  }
  reply: {
    id: string
    content: string
    ups: string[]
    create_at: string
  }
}

export interface MessagesResult {
  has_read_messages: MessageItem[]
  hasnot_read_messages: MessageItem[]
}

/** GET /topic_collect/:loginname 返回项（结构与主题列表一致） */
export interface CollectTopicItem extends TopicListItem {}

/** 发布/编辑主题分类（CNode 发布约定，不含 good/dev） */
export type PublishTab = 'ask' | 'share' | 'job' | 'dev'
