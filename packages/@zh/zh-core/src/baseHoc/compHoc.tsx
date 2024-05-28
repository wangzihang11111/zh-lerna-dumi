import React, { ComponentClass, FunctionComponent, MutableRefObject } from 'react';
import type { ICurrentObject, IObject, TypeOmit } from '../interface';
import { core, getCurrentWindow, Observer } from '../util';
import { removePageCompMap, setPageCompMap } from '../util/base';

/**
 * 组件出错显示
 * @param data 显示数据
 * @constructor
 */
function ErrorResult({ data }) {
  return <span>{data.name || data.message || data.data}</span>;
}

const interceptEvents = ['onClick'];

/**
 * 过滤高阶组件的属性
 * @param props 组件属性
 * @param compIns 组件实例
 */
function filterProps(props: any, compIns) {
  const key = props.id;
  const displayName: any = compIns.props.displayName;
  if (['Button', 'ToolBar'].includes(displayName)) {
    interceptEvents.forEach((eventName) => {
      const currentEvent = props[eventName];
      const beforeEventName = `onBefore${eventName.substr(2)}`;
      const beforeEvent = props[beforeEventName];
      delete props[beforeEventName]; // 删除前置事件属性
      props[eventName] = async (...args) => {
        const obParams =
          args.length > 0
            ? {
                ...args[0],
                key: args[0].key || args[0].id,
                containerId: args[0].containerId,
                args
              }
            : {};
        if (obParams.containerId) {
          const beforeResult = await core.getPageObserver().get(obParams, beforeEventName);
          if (beforeResult === false) {
            return;
          }
        }
        const resultArr = await compIns.notify(
          {
            instance: compIns,
            args
          },
          beforeEventName
        );

        if (resultArr.length > 0 && resultArr.some((r) => r === false)) {
          console.log(`${beforeEventName} subscribe prevent`, resultArr);
          return;
        }

        if (beforeEvent) {
          const beforeResult = await beforeEvent(...args);
          if (beforeResult === false) {
            console.log(`${beforeEventName} event prevent`);
            return;
          }
          beforeResult !== undefined && resultArr.push(beforeResult);
        }

        const result = await currentEvent?.(...args);
        result !== undefined && resultArr.push(result);

        const results = await compIns.notify({ instance: compIns, args, value: resultArr }, eventName);
        if (result !== false && obParams.containerId) {
          await core.getPageObserver().get(obParams, eventName);
        }
        Array.prototype.push.apply(resultArr, results);

        const afterEventName = `onAfter${eventName.substr(2)}`;
        await compIns.notify({ instance: compIns, args, value: resultArr }, afterEventName);
        return result;
      };
    });
  }
  if (key) {
    props['data-cid'] = key;
    delete props.id; // id不往下传，防止子组件嵌套compHoc，导致getCmp获取不到真实的组件实例
  }
}

class ClassComp extends React.Component<any, any> {
  _compRef = React.createRef<any>();
  _proxy: any = null;
  _allApi: any = null;
  _observer: Observer | undefined;
  _page: any;

  componentIns = true;

  umiDispatch = (action) => {
    const { dispatch, getDvaName } = this.props.compProps;
    if (dispatch) {
      if (action.type.indexOf('/') === -1) {
        action.type = `${getDvaName()}/${action.type}`;
      }
      return dispatch(action);
    }
  };

  constructor(props: any) {
    super(props);
    this.state = { props: {}, errorInfo: null };
    (this._compRef as any)['current'] = {}; // 强制初始化空对象
    this._page = getCurrentWindow('currentPageInstance')?.page;
  }

  focus() {
    this.getRef()?.focus?.();
  }

  shouldComponentUpdate(nextProps, nextState): boolean {
    return !(core.isPropsEqual(nextProps.compProps, this.props.compProps) && core.isPropsEqual(nextState, this.state));
  }

