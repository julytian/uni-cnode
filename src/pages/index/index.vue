<script setup lang="ts">
import type { TopicListItem } from '@/api/types'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { getTopics } from '@/api/topic'
import { ensureLogin } from '@/utils/auth'
import { TAB_LABELS } from '@/utils/time'

const PAGE_SIZE = 20

/** 分类 Tab：key 为空表示全部 */
const tabs = [
  '',
  'good',
  'share',
  'ask',
  'job',
  'dev',
].map(key => ({
  key,
  label: TAB_LABELS[key] || '全部',
}))

const currentTab = ref('')
const topics = ref<TopicListItem[]>([])
const page = ref(1)
const loading = ref(false)
const loadFailed = ref(false)
/** 是否已加载完全部数据（返回条数不足一页时置 true） */
const finished = ref(false)

/** 加载指定页数据（specs/topic-browsing：列表分页与失败重试） */
async function loadPage(targetPage: number, replace = false) {
  if (loading.value) {
    return
  }
  loading.value = true
  loadFailed.value = false
  try {
    const res = await getTopics({
      page: targetPage,
      limit: PAGE_SIZE,
      tab: (currentTab.value || undefined) as any,
    })
    page.value = targetPage
    finished.value = res.length < PAGE_SIZE
    topics.value = replace
      ? res
      : [
          ...topics.value,
          ...res,
        ]
  }
  catch {
    // 失败展示重试入口（错误提示已由 http 层 toast）
    loadFailed.value = true
  }
  finally {
    loading.value = false
    if (replace) {
      uni.stopPullDownRefresh()
    }
  }
}

/** 切换分类：重置分页并回到第 1 页（specs/topic-browsing：切换分类） */
function switchTab(key: string) {
  if (currentTab.value === key) {
    return
  }
  currentTab.value = key
  topics.value = []
  finished.value = false
  loadPage(1, true)
}

/** 下拉刷新：回到第 1 页并替换列表 */
onPullDownRefresh(() => {
  loadPage(1, true)
})

/** 上拉加载下一页；没有更多数据时不再请求 */
onReachBottom(() => {
  if (!finished.value && !loadFailed.value) {
    loadPage(page.value + 1)
  }
})

/** 失败重试：重试当前页 */
function retry() {
  loadPage(page.value || 1, topics.value.length === 0)
}

/** 进入主题详情 */
function goDetail(topic: TopicListItem) {
  uni.navigateTo({ url: `/pages/topic/detail?id=${topic.id}` })
}

/** 发布主题（需登录拦截） */
function goPublish() {
  if (ensureLogin('/pages/publish/index')) {
    uni.navigateTo({ url: '/pages/publish/index' })
  }
}

loadPage(1, true)
</script>

<template>
  <view class="relative flex h-screen flex-col bg-page">
    <!-- 分类 pill 横向滚动（CNode Next：胶囊选中态） -->
    <scroll-view scroll-x class="shrink-0 whitespace-nowrap bg-page">
      <view class="flex gap-2 px-4 pb-2.5 pt-3">
        <view
          v-for="t in tabs"
          :key="t.key"
          class="rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150"
          :class="currentTab === t.key
            ? 'bg-primary font-medium text-primary-fg'
            : 'bg-muted text-muted-fg'"
          @tap="switchTab(t.key)"
        >
          {{ t.label }}
        </view>
      </view>
    </scroll-view>

    <!-- 主题列表容器（CNode Next：大圆角深色卡片包裹） -->
    <scroll-view scroll-y class="min-h-0 flex-1">
      <view class="mx-3 mb-3 overflow-hidden rounded-2xl bg-card">
        <!-- 加载失败重试（specs/topic-browsing：列表加载失败） -->
        <view v-if="loadFailed && !topics.length" class="flex flex-col items-center py-24">
          <text class="text-sm text-ink-600">
            列表加载失败
          </text>
          <wd-button class="mt-3" size="small" plain @click="retry">
            重试
          </wd-button>
        </view>

        <template v-else>
          <TopicCard
            v-for="topic in topics"
            :key="topic.id"
            :topic="topic"
            @click="goDetail(topic)"
          />

          <!-- 空状态 -->
          <view v-if="!loading && !topics.length" class="py-24 text-center text-sm text-ink-400">
            暂无主题
          </view>
        </template>
      </view>

      <!-- 底部状态 -->
      <view class="pb-6 text-center">
        <text v-if="loading" class="text-xs text-ink-400">
          加载中...
        </text>
        <text v-else-if="finished && topics.length" class="text-xs text-ink-400">
          没有更多了
        </text>
        <text v-else-if="loadFailed" class="text-xs text-danger" @tap="retry">
          加载失败，点击重试
        </text>
      </view>
    </scroll-view>

    <!-- 发布入口（需登录，由发布页自行拦截） -->
    <view
      class="press-fab absolute bottom-24 right-4 z-10 flex h-13 w-13 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg shadow-black/40"
      @tap="goPublish"
    >
      <text class="text-2xl leading-none font-light">
        +
      </text>
    </view>
  </view>
</template>
