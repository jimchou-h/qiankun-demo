# qiankun 样式隔离不靠沙箱：4 条构建期规则管住 5 个应用的 CSS

> 示例仓库：`qiankun-demo`（父应用 Vue3 + antd4，子应用 Vue3/Vue2 各两个，UI 库分别是 antd4、antd1、element-plus、element-ui）
>
> 本篇只讲样式隔离这一层：为什么不启用 qiankun 自带的 CSS 隔离、用构建期前缀怎么把 5 个应用的样式缝在一起、以及这套做法在真实项目里会撞上的 7 个坑。读者预设：写过 Vue、知道 PostCSS 是什么，不需要微前端入门。

## 一、问题不在"会不会冲突"，而在"冲突发生在哪一层"

qiankun 提供两种 CSS 隔离：

- `experimentalStyleIsolation`：给子应用样式选择器加 `div[data-qiankun="xxx"]` 前缀
- `strictStyleIsolation`：把子应用塞进 Shadow DOM

两个方案在 demo 里都能跑，但和这个项目的三条硬约束对不上：

1. 子应用必须支持独立访问（单独打开 `localhost:5802` 就能跑）。qiankun 的前缀是运行时注入的，独立运行时不存在，样式产物会分成两套。
2. 弹层必须挂在子应用根容器内。`experimentalStyleIsolation` 的前缀锚点是 qiankun 生成的容器 `div`，一旦某次 `getContainer` 漏配、弹层挂到 `body`，前缀直接匹配不到，样式整片失效——错误会以"弹窗样式没了"的形式暴露，而不是"挂载点错了"。
3. 四个子应用的 UI 库不同（antd4 / antd1 / element-plus / element-ui），它们各自有全局副作用：`body` 字体、`@keyframes` 名、CSS 变量名。这些不是"选择器冲突"，前缀方案也管不到，需要单独的规则。

结论：隔离动作全部前移到构建期，运行时只留一个锚点。

## 二、方案：一个锚点 + 四条规则

锚点是每个子应用根容器的属性：

```html
<!-- packages/sub-vue3-antd4/src/App.vue -->
<div class="sub-app-root" data-app="sub-vue3-antd4" style="position: relative; z-index: 2000">
```

四条规则：

| 规则 | 解决什么 | 落点 |
|---|---|---|
| 所有选择器加 `[data-app="xxx"]` 前缀 | 类名/元素选择器跨应用互撞 | PostCSS `postcss-prefix-selector` |
| `@keyframes` 名加子应用前缀并同步 `animation` 引用 | 动画名跨应用覆盖 | 自写 PostCSS 插件 |
| 跳过 `body` / `html` / `:root` / `*` | 全局规则加前缀后直接失效 | 前缀插件的 `transform` |
| 变量改名（仅 element-plus） | `--el-*` 变量撞车 | Sass `$namespace: 'ep'` 编译期改写 |

再叠一条非样式但同源的约定：z-index 基数按应用分档（父 1000 / sub1 2000 / sub2 3000 / sub3 4000 / sub4 5000），保证弹层堆叠不互相穿透。

## 三、一条规则走一遍：从 `(0,1,0)` 到 `(0,2,0)`

拿 sub1 的一条业务样式做样本（sub1 通过 `<a-config-provider prefix-cls="a4">` 把 `ant-*` 改成了 `a4-*`，这里直接写改写后的类名）：

```css
/* 源码 */
.a4-btn { padding: 4px 15px; }
```

特异性是 `(0,1,0)`。构建后被改写成：

```css
/* 产物 */
[data-app="sub-vue3-antd4"] .a4-btn { padding: 4px 15px; }
```

属性选择器算一个类，特异性变成 `(0,2,0)`。这一步的配置在 `packages/sub-vue3-antd4/postcss.config.js:10:25`：

```js
export default {
  plugins: [
    prefixSelector({
      prefix: APP_SELECTOR,
      transform(prefix, selector, prefixedSelector) {
        const trimmed = selector.trim()
        if (GLOBAL_SELECTORS.includes(trimmed)) return selector  // body/html/:root/*
        if (trimmed.includes(APP_SELECTOR)) return selector      // 幂等：已带前缀不再加
        return prefixedSelector
      }
    }),
    prefixKeyframes({ prefix: 'sub-vue3-antd4-' })
  ]
}
```

