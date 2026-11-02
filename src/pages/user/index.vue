<script setup lang="ts">
import type { UserDetail } from '@/api/types'
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getUser } from '@/api/user'
import TopicCard from '@/components/TopicCard.vue'
import { timeAgo } from '@/utils/time'

const loginname = ref('')
const user = ref<UserDetail | null>(null)
const loading = ref(true)
const loadFailed = ref(false)

/** 当前区块：topics=最近创建 / replies=最近回复（anchor 参数可定位初始区块） */
const activeBlock = ref<'topics' | 'replies'>('topics')

async function loadUser() {
  loading.value = true
  loadFailed.value = false
  try {
    user.value = await getUser(loginname.value)
  }
  catch {
    loadFailed.value = true
  }
  finally {
    loading.value = false
  }
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/topic/detail?id=${id}` })
}

onLoad((options) => {
  loginname.value = options?.loginname ?? ''
  if (options?.anchor === 'topics' || options?.anchor === 'replies') {
    activeBlock.value = options.anchor
  }
  uni.setNavigationBarTitle({ title: loginname.value || '用户主页' })
  loadUser()
})
</script>

<template>
  <view class="min-h-screen bg-page">
    <!-- 加载态 -->
    <view v-if="loading" class="flex justify-center pt-24">
      <wd-loading />
    </view>

    <!-- 失败重试 -->
    <view v-else-if="loadFailed" class="flex flex-col items-center pt-24">
      <text class="text-sm text-ink-600">
        用户信息加载失败
      </text>
      <wd-button class="mt-3" size="small" plain @click="loadUser">
        重试
      </wd-button>
    </view>

    <template v-else-if="user">
      <!-- 资料卡 -->
      <view class="mx-3 mt-3 rounded-2xl bg-card px-4 pb-6 pt-8">
        <image class="h-16 w-16 rounded-full bg-muted" :src="user.avatar_url" mode="aspectFill" />
        <view class="flex-1">
          <text class="text-lg font-semibold text-ink-900">
            {{ user.loginname }}
          </text>
          <view class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <text class="text-xs text-ink-600">
              积分 {{ user.score }}
            </text>
            <text class="text-xs text-ink-600">
              注册于 {{ user.create_at?.slice(0, 10) }}
            </text>
          </view>
          <text v-if="user.githubUsername" class="mt-1 block text-xs text-ink-400">
            GitHub: @{{ user.githubUsername }}
          </text>
        </view>
      </view>

      <!-- 区块切换：分段控件（CNode Next pill 语言） -->
      <view class="mx-3 mt-3 flex rounded-full bg-muted p-1">
        <view
          class="flex-1 rounded-full py-2 text-center text-sm transition-colors duration-150"
          :class="activeBlock === 'topics' ? 'bg-primary font-medium text-primary-fg' : 'text-muted-fg'"
          @tap="activeBlock = 'topics'"
        >
          最近创建
        </view>
        <view
          class="flex-1 rounded-full py-2 text-center text-sm transition-colors duration-150"
          :class="activeBlock === 'replies' ? 'bg-primary font-medium text-primary-fg' : 'text-muted-fg'"
          @tap="activeBlock = 'replies'"
        >
          最近回复
        </view>
      </view>

      <!-- 最近创建的话题 -->
      <view v-if="activeBlock === 'topics'" class="p-3">
        <template v-if="user.recent_topics.length">
          <TopicCard
            v-for="t in user.recent_topics"
            :key="t.id"
            :topic="t"
            @click="goDetail(t.id)"
          />
        </template>
        <view v-else class="pt-16 text-center text-sm text-ink-400">
          暂无创建的话题
        </view>
      </view>

      <!-- 最近回复的话题（回复过的主题：标题 + 时间） -->
      <view v-else class="p-3">
        <template v-if="user.recent_replies.length">
          <view
            v-for="r in user.recent_replies"
            :key="r.id"
            class="mb-2 rounded-2xl bg-card px-3 py-3 active:bg-muted"
            @tap="goDetail(r.id)"
          >
            <view class="flex items-center gap-2">
              <image class="h-6 w-6 rounded-full bg-muted" :src="r.author.avatar_url" mode="aspectFill" />
              <text class="text-xs text-ink-600">
                {{ r.author.loginname }}
              </text>
              <view class="flex-1" />
              <text class="text-xs text-ink-400">
                {{ timeAgo(r.last_reply_at) }}
              </text>
            </view>
            <text class="mt-2 line-clamp-2 block text-sm text-ink-900">
              {{ r.title }}
            </text>
          </view>
        </template>
        <view v-else class="pt-16 text-center text-sm text-ink-400">
          暂无回复的话题
        </view>
      </view>
    </template>
  </view>
</template>
