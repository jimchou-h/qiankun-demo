import { createI18n } from 'vue-i18n'

/**
 * 父应用 i18n：仅承载父应用自身界面文案。
 * 子应用各自维护 locale 文件（不共享），父应用通过 qiankun 广播 lang 驱动其切换。
 */
const messages = {
  'zh-CN': {
    menu: {
      home: '父应用首页',
      sub1: 'sub1 antd4',
      sub2: 'sub2 antd1',
      sub3: 'sub3 element-plus',
      sub4: 'sub4 element-ui'
    },
    badge: '子应用消息',
    home: {
      title: '父应用首页',
      desc: '这是 qiankun 父应用（Vue3 + Ant Design Vue 4），顶部导航可加载 4 个子应用（Vue2/Vue3 × antd1/antd4/element-plus/element-ui）。'
    }
  },
  'en-US': {
    menu: {
      home: 'Parent Home',
      sub1: 'sub1 antd4',
      sub2: 'sub2 antd1',
      sub3: 'sub3 element-plus',
      sub4: 'sub4 element-ui'
    },
    badge: 'Sub messages',
    home: {
      title: 'Parent Home',
      desc: 'This is the qiankun parent app (Vue3 + Ant Design Vue 4). Use the top nav to load 4 micro apps (Vue2/Vue3 × antd1/antd4/element-plus/element-ui).'
    }
  }
}

export function createParentI18n() {
  const locale = localStorage.getItem('lang') ?? 'zh-CN'
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'zh-CN',
    messages
  })
}
