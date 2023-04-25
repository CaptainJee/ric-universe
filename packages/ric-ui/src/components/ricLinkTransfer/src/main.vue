<template>
  <div>
    <h-msg-box
      transfer
      v-model="show"
      :escClose="true"
      :title="msgBoxTitle"
      maxHeight="620"
      @on-close="cancel"
      width="620"
      footerHide
      :mask-closable="false"
    >
      <iframe v-if="show" :src="transferUrl" frameborder="0" class="h5-iframe" name="h5-iframe" id="h5-iframe" scrolling="scroll" width="100%"
        height="550px"></iframe>
    </h-msg-box>
  </div>
</template>

<script>

export default {
  name: 'LinkTransfer',
  props: {
    // 是否显示
    showLinkTransferBox: {
      type: Boolean,
      default: () => false
    },
    // 是否使用转化工具的链接参数
    useTransferUrlParams: {
      type: Boolean,
      default: () => false
    },
    // 弹框标题
    msgBoxTitle: {
      type: String,
      default: () => '链接转化工具'
    },
    sourceInput: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      TransferUrl: window.CMS_CONFIG.TRANSFER_URL,
      TransferUrlParams: window.CMS_CONFIG.TRANSFER_URL_PARAMS,
      show: false // 是否展示弹窗
    }
  },
  computed: {
    transferUrl() {
      return this.useTransferUrlParams ? this.TransferUrl + '?' + this.TransferUrlParams : this.TransferUrl
    }
  },
  watch: {
    showLinkTransferBox: {
      handler(val) {
        this.show = val
        if (val) {
          window.addEventListener('message', this.exportUrl, false)
        } else {
          window.removeEventListener('message', this.exportUrl, false)
        }
      },
      deep: true,
      immediate: true
    }
  },
  methods: {
    cancel() {
      // this.show = false
      this.$emit('msgCancel', false)
    },
    exportUrl(val) {
      console.log(val)
      let url = ''
      let encodeTimes = 0
      // 当前只有东北客户有此要求
      if (val.data.indexOf('cms_current_work') !== -1) {
        if (val.data.indexOf('$cms_current_work$') !== -1) {
          url = decodeURIComponent(val.data)
          encodeTimes++
        } else {
          url = decodeURIComponent(val.data)
          encodeTimes++
          for (let i = 0; i < 3; i++) { // 根据要求，最多3次encode
            if (url.indexOf('$cms_current_work$') !== -1) {
              break
            } else {
              url = decodeURIComponent(url)
              encodeTimes++
            }
          }
        }
        url = url + `&encode_times=${encodeTimes}`
      } else {
        url = val.data
        // for (let j = 0; j < 3; j++) { // 根据要求，最多3次encode
        //   console.log(url)
        //   url = decodeURIComponent(url)
        // }
      }
      this.$emit('exportUrl', {url: url, source: this.sourceInput})
      this.cancel()
    }
  }
}
</script>

<style scoped lang="scss">

</style>
