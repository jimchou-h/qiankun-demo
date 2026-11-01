import { ref } from 'vue'

export type ThemeName = 'light' | 'dark'

export const theme = ref<ThemeName>('light')

export function applyTheme(next: ThemeName): void {
  theme.value = next
  const root = document.querySelector('[data-app="sub-vue3-element-plus"]')
  root?.setAttribute('data-theme', next)
}
