import { createI18n, type I18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// i18n 骨架：仅 demo 一组 key，完整文案库与父应用 lang 广播由后续 change 补
export function createAppI18n(locale = 'zh-CN'): I18n {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-CN',
    messages: {
      'zh-CN': zhCN,
      'en-US': enUS
    }
  })
}
