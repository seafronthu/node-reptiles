const Koa = require('koa')
const https = require('https')
const path = require('path')
// const fs = require('fs')
const staticCache = require('koa-static-cache') // 静态资源
const bodyParser = require('koa-bodyparser') // 请求内容
const Router = require('koa-router')
// const fs = require('fs')
const router = new Router()
const app = new Koa()
app.use(staticCache(path.join(__dirname, '../dist'), {
  maxAge: 365 * 24 * 60 * 60,
  gzip: true
}))
app.use(bodyParser())
// 所有路由
router.post('/wawawu/rest/login', async ctx => {
  const req = https.request({
    hostname: 'wa.leyaoyao.com',
    // port: 443,
    path: ctx.url,
    method: ctx.method,
    headers: ctx.headers
  }, (res) => {
    console.log('状态码:', res.statusCode)
    console.log('请求头:', res.headers)

    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })

  req.on('error', (e) => {
    console.error(e)
  })
  req.end()
})
router.post('/wawawu/rest/orderpayment/queryOrderRecordList', async ctx => {
  const req = https.request({
    hostname: 'wa.leyaoyao.com',
    // port: 443,
    path: ctx.url,
    method: ctx.method,
    headers: ctx.headers
  }, (res) => {
    console.log('状态码:', res.statusCode)
    console.log('请求头:', res.headers)

    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })

  req.on('error', (e) => {
    console.error(e)
  })
  req.end()
})
app.use(router.routes())
// spa页
// app.use(Router.get('*', async (cxt, next) => {
//   console.log('gg')
//   fs.readFile(path.join(__dirname, '../dist/index.html'), 'utf-8', (err, content) => {
//     if (err) {
//       console.log('We cannot open "index.html" file.')
//     }
//     cxt.type = 'html'
//     cxt.status = 200
//     cxt.body = content
//   })
//   console.log(`http://${hostname}:${port}`)
// }).routes())
app.listen(10010)
