import { describe, expect, it } from 'vitest'
import { tabLabel, timeAgo } from './time'

const NOW = new Date('2026-11-01T12:00:00+08:00').getTime()

describe('timeAgo', () => {
  it('1 分钟内显示"刚刚"', () => {
    expect(timeAgo(new Date(NOW - 30 * 1000).toISOString(), NOW)).toBe('刚刚')
  })

  it('1 小时内显示"x 分钟前"', () => {
    expect(timeAgo(new Date(NOW - 5 * 60 * 1000).toISOString(), NOW)).toBe('5 分钟前')
  })

  it('1 天内显示"x 小时前"', () => {
    expect(timeAgo(new Date(NOW - 3 * 60 * 60 * 1000).toISOString(), NOW)).toBe('3 小时前')
  })

  it('30 天内显示"x 天前"', () => {
    expect(timeAgo(new Date(NOW - 6 * 24 * 60 * 60 * 1000).toISOString(), NOW)).toBe('6 天前')
  })

  it('超过 30 天显示日期', () => {
    expect(timeAgo('2026-08-15T08:00:00.000Z', NOW)).toBe('2026-08-15')
  })

  it('非法日期返回空串', () => {
    expect(timeAgo('not-a-date', NOW)).toBe('')
  })
})

describe('tabLabel', () => {
  it('已知 tab 返回中文', () => {
    expect(tabLabel('good')).toBe('精华')
    expect(tabLabel('dev')).toBe('客户端测试')
  })

  it('未知 tab 原样返回', () => {
    expect(tabLabel('xxx')).toBe('xxx')
  })
})
