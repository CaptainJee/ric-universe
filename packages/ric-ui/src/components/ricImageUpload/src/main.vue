<template>
  <div class="img-upload-container" :class="type === 'imgText' && 'img-text-upload-container'">
    <template v-if="type === 'default'">
      <div class="img-upload-wrap" :class="{ 'has-img': hasImg }">
        <div class="blank-img-wrap" v-if="!hasImg">
          <img class="blank-icon" :src="boxImg" alt="">
          <div class="upload-btn">点击上传</div>
          <div class="description">{{ description }}</div>
        </div>
        <div class="img-wrap" v-if="hasImg">
          <img class="img" :src="localImgSrc || imgSrc" :alt="alt" @error="loadErrorImg">
        </div>
        <div class="img-reupload" v-show="hasImg">重新上传</div>
        <div class="img-del" v-show="hasImg" @click="delImg">
          <h-icon name="android-delete"></h-icon>
        </div>
        <input class="file-upload" type="file" ref="imgFile" @change="uploadImg($event)" :accept="acceptImg"/>
      </div>
      <div class="img-name">{{ name }}</div>
    </template>
    <template v-if="type === 'imgText'">
      <div class="img-upload-wrap" :class="{ 'has-img': hasImg }">
        <!--        <div class="blank-img-wrap" v-if="!hasImg">-->
        <!--          <img class="blank-icon" :src="boxImg" alt="">-->
        <!--          <div class="upload-btn">点击上传</div>-->
        <!--          <div class="description">{{ description }}</div>-->
        <!--        </div>-->
        <div class="img-wrap" v-if="hasImg">
          <img class="img" :src="localImgSrc || imgSrc" :alt="alt" @error="loadErrorImg">
        </div>
        <div class="img-reupload" v-show="hasImg">重新上传</div>
        <div class="img-reupload" v-show="!hasImg">
          <img src="@ric/scripts/assets/icon-upload.svg" alt="">
        </div>
        <div class="img-del" v-show="hasImg" @click="delImg">
          <h-icon name="android-delete"></h-icon>
        </div>
        <input class="file-upload" type="file" ref="imgFile" @change="uploadImg($event)" :accept="acceptImg"/>
      </div>
      <div class="img-name-wrap">
        <div class="img-name-title">{{ name }}</div>
        <div class="img-name-description">{{ description }}</div>
      </div>
    </template>
    <template v-if="type === 'material'">
      <MaterialSelectModal ref="materialSelectModal" v-model="cmsMaterialData" :gsv="cmsGsv" material_format="4"
        :maxSizeLimit="2000">
        <template v-solt>
          <div class="img-upload-wrap" :class="{ 'has-img': hasImg }">
            <div class="blank-img-wrap" v-if="!hasImg" @click="showModal">
              <img class="blank-icon" :src="boxImg" alt="">
              <div class="upload-btn">点击上传</div>
              <div class="description">{{ description }}</div>
            </div>
            <div class="img-wrap" v-if="hasImg">
              <img class="img" :src="localImgSrc || imgSrc" :alt="alt" @error="loadErrorImg">
            </div>
            <div class="img-reupload" v-show="hasImg" @click="showModal">重新上传</div>
            <div class="img-del" v-show="hasImg" @click="deleteImg">
              <h-icon name="android-delete"></h-icon>
            </div>
          </div>
          <div class="img-name">{{ name }}</div>
        </template>
      </MaterialSelectModal>
    </template>
  </div>
</template>

<script>
import { imgUpload } from '@ricApis/ricCommon/index'
import errorImg from '@ric/scripts/assets/upload-error.png'
import boxImg from '@ric/scripts/assets/box.png'
import MaterialSelectModal from '@ric/components/materialSelectModal/MaterialSelectModal.vue'
import { baseCMSUrl } from '@ricUtils/request'

