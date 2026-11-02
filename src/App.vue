<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { setTokenProvider, setUnauthorizedHandler } from '@/http'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'

// http 层依赖注册：token 提供者与鉴权失效降级（store 就绪后立即注册，模块级执行一次）
const userStore = useUserStore()
const messageStore = useMessageStore()

setTokenProvider(() => userStore.token)
setUnauthorizedHandler(() => {
  // token 失效：清登录态并引导重新登录（错误提示已由 http 层 toast，这里不重复）
  userStore.logout()
  uni.reLaunch({ url: '/pages/login/index' })
})

onLaunch(() => {
  const presetToken = import.meta.env.VITE_ACCESS_TOKEN as string | undefined

  if (!userStore.isLogged && presetToken) {
    // 调试预置 token 自动登录（specs/auth：开发环境自动登录）
    userStore.login(presetToken)
      .then(() => userStore.fetchUserDetail())
      .then(() => messageStore.refreshCount())
      .catch(() => {
        // 预置 token 失效不影响未登录浏览，登录页可手动登录
        console.warn('预置 accessToken 验证失败，以未登录状态运行')
      })
    return
  }

  if (userStore.isLogged) {
    userStore.fetchUserDetail().finally(() => messageStore.refreshCount())
  }
})
</script>

<style>
/* 全局样式在 app.css（tailwindcss 入口）维护 */
</style>