  componentDidMount(): void {
    const { compProps, compName } = this.props;
    const propId = compProps.id || '';
    propId && setPageCompMap(propId, this);
    compName && setPageCompMap(compName, this, true);
    if (this._compRef.current) {
      this._compRef.current._compIns = this;
      this._compRef.current.innerNotify = (args: any[], type: string) => {
        return this.getObserver().notify(
          {
            instance: this,
            args
          },
          type
        );
      };
      this._compRef.current.innerSubscribe = (fn: Function, type: string, condition?: Function) => {
        return this.subscribe(fn, type, condition);
      };
    }
  }

  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<any>, snapshot?: any): void {
    const { compProps } = this.props;
    const newPropId = compProps.id || '';
    const oldPropId = prevProps.compProps.id || '';
    if (newPropId !== oldPropId) {
      oldPropId && removePageCompMap(this, oldPropId);
      newPropId && setPageCompMap(newPropId, this);
    }
  }

  componentWillUnmount(): void {
    const { compProps, compName } = this.props;
    const propId = compProps.id || '';
    this.getObserver().notify(this, 'componentWillUnmount').then();
    this.getObserver().clear('');
    propId && removePageCompMap(this, propId, compName);
    if (this._compRef.current) {
      delete this._compRef.current._compIns;
      delete this._compRef.current.innerNotify;
      delete this._compRef.current.innerSubscribe;
    }
  }

  getRef() {
    return this._compRef.current;
  }

  refreshComponent(cmpProps?: any) {
    this.setState((prev: any) => ({
      ...prev,
      props: { ...prev.props, ...cmpProps, 'data-timestamp': new Date().getTime() }
    }));
  }

  setReadOnly(readonly: boolean | Function = true) {
    this.setProps({ disabled: readonly });
  }

  setProps(newProps: IObject | ((innerProps, outerProps) => IObject)) {
    this.setState((prev: any) => ({
      ...prev,
      props: { ...prev.props, ...(core.isFunction(newProps) ? newProps(prev.props, this.props.compProps) : newProps) }
    }));
  }

  getProps(origin = false) {
    if (origin) {
      return { ...this.props.compProps };
    }
    const tmp = { ...this.props.compProps, ...this.state.props };
    if (tmp.hasOwnProperty('dispatch')) {
      tmp.umiDispatch = this.umiDispatch;
    }
    tmp.observer = this.getObserver();
    return tmp;
  }

  /**
   * 添加唯一事件，常用于注入前置事件，例如 onBeforeClick 等
   * @param event 省略前缀on后的事件名称， 驼峰规则
   * @param eventFn 事件
   */
  bindEvent(event: string, eventFn: Function) {
    const eventName = 'on' + core.toFirstUpperCase(event);
    this.getObserver().clear(eventName);
    return this.subscribe(eventFn, eventName);
  }

  getObserver() {
    if (!this._observer) {
      this._observer = this.getProps(true).observer || new Observer();
    }
    return this._observer as Observer;
  }

  notify(fn, type) {
    return this.getObserver().notify(fn, type);
  }

  subscribe(fn: Function, type, condition?: Function) {
    return this.getObserver().subscribe(fn, type, condition);
  }

  /**
   * 给同一事件绑定多个回调，例如 onClick 等
   * @param event 省略前缀on后的事件名称， 驼峰规则
   * @param eventFn 事件
   * @param once 只执行一次，默认false
   */
  on(event: string, eventFn: Function, once = false) {
    const eventName = 'on' + core.toFirstUpperCase(event);
    if (once) {
      const un = this.subscribe((...args) => {
        eventFn(...args);
        un();
      }, eventName);
      return un;
    } else {
      return this.subscribe(eventFn, eventName);
    }
  }

  /**
   * 调用所有组件api的入口
   * @param refresh 强制刷新api缓存
   */
  getApi(refresh = false) {
    if (refresh || !this._allApi) {
      this._allApi = {};
      const isApi = (ctx, key) => {
        const notApi = [
          'getApi',
          'getRef',
          'constructor',
          'render',
          'componentDidUpdate',
          'componentDidCatch',
          'componentWillUnmount',
          'componentDidMount',
          'shouldComponentUpdate'
        ];
        return (
          key.indexOf('_') !== 0 && core.isFunction(ctx[key]) && !notApi.includes(key) // && !this._allApi.hasOwnProperty(key)
        );
      };
      let context: any = this;
      while (context) {
        const obj = context.nodeType === 1 || context.__proto__ === Object.prototype ? context : context.__proto__;
        if (!context.isRepeatHoc) {
          // 嵌套高阶组件不需要复写api，直接使用顶层api
          if (context !== obj) {
            Object.getOwnPropertyNames(context).forEach((key) => {
              if (isApi(context, key)) {
                this._allApi[key] = context[key].bind(context);
              }
            });
            if (core.isFunction(context.setState)) {
              this._allApi['setState'] = context['setState'].bind(context);
            }
          }
          Object.getOwnPropertyNames(obj).forEach((key) => {
            if (isApi(obj, key)) {
              this._allApi[key] = obj[key].bind(context);
            }
          });
        }
        if (obj?.nodeType === 1) {
          ['select', 'focus', 'blur'].forEach((key) => {
            if (!this._allApi.hasOwnProperty(key) && core.isFunction(obj[key])) {
              this._allApi[key] = obj[key].bind(context);
            }
          });
        }
        // 子组件通过useExtendRef注入的api
        const injectApi = context.__injectApi__ || obj.__injectApi__;
        if (injectApi) {
          Object.getOwnPropertyNames(injectApi).forEach((key) => {
            if (isApi(injectApi, key)) {
              this._allApi[key] = injectApi[key].bind(context);
            }
          });
        }
        context = context.outRef?.current || (context.getRef ? context.getRef() : context._compRef?.current);
      }
    }
    Promise.resolve().then(() => {
      // 微任务中取消缓存，保证当前宏任务中多次调用是从缓存中取，提升性能
      this._allApi = null;
    });
    return this._allApi;
  }

  componentDidCatch(error: Error): void {
    console.log(error);
    this.setState({ errorInfo: error });
  }

  render() {
    const { comp: MyWrapper, isClass } = this.props;
    const newProps: any = this.getProps(false);
    filterProps(newProps, this);
    newProps[isClass ? 'ref' : 'outRef'] = this._compRef;
    return this.state.errorInfo ? <ErrorResult data={this.state.errorInfo} /> : <MyWrapper {...newProps} />;
  }
}

/**
 * 组件高阶函数
 * @param Comp 基础组件
 * @param displayName
 */
export function compHoc<P, T = any>(
  Comp: FunctionComponent<P & { outRef: MutableRefObject<T> }> | ComponentClass<any, any>,
  displayName = ''
) {
  const defaultId = displayName || Comp.displayName;
  const compName = defaultId ? `__${defaultId}__` : '';

  return React.forwardRef<ICurrentObject<T>, TypeOmit<P & { id?: string }, 'outRef'>>((props: any, ref: any) => {
    return (
      <ClassComp
        ref={ref}
        comp={Comp}
        compName={compName}
        displayName={displayName}
        compProps={props}
        isClass={!!Comp.prototype?.isReactComponent}
      />
    );
  });
}
