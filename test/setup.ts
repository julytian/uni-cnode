import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, vi } from 'vitest'

// 每个测试前重置 Pinia 实例，避免状态在测试间泄漏（不注册持久化插件，只验证 store 逻辑）
beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// 全局 mock uni 对象（jsdom 中无此全局，uni-app 特有）
const uniMock = {
  showToast: vi.fn(),
  hideToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  showModal: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  navigateBack: vi.fn(),
  switchTab: vi.fn(),
  reLaunch: vi.fn(),
  setTabBarBadge: vi.fn(),
  removeTabBarBadge: vi.fn(),
  getStorageSync: vi.fn().mockReturnValue(''),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  request: vi.fn(),
  uploadFile: vi.fn(),
  getSystemInfoSync: vi.fn().mockReturnValue({ platform: 'devtools' }),
  getLocale: vi.fn().mockReturnValue('zh-Hans'),
  setLocale: vi.fn(),
}

Object.defineProperty(globalThis, 'uni', {
  value: uniMock,
  writable: true,
  configurable: true,
})

// getCurrentPages 是 uni-app 的全局函数（不在 uni 对象上）
Object.defineProperty(globalThis, 'getCurrentPages', {
  value: vi.fn().mockReturnValue([
    { route: 'pages/index/index' },
  ]),
  writable: true,
  configurable: true,
})
