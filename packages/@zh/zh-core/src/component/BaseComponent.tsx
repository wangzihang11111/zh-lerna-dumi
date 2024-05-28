import { ModalFuncProps } from 'antd/lib/modal';
import React from 'react';
import { OType } from '../enum';
import type { IObject, PromiseType } from '../interface';
import { core, Observer } from '../util';

type Dispatch<P = any, C = (payload: P) => void> = (action: {
  type: string;
  payload?: P;
  callback?: C;
  [key: string]: any;
}) => any;

/**
 * 基础组件class库
 */
export class ZhComponent<P = any, S = any, R = any> extends React.Component<P, S> {
  _primaryKey: string = '';
  state = {} as S;

  // 暴露组件内部实例，例：compHoc使用ins.outRef获取组件类的实例
  outRef = React.createRef<R>();

  // 组件的高阶函数实例
  _compIns: any = null;

  async innerNotify(args: any[], type: string) {
    return [];
  }

  innerSubscribe(fn: Function, type, condition?: Function) {
    return () => {};
  }

  getId(autoCreate = true) {
    if (!this._primaryKey) {
      this._primaryKey = this.props['id'] || this.props['data-cid'] || (autoCreate ? core.uniqueId() : '');
    }
    return this._primaryKey;
  }

  static propsToState(
    nextProps,
    prevState,
    keys = ['value'],
    options: { separator?: string; propToState?: (propKey: string, propValue: any) => any } = {}
  ) {
    const { separator = '|', propToState } = options;
    const compareProps = prevState?.props || {}; // 这个props可以被当做缓存，仅用作判断
    // 当传入的keys发生变化的时候，更新state
    const obj: any = {};
    const newProps = { ...nextProps };
    let hasChanged = false;
    keys.forEach((key) => {
      const arr = key.split(separator);
      const propKey = arr[0];
      const stateKey = arr.length > 1 ? arr[1] : propKey;
      // 属性存在，则比较
      const propValue = nextProps[propKey];
      if (nextProps.hasOwnProperty(propKey) && propValue !== compareProps[propKey]) {
        hasChanged = true;
        obj[stateKey] = propToState?.(propKey, propValue) ?? propValue;
      }
    });
    if (hasChanged) {
      return { ...obj, props: newProps };
    }
    // 否则，对于state不进行任何操作
    return null;
  }

  /**
   * 默认浅比较，可以在继承类里面重写该方法
   * @param nextProps
   * @param nextState
   * @param nextContext
   */
  shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean {
    return !(core.isPropsEqual(nextProps, this.props) && core.isPropsEqual(nextState, this.state));
  }
}

interface BaseComponentLifecycle {
  umiDispatch: Dispatch;
  getDvaState: (ns?: string) => any;

  getLang(): object;

  componentAsyncMount?(): Promise<any>;

  componentAllReady?(...args): void;

  closeCheck?(): PromiseType<Boolean | ModalFuncProps>;
}

/**
 * 基础页面class实例
 */
export class BaseComponent<P = any, S = any, R = any, Hooks = any>
  extends ZhComponent<P, S, R>
  implements BaseComponentLifecycle
{
  private readonly _language: any = {};
  private _observer: Observer | undefined;
  private customHooks: Hooks = {} as Hooks;
  private _refMaps = new Map<React.Key, React.RefObject<any>>();
  OType = OType;

  constructor(props) {
    super(props);
    this._language = props.language;
    this._observer = props.__parent__?.observer;
  }

  refreshButtonRights({ orgId, rightName }: { orgId?: string; rightName?: string } = {}) {
    return (this.props as any).__parent__?.refreshButtonRights?.({ orgId, rightName });
  }

  createHooks = () => {
    // 二开脚本加载完成
    return new Promise<Hooks>((resolve) => {
      const un = this.observer.subscribe(() => {
        un();
        resolve(this.customHooks);
      }, 'onScriptLoad');
    });
  };

  get busType() {
    return (this.props as any).__parent__?.busType;
  }

  get observer() {
    if (!this._observer) {
      this._observer = new Observer();
    }
    return this._observer;
  }

  getRef<R = any>(key) {
    if (!this._refMaps.has(key)) {
      this._refMaps.set(key, React.createRef<R>());
    }
    return this._refMaps.get(key) as React.RefObject<R>;
  }

  removeRef(key) {
    this._refMaps.delete(key);
  }

  componentWillUnmount(): void {
    this.observer?.clear();
    this._refMaps?.clear();
  }

  subscribe(fn: Function, type, condition?: Function) {
    return this.observer.subscribe(fn, type, condition);
  }

  umiDispatch = (action: { type: string } & IObject) => {
    const { dispatch, getDvaName } = this.props as any;
    if (dispatch) {
      if (action.type.indexOf('/') === -1) {
        action.type = `${getDvaName()}/${action.type}`;
      }
      return dispatch(action);
    }
  };

  getDvaState = (ns?: string) => {
    const { getDvaState } = this.props as any;
    return getDvaState?.(ns);
  };

  getLayout = () => {
    return this.getDvaState('model_global')?.layoutConfig;
  };

  /**
   * 多语言
   */
  getLang(key?, dv?) {
    if (!key && !dv) {
      return this._language || {};
    }
    return this._language?.[key] || dv || key;
  }

  // 加载异步数据
  async componentAsyncMount() {}

  // 数据状态加载完成
  componentAllReady(...args): void {}

  /**
   * 关闭时检查，返回false或者对象时，弹出关闭提示框
   */
  closeCheck(): PromiseType<Boolean | ModalFuncProps> {
    return true;
  }
}
