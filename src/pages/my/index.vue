<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { ensureLogin } from '@/utils/auth'

const userStore = useUserStore()
const messageStore = useMessageStore()

/** 菜单项：未登录点击统一走登录拦截 */
const menus = [
  {
    key: 'collect',
    label: '我的收藏',
    icon: 'i-carbon-star',
    url: '/pages/collect/index',
  },
  {
    key: 'topics',
    label: '我的主题',
    icon: 'i-carbon-list',
    url: '',
  },
  {
    key: 'replies',
    label: '我的回复',
    icon: 'i-carbon-chat',
    url: '',
  },
]

/** 我的主题/回复复用用户主页（specs/user-profile），区块定位通过锚点参数 */
function openMenu(menu: typeof menus[number]) {
  if (menu.key === 'topics' || menu.key === 'replies') {
    const anchor = menu.key === 'topics'
      ? 'topics'
      : 'replies'
    const url = `/pages/user/index?loginname=${userStore.userInfo?.loginname}&anchor=${anchor}`
    uni.navigateTo({ url })
    return
  }
  if (ensureLogin(menu.url)) {
    uni.navigateTo({ url: menu.url })
  }
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

function goMessages() {
  if (ensureLogin('/pages/message/index')) {
    uni.switchTab({ url: '/pages/message/index' })
  }
}

function confirmLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        messageStore.unreadCount = 0
        messageStore.syncBadge()
      }
    },
  })
}

onShow(() => {
  // 已登录时刷新个人资料与未读数
  if (userStore.isLogged) {
    userStore.fetchUserDetail().finally(() => messageStore.refreshCount())
  }
})
</script>

<template>
  <view class="min-h-screen bg-page pb-8">
    <!-- 用户信息卡 -->
    <view class="mx-3 mt-3 rounded-2xl bg-card px-4 pb-6 pt-8">
      <template v-if="userStore.isLogged && userStore.userInfo">
        <view class="flex items-center gap-4">
          <image
            class="h-16 w-16 rounded-full bg-muted"
            :src="userStore.userInfo.avatar_url"
            mode="aspectFill"
          />
          <view class="flex-1">
            <text class="text-lg font-semibold text-ink-900">
              {{ userStore.userInfo.loginname }}
            </text>
            <view class="mt-1 flex items-center gap-3">
              <text class="text-xs text-ink-600">
                积分 {{ userStore.userInfo.score ?? '-' }}
              </text>
              <text class="text-xs text-ink-600">
                注册于 {{ userStore.userInfo.create_at?.slice(0, 10) ?? '-' }}
              </text>
            </view>
          </view>
        </view>
      </template>

      <template v-else>
        <view class="flex items-center gap-4" @tap="goLogin">
          <view class="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <text class="text-2xl text-ink-400">
              ?
            </text>
          </view>
          <view class="flex-1">
            <text class="text-base font-medium text-ink-700">
              点击登录
            </text>
            <text class="mt-1 block text-xs text-ink-400">
              登录后可收藏、回复、发布主题
            </text>
          </view>
        </view>
      </template>
    </view>

    <!-- 功能菜单 -->
    <view class="mx-3 mt-3 overflow-hidden rounded-2xl bg-card">
      <view
        v-for="(menu, idx) in menus"
        :key="menu.key"
        class="flex items-center px-4 py-4 active:bg-muted"
        :class="{ 'border-b border-line': idx < menus.length - 1 }"
        @tap="openMenu(menu)"
      >
        <text class="text-base">
          {{ menu.label }}
        </text>
        <view class="flex-1" />
        <text class="text-ink-400">
          ›
        </text>
      </view>

      <!-- 我的消息 -->
      <view class="flex items-center border-t border-line px-4 py-4 active:bg-muted" @tap="goMessages">
        <text class="text-base">
          我的消息
        </text>
        <view class="flex-1" />
        <view v-if="messageStore.unreadCount > 0" class="rounded-full bg-danger px-2 py-0.5">
          <text class="text-2xs text-white">
            {{ messageStore.unreadCount }}
          </text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="userStore.isLogged" class="mx-3 mt-3 overflow-hidden rounded-2xl bg-card">
      <view class="px-4 py-4 text-center active:bg-muted" @tap="confirmLogout">
        <text class="text-base text-danger">
          退出登录
        </text>
      </view>
    </view>
  </view>
</template>
