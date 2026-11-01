<template>
  <el-card :title="t('demo.title')">
    <div class="demo-actions">
      <el-button type="primary" @click="visible = true">打开 Dialog</el-button>
      <el-button @click="drawerVisible = true">打开 Drawer</el-button>
      <el-button @click="showMessage">Message</el-button>
      <!-- 子→父：经 qiankun setGlobalState 上报 msgNum，父应用 Layout 徽标 +1 -->
      <el-button @click="reportToParent">report to parent</el-button>
      <!-- 主题切换：验证 data-theme 驱动的 --ep-* 暗色变量覆盖 -->
      <el-button @click="toggleTheme">切换主题</el-button>
    </div>

    <!-- 验证业务选择器被 PostCSS 加前缀 + @keyframes 改名 -->
    <div class="demo-card">demo card（验证 CSS 前缀与 keyframes 改名）</div>

    <!-- append-to-body=false：Dialog DOM 挂载到 [data-app="sub-vue3-element-plus"] 内部 -->
    <el-dialog v-model="visible" title="element-plus Dialog" :append-to-body="false">
      <p>Dialog 挂载到子应用根容器 [data-app="sub-vue3-element-plus"] 内部。</p>
      <template #footer>
        <el-button @click="visible = false">{{ t('demo.cancel') }}</el-button>
        <el-button type="primary" @click="visible = false">{{ t('demo.ok') }}</el-button>
      </template>
    </el-dialog>

    <!-- append-to-body=false：Drawer 同为 portal 类，挂到根容器内部 -->
    <el-drawer v-model="drawerVisible" title="element-plus Drawer" :append-to-body="false">
      <p>Drawer 挂载到子应用根容器 [data-app="sub-vue3-element-plus"] 内部。</p>
    </el-drawer>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'

import { reportMsgNum } from '../qiankun/bridge'
import { theme, applyTheme } from '../theme'

const { t } = useI18n()
const visible = ref(false)
const drawerVisible = ref(false)

function showMessage() {
  ElMessage.success({
    message: 'message 挂根容器',
    // 点击发生在挂载后，根容器必然存在；直接传元素避免回退到 body
    appendTo: document.querySelector('[data-app="sub-vue3-element-plus"]') as HTMLElement
  })
}

function reportToParent() {
  reportMsgNum()
}

function toggleTheme() {
  applyTheme(theme.value === 'light' ? 'dark' : 'light')
}
</script>

<style>
/* 业务选择器：验证 PostCSS 加 [data-app="sub-vue3-element-plus"] 前缀 */
.demo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.demo-card {
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

/* 验证 @keyframes 改名：产物应为 sub-vue3-element-plus-fadeIn，且上面 animation 引用同步改名 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
