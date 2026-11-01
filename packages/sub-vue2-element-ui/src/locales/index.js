import VueI18n from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

/**
 * 创建子应用 i18n 实例
 * @param lang 初始语言：qiankun 集成模式由父应用 props 注入；独立运行默认 zh-CN
 */
export function createAppI18n(lang = 'zh-CN') {
  return new VueI18n({
    locale: lang,
    fallbackLocale: 'zh-CN',
    messages
  })
}
