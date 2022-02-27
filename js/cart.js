/* eslint-disable node/handle-callback-err */

const { defineRule, Form, Field, ErrorMessage, configure } = VeeValidate
const { required, email, min, max, numeric } = VeeValidateRules
const { localize, loadLocaleFromURL } = VeeValidateI18n

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('max', max)
defineRule('numeric', numeric)// 須為數字
// 驗證規則

loadLocaleFromURL('./zh_TW.json') // 外部的中文字檔
configure({
  generateMessage: localize('zh_TW'), // 切換成中文版
  validateOnInput: true // 立即驗證
})

const emitter = mitt()
const app = Vue.createApp({
  data() {
    return {
      apiUrl: 'https://vue3-course-api.hexschool.io/v2',
      apiPath: 'sausage',
      loadingStatus: {
        loadingItem: ''
      },
      cartData: {
      },
      products: [],
      productId: '',
      form: {
        user: {
          name: '',
          email: '',
          tel: '',
          address: ''
        },
        message: ''
      },
      ajaxMessage: '',
      isSuccess: true
    }
  },
  components: {
    VForm: Form,
    VField: Field,
    ErrorMessage: ErrorMessage
  },
  methods: {
    getProducts() {
      axios.get(`${this.apiUrl}/api/${this.apiPath}/products/all`)
        .then((res) => {
          this.products = res.data.products
        })
    },
    openProductModal(id) {
      this.loadingStatus.loadingItem = id
      this.productId = id
      this.$refs.productModal.openModal()
      this.loadingStatus.loadingItem = ''
    },
    getCart() {
      axios.get(`${this.apiUrl}/api/${this.apiPath}/cart`)
        .then((res) => {
          this.cartData = res.data.data
        })
    },
    addToCart(id, qty = 1) {
      this.loadingStatus.loadingItem = id
      const data = {
        product_id: id,
        qty
      }
      axios.post(`${this.apiUrl}/api/${this.apiPath}/cart`, { data })
        .then((res) => {
          this.isSuccess = true
          this.ajaxMessage = res.data.message
          this.getCart()
          this.loadingStatus.loadingItem = ''
        })
        .catch((err) => {
          this.ajaxMessage = '發生錯誤'
          this.isSuccess = false
          this.loadingStatus.loadingItem = ''
        })
    },
    removeCartItem(id) {
      this.loadingStatus.loadingItem = id
      axios.delete(`${this.apiUrl}/api/${this.apiPath}/cart/${id}`)
        .then((res) => {
          this.getCart()
          this.loadingStatus.loadingItem = ''
        })
    },
    deleteCart() {
      this.loadingStatus.loadingItem = true
      axios.delete(`${this.apiUrl}/api/${this.apiPath}/carts`)
        .then((res) => {
          this.isSuccess = true
          this.ajaxMessage = '購物車已刪除'
          this.$refs.statusMessage.openModal()
          this.getCart()
          this.loadingStatus.loadingItem = ''
          setTimeout(() => {
            this.$refs.statusMessage.closeModal()
          }, 2000)
        })
    },
    updateCartItem(item) {
      const data = {
        product_id: item.id,
        qty: item.qty
      }
      this.loadingStatus.loadingItem = item.id
      axios.put(`${this.apiUrl}/api/${this.apiPath}/cart/${item.id}`, { data })
        .then((res) => {
          this.getCart()
          this.loadingStatus.loadingItem = ''
        })
    },
    createOrder() {
      this.loadingStatus.loadingItem = true
      const order = this.form
      axios.post(`${this.apiUrl}/api/${this.apiPath}/order`, { data: order })
        .then((res) => {
          this.$refs.form.resetForm()
          this.isSuccess = true
          this.ajaxMessage = res.data.message
          this.$refs.statusMessage.openModal()
          this.loadingStatus.loadingItem = ''
        })
        .catch((err) => {
          this.ajaxMessage = err.data.message
          this.isSuccess = false
        })
    },
    addLoading() {
      const loader = this.$loading.show({
        container: this.fullPage ? null : this.$refs.loadingContainer,
        canCancel: true,
        onCancel: this.onCancel,
        loader: 'dots'
      })

      setTimeout(() => {
        loader.hide()
      }, 600)
    }
  },
  mounted() {
    this.addLoading()
    this.getProducts()
    this.getCart()
    emitter.on('openModal', () => {
      console.log(this)
      this.$refs.statusMessage.openModal()
      setTimeout(() => {
        this.$refs.statusMessage.closeModal()
      }, 2000)
    })
  }
})

  .component('product-modal', {
    props: ['id', 'apiUrl', 'apiPath'],
    template: '#userProductModal',
    data() {
      return {
        modal: {},
        product: [],
        qty: 1
      }
    },
    watch: {
      id() {
        this.getProduct()
      }
    },
    methods: {
      openModal() {
        this.modal.show()
      },
      getProduct() {
        axios.get(`${this.apiUrl}/api/${this.apiPath}/product/${this.id}`)
          .then((res) => {
            this.product = res.data.product
          })
      },
      addToCart() {
        this.$emit('add-cart', this.product.id, this.qty)
        this.modal.hide()
        emitter.emit('openModal')
      }
    },
    mounted() {
      this.modal = new bootstrap.Modal(this.$refs.modal)
    }
  })
  .component('statusMessage', {
    props: ['infoMessage', 'isSuccess'],
    data() {
      return {
        bsModal: ''
      }
    },
    template: /* html */`
    <div class="modal fade" id="statusMessage" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropLabel" aria-hidden="true" ref="messageModal">
    <div class="modal-dialog ">
      <div class="modal-content">
        <div class="modal-header" :class="[isSuccess ? 'bg-primary':'bg-danger']">
          <div class="container">
            <h5 class="modal-title text-center text-white display-7" id="staticBackdropLabel">{{infoMessage}}</h5>
          </div>
        </div>
        <div v-if="!isSuccess" class="d-flex justify-content-center">
          <div class="d-inline-flex my-4 text-warning">
            <i class="fas fa-exclamation-triangle fa-4x"></i>
          </div>
        </div>
        <div v-else class="d-flex justify-content-center">
          <div class="d-inline-flex my-4 text-success">
            <i class="fas fa-check fa-4x"></i>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
  `,
    methods: {
      openModal() {
        this.bsModal.show()
      },
      closeModal() {
        this.bsModal.hide()
      }
    },
    mounted() {
      this.bsModal = new bootstrap.Modal(this.$refs.messageModal, { keyboard: false })
    }
  })

  .use(VueLoading.Plugin)
  .mount('#app')
