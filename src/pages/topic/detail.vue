<script setup lang="ts">
import type { TopicDetail, TopicReply } from '@/api/types'
import { onLoad } from '@dcloudio/uni-app'
import MpHtml from 'mp-html/dist/uni-app/components/mp-html/mp-html.vue'
import { computed, nextTick, ref } from 'vue'
import { collectTopic, deCollectTopic } from '@/api/collect'
import { getTopicDetail, replyTopic, upReply } from '@/api/topic'
import { useUserStore } from '@/stores/user'
import { ensureLogin } from '@/utils/auth'
import { renderMarkdown } from '@/utils/markdown'
import { tabLabel, timeAgo } from '@/utils/time'

const userStore = useUserStore()

const topicId = ref('')
const topic = ref<TopicDetail | null>(null)
const loading = ref(true)
const loadFailed = ref(false)
/** 评论卡片锚点：回复成功后滚动定位到最新评论 */
const scrollInto = ref('')

/** 回复输入状态 */
const replyContent = ref('')
const replyTarget = ref<TopicReply | null>(null)
const submitting = ref(false)

/** 正文渲染结果（原始 Markdown → CNode Next 同款管线 HTML） */
const renderedContent = computed(() => renderMarkdown(topic.value?.content || ''))

/** 是否主题作者（决定编辑入口，specs/topic-interaction） */
const isAuthor = computed(() =>
  !!topic.value && !!userStore.userInfo && topic.value.author.loginname === userStore.userInfo.loginname,
)

/** 加载详情 */
async function loadDetail() {
  loading.value = true
  loadFailed.value = false
  try {
    topic.value = await getTopicDetail(topicId.value)
    // 回复成功后刷新会定位到最后一条评论
    if (scrollInto.value === 'reply-last') {
      await nextTick()
      scrollInto.value = ''
      await nextTick()
      scrollInto.value = 'reply-last'
    }
  }
  catch {
    loadFailed.value = true
  }
  finally {
    loading.value = false
  }
}

/** 收藏/取消收藏（specs/topic-interaction：状态切换） */
async function toggleCollect() {
  if (!topic.value) {
    return
  }
  const id = topic.value.id
  if (!ensureLogin(`/pages/topic/detail?id=${id}`)) {
    return
  }
  const collected = !!topic.value.is_collect
  try {
    if (collected) {
      await deCollectTopic(id)
      topic.value.is_collect = false
      uni.showToast({ icon: 'none', title: '已取消收藏' })
    }
    else {
      await collectTopic(id)
      topic.value.is_collect = true
      uni.showToast({ icon: 'none', title: '收藏成功' })
    }
  }
  catch {
    // 错误提示已由 http 层统一处理
  }
}

/** 评论点赞/取消（specs/topic-interaction：幂等切换，本地同步点赞数） */
async function toggleUp(reply: TopicReply) {
  if (!ensureLogin(`/pages/topic/detail?id=${topicId.value}`)) {
    return
  }
  try {
    await upReply(reply.id)
    if (reply.is_uped) {
      reply.ups = reply.ups.filter(uid => uid !== userStore.userInfo?.id)
      reply.is_uped = false
    }
    else {
      if (userStore.userInfo?.id && !reply.ups.includes(userStore.userInfo.id)) {
        reply.ups.push(userStore.userInfo.id)
      }
      reply.is_uped = true
    }
  }
  catch {
    // 错误提示已由 http 层统一处理
  }
}

/** 选择回复目标（点击评论的回复按钮） */
function pickReplyTarget(reply: TopicReply) {
  if (!ensureLogin(`/pages/topic/detail?id=${topicId.value}`)) {
    return
  }
  replyTarget.value = reply
}

/** 提交回复（specs/topic-interaction：成功后刷新评论列表并定位新评论） */
async function submitReply() {
  const content = replyContent.value.trim()
  if (!content) {
    uni.showToast({ icon: 'none', title: '回复内容不能为空' })
    return
  }
  submitting.value = true
  try {
    await replyTopic(topicId.value, {
      content,
      reply_id: replyTarget.value?.id,
    })
    replyContent.value = ''
    replyTarget.value = null
    uni.showToast({ icon: 'none', title: '回复成功' })
    scrollInto.value = 'reply-last'
    await loadDetail()
  }
  catch {
    // 错误提示已由 http 层统一处理
  }
  finally {
    submitting.value = false
  }
}

