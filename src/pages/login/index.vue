<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const accessToken = ref('')
const submitting = ref(false)
/** 登录成功后的回跳地址（specs/auth：登录后返回继续操作） */
const redirect = ref('')

/** 打开 CNode 官网获取 accessToken 的引导 */
function openHelp() {
  uni.showModal({
    title: '如何获取 accessToken？',
    content: '1. 在浏览器登录 cnodejs.org；2. 进入「设置」页面；3. 复制页面下方的 AccessToken 粘贴到此处。',
    showCancel: false,
    confirmText: '知道了',
  })
}

/** 提交登录（specs/auth：Token 登录） */
async function submitLogin() {
  const token = accessToken.value.trim()
  if (!token) {
    uni.showToast({ icon: 'none', title: '请输入 accessToken' })
    return
  }
  submitting.value = true
  try {
    await userStore.login(token)
    // 登录后拉取详情并刷新未读角标（失败不影响登录流程）
    userStore.fetchUserDetail().finally(() => {
      useMessageStore().refreshCount()
    })
    // 回跳来源页或首页
    setTimeout(() => {
      if (redirect.value) {
        uni.redirectTo({ url: redirect.value })
      }
      else {
        uni.switchTab({ url: '/pages/my/index' })
      }
    }, 600)
  }
  catch (err: any) {
    uni.showToast({ icon: 'none', title: err?.message || '登录失败，请检查 token' })
  }
  finally {
    submitting.value = false
  }
}

/** 回跳地址解码：uni 路由与 ensureLogin 各编码一次，循环解码直至得到原始路径 */
function decodeRedirect(raw: string) {
  let r = raw
  for (let i = 0; i < 3 && /%[0-9A-F]{2}/i.test(r); i++) {
    const next = decodeURIComponent(r)
    if (next === r) {
      break
    }
    r = next
  }
  return r
}

onLoad((options) => {
  redirect.value = decodeRedirect(options?.redirect ?? '')
})
</script>

<template>
  <view class="min-h-screen bg-page px-5 py-10">
    <view class="rounded-xl bg-card p-5 shadow-xs">
      <view class="text-center">
        <text class="text-lg font-semibold text-ink-900">
          登录 CNode
        </text>
        <text class="mt-2 block text-xs text-ink-400">
          使用社区 accessToken 登录，与网页版账号通用
        </text>
      </view>

      <view class="mt-6">
        <wd-textarea
          v-model="accessToken"
          placeholder="在此粘贴你的 accessToken"
          :maxlength="64"
          custom-class="font-mono"
          auto-height
        />
        <view class="mt-1 flex items-center justify-between">
          <text class="text-2xs text-ink-400" @tap="openHelp">
            如何获取 accessToken？
          </text>
        </view>
      </view>

      <wd-button
        class="mt-5"
        type="primary"
        size="large"
        block
        :loading="submitting"
        @click="submitLogin"
      >
        登录
      </wd-button>
    </view>
  </view>
</template>
