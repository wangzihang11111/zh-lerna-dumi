function mergeConfig(defaultCfg, cfg) {
  Object.keys(cfg).forEach((key) => {
    if (Object.prototype.toString.call(cfg[key]) === '[object Object]') {
      defaultCfg[key] = { ...defaultCfg[key], ...cfg[key] };
    } else {
      defaultCfg[key] = cfg[key];
    }
  });
  return defaultCfg;
}

/**
 * 配置umi.ts
 * @param config
 */
export function initUmiConfig(config: Record<string, any> = {}) {
  const { chainWebpack, headScripts = [], mfsu, ...others } = config;
  const publicPath = process.env.NODE_ENV === 'production' ? './' : '/';
  const { shared, ...mfsuCfg } = mfsu || {};
  const productionConfig: any = mergeConfig(
    {
      runtimePublicPath: {},
      publicPath,
      headScripts: [`window.publicPath='${publicPath}';`, ...headScripts],
      base: '/',
      ignoreMomentLocale: true,
      history: {
        type: 'hash'
      },
      model: {},
      antd: { import: false },
      request: false,
      initialState: {},
      locale: {
        antd: true,
        default: 'zh-CN'
      },
      mock: {},
      layout: false,
      dva: { skipModelValidate: true, lazyLoad: true },
      mfsu: {
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          dva: { singleton: true },
          '@zh/zh-core': { singleton: true },
          '@zh/zh-design': { singleton: true },
          '@zh/zh-mobile-ui': { singleton: true },
          ...shared
        },
        strategy: 'eager',
        ...mfsuCfg
      }
    },
    others
  );

  if (process.env.NODE_ENV === 'production') {
    productionConfig.hash = true;

    productionConfig.chainWebpack = function (config, options) {
      const CompressionWebpackPlugin = require('compression-webpack-plugin');
      config.plugin('compression-webpack-plugin').use(
        new CompressionWebpackPlugin({
          algorithm: 'gzip', // 指定生成gzip格式
          test: /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i, // 匹配哪些格式文件需要压缩
          threshold: 10240, //对超过10k的数据进行压缩
          minRatio: 0.6 // 压缩比例，值为0 ~ 1
        })
      );

      chainWebpack && chainWebpack(config, options);
    };
  } else {
    if (!productionConfig.chainWebpack && chainWebpack) {
      productionConfig.chainWebpack = chainWebpack;
    }
  }

  return productionConfig;
}
