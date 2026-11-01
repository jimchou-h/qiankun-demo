import VueI18n from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

export function createAppI18n(lang = 'zh-CN') {
  return new VueI18n({
    locale: lang,
    fallbackLocale: 'zh-CN',
    messages: { 'zh-CN': zhCN, 'en-US': enUS }
  })
}
