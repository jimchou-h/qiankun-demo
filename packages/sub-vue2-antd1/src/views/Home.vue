<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card :title="$t('demo.title')">
      <a-space>
        <a-button type="primary" @click="openModal">open modal</a-button>
        <a-button @click="openDrawer">open drawer</a-button>
        <!-- 子→父：经 qiankun setGlobalState 上报 msgNum，父应用 Layout 徽标 +1 -->
        <a-button @click="reportToParent">report to parent</a-button>
      </a-space>

      <!-- 验证业务选择器被 PostCSS 加前缀 + @keyframes 改名 -->
      <div class="demo-card">demo card（验证 CSS 前缀与 keyframes 改名）</div>
    </a-card>

    <!-- antd1 Modal：必须显式传 get-container。
         改 props 默认值不够——Vue2 在组件创建时就执行 default，此时根容器还没插入文档，
         querySelector 返回 null 会 fallback 到 body；传函数则由弹层在打开时再调用。 -->
    <a-modal
      v-model="modalVisible"
      title="antd1 Modal"
      :get-container="getContainer"
      @ok="modalVisible = false"
    >
      <p>Modal 挂载到子应用根容器 [data-app="sub-vue2-antd1"] 内部。</p>
    </a-modal>

    <!-- antd1 Drawer 同为 portal 类。注意：antd1 的 Drawer 没有声明 model:visible
         （Modal 才有），用 v-model 会绑到不存在的 value prop 导致抽屉永远打不开，必须显式 :visible -->
    <a-drawer
      :visible="drawerVisible"
      :get-container="getContainer"
      title="antd1 Drawer"
      @close="drawerVisible = false"
    >
      <p>Drawer 挂载到子应用根容器 [data-app="sub-vue2-antd1"] 内部。</p>
    </a-drawer>
  </a-space>
</template>

<script>
import { reportMsgNum } from '../qiankun/bridge'
import { getContainer } from '../components/antd'

export default {
  name: 'Home',
  data() {
    return {
      modalVisible: false,
      drawerVisible: false,
      // 弹层统一挂载点（函数形式，确保调用时根容器已存在）
      getContainer
    }
  },
  methods: {
    openModal() {
      this.modalVisible = true
    },
    openDrawer() {
      this.drawerVisible = true
    },
    reportToParent() {
      reportMsgNum()
    }
  }
}
</script>

<style>
/* 业务选择器：验证 PostCSS 加 [data-app="sub-vue2-antd1"] 前缀 */
.demo-card {
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  animation: fadeIn 0.3s ease;
}

/* 验证 @keyframes 改名：产物应为 sub-vue2-antd1-fadeIn，且上面 animation 引用同步改名 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
