// HBuilderX 内置编译器（vite/postcss 版本较旧）编译 app 平台时，
// 需要 weapp-tailwindcss 官方的 postcss 兼容包来展开 tailwindcss v4 入口
module.exports = {
  plugins: {
    '@weapp-tailwindcss/postcss': {},
  },
}
