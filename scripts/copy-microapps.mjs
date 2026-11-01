/**
 * build:all 后把各子应用 dist-qiankun 拷贝到父应用 dist/microapp/<name>/，
 * 与父应用 prod index.html 中的子应用 entry（/qiankun-demo/microapp/<name>/）对应。
 * 由根 package.json 的 postbuild:all 触发。
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const distRoot = join(root, 'dist')
const apps = ['sub-vue3-antd4', 'sub-vue2-antd1', 'sub-vue3-element-plus', 'sub-vue2-element-ui']

for (const name of apps) {
  const src = join(root, 'packages', name, 'dist-qiankun')
  const dest = join(distRoot, 'microapp', name)
  if (!existsSync(src)) {
    console.warn(`[copy] 缺少子应用产物，跳过: ${src}`)
    continue
  }
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
  console.log(`[copy] ${name} -> dist/microapp/${name}/`)
}
