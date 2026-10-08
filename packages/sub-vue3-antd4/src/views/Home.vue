<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card :title="t('demo.title')">
      <a-space>
        <a-button type="primary" @click="openModal">open modal</a-button>
      </a-space>

      <!-- 验证业务选择器被 PostCSS 加前缀 + @keyframes 改名 -->
      <div class="demo-card">demo card（验证 CSS 前缀与 keyframes 改名）</div>
    </a-card>

    <!--
      ticket 02：Modal 仍挂载到 document.body（未做隔离）
      ticket 04 会通过 setupAntd 把 getContainer 改到子应用根容器
    -->
    <a-modal v-model:open="visible" title="antd4 Modal" @ok="visible = false">
      <p>当前 Modal DOM 挂载到 document.body；ticket 04 会把它改到子应用根容器。</p>
    </a-modal>
  </a-space>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const visible = ref(false)

function openModal() {
  visible.value = true
}
</script>

<style>
/* 业务选择器：验证 PostCSS 加 [data-app="sub-vue3-antd4"] 前缀 */
.demo-card {
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

/* 验证 @keyframes 改名：产物应为 sub-vue3-antd4-fadeIn，且上面 animation 引用同步改名 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
