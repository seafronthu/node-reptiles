<template>
  <div>
    <a-form>
      <a-row :gutter="24">
        <a-col :md="18" :sm="24">
          <a-form-item label="Cookie"
          :label-col="{ span: 5 }"
        :wrapper-col="{ span: 19 }">
            <a-textarea placeholder="请输入" v-model="value" :autosize="{ minRows: 2, maxRows: 6 }"/>
          </a-form-item>
        </a-col>
        <a-col :md="3" :sm="24">
          <a-form-item>
            <a-button type="primary" @click="handleAdd" :loading="addLoading">添加</a-button>
          </a-form-item>
        </a-col>
        <a-col :md="3" :sm="24">
          <a-form-item>
            <a-button type="primary" @click="exportExcel" :loading="exportLoading"><a-icon type="export" />导出</a-button>
          </a-form-item>
        </a-col>
      </a-row>
    </a-form>
     <a-table :columns="columns" :dataSource="tableData" :pagination="{total, pageSize}" @change="handleChangePage">

    </a-table>
  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import excel from '@/lib/excel'
const columns = [
  { title: '序号', dataIndex: 'id' },
  { title: '交易时间', dataIndex: 'created' },
  { title: '交易单号', dataIndex: 'wechatTrxid' },
  { title: '商户单号', dataIndex: 'swiftpassTrxid' },
  { title: '交易类型', dataIndex: 'description' },
  { title: '场地', dataIndex: 'name' },
  { title: '支付用户编号', dataIndex: 'lyyUserId' },
  { title: '实际支付额', dataIndex: 'totalFee' }
]

const tableData = []
export default {
  name: 'home',
  data () {
    return {
      columns,
      value: '',
      tableData,
      total: 0,
      pageSize: 20,
      addLoading: false,
      exportLoading: false
    }
  },
  methods: {
    handleAdd () {
      const { value } = this
      if (value === '') {
        this.$warning({
          title: 'This is a warning message',
          content: 'cookie 不能为空！'
        })
        return
      }
      this.addLoading = true
      document.cookie = value
      this.getOrderList({})
    },
    getOrderList ({ pageIndex = 1, pageSize = 20 }) {
      return axios({
        method: 'post',
        baseURL: process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:10010/',
        url: 'wawawu/rest/orderpayment/queryOrderRecordList',
        headers: { 'Content-Type': 'application/json;charset=utf-8' },
        withCredentials: true,
        data: {
          dateEnd: moment().format('YYYY-MM-DD'),
          dateStart: '',
          equipmentIdList: '',
          pageIndex,
          pageSize,
          paymentNo: '',
          place: '',
          type: '',
          userId: ''
        }
      }).then(res => {
        this.addLoading = false
        this.exportLoading = false
        if (res.data && res.data.result) {
          this.total = res.data.para.total
          this.tableData = res.data.para.dataList.map((v, i) => ({
            key: v.outTradeNo,
            id: (pageIndex - 1) * pageSize + i + 1,
            created: moment(v.created).format('YYYY-MM-DD HH-mm-ss'),
            wechatTrxid: v.wechatTrxid,
            swiftpassTrxid: v.swiftpassTrxid,
            description: v.description,
            name: v.name,
            lyyUserId: v.lyyUserId,
            totalFee: v.totalFee
          }))
        } else {
          this.$error({
            title: res.data.message,
            content: 'cookie失效了，请重新添加cookie'
          })
        }
      })
    },
    async exportExcel () {
      if (this.total === 0) {
        this.$warning({
          title: 'This is a warning message',
          content: '数据不能为空！'
        })
        return
      }
      await this.getOrderList({ pageIndex: 1, pageSize: this.total })

      this.exportLoading = true
      const params = {
        title: this.columns.map(v => v.title),
        key: this.columns.map(v => v.dataIndex),
        data: this.tableData,
        autoWidth: true,
        filename: '订单数据'
      }
      excel.export_array_to_excel(params)
      this.exportLoading = false
    },
    handleChangePage ({ current }) {
      this.getOrderList({ pageIndex: current })
    }
  },
  created () {
  }
}
</script>
