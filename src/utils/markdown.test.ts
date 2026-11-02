import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown：基础与 GFM（对齐 CNode Next 管线）', () => {
  it('renders heading and paragraph synchronously', () => {
    const html = renderMarkdown('# 标题\n\n正文段落')
    expect(html).toContain('<h1>标题</h1>')
    expect(html).toContain('<p>正文段落</p>')
  })

  it('renders gfm tables', () => {
    const html = renderMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>')
  })

  it('renders gfm task list checkboxes', () => {
    const html = renderMarkdown('- [x] 完成\n- [ ] 待办')
    expect(html).toContain('checkbox')
    expect(html).toContain('checked')
  })
})

describe('renderMarkdown：语法高亮（rehype-highlight）', () => {
  it('emits hljs highlight spans for language-js code blocks', () => {
    const html = renderMarkdown('```js\nconst app = new Hoa()\n```')
    expect(html).toContain('hljs language-js')
    expect(html).toContain('<span')
  })

  it('language-bash 代码块高亮', () => {
    const html = renderMarkdown('```bash\nnpm i hoa --save\n```')
    expect(html).toContain('hljs language-bash')
  })

  it('未知语言不报错（ignoreMissing），保留 language- class', () => {
    const html = renderMarkdown('```some-lang\nhello\n```')
    expect(html).toContain('language-some-lang')
  })
})

describe('renderMarkdown：sanitize 安全与内联 HTML', () => {
  it('过滤 <script> 标签', () => {
    const html = renderMarkdown('前文\n\n<script>alert(1)</script>\n\n后文')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('保留内联 <br> 与 <b>（CNode 内容含内联 HTML）', () => {
    const html = renderMarkdown('第一行<br>第二行\n\n<b>加粗</b>')
    expect(html).toContain('<br>')
    expect(html).toContain('<b>加粗</b>')
  })

  it('onclick 等事件属性被过滤', () => {
    const html = renderMarkdown('<b onclick="alert(1)">加粗</b>')
    expect(html).not.toContain('onclick')
  })
})

describe('renderMarkdown：站内相对路径后处理', () => {
  it('表情等站内图片 src 补全 cnodejs.org 域名', () => {
    const html = renderMarkdown('![微笑](/public/emoji/weixiao.gif)')
    expect(html).toContain('src="https://cnodejs.org/public/emoji/weixiao.gif"')
  })

  it('协议相对路径与外链图片不被改写', () => {
    const html = renderMarkdown('![a](//cdn.example.com/x.png)\n\n![b](https://example.com/y.png)')
    expect(html).toContain('src="//cdn.example.com/x.png"')
    expect(html).toContain('src="https://example.com/y.png"')
  })

  it('@提及渲染为站内用户链接（保留相对 href，交由 linktap 拦截）', () => {
    const html = renderMarkdown('[@cllgeek](/user/cllgeek) 相当')
    expect(html).toContain('<a href="/user/cllgeek">@cllgeek</a>')
  })
})
