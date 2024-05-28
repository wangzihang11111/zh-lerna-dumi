export interface IModelType {
  /**
   * 是否全局，默认false，设置true时，路由切换不会自动还原初始状态
   */
  global?: boolean;
  /**
   * 命名空间，唯一key
   */
  namespace?: string;
  /**
   * 状态值
   */
  state: {} | Array<any>;
  /**
   * 副作用集合，处理异步请求
   */
  effects?: {};
  /**
   * 纯函数集合，更新状态值
   */
  reducers?: {};
  /**
   * 订阅，订阅路由变化，鼠标、窗口、键盘等，对象里面方法名可以根据事件类型定义，方法的参数为{ dispatch, history }
   */
  subscriptions?: Record<string, ({ dispatch, history }, done) => void>;
}