/** 进入用户主页 */
function goUser(loginname: string) {
  uni.navigateTo({ url: `/pages/user/index?loginname=${loginname}` })
}

/**
 * mp-html 链接点击拦截：站内 /user/xxx 转用户主页路由，返回 true 阻止默认复制行为
 */
function onLinkTap(e: { href?: string }) {
  const href = e?.href || ''
  const userMatch = href.match(/^\/user\/([\w-]+)/)
  if (userMatch) {
    goUser(userMatch[1])
    return true
  }
  return false
}

/** mp-html 深色 tag-style（CNode Next 代码块/引用/表格容器语言） */
const mdTagStyle = {
  pre: 'background:#172813;border-radius:8px;padding:12px;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.6;',
  code: 'font-family:Menlo,Consolas,Monaco,monospace;font-size:12px;',
  blockquote: 'margin:8px 0;padding:8px 12px;border-left:3px solid #9de330;background:#172813;border-radius:0 8px 8px 0;color:#9eb092;',
  table: 'border-collapse:collapse;width:100%;font-size:12px;',
  th: 'border:1px solid rgba(255,255,255,.08);padding:6px 10px;background:#172813;',
  td: 'border:1px solid rgba(255,255,255,.08);padding:6px 10px;',
  img: 'border-radius:8px;',
}

/** 编辑主题（仅作者可见入口） */
function goEdit() {
  uni.navigateTo({ url: `/pages/publish/index?id=${topicId.value}` })
}

onLoad((options) => {
  topicId.value = options?.id ?? ''
  loadDetail()
})
</script>

