import zhLocale from 'element-ui/lib/locale/lang/zh-CN'
import enLocale from 'element-ui/lib/locale/lang/en'
import locale from 'element-ui/lib/locale'

let current = 'zh-CN'
locale.use(current)

export function switchElementUILocale(lang) {
  if (lang === current) return
  current = lang
  locale.use(lang === 'en-US' ? 'en' : 'zh-CN')
}
