import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'

/** CNode 站内资源域名（表情/上传图片为相对路径） */
const CNODE_ORIGIN = 'https://cnodejs.org'

/**
 * sanitize 白名单：GitHub 默认 schema 基础上放宽 className
 * （保留 rehype-highlight 产出的 hljs-* 与 language-* 类）与任务列表 input 状态
 */
const cnodeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] ?? []),
      ['className', /^hljs[-\w]*$/, /^language-[\w-]+$/],
    ],
    'input': [
      ...(defaultSchema.attributes?.input ?? []),
      'checked',
      'disabled',
      'type',
    ],
  },
}

/** CNode 常用语言子集（按需注册控制包体） */
const languages = {
  javascript,
  typescript,
  bash,
  json,
  xml,
  css,
  yaml,
  markdown,
  diff,
}

/**
 * 客户端 Markdown 渲染管线：与 CNode Next（apps/web）同款库与处理顺序
 * remark-parse → remark-gfm → remark-rehype(allowDangerousHtml)
 * → rehype-raw → rehype-sanitize → rehype-highlight → rehype-stringify
 *
 * 输入为 CNode API `mdrender=false` 返回的原始 Markdown，输出 HTML 字符串
 * （交由 mp-html 渲染；`.hljs-*` 配色由页面 CSS 提供，站内图片已补全域名，
 * 站内 `/user/xxx` 链接保留相对 href 由 mp-html linktap 拦截转站内路由）。
 */
export function renderMarkdown(markdown: string): string {
  const html = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, cnodeSchema as typeof defaultSchema)
    .use(rehypeHighlight, { detect: false, ignoreMissing: true, languages })
    .use(rehypeStringify)
    .processSync(markdown)
    .toString()

  return completeRelativeImageUrls(html)
}

/** 站内图片（表情/上传图）相对路径补全域名；协议相对与绝对地址不改写 */
function completeRelativeImageUrls(html: string): string {
  return html.replace(/(src=")\/(?!\/)/g, `$1${CNODE_ORIGIN}/`)
}
