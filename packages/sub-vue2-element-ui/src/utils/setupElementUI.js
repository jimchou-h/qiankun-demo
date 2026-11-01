import { Message, Notification, MessageBox } from 'element-ui'

const APP_SELECTOR = '[data-app="sub-vue2-element-ui"]'

function mountInRoot(vm) {
  const el = vm && vm.$el
  const root = document.querySelector(APP_SELECTOR)
  if (el && root && el.parentNode === document.body) {
    root.appendChild(el)
  }
  return vm
}

function wrap(api) {
  const fn = (options) => mountInRoot(api(options))
  // 复制 api 上挂的快捷方法（success/warning/info/error/confirm/alert/prompt 等）
  Object.keys(api).forEach((key) => {
    if (typeof api[key] === 'function') fn[key] = (options) => mountInRoot(api[key](options))
  })
  return fn
}

export function setupElementUI(Vue) {
  const wrappedMessage = wrap(Message)
  const wrappedNotify = wrap(Notification)
  Vue.prototype.$message = wrappedMessage
  Vue.prototype.$notify = wrappedNotify
  // MessageBox 是 promise 型 + 内部独立渲染，改用 confirm/alert/prompt 快捷方法包装
  Vue.prototype.$msgbox = MessageBox
  Vue.prototype.$alert = (message, title, options) => MessageBox.alert(message, title, options)
  Vue.prototype.$confirm = (message, title, options) => MessageBox.confirm(message, title, options)
  Vue.prototype.$prompt = (message, title, options) => MessageBox.prompt(message, title, options)
}
