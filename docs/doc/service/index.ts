import { zh } from '@zh/zh-design';

export async function getDetail() {
  await zh.delay(100);
  return { content: '高度自适应111' };
}

export async function getPageParams() {
  return {
    pageParams: [
      { key: 'model', des: '当前连接的 dva model实例，支持导入' },
      { key: 'component', des: '定义业务组件，必须为类组件，方便获取二开实例' },
      { key: 'busType', des: '当前业务类型，也可以在model中定义' },
      { key: 'injectSrc', des: '声明需要加载的静态js文件' },
      { key: 'injectProps', des: '用于向业务组件内部注入额外属性，异步方法，参数为当前model的状态' },
      {
        key: 'initLoad',
        des: '用于声明需要初始化加载的请求，包括二开脚本、多语言、ui元数据、灵动菜单，默认值：{ script: true, language: true, ui: true }'
      }
    ]
  };
}
