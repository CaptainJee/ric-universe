<template>
  <div class="h-transfer">
    <!-- 穿梭框左侧内容区 -->
    <transfer-panel-tree :style="listStyle" v-bind="$props" ref="leftPanel" :data="sourceData"
      :title="titles[0] || '源数据'" :placeholder="filterPlaceholder || '请输入搜索内容'" :default-checked="leftDefaultChecked"
      :checkStrictly="checkStrictly" :selectToCheck="selectToCheck" @checked-change="onSourceCheckedChange">
      <slot name="left-footer"></slot>
    </transfer-panel-tree>
    <!-- 穿梭框中间操作按键 -->
    <div class="h-transfer-operation">
      <h-button type="ghost" :class="['h-transfer-operation__button', hasButtonTexts ? 'is-with-texts' : '']"
        @click.native="addToLeft" :disabled="rightChecked.length === 0">
        <i class="iconfont icon-return"></i>
        <span v-if="buttonTexts[0] !== undefined">{{ buttonTexts[0] }}</span>
      </h-button>
      <h-button type="ghost" :class="['h-transfer-operation__button', hasButtonTexts ? 'is-with-texts' : '']"
        @click.native="addToRight" :disabled="leftChecked.length === 0">
        <span v-if="buttonTexts[1] !== undefined">{{ buttonTexts[1] }}</span>
        <i class="iconfont icon-enter"></i>
      </h-button>
    </div>
    <!-- 穿梭框右侧内容区 -->
    <transfer-panel-tree v-if="panelType === 'tree'" :style="listStyle" v-bind="$props" ref="rightPanel"
      :data="targetData" :title="titles[1] || '目的数据'" :default-checked="rightDefaultChecked"
      :checkStrictly="checkStrictly" :selectToCheck="selectToCheck" :placeholder="filterPlaceholder || '请输入搜索内容'"
      @checked-change="onTargetCheckedChange">
      <slot name="right-footer"></slot>
    </transfer-panel-tree>
    <transfer-panel-list v-if="panelType === 'list'" :style="listStyle" v-bind="$props" ref="rightPanel"
      :data="targetDataList" :title="titles[1] || '目标列表'" :default-checked="rightDefaultChecked"
      :placeholder="filterPlaceholder || '请输入搜索内容'" @checked-change="onTargetCheckedChange">
      <slot name="right-footer"></slot>
    </transfer-panel-list>
  </div>
</template>

<script>

import { emitter, migrating } from '@ricUtils/mixin'
import { cloneDeep } from 'lodash'
import TransferPanelTree from './transfer-panel-tree'
import TransferPanelList from './transfer-panel-list'

