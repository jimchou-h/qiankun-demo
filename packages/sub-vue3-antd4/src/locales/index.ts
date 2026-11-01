import { createI18n, type I18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

export type AppI18n = I18n

// i18n：子应用各自维护 locale 文件；locale 初值来自 qiankun props 或 localStorage，
// 后续由父应用 lang 广播（onGlobalStateChange）驱动切换
export function createAppI18n(locale = 'zh-CN'): AppI18n {
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
