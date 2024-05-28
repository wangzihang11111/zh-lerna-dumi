import { defineConfig } from 'dumi';
import path from 'path';

require('events').EventEmitter.defaultMaxListeners = 0; // 解除node监听器的limit数量限制警告
const publicPath = process.env.NODE_ENV === 'production' ? './' : '/';

export default defineConfig({
  runtimePublicPath: {},
  publicPath,
  headScripts: [`window.publicPath='${publicPath}';`],
  alias: {
    '@zh/zh-core': path.join(__dirname, 'node_modules/@zh/zh-core/src'),
    '@zh/zh-design': path.join(__dirname, 'node_modules/@zh/zh-design/src'),
  },
  plugins: [
    '@umijs/plugins/dist/dva',
    '@umijs/plugins/dist/initial-state',
    '@umijs/plugins/dist/model',
    '@umijs/plugins/dist/request',
    path.join(__dirname, '.dumi/plugin/api/index.ts')
  ],
  dva: { skipModelValidate: true, lazyLoad: true },
  model: {},
  initialState: {},
  request: {},
  // devtool: 'eval',
  favicons: ['images/logo.png'],
  locales: [{ id: 'zh-CN', name: '中文' }],
  exportStatic: {},
  history: {
    type: 'hash'
  },
  oldApiParser: true, // dumi2的api解析有坑，暂时使用自定义的.dumi/plugin/api
  // apiParser: {},
  // resolve: {
  //   // 配置入口文件路径，API 解析将从这里开始
  //   entryFile: '.dumi/resolveEntry/index.ts'
  // },
  ignoreMomentLocale: true,
  logo: 'images/logo.png',
  // 用于替换 __VERSION__ pkg.version
  extraBabelPlugins: ['version'],
  themeConfig: {
    hd: {
      rules: []
      // 更多 rule 配置访问 https://github.com/umijs/dumi/blob/master/packages/theme-mobile/src/typings/config.d.ts#L7
    },
    name: 'Zh Design',
    nav: [
      { title: '指南', link: '/doc', activePath: '/doc' },
      { title: '基础组件', link: '/base/tool-bar', activePath: '/base' },
      { title: '业务组件', link: '/business/query-panel', activePath: '/business' },
    ] as any,
    footer: 'Copyright © 2023  Powered by 中建数科 技术与大数据平台组'
  },
  chainWebpack: function (config, options) {
    if (process.env.NODE_ENV === 'production') {
      config.merge({
        optimization: {
          minimize: true,
          splitChunks: {
            chunks: 'async',
            minSize: 30000,
            minChunks: 1,
            automaticNameDelimiter: '.',
            cacheGroups: {
              default: {
                minChunks: 2,
                reuseExistingChunk: true,
                priority: -50
              }
            }
          }
        }
      });
      const CompressionWebpackPlugin = require('compression-webpack-plugin');
      config.plugin('compression-webpack-plugin').use(
        new CompressionWebpackPlugin({
          algorithm: 'gzip', // 指定生成gzip格式
          test: /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i, // 匹配哪些格式文件需要压缩
          threshold: 10240, //对超过10k的数据进行压缩
          minRatio: 0.6 // 压缩比例，值为0 ~ 1
        })
      );
    }
  },
  proxy: {
    '/proxy': {
      // 已api开头的请求自动代理
      // target: 'http://10.35.199.51:30090/', // 代理的徐晨可地址
      target: 'http://10.18.3.205:8081/', // 代理的真实请求地址
      //  target: 'http://10.239.54.76/', // 代理的真实请求地址
      pathRewrite: { '^/proxy': '' },
      changeOrigin: true
    }
    // '/proxy/fileSrv': {
    //   target: 'http://10.18.3.205:8081/', // 代理的真实请求地址
    //   pathRewrite: { '^/proxy': '' },
    //   changeOrigin: true
    // }
  }
  // more config: https://d.umijs.org/config
});
