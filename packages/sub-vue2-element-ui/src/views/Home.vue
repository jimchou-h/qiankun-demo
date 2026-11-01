<template>
  <el-card :title="$t('demo.title')">
    <div class="home-buttons">
      <el-button type="primary" @click="visible = true">打开 Dialog</el-button>
      <el-button @click="drawerVisible = true">打开 Drawer</el-button>
      <el-button @click="showMessage">Message</el-button>
      <!-- 子→父：经 qiankun setGlobalState 上报 msgNum，父应用 Layout 徽标 +1 -->
      <el-button @click="reportToParent">report to parent</el-button>
    </div>

    <!-- 验证业务选择器被 PostCSS 加前缀 + @keyframes 改名 -->
    <div class="demo-card">demo card（验证 CSS 前缀与 keyframes 改名）</div>

    <!-- element-ui Dialog：append-to-body/modal-append-to-body 均 false，挂载到根容器内 -->
    <el-dialog
      title="element-ui Dialog"
      :visible.sync="visible"
      :append-to-body="false"
      :modal-append-to-body="false"
    >
      <p>Dialog 挂载到子应用根容器 [data-app="sub-vue2-element-ui"] 内部。</p>
      <div slot="footer">
        <el-button @click="visible = false">{{ $t('demo.cancel') }}</el-button>
        <el-button type="primary" @click="visible = false">{{ $t('demo.ok') }}</el-button>
      </div>
    </el-dialog>

    <!-- element-ui Drawer：同上，挂载到根容器内 -->
    <el-drawer
      title="element-ui Drawer"
      :visible.sync="drawerVisible"
      :append-to-body="false"
      :modal-append-to-body="false"
    >
      <p>Drawer 挂载到子应用根容器 [data-app="sub-vue2-element-ui"] 内部。</p>
    </el-drawer>
  </el-card>
</template>

<script>
import { reportMsgNum } from '../qiankun/bridge'

export default {
  name: 'Home',
  data() {
    return {
      visible: false,
      drawerVisible: false
    }
  },
  methods: {
    showMessage() {
      this.$message({ message: 'message 挂根容器', type: 'success' })
    },
    reportToParent() {
      reportMsgNum()
    }
  }
}
</script>

<style>
/* 业务选择器：验证 PostCSS 加 [data-app="sub-vue2-element-ui"] 前缀 */
.home-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-card {
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

/* 验证 @keyframes 改名：产物应为 sub-vue2-element-ui-fadeIn，且上面 animation 引用同步改名 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
