<template>
  <div class="h-datagrid">
    <div class="h-datagrid-title" v-if="title" ref="gridTitle">
      <h4>{{ title }}</h4>
    </div>
    <div class="h-datagrid-toolbar" v-if="hasToolBar" ref="gridToolbar">
      <div class="pull-right" ref="listCheckBox" v-if="showListCkeckBox">
        <h-tooltip content="刷新" placement="top" transfer v-if="refresh">
          <h-button type="ghost" icon="refresh" @click="dataChange"></h-button>
        </h-tooltip>
        <!-- <h-poptip placement="bottom-end" transfer v-if="size">
          <h-tooltip content="密度" placement="top" transfer>
            <h-button type="ghost" icon="wrench"></h-button>
          </h-tooltip>
          <div slot="content">
            <h-radio-group v-model="tableSize" vertical>
              <h-radio label="large">
                <span>宽松</span>
              </h-radio>
              <h-radio label="default">
                <span>默认</span>
              </h-radio>
              <h-radio label="small">
                <span>紧凑</span>
              </h-radio>
            </h-radio-group>
          </div>
        </h-poptip> -->

        <h-poptip placement="bottom-end" transfer>
          <!-- <h-tooltip content="列设置" placement="top" transfer> -->
          <h-button type="ghost">自定义列表</h-button>
          <!-- </h-tooltip> -->
          <div slot="content" style="max-width:200px;max-height: 200px;overflow-y: auto" v-if="canMove">
            <draggable v-model="showCol" chosenClass="chosen" @start="onStart" @end="onEnd">
              <transition-group>
                <h-checkbox-group class="h-table-checkBox-group" v-model="checked" v-for="item in showCol"
                  :key="item.key" @on-change="checkAllGroupChange(item)">
                  <div class="item-content" v-if="!item.fixed">
                    <!-- @mouseenter="showCurrentIndex(index)" @mouseleave="hideCurrentIndex" -->
                    <h-icon name="xf-move"></h-icon>
                    <h-checkbox :label="item.key" class="h-table-checkBox" :disabled="item.unEdit">
                      <span class="h-table-checkBox-item">{{ item.title }}</span>
                    </h-checkbox>
                    <!-- <span class="lockTool">
                      <h-icon name="t-b-moveup" v-show="index==curItemIndex"></h-icon>
                      <h-icon name="t-b-movedown" v-show="index==curItemIndex"></h-icon>
                    </span> -->
                  </div>
                </h-checkbox-group>
              </transition-group>
            </draggable>
          </div>
          <div slot="content" style="max-width:200px;max-height: 200px;overflow-y: auto" v-else>
            <transition-group>
              <h-checkbox-group class="h-table-checkBox-group" v-model="checked" v-for="item in showCol" :key="item.key"
                @on-change="checkAllGroupChange(item)">
                <h-checkbox :label="item.key" class="h-table-checkBox" :disabled="item.unEdit">
                  <span class="h-table-checkBox-item">{{ item.title }}</span>
                </h-checkbox>
              </h-checkbox-group>
            </transition-group>
          </div>
        </h-poptip>
      </div>
      <slot name="toolbar"></slot>
      <!-- <h-button type="ghost" icon="addition" @click="exportCsv()">{{$t('m.i.common.download')}}</h-button> -->
    </div>
    <div :ref="selfAdaptTable" class="h-table-box">
      <h-table :data="tData" :columns="myColumns" :canMove="canMove" :size="tableSize" :border="border" :stripe="stripe"
        :show-header="showHeader" :width="width" :height="fixedHeight" :canDrag="canDrag" :loading="loadingData"
        :disabled-hover="disabledHover" :highlight-row="highlightRow" :rowSelect="rowSelect"
        :row-class-name="rowClassName" :no-data-text="onDataText" :no-filtered-data-text="noFilteredDataText"
        :patibleHeight="patibleHeight" :fixedAutoHeight="fixedAutoHeight" :summationData="summationData"
        :multiLevel="multiLevel" :maxHeight="maxHeight" showTitle @on-row-click="onRowClick"
        @on-row-dblclick="onRowDbClick" @on-current-change="onCurrentChange"
        @on-current-change-cancle="onCurrentChangeCancle" @on-select="onSelect" @on-select-cancel="onSelectCancel"
        @on-select-all="onSelectAll" @on-selection-change="onSelectChange" @on-sort-change="onSortChange"
        @on-expand="onExpand" @on-move="onMove" ref="gridContent">
      </h-table>
    </div>
    <h-form onsubmit="return false">
      <div class="clearfix">
        <h-page :current="pageInfo.pageNo" :total="total" :page-size="pageInfo.pageSize" :size="size"
          :placement="placement" :simple="simple" :show-total="showTotal" :show-elevator="showElevator"
          :show-sizer="showSizer" :pageSizeOpts="pageSizeOpts" :class-name="className" :styles="styles"
          @on-change="pageChange" @on-page-size-change="pageSizeChange" ref="gridPage" v-if="hasPage">
        </h-page>
      </div>
    </h-form>
  </div>
