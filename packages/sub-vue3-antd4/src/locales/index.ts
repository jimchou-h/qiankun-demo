import { createI18n, type I18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// i18n 骨架：仅 1 个 demo key，完整文案库与父应用 lang 广播由后续 change 补
export function createAppI18n(): I18n {
  return createI18n({
    legacy: false,
    locale: 'zh-CN',
    fallbackLocale: 'zh-CN',
    messages: {
      'zh-CN': zhCN,
      'en-US': enUS
    }
  })
}
