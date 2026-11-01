import { computed, ref } from 'vue'
import { theme as antdTheme } from 'ant-design-vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import enUS from 'ant-design-vue/es/locale/en_US'

/**
 * sub1 主题/语言响应式状态：
 * - themeConfig：antd4 ConfigProvider 的 :theme（dark 时启用 darkAlgorithm）
 * - antdLocale：antd4 UI 文案（Modal 确定/取消等）
 * 数据源：qiankun 广播（mount props 初值 + onGlobalStateChange 增量）；独立运行时读 localStorage。
 */
export type ThemeName = 'light' | 'dark'

export const theme = ref<ThemeName>('light')
export const lang = ref('zh-CN')

export const themeConfig = computed(() =>
  theme.value === 'dark' ? { algorithm: antdTheme.darkAlgorithm } : {}
)

export const antdLocale = computed(() => (lang.value === 'en-US' ? enUS : zhCN))

export function applyTheme(next: ThemeName): void {
  theme.value = next
}

export function applyLang(next: string): void {
  lang.value = next
}
