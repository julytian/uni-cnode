/** 相对时间格式化：x 分钟前 / x 小时前 / x 天前 / 超过 30 天显示日期 */
export function timeAgo(dateStr: string, now = Date.now()): string {
  const time = new Date(dateStr).getTime()
  if (Number.isNaN(time)) {
    return ''
  }
  const diff = now - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day

  if (diff < minute) {
    return '刚刚'
  }
  if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`
  }
  if (diff < month) {
    return `${Math.floor(diff / day)} 天前`
  }
  const d = new Date(time)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 主题分类中文标签 */
export const TAB_LABELS: Record<string, string> = {
  all: '全部',
  good: '精华',
  share: '分享',
  ask: '问答',
  job: '招聘',
  dev: '客户端测试',
}

export function tabLabel(tab: string): string {
  return TAB_LABELS[tab] ?? tab
}
