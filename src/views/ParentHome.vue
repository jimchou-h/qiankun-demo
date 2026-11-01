<template>
  <a-card :title="t('home.title')" :bordered="false">
    <p>{{ t('home.desc') }}</p>
    <a-alert
      type="info"
      show-icon
      message="4 个子应用已注册"
      description="Vue2/Vue3 × antd1/antd4/element-plus/element-ui，顶部导航逐个切换；主题开关与语言开关全局广播。"
    />
  </a-card>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
