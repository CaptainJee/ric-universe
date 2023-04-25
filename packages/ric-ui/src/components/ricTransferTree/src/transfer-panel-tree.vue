<template>
  <div :class="['h-transfer-list', hasFooter ? 'h-transfer-list-with-footer' : '']">
    <!-- 穿梭框头部内容区 -->
    <div class="h-transfer-list-header">
      <h-checkbox class="h-checkbox-wrapper" v-if="panelType !== 'list'" v-model="allChecked"
        @on-change="handleAllCheckedChange" :indeterminate="isIndeterminate">
      </h-checkbox>
      <span class="h-transfer-list-header-title">{{ title }}</span>
      <span class="h-transfer-list-header-count">{{ checkedSummary }}</span>
    </div>

    <!-- 穿梭框主体区 -->
    <div
      :class="['h-transfer-list-body', filterable ? 'h-transfer-list-body-with-search' : '', hasFooter ? 'is-with-footer' : '']">
      <!-- 数据筛选输入框 -->
      <div class="h-transfer-list-body-search-wrapper" v-if="filterable">
        <div class="h-input-wrapper h-input-wrapper-small h-input-type">
          <h-input v-model="query" size="small" :placeholder="placeholder" @mouseenter.native="inputHover = true"
            @mouseleave.native="inputHover = false" v-if="filterable" :icon="inputIcon" @on-click="clearQuery">
          </h-input>
        </div>
      </div>
      <!-- 数据内容区 -->
      <div class="h-transfer-list-content">
        <h-tree style="padding:10px;" :node-key="keyProp" :data="filteredData" show-checkbox multiple ref="htree"
          :checkStrictly="checkStrictly" :filter-node-method="filterNode" :render="renderContent"
          :selectToCheck="selectToCheck" @on-check-change="checkChange">
          <!-- 空状态 -->
          <div slot="nodata" v-show="hasNoMatch">暂无数据</div>
          <div slot="nodata" v-show="data.length === 0 && !hasNoMatch">暂无数据</div>
        </h-tree>
      </div>
    </div>

    <!-- 穿梭框底部自定义内容区 -->
    <p class="h-transfer-list-footer" v-if="hasFooter">
      <slot></slot>
    </p>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'