export default {
  name: 'ImgUpload',
  components: {
    MaterialSelectModal
  },
  props: {
    value: {
      type: String,
      default: () => ''
    },
    type: {
      type: String,
      default: 'default'
    },
    name: String,
    alt: String,
    size: {
      type: Number || String,
      default: () => 1024 // kb
    },
    description: String,
    accept: {
      type: Array,
      default: () => ['png']
    }
  },
  computed: {
    hasImg() {
      return !!this.imgSrc
    },
    acceptImg() {
      return this.accept.map(item => {
        return `image/${item}`
      }).join(',')
    }
  },
  data() {
    return {
      imgSrc: '',
      localImgSrc: '',
      cmsMaterialData: {},
      cmsGsv: baseCMSUrl
    }
  },
  watch: {
    value(val) {
      if (val.fileGuid !== undefined) {
        this.setValue(val.fileGuid)
      } else {
        this.setValue(val)
      }
    },
    cmsMaterialData(val) {
      this.setValue(val.thumbnail_path)
      this.$emit('input', val.thumbnail_path)
    }
  },
  methods: {
    showModal() {
      this.$refs.materialSelectModal.showModal()
    },
    deleteImg() {
      this.$refs.materialSelectModal.deleteItem()
      this.$emit('input', '')
    },
    // 请求网络图片或者接口图片为空、错误时，使用默认图片
    loadErrorImg(event) {
      if (event.type == 'error') {
        event.target.src = errorImg
      }
    },
    setValue(val) {
      val = typeof val === 'string' ? val.trim() : ''
      if (val) {
        this.imgSrc = val
      } else {
        this.imgSrc = ''
      }
    },
    delImg() {
      this.setValue()
      this.$emit('input', '')
    },
    uploadImg(e) {
      let file = e.target.files[0]
      let localSrc = window.URL.createObjectURL(file)
      let type = file.type
      // 兼容火狐、IE
      if (this.acceptImg.split(',').indexOf(type) === -1) {
        this.$hMessage.info(`仅支持${this.accept.join('，')}格式的图片`)
        this.$refs.imgFile.value = ''
        return
      }
      if (file && file.size > 0) {
        let maxSize = file.size
        if (maxSize > this.size * 1024) {
          this.$hMessage.info(`${this.name}最大限制${this.size}KB，请重新提交`)
          return false
        }
        const Form = new FormData()
        Form.append('file', file)
        imgUpload(Form)
          .then(res => {
            if (res.data.fileServerInnerUrl) {
              this.localImgSrc = localSrc
              this.$emit('input', res.data.fileServerInnerUrl)
            }
            // e.target.value = ''
          })
          .catch(err => err)
          .finally(() => {
            e.target.value = ''
          })
      }
    }
  },
  created() {
    this.boxImg = boxImg
  }
}
</script>

<style lang="scss" scoped>
.img-upload-container {
  width: 240px;
  position: relative;
  margin-bottom: 12px;

  .img-name {
    text-align: center;
    color: #333;
    font-size: 12px;
    margin-top: 4px;
  }
}

.img-upload-wrap {
  cursor: pointer;
  position: relative;
  width: 240px;
  height: 140px;
  border: 1px dashed #ddd;
  border-radius: 2px;
  background-color: #f7f7f7;

  &.has-img {
    border: 0;

    .file-upload {
      height: 40px;
      left: 0;
      bottom: 0;
    }
  }

  .blank-img-wrap {
    position: relative;
    padding: 30px 8px 0;

    .blank-icon {
      display: block;
      width: 30px;
      height: 30px;
      margin: 0 auto;
    }

    .upload-btn {
      font-size: 14px;
      line-height: 14px;
      color: #333;
      text-align: center;
      margin: 10px 0;
    }

    .description {
      color: #999;
      text-align: center;
      line-height: 14px;
    }
  }

  .file-upload {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 240px;
    height: 140px;
    z-index: 100;
    opacity: 0;
    line-height: 0px;
    cursor: pointer;
  }

  .img-wrap {
    width: 240px;
    height: 140px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f7f7f7;
    border-radius: 2px;

    .img {
      display: block;
      max-width: 240px;
      max-height: 140px;
    }
  }

  .img-reupload {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 40px;
    line-height: 40px;
    text-align: center;
    color: #fff;
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.3);
  }

  .img-del {
    position: absolute;
    right: 0;
    top: 0;
    width: 40px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    background-color: rgba(0, 0, 0, 0.3);
  }
}

.img-text-upload-container {
  display: flex;
  align-items: center;
  width: auto;

  .img-upload-wrap {
    width: 80px;
    height: 80px;
    flex: none;
    margin-right: 10px;

    .img-wrap {
      width: 80px;
      height: 80px;

      .img {
        display: block;
        max-width: 80px;
        max-height: 80px;
      }
    }
  }

  .img-name-wrap {
    width: 197px;
    height: 80px;
    flex: auto;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .img-name-title {
    font-weight: bold;
  }

  .img-name-description {
    line-height: 1.5;
    color: #999;
  }

  .img-reupload {
    height: 28px;
    line-height: 28px;
    background: rgba(0, 0, 0, 0.50);
    font-size: 12px;
  }

  .file-upload {
    width: 80px;
    height: 80px;
  }
}
</style>