</template>
<script>
import fetchApi from '@ricUtils/ucpFetch'
import { emitter } from '@ricUtils/mixin'
import draggable from 'vuedraggable'
import { difference, without, cloneDeep } from 'lodash'

export default {
  name: 'HDatagrid',
  data() {
    return {
      patibleHeight: true,
      selfHeight: 0,
      fixedHeight: this.height,
      tData: [],
      total: 0,
      colMap: new Map(),
      dataInfo: {},
      pageInfo: {
        pageNo: this.current || 1,
        pageSize: this.pageSize || 10
      },
      hasToolBar: true,
      loadingData: false, // 仅在url中生效，非URL在外部配置,
      showMultiple: false,
      tableSize: 'default',
      myColumns: [],
      checked: [],
      showCol: [],
      curItemIndex: -1,
      queryParam: null // 查询条件对象bindForm深拷贝存储
    }
  },
  components: {
    draggable
  },
  mixins: [emitter],
  props: {
    canMove: { // 表格是否可拖动,改变表格列顺序
      type: Boolean,
      default: false
    },
    refresh: {
      type: Boolean,
      default: false
    },
    currentPage: String,
    maxHeight: [Number, String],
    summationData: Array, //  自定义汇总
    multiLevel: Array, //  多表头
    title: String, // 表格列表头部信息,
    showListCkeckBox: { // 是否显示自定义表格选项框
      type: Boolean,
      default: false
    },
    gridData: Object, // 数据信息，包含表格信息rows及分页信息total[可以通过property自定义rows字段]
    columns: Array,
    border: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'small'
    },
    stripe: {
      type: Boolean,
      default: true
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    width: [Number, String],
    height: [Number, String],
    canDrag: {
      type: Boolean,
      default: true
    },
    disabledHover: {
      type: Boolean,
      default: false
    },
    highlightRow: {
      type: Boolean
    },
    dataCheckedProp: {
      type: Boolean,
      default: false
    },
    rowSelect: {
      type: Boolean
    },
    rowClassName: Function,
    onDataText: String,
    noFilteredDataText: String,
    onRowClick: {
      type: Function,
      default() {
        return ''
      }
    },
    onRowDbClick: {
      type: Function,
      default() {
        return ''
      }
    },
    onCurrentChange: {
      type: Function,
      default() {
        return ''
      }
    },
    onCurrentChangeCancle: {
      type: Function,
      default() {
        return ''
      }
    },
    onSelect: {
      type: Function,
      default() {
        return ''
      }
    },
    onSelectCancel: {
      type: Function,
      default() {
        return ''
      }
    },
    onSelectAll: {
      type: Function,
      default() {
        return ''
      }
    },
    onSelectChange: {
      type: Function,
      default() {
        return ''
      }
    },
    onSortChange: {
      type: Function,
      default() {
        return ''
      }
    },
    onExpand: {
      type: Function,
      default() {
        return ''
      }
    },
    // onMove: {
    //   type: Function,
    //   default() {
    //     return ''
    //   }
    // },
    current: Number,
    pageSize: Number,
    placement: {
      type: String,
      default: 'top'
    },
    pageSizeOpts: Array,
    simple: Boolean,
    showTotal: {
      type: Boolean,
      default: true
    },
    showElevator: {
      type: Boolean,
      default: true
    },
    clearElevator: {
      type: Boolean,
      default: false
    },
    showSizer: {
      type: Boolean,
      default: true
    },
    className: String,
    styles: Object,
    hasPage: { // 是否显示分页
      type: Boolean,
      default: false
    },
    getDataFunc: { // 分页获取data函数，该参数必须配gridData || 无分页情况,直接返回rows,同时配置get-data事件
      type: Boolean,
      default: false
    },
    // getData: Function, //分页获取data函数，该参数必须配gridData || 无分页情况,直接返回rows
    url: String, // 参考2.0 通过url请求数据
    bindForm: Object,
    autoLoad: { // 设置URL时是否自动加载数据，默认true
      type: Boolean,
      default: true
    },
    loading: { // 非url时使用
      type: Boolean,
      default: false
    },
    selfAdaptTable: String, // 暴露给用户ref属性,设置此属性后，表格根据页面高度自适应，不设置此属性按照给定的高度值给表格设定高度
    property: {
      type: Object,
      default() { // 自定义返回字段
        return {
          total: 'total',
          rows: 'rows',
          pageNo: 'pageNo',
          pageSize: 'pageSize',
          responseType: 'data'
        }
      }
    },
    fixedAutoHeight: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    selfHeight(val) {
      this.selfHeight = val
    },
    current(val) {
      this.pageInfo.pageNo = val
    },
    pageSize(val) {
      this.pageInfo.pageSize = val
    },
    gridData: {
      handler(newValue, oldValue) {
        if (newValue && newValue[this.property.rows] && newValue[this.property.rows].length > 0) {
          this.tData = newValue[this.property.rows]
        } else {
          this.tData = []
        }
        if (this.hasPage) {
          if (newValue && newValue[this.property.total]) {
            this.total = newValue[this.property.total]
          } else {
            this.total = 0
          }
        }
      },
      deep: true
    },
    loading(val) {
      this.loadingData = val
    },
    columns: {
      handler(val) {
        this.genetareColumns(val)
      },
      immediate: true
    }
  },
  methods: {
    getDataListByUrl(flag) {
      // 是否有分页存在
      this.loadingData = true
      if (this.hasPage) {
        if (flag) {
          this.queryParam = JSON.parse(JSON.stringify(this.bindForm))
        }
        let query = Object.assign({}, this.pageInfo, this.queryParam)

        let that = this
        fetchApi.fetch.post(this.url, query).then(res => {
          if (res && res[this.property.responseType] && !res[this.property.responseType].error_no) { // token过期判定
            if (res[this.property.responseType][this.property.total] && res[this.property.responseType][this.property.total] > 0 && res[this.property.responseType][this.property.rows]) {
              this.tData = res[this.property.responseType][this.property.rows]
              this.total = res[this.property.responseType][this.property.total]
            } else {
              this.tData = []
              this.total = 0
            }
            that.$nextTick(function () {
              that.dispatch('curpage', 'successDatagridLoad', this.tData, this.total)
            })
          } else {
            this.tData = []
            this.$hMessage.info(res.data.error_info)
          }
          // TODO
          that.$emit('gridDataLoaded', res.data)
        })
          .finally(() => {
            this.loadingData = false
          })
      } else {
        let query = this.bindForm
        let that = this
        fetchApi.fetch.post(this.url, query).then(res => {
          if (res && res[this.property.responseType] && !res[this.property.responseType].error_no) {
            if (res[this.property.responseType][this.property.rows] && res[this.property.responseType][this.property.rows].length > 0) {
              this.tData = res[this.property.responseType][this.property.rows]
            } else if (res[this.property.responseType] && res[this.property.responseType].length > 0) {
              this.tData = res[this.property.responseType]
            } else if (res[this.property.responseType] && res[this.property.responseType][this.property.rows] && res[this.property.responseType][this.property.rows].length > 0) {
              this.tData = res[this.property.responseType][this.property.rows]
            } else {
              this.tData = []
            }
            that.$nextTick(function () {
              that.dispatch('curpage', 'successDatagridLoad')
            })
          } else {
            this.tData = []
            this.$hMessage.info(res.data.error_info)
          }
          // TODO
          that.$emit('gridDataLoaded', res.data)
        })
          .finally(() => {
            this.loadingData = false
          })
      }
    },
    // 赋值
    setGridData() {
      if (this.gridData[this.property.rows]) {
        this.tData = this.gridData[this.property.rows]
      }
      if (this.hasPage) {
        if (this.gridData[this.property.total]) {
          this.total = this.gridData[this.property.total]
        }
      }
    },
    getDataList(pageNo, pageSize, flag = true) {
      if (this.url) {
        this.getDataListByUrl(flag)
        this.$emit('on-page-change-url', pageNo, pageSize)// 点击分页时，传递事件
      } else if (this.getDataFunc) {
        if (this.hasPage) {
          this.$emit('get-data', this.pageInfo)
        } else {
          this.$emit('get-data')
        }
      } else {
        this.$emit('on-page-change', pageNo, pageSize)
        // this.setGridData()
      }
    },
    // 默认查询
    dataChange(i) {
      this.pageInfo.pageNo = i
      this.getDataList(i, this.pageInfo.pageSize)
    },
    showCurrentIndex(index) {
      this.curItemIndex = index
    },
    hideCurrentIndex() {
      this.curItemIndex = -1
    },
    onEnd() {
      const newColums = []
      // const map = new Map()
      // this.myColumns.forEach((value, index) => {
      //   map.set(value.key, value)
      // })
      this.showCol.forEach((val, index) => {
        newColums.push(this.colMap.get(val.key))
      })
      this.myColumns = newColums

      if (this.currentPage) {
        let data = this.ricStorage.get(this.currentPage)
        const array = []
        newColums.forEach((value, index) => {
          array.push(value.key)
        })
        if (data) {
          data.totalKey = array
          this.ricStorage.set(this.currentPage, data)
        } else {
          let curData = {
            checked: this.checked,
            totalKey: array
          }
          this.ricStorage.set(this.currentPage, curData)
        }
      }
    },
    onMove(oldIndex, newIndex) {
      if (oldIndex === newIndex) return
      const tempCol = this.$refs['gridContent'].cloneColumns
      const movedKey = tempCol[newIndex].key
      const moveItem = this.colMap.get(movedKey)
      const arrayCol = cloneDeep(this.showCol)
      if (tempCol[newIndex - 1] && tempCol[newIndex - 1].key) {
        const prmovedKey = tempCol[newIndex - 1].key
        for (let i = 0; i < arrayCol.length; i++) {
          if (arrayCol[i].key === movedKey) {
            arrayCol.splice(i, 1)
            break
          }
        }
        for (let j = 0; j < arrayCol.length; j++) {
          if (arrayCol[j].key === prmovedKey) {
            arrayCol.splice(j + 1, 0, moveItem)
            break
          }
        }
      } else {
        for (let k = 0; k < arrayCol.length; k++) {
          if (arrayCol[k].key === movedKey) {
            arrayCol.splice(k, 1)
            break
          }
        }
        arrayCol.splice(0, 0, moveItem)
      }
      this.showCol = arrayCol
      const newColums = []
      const array = []
      this.showCol.forEach((val, index) => {
        newColums.push(this.colMap.get(val.key))
        array.push(val.key)
      })
      this.myColumns = newColums
      if (this.currentPage) {
        let data = this.ricStorage.get(this.currentPage)
        if (data) {
          data.totalKey = array
          this.ricStorage.set(this.currentPage, data)
        } else {
          let curData = {
            checked: this.checked,
            totalKey: array
          }
          this.ricStorage.set(this.currentPage, curData)
        }
      }
    },
    // 页码发生改变时
    pageChange(i) {
      this.pageInfo.pageNo = i
      this.getDataList(i, this.pageInfo.pageSize, false)
      // 清除电梯输入框
      if (this.clearElevator) {
        this.$refs.gridPage.clearElevator()
      }
    },
    // 每页显示条数发生变化时
    pageSizeChange(i) {
      this.pageInfo.pageSize = i
      this.pageInfo.pageNo = 1
      // pageNo || pageSize
      this.getDataList(1, i, false)
    },

    // 反选某行的选中状态，仅多选
    toggleTableSelect(index) {
      if (this.$refs.gridContent.selectType) {
        this.$refs.gridContent.toggleSelect(index)
      } else {
        this.$hMessage.info('仅支持表格多选')
      }
    },
    // 表格导出功能
    exportCsv(params) {
      /* {
          filename:  '' // 文件名
          columns: []// 导出表格列
          data: [] // 导出表格数据
          noHeader: false //是否导出表格头
        } */
      this.$refs.gridContent.exportCsv(params)
    },
    printer(config) {
      // 具体各项配置参考http://printjs.crabbly.com/
      // let printConfig = config || {
      //   printable: [],
      //   properties: [],
      //   type: 'json',
      //   gridHeaderStyle: 'border: 1px solid #111;',
      //   gridStyle: 'border: 1px solid #111;text-align:center;'
      // }
      // printJS(printConfig)
    },
    // bodyClick(event) {
    //   // 实现点击页面空白地方使自定义列表项div消失
    //   let _this = this
    //   if (_this.$refs.listCheckBox.contains(event.target)) return
    //   _this.showMultiple = false
    // },
    // // 显示多选框
    // handlemultiple() {
    //   this.showMultiple = !this.showMultiple
    //   document.body.addEventListener('click', this.bodyClick, false)
    // },
    // 控制列显示隐藏
    checkAllGroupChange(item) {
      this.myColumns.forEach((value, index) => {
        if (value.key == item.key) {
          // if (value.hiddenCol !== undefined) {
          value.hiddenCol = !value.hiddenCol
          // } else {
          //   this.$set(this.myColumns[index], 'hiddenCol', true)
          // }
          if (this.checked.length === 1) {
            this.$refs.gridContent.fixedHeader()
          }
        }
      })

      if (this.currentPage) {
        let data = this.ricStorage.get(this.currentPage)
        if (data) {
          data.checked = this.checked
          this.ricStorage.set(this.currentPage, data)
        } else {
          const array = []
          this.showCol.forEach((value, index) => {
            array.push(value.key)
          })
          let curData = {
            checked: this.checked,
            totalKey: array
          }
          this.ricStorage.set(this.currentPage, curData)
        }
      }
      this.$emit('on-check-group-change', this.checked)
    },
    // 计算表格高度
    calculateHeight() {
      // let appObj = document.getElementsByClassName('app-main')
      // let appOffsetTop = appObj.length === 0 ? 0 : appObj[0].offsetTop
      // let objects = {
      //   panelObj: window.document.getElementsByClassName('h-panel')[0],
      //   titleObj: window.document.getElementsByClassName('h-datagrid-title')[0],
      //   toolbarObj: window.document.getElementsByClassName('h-datagrid-toolbar')[0],
      //   pageObj: window.document.getElementsByClassName('h-page')[0]
      // }
      // let extralHeight = 0
      // Object.keys(objects).forEach(function (key, index) {
      //   if (typeof objects[key] !== 'undefined') {
      //     extralHeight += objects[key].clientHeight
      //   }
      // })
      // return window.innerHeight - extralHeight - appOffsetTop - 59

      // top 值为表格到浏览器可视窗口最高位置的距离
      let top = this.$refs[this.selfAdaptTable].getClientRects()[0].top
      // 判断是否存在page分页
      return window.innerHeight - top - (this.hasPage ? 32 : 0) - 30
    },
    // 表格自适应
    selfAdaption() {
      if (this.$refs[this.selfAdaptTable] && this.$refs[this.selfAdaptTable].getClientRects()[0]) {
        this.selfHeight = this.calculateHeight()
        this.fixedHeight = this.selfHeight
        if (this.selfHeight > 50) {
          this.$refs[this.selfAdaptTable].style.height = this.selfHeight.toString() + 'px'
        } else {

        }
        // this.$refs[this.selfAdaptTable].style.height = this.selfHeight.toString()+'px'
      }
    },
    genetareColumns(columns) {
      if (columns.length === 0) return
      let data = this.ricStorage.get(this.currentPage)
      if (this.currentPage && data) {
        let tempColumns = []
        let tempTotalKey = []
        let newChecked = []
        const map = new Map()

        // 1、根据新的列数据过滤checked数据：新增的、删除的
        let newTotalKey = columns.map(item => {
          map.set(item.key, item)
          return item.key
        })
        let oldTotalKey = data.totalKey // 获取旧的totalKey
        let oldChecked = data.checked // 获取旧的checked
        // 对比现在columns的key和totalKey的不同
        let removeKey = difference(oldTotalKey, newTotalKey) // 减少的key
        newChecked = without(oldChecked, ...removeKey) // 旧的check里去掉删掉的
        let addKey = difference(newTotalKey, oldTotalKey) // 增加的key
        // 检查新增的key的hiddenCol值，把值不为true的放到newChecked里
        columns.forEach(item => {
          if (addKey.includes(item.key)) {
            if (item.hiddenCol !== true) {
              newChecked.push(item.key)
            }
          }
        })

        // 2、根据新的列数据按顺序过滤缓存的totalKey数据：新增的、删除的
        // 2.1 删除无用的key
        tempTotalKey = without(oldTotalKey, ...removeKey)
        // 2.2 插入新增的key
        tempTotalKey = tempTotalKey.concat(addKey)

        tempTotalKey.forEach((key) => {
          if (newChecked.indexOf(key) === -1) {
            map.get(key).hiddenCol = true
          }
          tempColumns.push(map.get(key))
        })

        newChecked.forEach((key) => {
          if (map.get(key).hiddenCol) {
            map.get(key).hiddenCol = false
          }
        })

        // 3、赋值
        this.ricStorage.set(this.currentPage, {
          totalKey: tempTotalKey,
          checked: newChecked
        })
        this.checked = newChecked
        this.myColumns = tempColumns
      } else {
        this.myColumns = columns.map(item => {
          return {
            ...item,
            hiddenCol: !!item.hiddenCol
          }
        })
        for (let i = 0; i < this.myColumns.length; i++) {
          if (this.myColumns[i].hiddenCol !== true) {
            this.checked.push(this.myColumns[i].key)
          }
        }
      }
      this.myColumns.forEach((value, index, showCol) => {
        let tempItem = JSON.parse(JSON.stringify(value))
        if (tempItem.type === 'selection') {
          tempItem.title = '选择框'
        }
        this.showCol.push(tempItem)
        this.colMap.set(value.key, value)
      })
    }
  },
  created() {
    this.tableSize = this.size
    if (this.autoLoad) {
      this.getDataList(1, 10)
    } else {
      if (this.gridData) {
        this.setGridData()
      }
    }
    if (!this.$slots.toolbar) {
      this.hasToolBar = false
    }
  }
  // beforeDestroy() { // 在组件生命周期结束的时候销毁。
  //   document.body.removeEventListener('click', this.bodyClick, false)
  // }
}
</script>
<style lang="scss" scoped>
.h-datagrid {
  ::v-deep .h-form-label-right {
    margin-top: 10px;
    padding-bottom: 10px;
    box-sizing: border-box;
  }
  .h-datagrid-toolbar {
    margin-bottom: 10px;
  }
}

.item-content {
  height: 30px;
  line-height: 30px;
}

/*选中样式*/
.chosen {
  border: solid 1px #3089dc !important;
}
</style>
