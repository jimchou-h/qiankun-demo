<template>
  <el-card class="about-card" title="About">
    <div class="about-form">
      <el-input v-model="keyword" placeholder="输入关键字" />
      <el-select
        v-model="city"
        style="width: 100%"
        placeholder="选择城市"
        :popper-append-to-body="false"
      >
        <el-option
          v-for="o in options"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'About',
  data() {
    return {
      keyword: '',
      city: undefined,
      options: [
        { value: 'beijing', label: '北京' },
        { value: 'shanghai', label: '上海' },
        { value: 'shenzhen', label: '深圳' }
      ]
    }
  }
}
</script>

<style>
/* element-ui 的 .el-card 默认 overflow: hidden；本子应用要求弹层挂在根容器内，
   所以 el-select 用 popper-append-to-body=false 把下拉面板放在卡片内部，
   卡片裁剪会把面板截掉（只剩顶部几像素）。这里放开裁剪让面板完整显示。 */
.about-card {
  overflow: visible;
}

.about-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 320px;
}
</style>
