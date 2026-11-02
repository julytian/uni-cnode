// mp-html 组件类型声明（库的 package.json exports 未暴露 .vue 类型文件）
declare module 'mp-html/dist/uni-app/components/mp-html/mp-html.vue' {
  import type { DefineComponent } from 'vue'

  const MpHtml: DefineComponent<{ content?: string, readonly?: boolean }, any, any>
  export default MpHtml
}