`transform` 里那两个 `return selector` 都不是可选项，后面两节会说明它们各自避免了一个坑。

特异性从 1 个类涨到 2 个类，是这个方案唯一的"代价"，也是后面 reset.css 反噬的成因。

## 四、坑一：reset.css 加前缀后，反过来压住了 antd4

现象：子应用里所有 antd4 按钮、输入框的文字变成黑色，`primary` 按钮白字失效。

原因不在 antd4，在我们自己引入的 reset：

```css
/* public/reset.css 里的规则 */
button { color: inherit; }
```

元素选择器特异性 `(0,0,1)`。走 src import 会被前缀改写成：

```css
[data-app="sub-vue3-antd4"] button { color: inherit; }   /* (0,1,1) */
```

而 antd4 的 cssinjs 运行时规则是 `:where(.css-hash).a4-btn-primary` 这一级，`:where()` 特异性为 0，实际只有 `(0,1,0)`。

`(0,1,1) > (0,1,0)`，reset 赢了。于是白字变回 `inherit`，继承到 body 的黑色。

修法不是加 `!important`，而是让 reset 根本不参与前缀：

```
packages/sub-vue3-antd4/public/reset.css   ← 构建工具原样拷贝，不经过 PostCSS
packages/sub-vue3-antd4/public/index.html  ← <link rel="stylesheet" href="<%= BASE_URL %>reset.css">
```

代价是 reset 变成全局规则，集成模式下由父应用的那份兜底；换来的是它能稳定待在 `(0,0,1)`，永远压不过 UI 库。

**这条坑可以推广成一句话：前缀方案会让元素选择器升一级，凡是与 UI 库抢同一元素的全局样式，都不要走构建管线。**

## 五、坑二：keyframes 名不带前缀，动画会互相顶掉

`@keyframes fadeIn` 在两个子应用里各定义一次，后加载的那份生效——两个应用都能动，但动的是同一套参数，改一个另一个跟着变，排查时非常像"动画偶尔失效"。

自写插件在 `packages/sub-vue3-antd4/postcss-prefix-keyframes.cjs:18:36`：

```js
OnceExit(root) {
  if (!prefix) return
  const renamed = new Map()
  root.walkAtRules('keyframes', (atRule) => {
    const name = atRule.params.trim()
    if (!name || name.startsWith(prefix)) return   // 幂等
    renamed.set(name, prefix + name)
    atRule.params = prefix + name
  })
  if (renamed.size === 0) return
  root.walkDecls(/^animation(-name)?$/, (decl) => {
    decl.value = decl.value.replace(/[A-Za-z_][\w-]*/g, (token) =>
      renamed.has(token) ? renamed.get(token) : token)
  })
}
```

两个实现细节值得抄：

- 用 `OnceExit` 而不是 `Once`：先把全文件的 `@keyframes` 收齐改名，再回头改 `animation` 引用。否则声明写在 `@keyframes` 之前的规则会漏改。
- `startsWith(prefix)` 判重：这套插件在 dev 的 HMR 下会对同一份 AST 反复跑，不幂等就会变成 `sub-vue3-antd4-sub-vue3-antd4-fadeIn`。

## 六、坑三：pnpm workspace 里 PostCSS 配置根本不会被找到

sub1 用 Vite，配置文件在包根目录下能自动加载，一切正常。sub2/sub4 用 Vue CLI，同样的 `postcss.config.js` 放在包根目录，产物里 UI 库样式**一条前缀都没有**。

原因在路径解析：pnpm 把 UI 库的真实文件放在 `node_modules/.pnpm/ant-design-vue@1.7.8_.../node_modules/ant-design-vue/`，`postcss-loader` 从这个真实路径向上找配置，找到的是 `.pnpm` 这一层，永远走不到子应用包目录。

修法是显式传插件，别依赖自动查找（`packages/sub-vue2-antd1/vue.config.js:3:33`）：

