<script setup lang="ts">
import type { PublishTab } from '@/api/types'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { createTopic, getTopicDetail, updateTopic } from '@/api/topic'
import { useUserStore } from '@/stores/user'
import { ensureLogin } from '@/utils/auth'

const userStore = useUserStore()

/** 编辑模式：携带 id 即编辑（specs/topic-interaction：编辑主题） */
const editId = ref('')
const isEdit = ref(false)

const title = ref('')
const tab = ref<PublishTab | ''>('')
const content = ref('')
const submitting = ref(false)

/** 可发布分类（CNode 发布约定） */
const tabOptions: { key: PublishTab, label: string }[] = [
  { key: 'share', label: '分享' },
  { key: 'ask', label: '问答' },
  { key: 'job', label: '招聘' },
  { key: 'dev', label: '客户端测试' },
]

/** 表单校验（specs/topic-interaction：标题≥10字、分类必选、内容必填） */
function validate(): string {
  if (title.value.trim().length < 10) {
    return '标题至少 10 个字符'
  }
  if (!tab.value) {
    return '请选择分类'
  }
  if (!content.value.trim()) {
    return '内容不能为空'
  }
  return ''
}

async function submit() {
  const err = validate()
  if (err) {
    uni.showToast({ icon: 'none', title: err })
    return
  }
  submitting.value = true
  try {
    let topicId: string
    if (isEdit.value) {
      const res = await updateTopic({
        topic_id: editId.value,
        title: title.value.trim(),
        tab: tab.value as PublishTab,
        content: content.value,
      })
      topicId = res.topic_id
      uni.showToast({ icon: 'none', title: '更新成功' })
    }
    else {
      const res = await createTopic({
        title: title.value.trim(),
        tab: tab.value as PublishTab,
        content: content.value,
      })
      topicId = res.topic_id
      uni.showToast({ icon: 'none', title: '发布成功' })
    }
    // 发布/编辑成功跳转到主题详情（specs/topic-interaction）
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/topic/detail?id=${topicId}` })
    }, 600)
  }
  catch {
    // 接口拒绝：错误信息已由 http 层 toast，可修改后重试
  }
  finally {
    submitting.value = false
  }
}

/** 编辑模式预填原主题数据 */
async function loadForEdit(id: string) {
  try {
    const detail = await getTopicDetail(id)
    title.value = detail.title
    tab.value = detail.tab as PublishTab
    // 编辑时用原始 markdown（详情接口 content 为渲染后的 HTML，需要原始文本）
    // CNode 详情接口仅返回渲染后 HTML；编辑场景回填 HTML 到 textarea 由用户调整
    content.value = detail.content ?? ''
  }
  catch {
    uni.showToast({ icon: 'none', title: '主题加载失败' })
  }
}

onLoad((options) => {
  if (options?.id) {
    editId.value = options.id
    isEdit.value = true
    uni.setNavigationBarTitle({ title: '编辑主题' })
  }
})

onShow(() => {
  // 需登录（specs/auth：未登录操作拦截）
  if (!userStore.isLogged) {
    if (!ensureLogin(isEdit.value
      ? `/pages/publish/index?id=${editId.value}`
      : '/pages/publish/index')) {
      return
    }
  }
  if (isEdit.value && !title.value) {
    loadForEdit(editId.value)
  }
})
</script>

<template>
  <view class="min-h-screen bg-page p-4">
    <!-- 标题 -->
    <view class="rounded-lg bg-card p-3">
      <wd-input
        v-model="title"
        placeholder="标题，不少于 10 个字符"
        :maxlength="100"
        no-border
      />
    </view>

    <!-- 分类选择 -->
    <view class="mt-3 rounded-lg bg-card p-3">
      <text class="mb-2 block text-sm text-ink-600">
        选择分类
      </text>
      <view class="flex flex-wrap gap-2">
        <view
          v-for="opt in tabOptions"
          :key="opt.key"
          class="rounded-full px-3 py-1.5 text-sm transition-colors duration-150"
          :class="tab === opt.key ? 'bg-primary font-medium text-primary-fg' : 'bg-muted text-ink-600'"
          @tap="tab = opt.key"
        >
          {{ opt.label }}
        </view>
      </view>
    </view>

    <!-- 内容 -->
    <view class="mt-3 rounded-lg bg-card p-3">
      <wd-textarea
        v-model="content"
        placeholder="正文内容，支持 Markdown 语法"
        :maxlength="10000"
        auto-height
        custom-class="min-h-48"
      />
    </view>

    <wd-button
      class="mt-4"
      type="primary"
      size="large"
      block
      :loading="submitting"
      @click="submit"
    >
      {{ isEdit ? '保存修改' : '发布主题' }}
    </wd-button>
  </view>
</template>
