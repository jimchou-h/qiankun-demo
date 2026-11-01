/**
 * 父应用全局只加载一份 Vue2（window.Vue2）供 sub2/sub4 的 qiankun 集成包 external 使用，
 * 两者因此在同一个 `Vue.prototype` 上安装插件。而 vue-router@3 的模块末尾会无条件执行
 * `window.Vue && window.Vue.use(VueRouter)` 自动安装；`Vue.use` 只按插件对象身份去重，
 * 两个子应用各打包了一份 vue-router，插件不是同一对象 → 第二个 Vue2 子应用加载时会重复
 * `Object.defineProperty(Vue.prototype, '$router')`，抛 "Cannot redefine property: $router"，
 * 应用在 LOADING_SOURCE_CODE 阶段直接死亡。
 *
 * 不能简单地"已安装过就跳过"：vue-router 的 install 里是先 `_Vue = Vue`（模块级变量）再
 * defineProperty；跳过安装会让第二个子应用那份 vue-router 的 `_Vue` 一直是 undefined，
 * 之后 `resolveAsyncComponents` 里的 `_Vue.extend(...)` 会抛
 * "Cannot read properties of undefined (reading 'extend')"。
 * 所以这里保持 install 正常执行，只把"重复定义 $router/$route"的错误吞掉：
 * 这样 `_Vue` 被赋值、mixin 正常注册（重复 mixin 对同一 router 实例的 init 是幂等的），
 * 而 $router/$route 继续沿用先安装方的 getter（同一 Vue.prototype，语义一致）。
 *
 * 补丁只能打在父应用侧：webpack 会把子应用入口的所有 require 前置执行，子应用源码里再怎么
 * 提前 import 都晚于 vue-router 的自动安装（已实测无效），故在 qiankun beforeLoad 阶段打补丁。
 */
export function patchVue2UseGuard(): void {
  const Vue2 = (window as unknown as Record<string, any>).Vue2
  if (!Vue2 || typeof Vue2.use !== 'function' || Vue2.__vue2SharedUseGuard) return

  Vue2.__vue2SharedUseGuard = true
  const rawUse = Vue2.use
  Vue2.use = function patchedUse(plugin: any) {
    try {
      return rawUse.apply(this, arguments)
    } catch (err) {
      const message = String((err as Error)?.message ?? '')
      if (/Cannot redefine property: \$(router|route)$/.test(message)) return this
      throw err
    }
  }
}
