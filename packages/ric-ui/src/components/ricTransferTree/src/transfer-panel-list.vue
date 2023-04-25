<template>
  <div :class="['h-transfer-list', hasFooter ? 'h-transfer-list-with-footer' : '']">
    <!-- 穿梭框头部内容区 -->
    <div class="h-transfer-list-header">
      <!-- <h-checkbox class="h-checkbox-wrapper" v-model="allChecked" @on-change="handleAllCheckedChange"
        :indeterminate="isIndeterminate">
      </h-checkbox> -->
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
      <ul style="padding:10px;" class="h-transfer-list-content">
        <h-checkbox-group v-model="checked" v-show="!hasNoMatch && data.length > 0">
          <li style="padding-bottom:5px;" class="h-transfer-panel__item" :key="item[keyProp]"
            v-for="item in filteredData">
            <h-checkbox :label="item[keyProp]" :disabled="item[disabledProp]">
              <span v-if="typeof formatMethod === 'function'">{{ formatMethod(item) }}</span>
              <span v-else>{{ item[labelProp] }}</span>
            </h-checkbox>
          </li>
        </h-checkbox-group>
        <li style="color:#333; padding:10px 0;" v-show="hasNoMatch">暂无数据</li>
        <li style="color:#333; padding:10px 0;" v-show="data.length === 0 && !hasNoMatch">暂无数据</li>
      </ul>
    </div>

    <!-- 穿梭框底部自定义内容区 -->
    <p class="h-transfer-list-footer" v-if="hasFooter">
      <slot></slot>
    </p>
  </div>
</template>

<script>

export default {

  name: 'HTransferPanelList',

  componentName: 'HTransferPanelList',

  components: {
    OptionContent: {
      props: {
        option: Object
      },
      render(h) {
        const getParent = vm => {
          if (vm.$options.componentName === 'HTransferPanelList') {
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
    format: Object,
    filterMethod: Function,
    formatMethod: Function,
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
      const filteredDataKeys = this.filteredData.map(item => item[this.keyProp])
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

    defaultChecked: {
      immediate: true,
      handler(val, oldVal) {
        if (oldVal && val.length === oldVal.length &&
          val.every(item => oldVal.indexOf(item) > -1)) return
        const checked = []
        const checkableDataKeys = this.checkableData.map(item => item[this.keyProp])
        val.forEach(item => {
          if (checkableDataKeys.indexOf(item) > -1) {
            checked.push(item)
          }
        })
        this.checkChangeByUser = false
        this.checked = checked
      }
    }
  },

  computed: {
    filteredData() {
      return this.data.filter(item => {
        if (typeof this.filterMethod === 'function') {
          return this.filterMethod(this.query, item)
        } else {
          const label = item[this.labelProp] || item[this.keyProp].toString()
          return label.toLowerCase().indexOf(this.query.toLowerCase()) > -1
        }
      })
    },

    checkableData() {
      return this.filteredData.filter(item => !item[this.disabledProp])
    },

    checkedSummary() {
      const checkedLength = this.checked.length
      const dataLength = this.data.length > 0 ? this.data.length : 0
      const { noChecked, hasChecked } = this.format
      if (noChecked && hasChecked) {
        return checkedLength > 0
          ? hasChecked.replace(/\${checked}/g, checkedLength).replace(/\${total}/g, dataLength)
          : noChecked.replace(/\${total}/g, dataLength)
      } else {
        return `${checkedLength}/${dataLength}`
      }
    },

    isIndeterminate() {
      const checkedLength = this.checked.length
      return checkedLength > 0 && checkedLength < this.checkableData.length
    },

    hasNoMatch() {
      return this.query.length > 0 && this.filteredData.length === 0
    },

    inputIcon() {
      return this.query.length > 0 && this.inputHover
        ? 'close'
        : 'search'
    },

    labelProp() {
      return this.props.title || 'title'
    },

    keyProp() {
      return this.props.id || 'id'
    },

    disabledProp() {
      return this.props.disabled || 'disabled'
    },

    hasFooter() {
      return !!this.$slots.default
    }
  },

  methods: {
    updateAllChecked() {
      const checkableDataKeys = this.checkableData.map(item => item[this.keyProp])
      this.allChecked = checkableDataKeys.length > 0 &&
        checkableDataKeys.every(item => this.checked.indexOf(item) > -1)
    },

    handleAllCheckedChange(value) {
      this.checked = value
        ? this.checkableData.map(item => item[this.keyProp])
        : []
    },

    clearQuery() {
      if (this.inputIcon === 'close') {
        this.query = ''
      }
    }
  }
}
</script>
