<script setup lang="ts">
import type { MessageItem } from '@/api/types'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getMessages } from '@/api/message'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { timeAgo } from '@/utils/time'

const messageStore = useMessageStore()

const unread = ref<MessageItem[]>([])
const hasRead = ref<MessageItem[]>([])
const loading = ref(false)
const loadFailed = ref(false)

/** 消息类型文案 */
function typeLabel(m: MessageItem) {
  return m.type === 'at'
    ? '在话题中 @ 了你'
    : '回复了你的话题'
}

/** 加载消息列表（specs/message-notification：未读在前、已读在后） */
async function loadMessages() {
  if (!useUserStore().isLogged) {
    return
  }
  loading.value = true
  loadFailed.value = false
  try {
    const res = await getMessages()
    unread.value = res.hasnot_read_messages
    hasRead.value = res.has_read_messages
  }
  catch {
    loadFailed.value = true
  }
  finally {
    loading.value = false
    // 角标与列表保持一致
    messageStore.unreadCount = unread.value.length
    messageStore.syncBadge()
  }
}

/** 全部标记已读（带确认弹窗） */
function markAll() {
  if (!unread.value.length) {
    return
  }
  uni.showModal({
    title: '标记全部已读',
    content: `共 ${unread.value.length} 条未读消息，确认全部标记为已读？`,
    success: async (res) => {
      if (res.confirm) {
        await messageStore.markAllRead()
        hasRead.value = [
          ...unread.value.map(m => ({ ...m, has_read: true })),
          ...hasRead.value,
        ]
        unread.value = []
      }
    },
  })
}

/** 点击消息：未读先标记已读，然后跳转关联主题 */
async function onMessageTap(m: MessageItem) {
  const wasUnread = unread.value.includes(m)
  if (wasUnread) {
    await messageStore.markOne(m.id)
    unread.value = unread.value.filter(item => item.id !== m.id)
    hasRead.value = [
      ...hasRead.value,
      { ...m, has_read: true },
    ]
  }
  uni.navigateTo({ url: `/pages/topic/detail?id=${m.topic.id}` })
}

/** 跳转用户主页 */
function goUser(loginname: string) {
  uni.navigateTo({ url: `/pages/user/index?loginname=${loginname}` })
}

/** 未登录引导去登录 */
function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

onShow(() => {
  loadMessages()
})
</script>

<template>
  <view class="min-h-screen bg-page">
    <!-- 未登录引导 -->
    <view v-if="!useUserStore().isLogged" class="flex flex-col items-center pt-32">
      <text class="text-sm text-ink-600">
        登录后查看消息通知
      </text>
      <wd-button class="mt-4" type="primary" size="small" @click="goLogin">
        去登录
      </wd-button>
    </view>

    <template v-else>
      <!-- 顶部操作条 -->
      <view class="mx-3 mt-3 flex items-center justify-between rounded-2xl bg-card px-4 py-3">
        <text class="text-sm font-medium text-ink-900">
          未读 {{ unread.length }} 条
        </text>
        <wd-button
          size="small"
          plain
          :disabled="!unread.length"
          @click="markAll"
        >
          全部标记已读
        </wd-button>
      </view>

      <!-- 加载失败重试 -->
      <view v-if="loadFailed" class="mt-24 flex flex-col items-center">
        <text class="text-sm text-ink-600">
          消息加载失败
        </text>
        <wd-button class="mt-3" size="small" plain @click="loadMessages">
          重试
        </wd-button>
      </view>

      <view v-else-if="loading" class="pt-24 text-center">
        <wd-loading />
      </view>

      <!-- 消息列表 -->
      <view v-else>
        <!-- 未读消息 -->
        <view v-if="unread.length" class="mt-2 px-3">
          <text class="text-xs text-ink-400">未读消息</text>
          <view
            v-for="m in unread"
            :key="m.id"
            class="mb-2 rounded-2xl bg-card p-3 active:bg-muted"
            @tap="onMessageTap(m)"
          >
            <view class="flex items-center gap-2">
              <image class="h-8 w-8 rounded-full bg-muted" :src="m.author.avatar_url" mode="aspectFill" @tap.stop="goUser(m.author.loginname)" />
              <view class="flex-1">
                <view class="flex items-center gap-1.5">
                  <text class="text-sm font-medium text-ink-900" @tap.stop="goUser(m.author.loginname)">
                    {{ m.author.loginname }}
                  </text>
                  <text class="text-xs text-ink-600">{{ typeLabel(m) }}</text>
                </view>
                <text class="mt-0.5 block text-xs text-ink-600">{{ timeAgo(m.reply.create_at) }}</text>
              </view>
              <view class="h-2 w-2 rounded-full bg-danger" />
            </view>
            <text class="mt-2 line-clamp-2 block text-sm font-medium text-ink-900">{{ m.topic.title }}</text>
          </view>
        </view>

        <!-- 已读消息 -->
        <view v-if="hasRead.length" class="mt-2 px-3">
          <text class="text-xs text-ink-400">已读消息</text>
          <view
            v-for="m in hasRead"
            :key="m.id"
            class="mb-2 rounded-2xl bg-card p-3 opacity-70 active:bg-muted"
            @tap="onMessageTap(m)"
          >
            <view class="flex items-center gap-2">
              <image class="h-8 w-8 rounded-full bg-muted" :src="m.author.avatar_url" mode="aspectFill" />
              <view class="flex-1">
                <view class="flex items-center gap-1.5">
                  <text class="text-sm text-ink-700">{{ m.author.loginname }}</text>
                  <text class="text-xs text-ink-400">{{ typeLabel(m) }}</text>
                </view>
                <text class="mt-0.5 block text-xs text-ink-400">{{ timeAgo(m.reply.create_at) }}</text>
              </view>
            </view>
            <text class="mt-2 line-clamp-2 block text-sm text-ink-600">{{ m.topic.title }}</text>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!unread.length && !hasRead.length" class="pt-32 text-center text-sm text-ink-400">
          暂无消息
        </view>
      </view>
    </template>
  </view>
</template>