<template>
  <view class="flex h-screen flex-col bg-page">
    <!-- 加载态 -->
    <view v-if="loading" class="flex flex-1 items-center justify-center">
      <wd-loading />
    </view>

    <!-- 加载失败 -->
    <view v-else-if="loadFailed" class="flex flex-1 flex-col items-center justify-center">
      <text class="text-sm text-ink-600">
        主题加载失败
      </text>
      <wd-button class="mt-3" size="small" plain @click="loadDetail">
        重试
      </wd-button>
    </view>

    <template v-else-if="topic">
      <!-- 内容区（可滚动） -->
      <scroll-view scroll-y class="min-h-0 flex-1" :scroll-into-view="scrollInto">
        <!-- 话题头卡片 -->
        <view class="mx-3 mt-3 rounded-2xl bg-card p-4">
          <view class="flex items-start gap-3">
            <text class="flex-1 text-lg font-bold text-ink-900 leading-snug">
              {{ topic.title }}
            </text>
            <text class="mt-1 shrink-0 rounded-md bg-muted px-2 py-0.5 text-2xs text-muted-fg">
              {{ tabLabel(topic.tab) }}
            </text>
          </view>

          <!-- 作者行 -->
          <view class="mt-3.5 flex items-center gap-2.5">
            <image
              class="topic-avatar h-9 w-9 rounded-full bg-muted"
              :src="topic.author.avatar_url"
              mode="aspectFill"
              @tap="goUser(topic.author.loginname)"
            />
            <text class="text-sm font-medium text-ink-900" @tap="goUser(topic.author.loginname)">
              {{ topic.author.loginname }}
            </text>
            <text class="text-xs text-ink-400">
              发布于 {{ timeAgo(topic.create_at) }}
            </text>
          </view>

          <!-- 统计 + 操作行 -->
          <view class="mt-3.5 flex items-center gap-3 border-t border-line pt-3 text-xs text-ink-600">
            <text>回复 {{ topic.reply_count }}</text>
            <text>浏览 {{ topic.visit_count }}</text>
            <view class="flex-1" />
            <!-- 收藏 pill：outline star → fill star（currentColor 着色） -->
            <view
              class="flex h-7 items-center gap-1 rounded-full px-2.5 transition-colors duration-150 active:scale-95"
              :class="topic.is_collect ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-fg'"
              @tap="toggleCollect"
            >
              <wd-icon
                :name="topic.is_collect ? 'star-fill' : 'star'"
                size="13px"
                :color="topic.is_collect ? '#9de330' : '#9eb092'"
              />
              <text>{{ topic.is_collect ? '已收藏' : '收藏' }}</text>
            </view>
            <view
              v-if="isAuthor"
              class="flex h-7 items-center rounded-full bg-muted px-2.5 text-muted-fg active:scale-95"
              @tap="goEdit"
            >
              <text>编辑</text>
            </view>
          </view>
        </view>

        <!-- 正文卡片 -->
        <view class="mx-3 mt-3 rounded-2xl bg-card p-4">
          <MpHtml :content="renderedContent" :tag-style="mdTagStyle" @linktap="onLinkTap" />
        </view>

        <!-- 评论区：每条评论独立卡片 -->
        <view class="mx-3 mt-4">
          <text class="mb-2.5 block px-1 text-sm font-medium text-ink-600">
            共 {{ topic.reply_count }} 条回复
          </text>

          <view
            v-for="(reply, index) in topic.replies"
            :id="index === topic.replies.length - 1 ? 'reply-last' : undefined"
            :key="reply.id"
            class="mb-2.5 rounded-2xl bg-card p-4"
          >
            <!-- 评论头：头像 + 作者 + 楼层 + 时间 -->
            <view class="flex items-center gap-2.5">
              <image
                class="topic-avatar h-9 w-9 rounded-full bg-muted"
                :src="reply.author.avatar_url"
                mode="aspectFill"
                @tap="goUser(reply.author.loginname)"
              />
              <text class="text-15px font-semibold text-ink-900" @tap="goUser(reply.author.loginname)">
                {{ reply.author.loginname }}
              </text>
              <text class="text-xs text-ink-400">
                #{{ index + 1 }}
              </text>
              <view class="flex-1" />
              <text class="text-xs text-ink-400">
                {{ timeAgo(reply.create_at) }}
              </text>
            </view>

            <!-- 评论正文 -->
            <view class="mt-2.5">
              <MpHtml :content="renderMarkdown(reply.content || '')" :tag-style="mdTagStyle" @linktap="onLinkTap" />
            </view>

            <!-- 操作行：赞 / 回复 -->
            <view class="mt-3 flex items-center gap-6">
              <view class="flex items-center gap-1" @tap="toggleUp(reply)">
                <wd-icon
                  :name="reply.is_uped ? 'thumb-up-fill' : 'thumb-up'"
                  size="14px"
                  :color="reply.is_uped ? '#9de330' : '#9eb092'"
                />
                <text
                  class="text-xs"
                  :class="reply.is_uped ? 'text-primary' : 'text-ink-600'"
                >
                  赞 {{ reply.ups?.length ?? 0 }}
                </text>
              </view>
              <text class="text-xs text-ink-600" @tap="pickReplyTarget(reply)">
                回复
              </text>
            </view>
          </view>

          <view v-if="!topic.replies.length" class="rounded-2xl bg-card py-10 text-center text-sm text-ink-400">
            暂无评论，快来抢沙发
          </view>
        </view>

        <view class="h-3" />
      </scroll-view>

      <!-- 底部回复输入条 -->
      <view class="shrink-0 border-t border-line bg-card px-3 py-2.5">
        <view v-if="replyTarget" class="mb-2 flex items-center gap-2 rounded-lg bg-primary-soft px-2.5 py-1.5">
          <text class="flex-1 text-xs text-primary">
            回复 {{ replyTarget.author.loginname }}：
          </text>
          <text class="text-xs text-ink-400" @tap="replyTarget = null">
            取消
          </text>
        </view>
        <view class="flex items-center gap-2.5">
          <wd-input
            v-model="replyContent"
            custom-class="flex-1"
            no-border
            placeholder="回复支持 Markdown 语法"
            confirm-type="send"
            @confirm="submitReply"
          />
          <wd-button size="small" type="primary" round :loading="submitting" @click="submitReply">
            发送
          </wd-button>
        </view>
      </view>
    </template>
  </view>
</template>
