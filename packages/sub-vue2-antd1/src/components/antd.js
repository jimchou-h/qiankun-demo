// antd1 弹层组件挂载点统一改写：Modal/Drawer getContainer、弹层类 getPopupContainer
// 默认值改到子应用根容器，避免挂到 body（qiankun 下 body 层叠/样式隔离会乱）
import Modal from 'ant-design-vue/es/modal'
import Drawer from 'ant-design-vue/es/drawer'
import Select from 'ant-design-vue/es/select'
import Tooltip from 'ant-design-vue/es/tooltip'
import Popover from 'ant-design-vue/es/popover'
import Popconfirm from 'ant-design-vue/es/popconfirm'
import Dropdown from 'ant-design-vue/es/dropdown'
import TreeSelect from 'ant-design-vue/es/tree-select'
import Cascader from 'ant-design-vue/es/cascader'
import DatePicker from 'ant-design-vue/es/date-picker'
import message from 'ant-design-vue/es/message'
import notification from 'ant-design-vue/es/notification'

const getContainer = () => document.querySelector('[data-app="sub-vue2-antd1"]') || document.body

export { getContainer }

Modal.props.getContainer.default = getContainer
Drawer.props.getContainer.default = getContainer
;[Select, Tooltip, Popover, Popconfirm, Dropdown, TreeSelect, Cascader, DatePicker].forEach((comp) => {
  if (comp.props && comp.props.getPopupContainer) {
    comp.props.getPopupContainer.default = getContainer
  }
})
// 全局函数式 API：config 支持 getContainer 则配置，不支持就静默跳过（antd1 部分版本不支持）
try { message.config({ getContainer }) } catch (e) {}
try { notification.config({ getContainer }) } catch (e) {}
