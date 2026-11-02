import { describe, expect, it } from 'vitest'

// 单测基建 sanity：jsdom 环境与全局 uni mock 可用性
describe('test setup', () => {
  it('uni 全局 mock 可用', () => {
    uni.showToast({ title: 'hi' })
    expect(uni.showToast).toHaveBeenCalledWith({ title: 'hi' })
  })

  it('jsdom 环境可用', () => {
    expect(typeof document).toBe('object')
  })
})
