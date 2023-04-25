## 何时使用

源数据为树结构数据穿梭框

### 使用说明

- 为满足业务需求,临时增加的业务组件；

- treeData 需要满足 hui-tree 的基础数据结构,具体参照 hui 文档;

```
import TransferTree from '@ric/components/transferTree'
import { getAllOrgTree } from '@ricApis/ricProductManager/index'
import { orglistToTree } from '@ricUtils/commonUtil'
components: {
    TransferTree
  },
<template>
<transfer-tree v-model="res" filterable :data="baseData" :list-style="listStyle"
      :checkStrictly="true" @left-check-change="originalChange">
      <div :style="{ float: 'right', margin: '5px' }" slot="left-footer">
        <span>包含子部门:</span>
        <h-switch v-model="formItem.isIncludeChild" @on-change="switchChange"></h-switch>
      </div>
    </transfer-tree>
</template>
  data() {
    return {
      listStyle: {
        width: '420px',
        height: '300px'
      },
    }
  },
  methods: {
    // 获取初始组织树结构
    getCurOrgTree() {
      getAllOrgTree({
        org_id: '0_000000'
      })
        .then(res => {
          const list = res.data.list.filter(element => {
            if (element.parent_id === '0_000000') {
              element.title = element.org_name
              element.id = element.org_id
              element.loading = false
              element.selected = false
              element.children = []
              return element
            }
          })
          this.treeData = orglistToTree(list)
        }).catch((err) => {
          console.error(err)
        })
    },
    selectChange(list) {
      console.log(list)
      this.currentSelectList = list
    },
    checkChange(list) {
      console.log(list)
      this.currentSelectList = list
    },
    originalChange(list) {
      console.log(list)
    }
  }
```

## ricSelectTree API

#### ricSelectTree props

| 参数 | 说明 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| data | 源数据对象 | object | - | 树结构数据对象 |
| targetOrder | 目标框内的排序 | string | 'original'/'unshift' | - |
| props | 数据项属性名自定义 | object | - | 使用exData时，需要配置props.exAttribute |
| filterable | 数据是否可过滤 | boolean | false | - |
| value | 绑定的值，可使用 v-model 双向绑定 | array | - | - |
| exData | 数据项额外属性 | object | - | 当前只支持一个属性 |
| exAttribute | 额外属性控制 | boolean/string/number | - | 需要配合exData一起使用 |
| renderContent | 自定义渲染内容 | Function | - | 默认显示label |
| rightDefaultChecked | 右侧框默认选中的项 | array | - | - |
| leftDefaultChecked | 左侧框默认选中的项 | array | - | - |
| filterMethod | 右侧框自定义显示内容 | Function | - | - |
| filterPlaceholder | 搜索框默认显示内容 | string | - | - |
| buttonTexts | 箭头操作按键自定义名称 | array | - | - |
| titles | 自定义标题 | array | '右：源数据，左：目的数据' | - |
| selectToCheck | 点击行选中 | Boolean | false | - |
| checkStrictly | 父级是否关联子集 | Boolean | false | - |
| listStyle | 自定义样式| object | - | - |


#### ricSelectTree event

| 名称 | 说明 | 返回值 | 返回值说明 | 版本 |
| --- | --- | --- | --- | --- |
| change | 当前选择的内容值变更时触发 | array \| "" | 返回当前选择的节点数组 | - |  |


#### ricSelectTree methods

| 名称 | 说明 | 参数 | 版本 |
| --- | --- | --- | --- |
| getTargetDate | 获取历史数据方法 | function(item, callback) | - |  |

