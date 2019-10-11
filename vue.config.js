
// const { join, resolve } = require('path')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
// const CompressionWebpackPlugin = require('compression-webpack-plugin')
// const zopfli = require('@gfx/zopfli')
// const BrotliPlugin = require('brotli-webpack-plugin')
// const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i
module.exports = {
  // 修改webpack的配置
  configureWebpack: config => {
    // 把原本需要写在webpack.config.js中的配置代码 写在这里 会自动合并
    let plugins = []
    if (process.env.NODE_ENV === 'production') {
      plugins = [new CompressionWebpackPlugin({
        test: /\.js$|\.css$/, // 匹配文件名
        algorithm: 'gzip',
        // minRatio: 0,
        threshold: 0, // 对超过10k的数据进行压缩 服务端需判断是否有gz文件
        deleteOriginalAssets: false // 是否删除原文件
      })]
    }
    return {
      plugins
    }
  },
  // pluginOptions: {
  //   'style-resources-loader': {
  //     preProcessor: 'stylus',
  //     patterns: [
  //       resolve(__dirname, './src/assets/css/common.styl')
  //     ]
  //   }
  // },
  // css: {
  //   loaderOptions: {
  //     stylus: {
  //       import: resolve(__dirname, './src/assets/css/common.styl')
  //     }
  //   }
  // },
  // 打包时不生成.map文件
  productionSourceMap: false,
  // http://dev.hahaipi.com/wxxcx/index.php/Home/getMachineInfo
  devServer: {
    host: '0.0.0.0',
    port: 8080,
    https: false,
    hotOnly: false,
    proxy: 'http://127.0.0.1:9527'
    // proxy: {
    //   '/Home': {
    //     target: 'http://dev.hahaipi.com/', // 域名
    //     ws: false, // 是否启用websockets
    //     changOrigin: true // 开启代理：在本地会创建一个虚拟服务端，然后发送请求的数据，并同时接收请求的数据，这样服务端和服务端进行数据的交互就不会有跨域问题
    //   // pathRequiresRewrite: {
    //   //   '^Home': '/'
    //   // }
    //   }
    // }
  }
}
