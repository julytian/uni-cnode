import { fileURLToPath, URL } from 'node:url'

import Uni from '@uni-helper/plugin-uni'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotV2Resolver, ZPagingResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import { defineConfig } from 'vite'
import { WeappTailwindcss } from 'weapp-tailwindcss/vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // pnpm 严格 node_modules 下，unified/remark 管线的传递依赖只存在于
      // node_modules/.pnpm/node_modules（pnpm 内部 hoist 目录），
      // 显式提供给 esbuild 预构建解析（顶层 node_modules 无链接）
      nodePaths: [
        fileURLToPath(new URL('./node_modules/.pnpm/node_modules', import.meta.url)),
      ],
    },
  },
  plugins: [
    // https://uni-helper.js.org/vite-plugin-uni-components
    Components({
      dts: true,
      resolvers: [
        ZPagingResolver(),
        WotV2Resolver(),
      ],
    }),
    // https://uni-helper.js.org/plugin-uni
    Uni(),
    // https://tw.weapp.dev/
    WeappTailwindcss({
      // Tailwind CSS 4 的入口文件，需要被项目实际引入
      cssEntries: [
        fileURLToPath(new URL('./src/app.css', import.meta.url)),
      ],
      cssOptions: {
        // 将 rem 转换为 rpx，保证小程序端的尺寸表现
        rem2rpx: true,
      },
    }),
  ],
  server: {
    // H5 开发代理：CNode API 的 CORS 仅允许 cnodejs.org 来源，
    // 开发期经本地代理转发规避跨域（App 端原生请求无 CORS，直连）
    proxy: {
      '/cnode-api': {
        target: 'https://api.cnodejs.org',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/cnode-api/, '/api/v1'),
      },
    },
  },
})
