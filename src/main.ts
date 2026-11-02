import * as Pinia from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { createSSRApp } from 'vue'
import App from './App.vue'
import './app.css'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = Pinia.createPinia()
  // 登录态持久化到本地存储（uni storage 全端适配），App 重启自动恢复
  pinia.use(createPersistedState({
    storage: {
      getItem: key => uni.getStorageSync(key),
      setItem: (key, value) => uni.setStorageSync(key, value),
    },
  }))
  app.use(pinia)
  return {
    app,
    Pinia,
  }
}