```js
module.exports = {
  css: {
    loaderOptions: {
      postcss: {
        postcssOptions: {
          plugins: [
            prefixSelector({ prefix: APP_SELECTOR, transform }),
            prefixKeyframes({ prefix: 'sub-vue2-antd1-' })
          ]
        }
      }
    }
  }
}
```

**判断标准很简单：产物 CSS 里如果只有自己写的类带前缀、UI 库的类不带，就是配置没生效，不用怀疑 `transform` 逻辑。**

## 七、坑四：弹层不在组件树里，`scoped` 和"就近覆盖"全部失效

这是整套方案里最花时间的一块。弹窗、下拉、Message 都是运行时创建节点，挂载点由三个不同机制决定：

| 子应用 | 机制 | 本项目取值 |
|---|---|---|
| sub1 antd4 | `ConfigProvider` 的 `getPopupContainer` | 根容器 |
| sub2 antd1 | 各组件 `getContainer` / `getPopupContainer` | 根容器 |
| sub3 element-plus | `append-to-body=false` / `teleported=false` | 根容器 |
| sub4 element-ui | `append-to-body=false` / `popper-append-to-body=false` | 根容器 |

配套的两个坑：

**1）Vue2 的 props 默认值在组件创建时就求值。** 把 `getContainer` 的默认值改成 `() => document.querySelector('[data-app="sub-vue2-antd1"]')` 看起来对，但组件创建发生在根容器插入文档之前，`querySelector` 返回 `null`，回退 `document.body`。所以调用点必须显式传函数（`packages/sub-vue2-antd1/src/components/antd.js:16:29`）：

```js
const getContainer = () => document.querySelector('[data-app="sub-vue2-antd1"]') || document.body
Modal.props.getContainer.default = getContainer
Drawer.props.getContainer.default = getContainer
```

并且模板里逐个显式绑定 `:get-container="getContainer"`，让求值推迟到弹层打开时。

**2）弹层进了根容器，仍可能被祖先裁剪。** sub4 的 `el-select` 用 `popper-append-to-body=false` 把面板放进 `.el-card` 内，而 `.el-card` 默认 `overflow: hidden`，面板定位完全正确、就是只露出顶部 9px 白边。修法是把卡片放开（`packages/sub-vue2-element-ui/src/views/About.vue:40:45`）：

```css
.about-card { overflow: visible; }   /* (0,2,0) > .el-card 的 (0,1,0) */
```

**所以"改弹窗样式不生效"先看 DOM 在哪，再看有没有被裁剪，最后才怀疑选择器。**

## 八、坑五：CSS 变量没有前缀，sub3 会把父应用的 `--el-*` 改掉

antd 系不用 CSS 变量，element 系用。`element-plus` 的组件默认读 `--el-color-primary` 这类变量，同名变量在同一个 `document` 上互相覆盖。

本项目只给 sub3 做了变量改名：Sass 编译期改 namespace（`packages/sub-vue3-element-plus/src/styles/element.scss:1:10`）：

```scss
@use 'element-plus/theme-chalk/src/mixins/config.scss' with (
  $namespace: 'ep'
);
@use 'element-plus/theme-chalk/src/index.scss';
```

配合 `<el-config-provider :namespace="'ep'">`，产物类名变 `.ep-*`、变量变 `--ep-*`。注意 `@use ... with` 必须排在其他 `@use` 之前，否则 Sass 会报"模块已被加载过"。

暗色主题也走变量，覆盖在根容器上（`packages/sub-vue3-element-plus/src/App.vue:46:57`）：

```css
[data-app="sub-vue3-element-plus"][data-theme="dark"] {
  --ep-bg-color: #141414;
  --ep-text-color-primary: #e5eaf3;
  /* ... */
}
```

而主题本身是分档的：父应用 + sub1 + sub3 跟随暗色，sub2/sub4 因为是 antd1/element-ui 那代 UI 库、没有暗色 token，固定 light。分档不是偷懒，是 UI 库能力边界。

## 九、坑六：前缀把根容器的规则改成了后代选择器

