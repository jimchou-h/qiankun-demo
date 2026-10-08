<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card :title="t('demo.title')">
      <a-space>
        <a-button type="primary" @click="openModal">open modal</a-button>
        <a-button @click="openDrawer">open drawer</a-button>
        <!-- 子→父：经 qiankun setGlobalState 上报 msgNum，父应用 Layout 徽标 +1 -->
        <a-button @click="reportToParent">report to parent</a-button>
      </a-space>

      <!-- 验证业务选择器被 PostCSS 加前缀 + @keyframes 改名 -->
      <div class="demo-card">demo card（验证 CSS 前缀与 keyframes 改名）</div>
    </a-card>

    <!-- ticket 04：setupAntd 已把 getContainer 默认值改到子应用根容器，Modal DOM 挂载到 [data-app="sub-vue3-antd4"] 内部 -->
    <a-modal v-model:open="visible" title="antd4 Modal" @ok="visible = false">
      <p>Modal 挂载到子应用根容器 [data-app="sub-vue3-antd4"] 内部。</p>
    </a-modal>

    <!-- ticket 04：Drawer 同为 portal 类，getContainer 默认值已改写 -->
    <a-drawer v-model:open="drawerVisible" title="antd4 Drawer" @close="drawerVisible = false">
      <p>Drawer 挂载到子应用根容器 [data-app="sub-vue3-antd4"] 内部。</p>
    </a-drawer>
  </a-space>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportMsgNum } from '../qiankun/bridge'

const { t } = useI18n()
const visible = ref(false)
const drawerVisible = ref(false)

function openModal() {
  visible.value = true
}

function openDrawer() {
  drawerVisible.value = true
}

function reportToParent() {
  reportMsgNum()
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