export default {

  name: 'HTransferPanelTree',

  componentName: 'HTransferPanelTree',

  components: {
    OptionContent: {
      props: {
        option: Object
      },
      render(h) {
        const getParent = vm => {
          if (vm.$options.componentName === 'HTransferPanelTree') {
            return vm
          } else if (vm.$parent) {
            return getParent(vm.$parent)
          } else {
            return vm
          }
        }
        const panel = getParent(this)
        const transfer = panel.$parent || panel
        return panel.renderContent
          ? panel.renderContent(h, this.option)
          : transfer.$scopedSlots.default
            ? transfer.$scopedSlots.default({ option: this.option })
            : <span>{this.option[panel.labelProp] || this.option[panel.keyProp]}</span>
      }
    }
  },

  props: {
    data: {
      type: Array,
      default() {
        return []
      }
    },
    renderContent: Function,
    placeholder: String,
    title: String,
    filterable: Boolean,
    checkStrictly: Boolean,
    selectToCheck: Boolean,
    format: Object,
    panelType: String,
    filterMethod: Function,
    defaultChecked: Array,
    props: Object
  },

  data() {
    return {
      checked: [],
      allChecked: false,
      query: '',
      inputHover: false,
      checkChangeByUser: true
    }
  },

  watch: {
    checked(val, oldVal) {
      this.updateAllChecked()
      if (this.checkChangeByUser) {
        const movedKeys = val.concat(oldVal)
          .filter(v => val.indexOf(v) === -1 || oldVal.indexOf(v) === -1)
        this.$emit('checked-change', val, movedKeys)
      } else {
        this.$emit('checked-change', val)
        this.checkChangeByUser = true
      }
    },

    data() {
      const checked = []
      const filteredDataKeys = this.getAllChecked(this.checkableData)
      this.checked.forEach(item => {
        if (filteredDataKeys.indexOf(item) > -1) {
          checked.push(item)
        }
      })
      this.checkChangeByUser = false
      this.checked = checked
    },

    checkableData() {
      this.updateAllChecked()
    },

    // 默认选中的数据
    defaultChecked: {
      immediate: true,
      handler(val, oldVal) {
        if (oldVal && val.length === oldVal.length &&
          val.every(item => oldVal.indexOf(item) > -1)) return
        const checked = []
        const checkableDataKeys = this.getAllChecked(this.checkableData)
        val.forEach(item => {
          if (checkableDataKeys.indexOf(item) > -1) {
            checked.push(item)
          }
        })
        this.checkChangeByUser = false
        this.checked = checked
      }
    },
    query(val) {
      this.$refs.htree.expandTree(true)
      this.$refs.htree.filter(val)
    }
  },

  computed: {
    filteredData() {
      this.$nextTick(() => {
        this.$refs.htree.expandTree(true)
      })
      return this.data
    },

    checkableData() {
      const dataCopy = cloneDeep(this.data)

      const filterFun = (list) => {
        return list.filter(item => {
          if (item[this.childrenProp]) {
            item[this.childrenProp] = filterFun(item[this.childrenProp])
          }
          return !item[this.disabledProp]
        })
      }

      return filterFun(dataCopy)
    },

    checkableCount() {
      const data = cloneDeep(this.data)

      const filterDataList = (list) => {
        const res = []
        const filter = (list) => {
          list.forEach(item => {
            if (!item[this.disabledProp]) {
              res.push(item)
            }

            if (item[this.props.children] && item[this.props.children].length > 0) {
              filter(item[this.props.children])
            }
          })
        }
        filter(list)
        return res.length
      }

      return filterDataList(data)
    },

    // 选中的总数/总数
    checkedSummary() {
      // console.log(this.checkableData)
      const checkedLength = this.checked.length
      const dataLength = this.checkableCount > 0 ? this.checkableCount : 0 // this.data.length > 0 ? this.data[0].totalCount : 0
      const { noChecked, hasChecked } = this.format
      if (noChecked && hasChecked) {
        return checkedLength > 0
          ? hasChecked.replace(/\${checked}/g, checkedLength).replace(/\${total}/g, dataLength)
          : noChecked.replace(/\${total}/g, dataLength)
      } else {
        return `${checkedLength}/${dataLength}`
      }
    },

    // 设置 indeterminate 状态，只负责样式控制(全选状态与半选状态)
    isIndeterminate() {
      const checkedLength = this.checked.length

      const filteredDataKeys = this.getAllChecked(this.checkableData)

      return checkedLength > 0 && checkedLength < filteredDataKeys.length
    },

    // 是否存在过滤出的数据
    hasNoMatch() {
      return this.query.length > 0 && this.filteredData.length === 0
    },

    // 输入框的图标：搜索/删除
    inputIcon() {
      return this.query.length > 0 && this.inputHover
        ? 'close'
        : 'search'
    },

    childrenProp() {
      return this.props.children || 'children'
    },

    // label属性
    labelProp() {
      return this.props.title || 'title'
    },

    // key属性
    keyProp() {
      return this.props.id || 'id'
    },

    // disabled属性
    disabledProp() {
      return this.props.disabled || 'disabled'
    },

    // 是否存在自定义内容
    hasFooter() {
      return !!this.$slots.default
    }
  },

  methods: {
    // tree 筛选
    filterNode(value, data, node) {
      if (this.filterMethod) {
        return this.filterMethod(value, data)
      }
      if (!value) return true
      return node.title.indexOf(value) !== -1
    },

    // 判断是否全选
    updateAllChecked() {
      const checkableDataKeys = this.checkableData.map(item => item[this.keyProp])
      this.allChecked = checkableDataKeys.length > 0 &&
        checkableDataKeys.every(item => this.checked.indexOf(item) > -1)
    },

    // 头部全选操作
    handleAllCheckedChange(value) {
      const checks = []
      // console.log(this.checkableData)

      const getChecked = (list) => {
        list.forEach(item => {
          if (checks.indexOf(item.id) === -1) {
            checks.push(item.id)
          }
          if (item[this.childrenProp] && item[this.childrenProp].length > 0) {
            getChecked(item[this.childrenProp])
          }
        })
      }
      getChecked(this.checkableData)

      if (value) {
        checks.forEach((checkID) => {
          this.$refs.htree.nodeCheck('id', checkID, true)
        })
      } else {
        checks.forEach((checkID) => {
          this.$refs.htree.nodeCheck('id', checkID, false)
        })
      }

      this.checked = this.$refs.htree.getCheckedNodes()
    },

    // 获取tree的已选项
    getAllChecked(list) {
      const keys = []
      list.forEach(item => {
        keys.push(item[this.keyProp])
        if (item[this.childrenProp]) {
          keys.push(...this.getAllChecked(item[this.childrenProp]))
        }
      })
      return keys
    },

    // 清除搜索
    clearQuery() {
      if (this.inputIcon === 'close') {
        this.query = ''
      }
    },

    // 树节点选中
    checkChange(list) {
      let temp = []
      for (let i = 0; i < list.length; i++) {
        if (!list[i][this.disabledProp]) {
          temp.push(list[i][this.keyProp])
        }
      }

      this.checked = temp
    }
  }
}
</script>
