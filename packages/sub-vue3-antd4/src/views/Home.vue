<template>
  <a-space direction="vertical" style="width: 100%">
    <a-card :title="t('demo.title')">
      <a-space>
        <a-button type="primary" @click="openModal">open modal</a-button>
      </a-space>
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
