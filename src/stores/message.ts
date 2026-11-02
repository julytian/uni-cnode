import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnreadCount, markAllRead as markAllReadApi, markOneRead } from '@/api/message'
import { useUserStore } from '@/stores/user'

/** 消息 Tab 在 tabBar.list 中的下标（pages.json：首页0 / 消息1 / 我的2） */
export const MESSAGE_TAB_INDEX = 1

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref(0)

  /** 同步 TabBar 角标：>0 显示数字角标，=0 清除 */
  function syncBadge() {
    if (unreadCount.value > 0) {
      uni.setTabBarBadge({
        index: MESSAGE_TAB_INDEX,
        text: String(unreadCount.value),
      })
    }
    else {
      uni.removeTabBarBadge({ index: MESSAGE_TAB_INDEX })
    }
  }

  /**
   * 刷新未读数（进入 App、进入消息页等时机调用）。
   * 未登录时清零并清角标，不发起请求。
   */
  async function refreshCount() {
    const userStore = useUserStore()
    if (!userStore.isLogged) {
      unreadCount.value = 0
      syncBadge()
      return
    }
    try {
      unreadCount.value = await getUnreadCount()
      syncBadge()
    }
    catch (err) {
      // 未读数刷新失败不打断页面，角标保持旧值
      console.error('刷新未读消息数失败:', err)
    }
  }

  /** 全部标记已读：清零并清角标 */
  async function markAllRead() {
    await markAllReadApi()
    unreadCount.value = 0
    syncBadge()
  }

  /** 单条标记已读：未读数下探（不为负）并同步角标 */
  async function markOne(msgId: string) {
    await markOneRead(msgId)
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    syncBadge()
  }

  return {
    unreadCount,
    refreshCount,
    markAllRead,
    markOne,
    /** 消息页本地列表变化后手动同步角标用 */
    syncBadge,
  }
})
