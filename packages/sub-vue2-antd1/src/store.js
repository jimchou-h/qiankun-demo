import Vue from 'vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'

export const uiState = Vue.observable({ lang: 'zh-CN' })

export const antdLocale = {
  get value() {
    return uiState.lang === 'en-US' ? enUS : zhCN
  }
}

export function setUiLocale(lang) {
  uiState.lang = lang
}
