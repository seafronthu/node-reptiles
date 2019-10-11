import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import {
  Table,
  Row,
  Col,
  Icon,
  Form,
  Button,
  Input,
  Modal
} from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import './style.styl'

Vue.use(Table)
Vue.use(Row)
Vue.use(Col)
Vue.use(Icon)
Vue.use(Form)
Vue.use(Button)
Vue.use(Input)
Vue.config.productionTip = false
Vue.prototype.$warning = Modal.warning
Vue.prototype.$error = Modal.error

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