根容器的样式最容易写错：

```css
.sub-app-root { padding: 16px; min-height: 100vh; }
```

前缀后变成 `[data-app="sub-vue3-antd4"] .sub-app-root`——**后代**选择器，而 `data-app` 就在根元素自己身上。规则永远匹配不到任何元素，`padding` 静默失效，排查时只看到"内容贴边"。

正确写法是属性 + 类复合选择器，同时依赖 `transform` 里那条 `if (trimmed.includes(APP_SELECTOR)) return selector` 保持原样：

```css
[data-app="sub-vue3-antd4"].sub-app-root {
  padding: 12px;
  min-height: var(--qk-subapp-min-height, 100vh);
  background: var(--qk-subapp-bg, #fff);
}
```

高度和底色用变量从父应用传下来（父应用在非 scoped 的 `<style>` 里定义）：

```css
:root { --qk-subapp-min-height: calc(100vh - 96px); }   /* 视口 - header 64 - content 上下 padding 32 */
```

顺带一个同源坑：`:root` 不能写进 `<style scoped>`，会被编译成 `:root[data-v-xxx]`，变量永远不生效。

## 十、坑七：父应用的菜单高亮，和子应用路由不是一回事

子应用自己切到 `/about` 后，父菜单 5 项全部熄灭。

父应用拿 `route.path` 与菜单 key（`/sub-vue3-antd4/home`）全等比较，子应用内部跳转后路径变成 `/sub-vue3-antd4/about`，没有任何 key 命中。样式问题里混进了路由问题，修法是按 base 前缀归一：

```js
// src/layouts/MainLayout.vue
const MENU_KEYS = [/* 每个子应用的 base 前缀 → 一级菜单 key */]
```

同理，子应用内部的导航高亮、父菜单高亮是两套状态，不要指望一套 key 同时满足。

## 十一、排查手册

遇到"样式没生效"，按这个顺序走，比读代码快：

| 现象 | 先查 |
|---|---|
| 整个 UI 库都像没加前缀 | 构建配置有没有被加载（pnpm 真实路径） |
| 文字颜色/字号不对 | 有没有全局 reset 走构建管线，特异性是否反超 |
| 弹窗样式全丢 | 弹层 DOM 在不在 `[data-app]` 内 |
| 弹窗只露一条边 | 祖先 `overflow: hidden` |
| 根容器的 padding 不生效 | 规则是不是被改写成了后代选择器 |
| 动画改了没反应 | `@keyframes` 名有没有前缀、`animation` 引用有没有同步 |
| 子应用内跳转后父菜单灭了 | 父应用匹配逻辑是不是全等比较 |

判断依据尽量用运行时事实，而不是读代码推理：`getComputedStyle` 看最终值，`document.styleSheets` 看实际规则，`getBoundingClientRect` 看盒模型。

## 十二、带走几条

1. 隔离放在构建期，运行时只留 `data-app` 一个锚点。分层越少，出错时的定位成本越低。
2. 前缀让元素选择器从 `(0,0,1)` 升到 `(0,1,1)`，这一级之差就是 reset 压死 cssinjs 的原因。全局 reset 不要走构建管线。
3. 自动查找在 monorepo 里不可靠。PostCSS / Babel 这类依赖"向上找配置"的 loader，显式传插件。
4. 弹层是独立 DOM 子树。挂载点、裁剪、作用域，三个问题要分开查；`scoped` 对它完全无效。
5. 主题能力受 UI 库版本限制，方案里写清"哪些应用不跟随"比事后解释更有用。

关键源码：

- `packages/sub-vue3-antd4/postcss.config.js`
- `packages/sub-vue3-antd4/postcss-prefix-keyframes.cjs`
- `packages/sub-vue2-antd1/vue.config.js`
- `packages/sub-vue2-antd1/src/components/antd.js`
- `packages/sub-vue3-element-plus/src/styles/element.scss`
- `packages/sub-vue3-element-plus/src/App.vue`

*本文只覆盖 CSS 隔离这一层：JS 沙箱、双构建、通信、错误处理留到单独一篇。*
