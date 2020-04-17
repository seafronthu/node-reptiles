const https = require('https')
const { errorCaptured } = require('./lib/utils')
// const fs = require('fs')
class Main {
  // difficultStatus = [
  //   { color: '#9e9e9e', name: '未知' },
  //   { color: '#4caf50', name: '简单' },
  //   { color: '#ff9800', name: '中等' },
  //   { color: '#f44336', name: '困难' }
  // ]
  constructor () {
    this.zhihuData = []
    this.juejinData = []
    this.difficultStatus = [{
      color: '#9e9e9e',
      name: '未知'
    },
    {
      color: '#4caf50',
      name: '简单'
    },
    {
      color: '#ff9800',
      name: '中等'
    },
    {
      color: '#f44336',
      name: '困难'
    }
    ]
  }
  async request (options) {
    const {
      // protocol,
      host,
      pathname,
      method,
      headers,
      body
    } = options
    // const origin = `${protocol}//${host}`
    // const href = origin + pathname
    let data = ''
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: host,
        // port: 443,
        path: pathname,
        method,
        headers
      },
      res => {
        res.on('data', result => {
          data += result.toString('utf8')
        })
        res.on('end', () => {
          resolve(data)
        })
      }
      )

      req.on('error', e => {
        reject(e)
      })
      // req.write(JSON.stringify(ctx.request.body || {}))
      req.end(JSON.stringify(body || {}), 'utf8', (resu) => {
        // console.log(resu)
      })
    })
  }
  getRandomValue (arr) {
    const len = arr.length
    if (len === 1) {
      return arr[0]
    }
    const rNum = (len * Math.random() | 0)
    const item = arr[rNum]
    if (item.paid_only) {
      arr.splice(rNum, 1)
      return this.getRandomValue(arr)
    }
    return item
  }
  everyDayOnceTask ({ callback, delay, hour, status, initDelay }) {
    const currDate = new Date()
    const currHour = currDate.getHours()
    const currMinute = currDate.getMinutes()
    let surplusHour
    let surplus
    if (currHour > hour) {
      surplusHour = 24 - currHour + hour
      surplus = (24 - currHour - currMinute / 60 + hour) * 1000 * 60 * 60
    } else {
      surplusHour = hour - currHour
      surplus = (hour - currHour - currMinute / 60) * 1000 * 60 * 60
    }
    if (surplusHour === 0 && status) {
      status = false
      callback()
    } else if (surplusHour <= 2 && surplusHour > 0) {
      initDelay = surplus / 10
      initDelay = initDelay <= 1000 ? 1000 : initDelay
    } else {
      status = true
      initDelay = 60 * 60 * 1000
    }
    setTimeout(() => {
      this.everyDayOnceTask({ callback, delay, hour, status })
    }, delay)
  }
  everyDayManyTask ({ callback, today = new Date(), startNum, intervalHours, delay, endNum = 0 }) {
    const currDate = new Date()
    const currDay = currDate.getDay()
    const now = today.getDay()
    const currHour = currDate.getHours()
    const currMinute = currDate.getMinutes()
    const intervalSmallHour = intervalHours[0]
    const intervalLargeHour = intervalHours[1]
    //! 当前次数大于0 且在区间中
    let initDelay = delay
    let surplusHour
    let surplus
    if (currHour > intervalLargeHour) {
      surplusHour = 24 - currHour + intervalSmallHour
      surplus = (24 - currHour - currMinute / 60 + intervalSmallHour) * 60 * 60 * 1000
      if (surplusHour <= 2) {
        initDelay = surplus / 10
        initDelay = initDelay < 1000 ? 1000 : initDelay
      } else {

      }
    } else if (currHour < intervalSmallHour) {
      surplusHour = intervalSmallHour - currHour
      surplus = (intervalSmallHour - currHour - currMinute / 60) * 60 * 60 * 1000
      if (surplusHour <= 2) {
        initDelay = surplus / 10
        initDelay = initDelay < 1000 ? 1000 : initDelay
      }
    } else if (startNum > 0) {
      --startNum
      ++endNum
      callback()
      surplus = (intervalLargeHour - currHour - currMinute / 60) * 60 * 60 * 1000
      initDelay = surplus / startNum
    }
    //! 区间最大值和当前小时的差值大于等于2且有次数的时候，计时器间隔重新计算
    if (currDay !== now) {
      today = currDate
      startNum ^= endNum ^= startNum ^= endNum
    }
    setTimeout(() => {
      this.everyDayManyTask({ callback, today, startNum, intervalHours, delay, endNum })
    }, initDelay)
  }
  getDingTalkBody (params, msgtype) {
    if (msgtype === 'actionCard') {
      return {
        'actionCard': params,
        'msgtype': 'actionCard'
      }
    }
    if (msgtype === 'feedCard') {
      return {
        'feedCard': {
          'links': params
        },
        'msgtype': 'feedCard'
      }
    }
  }
  arrangeLeetcodeData (items) {
    const {
      stat: {
        question__title: title,
        question__title_slug: slug
      },
      difficulty: {
        level
      }
    } = items
    const {
      difficultStatus
    } = this
    return {
      'title': '每日算法',
      'text': `### leetcode \n> ![screenshot](https://assets.leetcode-cn.com/lccn-resources/leetcode-200x133.jpg) \n> ## ${title}  (难度：<font color=${difficultStatus[level].color} size=1>${difficultStatus[level].name}</font>) \n> (https://leetcode-cn.com/problems/${slug}/)`,
      'btnOrientation': '0',
      'singleTitle': '阅读全文',
      'singleURL': `https://leetcode-cn.com/problems/${slug}/`
    }
  }
  async leetcodeSendMessage () {
    const leetcodeRes = await errorCaptured(async () => {
      return this.request({
        protocol: 'https:',
        host: 'leetcode-cn.com',
        pathname: '/api/problems/all/',
        method: 'GET'
      })
    })
    let leetCodeData = []
    if (leetcodeRes[1]) {
      const leetcodeRes1 = leetcodeRes[1]
      // leetCodeData = JSON.parse(leetcodeRes1).stat_status_pairs
      const leetCodeDataParse = JSON.parse(leetcodeRes1)
      leetCodeData = leetCodeDataParse.stat_status_pairs
    }
    if (!leetCodeData || leetCodeData.length === 0) {
      return
    }
    const value = this.getRandomValue(leetCodeData)
    const body = this.getDingTalkBody(this.arrangeLeetcodeData(value), 'actionCard')
    // 计算机精英部队
    await errorCaptured(async () => {
      return this.request({
        protocol: 'https:',
        host: 'oapi.dingtalk.com',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        pathname: '/robot/send?access_token=37850974cf16cebeaf14e1316aa6ae4a045897202757ef29201a098a78572c87',
        method: 'post',
        body
      })
    })
    // 计算机高级会员
    const dingtalkRes2 = await errorCaptured(async () => {
      return this.request({
        protocol: 'https:',
        host: 'oapi.dingtalk.com',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        pathname: '/robot/send?access_token=6ab294094a0a7f6ff94103cb37a826b009ed8ba81221e09e2dfaa3429bf47767',
        method: 'post',
        body
      })
    })
    return dingtalkRes2
  }
  arrangeZhihuData () {
    let data = this.zhihuData.splice(0, 5)
    return data.map(v => {
      const child = v.children[0]
      return {
        'title': '知乎：' + v.target.title,
        'messageURL': `https://www.zhihu.com/question/${v.target.id}`, // v.target.url,
        'picURL': (child && child.thumbnail) || 'https://static.zhihu.com/heifetz/assets/sign_bg.db29b0fb.png'
      }
    })
  }
  async zhihuSendMessage () {
    if (this.zhihuData.length === 0) {
      const zhihuRes = await errorCaptured(async () => {
        return this.request({
          protocol: 'https:',
          host: 'www.zhihu.com',
          pathname: '/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true',
          method: 'GET'
        })
      })
      if (zhihuRes[1]) {
        this.zhihuData = JSON.parse(zhihuRes[1]).data
      }
    }
    if (this.zhihuData.length === 0) {
      return
    }
    const data = this.arrangeZhihuData()
    const body = this.getDingTalkBody(data, 'feedCard')
    // 钉钉小分队
    await errorCaptured(async () => {
      return this.request({
        protocol: 'https:',
        host: 'oapi.dingtalk.com',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        pathname: '/robot/send?access_token=39e10e2a467663a13a5df7b2400948c2cd9f73fc9bb8b4a67c65ed4090f1d2e5',
        method: 'post',
        body
      })
    })
    // 接口对接
    const dingtalkRes2 = await errorCaptured(async () => {
      return this.request({
        protocol: 'https:',
        host: 'oapi.dingtalk.com',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        pathname: '/robot/send?access_token=6b682106ff49ce905ab52a5d029794516c942cebec6080a73dbe320cf7e5e612',
        method: 'post',
        body
      })
    })
    return dingtalkRes2
  }
  // 整理掘金数据
  arrangeJuejinData () {

  }
  // 掘金
  async juejinSendMessage () {
    if (this.juejinData.length === 0) {
      const juejinRes = await errorCaptured(async () => {
        return this.request({
          protocol: 'https:',
          host: 'web-api.juejin.im',
          pathname: '/query',
          method: 'post',
          body: {
            'operationName': '',
            'query': '',
            'variables': {
              'tags': [],
              'category': '5562b415e4b00c57d9b94ac8',
              'first': 20,
              'after': '',
              'order': 'POPULAR'
            },
            'extensions': {
              'query': {
                'id': '653b587c5c7c8a00ddf67fc66f989d42'
              }
            }
          }
        })
      })
      if (juejinRes[1]) {
        this.zhihuData = JSON.parse(juejinRes[1]).data
      }
    }
    if (this.juejinData.length === 0) {
      return
    }
    const data = this.arrangeJuejinData()
    const body = this.getDingTalkBody(data, 'feedCard')
    // 前端技术大佬内部群
    await errorCaptured(async () => {
      return this.request({
        protocol: 'https:',
        host: 'oapi.dingtalk.com',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        pathname: '/robot/send?access_token=39e10e2a467663a13a5df7b2400948c2cd9f73fc9bb8b4a67c65ed4090f1d2e5',
        method: 'post',
        body
      })
    })
  }
  robot () {
    const leetcodeDelay = 10 * 60 * 1000
    this.everyDayOnceTask({
      callback: () => {
        this.leetcodeSendMessage()
      },
      delay: leetcodeDelay,
      status: true,
      hour: 10
    })
    const zhihuDelay = 30 * 60 * 1000
    this.everyDayManyTask({
      callback: () => {
        this.zhihuSendMessage()
      },
      startNum: 10,
      delay: zhihuDelay,
      intervalHours: [10, 22]
    })
  }
}
const main = new Main()
main.robot()
