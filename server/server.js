const https = require('https')
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
  everyDayOnceTask ({ callback, delay, hour, status }) {
    const currDate = new Date()
    const currHour = currDate.getHours()
    if (currHour === hour && status) {
      status = false
      callback()
    } else if (currHour !== hour) {
      status = true
    }
    setTimeout(() => {
      this.everyDayOnceTask({ callback, delay, hour, status })
    }, delay)
  }
  everyDayManyTask ({ callback, num, intervalHours, delay }) {
    const currDate = new Date()
    const currHour = currDate.getHours()
    const intervalSmallHour = intervalHours[0]
    const intervalLargeHour = intervalHours[1]
    if (num > 0 && currHour >= intervalSmallHour && currHour <= intervalLargeHour) {
      --num
      callback()
    } else {
      delay = 30 * 60 * 1000
    }
    const difference = intervalLargeHour - currHour
    if (difference >= 2 && num > 0) {
      delay = (difference - 1) / num * 60 * 60 * 1000
    }
    setTimeout(() => {
      this.everyDayOnceTask({ callback, num, intervalHours, delay })
    }, delay)
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
    const leetcodeRes = await this.request({
      protocol: 'https:',
      host: 'leetcode-cn.com',
      pathname: '/api/problems/all/',
      method: 'GET'
    })
    const leetCodeData = JSON.parse(leetcodeRes).stat_status_pairs
    if (!leetCodeData || leetCodeData.length === 0) {
      return
    }
    const value = this.getRandomValue(JSON.parse(leetcodeRes).stat_status_pairs)
    const body = this.getDingTalkBody(this.arrangeLeetcodeData(value), 'actionCard')
    const dingtalkRes = await this.request({
      protocol: 'https:',
      host: 'oapi.dingtalk.com',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      pathname: '/robot/send?access_token=37850974cf16cebeaf14e1316aa6ae4a045897202757ef29201a098a78572c87',
      method: 'post',
      body
    })
    return dingtalkRes
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
      const zhihuRes = await this.request({
        protocol: 'https:',
        host: 'www.zhihu.com',
        pathname: '/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true',
        method: 'GET'
      })
      this.zhihuData = JSON.parse(zhihuRes).data
    }
    const data = this.arrangeZhihuData()
    const body = this.getDingTalkBody(data, 'feedCard')
    const dingtalkRes = await this.request({
      protocol: 'https:',
      host: 'oapi.dingtalk.com',
      headers: {
        'Content-Type': 'application/json;charset=utf-8'
      },
      pathname: '/robot/send?access_token=39e10e2a467663a13a5df7b2400948c2cd9f73fc9bb8b4a67c65ed4090f1d2e5',
      method: 'post',
      body
    })
    return dingtalkRes
  }
  robot () {
    const leetcodeDelay = 10 * 60 * 1000
    this.everyDayOnceTask({
      callback: () => {
        this.leetcodeSendMessage()
      },
      delay: leetcodeDelay,
      status: true,
      hour: 20
    })
    const zhihuDelay = 30 * 60 * 1000
    this.everyDayManyTask({
      callback: () => {
        this.zhihuSendMessage()
      },
      num: 10,
      delay: zhihuDelay,
      intervalHours: [10, 22]
    })
  }
}
const main = new Main()
main.robot()
