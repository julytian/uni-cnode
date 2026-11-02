<script setup lang="ts">
import type { CollectTopicItem } from '@/api/types'
import { onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getCollectTopics } from '@/api/collect'
import TopicCard from '@/components/TopicCard.vue'
import { useUserStore } from '@/stores/user'
import { ensureLogin } from '@/utils/auth'

const userStore = useUserStore()

const topics = ref<CollectTopicItem[]>([])
const loading = ref(true)
const loadFailed = ref(false)

async function loadCollects() {
  if (!userStore.isLogged || !userStore.userInfo) {
    // 收藏页必须登录访问；从 tabbar 外进入时兜底拦截
    ensureLogin('/pages/collect/index')
    loading.value = false
    return
  }
  loading.value = true
  loadFailed.value = false
  try {
    topics.value = await getCollectTopics(userStore.userInfo.loginname)
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

onShow(() => {
  loadCollects()
})
</script>

<template>
  <view class="min-h-screen bg-page p-3">
    <!-- 加载态 -->
    <view v-if="loading" class="flex justify-center pt-24">
      <wd-loading />
    </view>

    <!-- 失败重试 -->
    <view v-else-if="loadFailed" class="flex flex-col items-center pt-24">
      <text class="text-sm text-ink-600">
        收藏列表加载失败
      </text>
      <wd-button class="mt-3" size="small" plain @click="loadCollects">
        重试
      </wd-button>
    </view>

    <!-- 空状态（specs/user-profile：收藏为空） -->
    <view v-else-if="!topics.length" class="flex flex-col items-center pt-28">
      <text class="text-3xl">
        ☆
      </text>
      <text class="mt-3 text-sm text-ink-400">
        暂无收藏，去主题详情页收藏喜欢的内容吧
      </text>
    </view>

    <!-- 收藏列表 -->
    <template v-else>
      <view class="mx-3 overflow-hidden rounded-2xl bg-card">
        <TopicCard
          v-for="t in topics"
          :key="t.id"
          :topic="t"
          @click="goDetail(t.id)"
        />
      </view>
    </template>
  </view>
</template>
