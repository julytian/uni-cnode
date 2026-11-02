<script setup lang="ts">
import type { TopicListItem, UserTopicItem } from '@/api/types'
import { tabLabel, timeAgo } from '@/utils/time'

defineProps<{
  topic: TopicListItem | UserTopicItem
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <!-- CNode Next 列表条目：头像 + 标题 + 元信息行 + 标签 pill 行 -->
  <view
    class="press-card border-b border-line px-4 py-3.5 last:border-b-0 active:bg-card-hover"
    @tap="$emit('click')"
  >
    <view class="flex items-start gap-3">
      <image
        class="topic-avatar h-10 w-10 shrink-0 rounded-full bg-muted"
        :src="topic.author.avatar_url"
        mode="aspectFill"
      />

      <view class="min-w-0 flex-1">
        <!-- 标题 -->
        <text class="line-clamp-2 text-15px font-semibold text-ink-900 leading-snug">
          {{ topic.title }}
        </text>

        <!-- 元信息行：作者 · 回复 · 浏览 · 时间（长名截断，App 单行规范） -->
        <view class="mt-1.5 flex items-center gap-2 text-xs text-ink-600">
          <text class="max-w-40 truncate">
            {{ topic.author.loginname }}
          </text>
          <text v-if="topic.reply_count !== undefined" class="shrink-0">
            回复 {{ topic.reply_count }}
          </text>
          <text v-if="topic.visit_count !== undefined" class="shrink-0">
            浏览 {{ topic.visit_count }}
          </text>
          <view class="flex-1" />
          <text class="shrink-0 text-ink-400">
            {{ timeAgo(topic.last_reply_at) }}
          </text>
        </view>

        <!-- 标签 pill 行：置顶/精华（亮绿底深字）+ 分类（深灰绿底浅字） -->
        <view class="mt-2 flex items-center gap-1.5">
          <text
            v-if="topic.top"
            class="rounded-md bg-primary px-1.5 py-0.5 text-2xs font-medium text-primary-fg"
          >
            置顶
          </text>
          <text
            v-if="topic.good"
            class="rounded-md bg-primary px-1.5 py-0.5 text-2xs font-medium text-primary-fg"
          >
            精华
          </text>
          <text v-if="topic.tab" class="rounded-md bg-muted px-1.5 py-0.5 text-2xs text-muted-fg">
            {{ tabLabel(topic.tab) }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>
