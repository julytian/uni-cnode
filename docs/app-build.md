# App 双端打包说明（Android APK / iOS IPA）

uni-cnode 使用 HBuilderX 打包 App（Android / iOS）。代码无需修改——App 端原生请求直连 `https://api.cnodejs.org`，无 CORS 问题（`.env.development` 的代理开关仅对 H5 生效）。

## 前置准备

1. 安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（App 开发版）
2. 本项目为 CLI 工程（`pnpm create uni` 创建），需先构建生成 App 资源：

```bash
pnpm build:app        # unh build app（生成 dist/build/app 资源）
```

## 方式一：HBuilderX 导入 + 云打包（推荐，免本地环境）

1. HBuilderX → 文件 → 导入 → 从本地目录导入 → 选择本项目根目录
2. 确认 `src/manifest.json`：
   - **基础配置**：App 名称（CNode）、appid（首次云打包时 HBuilderX 会自动生成 `__UNI__XXXX` 并回写，勿手动乱填）
   - **App 图标**：manifest → App图标配置 → 上传 1024×1024 图标自动生成全套
   - **App 模块配置**：本项目未使用原生模块，保持默认即可
3. 发行 → 原生 App-云打包：
   - **Android**：包名（如 `org.cnode.app`）、证书选"使用公共测试证书"（测试）或自有证书（发布）、勾选"打正式包"（发布时）
   - **iOS**：需 Apple 开发者账号；测试用"越狱包/自定义基座"需证书配置；正式打包填写 bundleId、描述文件（.mobileprovision）与证书（.p12）
4. 打包完成后 HBuilderX 控制台给出下载链接

> CLI 工程每次代码更新后重新 `pnpm build:app`，再在 HBuilderX 里发行即可。

## 方式二：本地生成 App 资源 + 离线打包

1. `pnpm build:app` 生成离线打包资源（dist/build/app）
2. 按 DCloud 官方离线打包文档集成：
   - Android：[Android 离线打包](https://nativesupport.dcloud.net.cn/AppDocs/usesdk/android.html)
   - iOS：[iOS 离线打包](https://nativesupport.dcloud.net.cn/AppDocs/usesdk/ios.html)
3. 适合需要自定义原生能力/已有 Android/iOS 工程的团队

## 真机调试（开发期）

- **HBuilderX 真机运行**：导入项目后，运行 → 运行到手机或模拟器 → 选择设备；CLI 工程选择"运行到手机"时使用 `pnpm dev:app` 的产物基座
- 或使用 HBuilderX 的"自定义调试基座"（manifest 有自定义模块时必须）

## 已知环境问题（2026-11 排查记录）

> **iOS 模拟器（iOS 26.5 runtime）+ HBuilderX 5.34 正式版基座** 组合存在页面白屏的兼容性问题——
> 纯净 create-uni 模板（零业务代码）即可复现，与本项目代码无关。
> **真机（iOS 16/17/18）与 H5 端不受影响。**
>
> 规避方式（任选）：
> 1. 真机调试：按本文档路径 A + Appuploader（https://www.appuploader.net/）生成免费开发证书
> 2. HBuilderX 换 **Alpha 版 5.33**（与 npm alpha 编译器 5.3.03 匹配）
> 3. Xcode → Settings → Platforms 下载 **iOS 18 模拟器 runtime**，创建 iOS 18 模拟器使用
>
> 同时已做的环境适配（保留在仓库中）：
> - `pnpm-workspace.yaml`：`shamefullyHoist: true`（pnpm v12 设置迁移）+ `trustPolicyExclude`（pnpm#10202 误报豁免）
> - `vite.config.ts`：`optimizeDeps.esbuildOptions.nodePaths` 指向 pnpm 内部 hoist 目录（unified/remark 管线传递依赖解析）
> - `postcss.config.cjs`：`@weapp-tailwindcss/postcss`（HBuilderX 内置编译器编译 tailwind v4 入口）
> - `src/manifest.json`：appid=`HBuilder`（标准基座 control.xml 约定）

## 注意事项

| 项 | 说明 |
|---|---|
| 网络 | App 端直连 `https://api.cnodejs.org`（HTTPS 公网接口），无需配置域名白名单；Android 9+ 默认禁 HTTP，本项目全 HTTPS 无需额外配置 |
| accessToken | App 安装后首次启动若 `.env.local` 的预置 token 被打进生产包则自动登录；**正式发布建议不打包预置 token**，让用户在登录页粘贴自己的 token（`.env.production` 不提供 `VITE_ACCESS_TOKEN` 即可） |
| iOS 上架 | App Store 审核需开发者账号 + 完整的隐私政策与截图；CNode 内容为 UGC，审核时注意类目选择 |
| 权限 | manifest 默认 Android 权限含网络/存储等基础项，本项目未用定位/相机可按需裁剪 |
| 角标 | 消息角标使用 `uni.setTabBarBadge`（应用内 TabBar 角标），非系统桌面角标 |
