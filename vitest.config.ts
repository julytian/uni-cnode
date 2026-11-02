import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // 单元测试环境：jsdom + 全局 uni mock（见 test/setup.ts）
    // 模板自带的 uniapp 环境为 miniprogram-automator 端到端测试预留，需要微信开发者工具，暂不启用
    environment: 'jsdom',
    globals: true,
    setupFiles: ['test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
})