export default {
  name: 'HTransferTree',

  mixins: [emitter, migrating],

  components: {
    TransferPanelTree,
    TransferPanelList
  },

  props: {
    // 自定义样式
    listStyle: {
      type: Object,
      default() {
        return {}
      }
    },
    // 目前只支持'list'，'tree'未完成兼容开发
    panelType: {
      type: String,
      default: 'list'
    },
    // 子项额外属性
    exAttribute: {
      type: [Boolean, String, Number]
    },
    // 未增加相关逻辑
    limitCount: {
      type: Number
    },
    // 父子是否强关联
    checkStrictly: {
      type: Boolean,
      default: true
    },
    // 点击名字勾选
    selectToCheck: {
      type: Boolean,
      default: true
    },
    // 内容数据
    data: {
      type: Array,
      default() {
        return []
      }
    },
    exData: {
      type: Object,
      default() {
        return {}
      }
    },
    // 自定义标题
    titles: {
      type: Array,
      default() {
        return []
      }
    },
    // 自定义操作按键
    buttonTexts: {
      type: Array,
      default() {
        return []
      }
    },
    // 搜索框默认显示
    filterPlaceholder: {
      type: String,
      default: ''
    },
    // 自定义筛选方法
    filterMethod: Function,
    // 自定义目标栏展示数据格式化
    formatMethod: Function,
    // 左边默认选中内容
    leftDefaultChecked: {
      type: Array,
      default() {
        return []
      }
    },
    // 右边默认选中内容
    rightDefaultChecked: {
      type: Array,
      default() {
        return []
      }
    },
    // 自定义渲染内容
    renderContent: Function,
    value: {
      type: Array,
      default() {
        return []
      }
    },
    format: {
      type: Object,
      default() {
        return {}
      }
    },
    // 是否可以筛选
    filterable: Boolean,
    // 数据源的字段别名,因hui写死参数故无法使用,勿传
    props: {
      type: Object,
      default() {
        return {
          label: 'title',
          key: 'id',
          children: 'children',
          disabled: 'disabled',
          exAttribute: 'includechildrenflag'
        }
      }
    },
    targetOrder: {
      type: String,
      default: 'original'
    }
  },

  data() {
    return {
      historyTargetData: new Map(),
      leftChecked: [],
      rightChecked: [],
      isInitData: true
    }
  },

  computed: {
    sourceData() {
      const data = cloneDeep(this.data)

      const filterData = (list) => {
        const filterDataTree = (list) => {
          list.map(item => {
            if (this.value.indexOf(item[this.props.key]) !== -1) {
              item[this.props.disabled] = true
              item.checked = true
            }
            if (item[this.props.children] && item[this.props.children].length > 0) {
              filterDataTree(item.children)
            }
          })
        }
        filterDataTree(list)
        return list
      }

      return filterData(data)
    },

    targetData() {
      const data = cloneDeep(this.data)

      const filterData = (list) => {
        const res = []
        list.forEach(item => {
          if (this.value.indexOf(item[this.props.key]) > -1) {
            res.push(item)
          }

          if (item[this.props.children] && item[this.props.children].length > 0) {
            const result = filterData(item[this.props.children])
            if (result.length > 0) {
              item[this.props.children] = result
              const find = res.find(i => i.key === item.key)

              if (find === undefined) {
                res.push(item)
              }
            }
          }
        })
        return res
      }

      return filterData(data)
    },

    targetDataList() {
      const data = cloneDeep(this.data)
      const exAttribute = this.exAttribute
      const historyTargetData = this.historyTargetData
      const filterDataList = (list) => {
        const res = []
        const filter = (list) => {
          list.forEach(item => {
            if (this.value.indexOf(item[this.props.key]) > -1) {
              if (!historyTargetData.has(item[this.props.key])) {
                if (this.isInitData && this.exData[item.id]) {
                  item = Object.assign({}, item, this.exData[item.id])
                } else {
                  item[this.props.exAttribute] = exAttribute
                }
                historyTargetData.set(item[this.props.key], cloneDeep(item))
                res.push(item)
              } else {
                res.push(historyTargetData.get(item[this.props.key]))
              }
            }

            if (item[this.props.children] && item[this.props.children].length > 0) {
              filter(item[this.props.children])
            }
          })
        }
        filter(list)
        if (this.targetOrder === 'unshift') {
          res.reverse()
        }
        return res
      }

      return filterDataList(data)
    },

    hasButtonTexts() {
      return this.buttonTexts.length === 2
    }
  },

  watch: {
    value(val) {
      if (this.isInitData && this.historyTargetData.size !== 0) this.isInitData = false
      if (val.length === 0) {
        this.historyTargetData.clear()
      }
      this.dispatch('MultipleSelect', 'on-select-selected', val)
    }
  },

  methods: {
    getMigratingConfig() {
      return {
        props: {
          'footer-format': 'footer-format is renamed to format.'
        }
      }
    },

    // 左侧数据选中
    onSourceCheckedChange(val, movedKeys) {
      this.leftChecked = val
      if (movedKeys === undefined) return
      this.$emit('left-check-change', val, movedKeys)
    },

    // 右侧数据选中
    onTargetCheckedChange(val, movedKeys) {
      this.rightChecked = val
      if (movedKeys === undefined) return
      this.$emit('right-check-change', val, movedKeys)
    },

    // 将数据加入左侧
    addToLeft() {
      const list = this.rightChecked
      let currentValue = this.value.slice()
      list.forEach(item => {
        const index = currentValue.indexOf(item)
        if (index > -1) {
          currentValue.splice(index, 1)
        }
        if (this.historyTargetData.has(item)) {
          this.historyTargetData.delete(item)
        }
      })

      this.$emit('input', currentValue)
      this.$emit('change', currentValue, 'left', this.rightChecked)
    },

    // 将数据加入右侧
    addToRight() {
      let currentValue = []
      const itemsToBeMoved = []
      currentValue = this.value.slice()

      const findSelectkey = (list) => {
        const key = this.props.key
        const itemsToBeMoved = []

        list.forEach(item => {
          const itemKey = item[key]
          if (
            this.leftChecked.indexOf(itemKey) > -1 &&
            this.value.indexOf(itemKey) === -1
          ) {
            itemsToBeMoved.push(itemKey)
          }

          if (item[this.props.children] && item[this.props.children].length > 0) {
            itemsToBeMoved.push(...findSelectkey(item[this.props.children]))
          }
        })
        return itemsToBeMoved
      }

      itemsToBeMoved.push(...findSelectkey(this.data))

      currentValue = this.targetOrder === 'unshift'
        ? itemsToBeMoved.concat(currentValue)
        : currentValue.concat(itemsToBeMoved)
      this.$emit('input', currentValue)
      this.$emit('change', currentValue, 'right', this.leftChecked)
    },

    // 清空队列
    clearQuery(which) {
      if (which === 'left') {
        this.$refs.leftPanel.query = ''
      } else if (which === 'right') {
        this.$refs.rightPanel.query = ''
      }
    },
    getTargetDate() {
      return this.historyTargetData
    }
  }
}
</script>
