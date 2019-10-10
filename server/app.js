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
app.use(async (ctx, next) => {
  const {
    req,
    res,
    response,
    request
  } = ctx
  ctx.set({
    'Access-Control-Allow-Origin': ctx.headers.origin,
    'Access-Control-Allow-Methods': 'DELETE,PUT,POST,GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Cookie, Host',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json;charset=utf-8'
  })
  await next()
  let method = ctx.method.toLocaleUpperCase()
  if (method === 'OPTIONS') {
    ctx.status = 200
    res.end()
  }
})
// 所有路由
async function promiseRequest (ctx) {
  let data = ''
 return new Promise((resolve, reject) => {
   const headers = {
     ...ctx.headers,
     host: 'wa.leyaoyao.com',
     origin: 'https://wa.leyaoyao.com',
     referer: 'https://wa.leyaoyao.com/'
   }
  const req = https.request({
    hostname: 'wa.leyaoyao.com',
    // port: 443,
    path: ctx.url,
    method: ctx.method,
    headers
  }, (res) => {
console.log(res)
    res.on('data', (result) => {
      data += result.toString('utf8')
    })
    res.on('end', () => {
      resolve(data)
    })
  })

  req.on('error', (e) => {
    reject(e)
  })
  // req.write(JSON.stringify(ctx.request.body || {}))
  req.end(JSON.stringify(ctx.request.body || {}), 'utf8', (resu) => {
    console.log(resu)
  })
 })
}
router.post('/wawawu/rest/login', async ctx => {
})
router.post('/wawawu/rest/orderpayment/queryOrderRecordList', async ctx => {
  try {
    const result = await promiseRequest(ctx)
    ctx.body = result
    ctx.status = 200
  } catch (e) {
    console.log(e)
  }
})
app.use(router.routes())
// spa页
// app.use(Router.get('*', async (cxt, next) => {
//   console.log('gg')
//   fs.readFile(path.join(__dirname, '../dist/index.html'), 'utf-8', (err, content) => {
//     if (err) {
//       console.log('We cannot open 'index.html' file.')
//     }
//     cxt.type = 'html'
//     cxt.status = 200
//     cxt.body = content
//   })
//   console.log(`http://${hostname}:${port}`)
// }).routes())
app.listen(10010)
