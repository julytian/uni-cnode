import uniHelper from '@uni-helper/eslint-config'

export default uniHelper({
  ignores: [
    // OpenSpec 规划产物（markdown/yaml 混合结构，非应用源码）
    'openspec/**',
    // pnpm 工作区配置（trustPolicyExclude 的带 @ 包名与 yaml 规则冲突）
    'pnpm-workspace.yaml',
  ],
})
