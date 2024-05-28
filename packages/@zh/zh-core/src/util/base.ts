import React from 'react';
import ReactDOM from 'react-dom';
import type { ICurrentObject, IObject } from '../interface';
import { getDvaApp } from '../umiExports';
import { getCurrentWindow } from './core';
import { Observer } from './observer';
import { CreateRequest } from './request';
import { CacheObj, clearTemporaryCache, util } from './tool';

const global = getCurrentWindow();

function batchedUpdates(callback: () => any) {
  ReactDOM.unstable_batchedUpdates(callback);
}

/**
 * 查询组件实例是否是要查找的id
 * @param ins 组件实例
 * @param matchId 需要查找的id
 * @private
 */
const _isMatch = (ins: any, matchId: string) => {
  if (!ins) return false;
  const nodeId = ins.id || ins?.props?.id;
  return matchId === nodeId && ins.componentIns;
};

/**
 * 递归查找页面中的实例组件
 * @param node 虚拟dom节点
 * @param matchId 需要查找的实例id
 * @private
 */
const _findNode: any = (node: any, matchId: string) => {
  if (!node) return null;
  if (_isMatch(node.stateNode, matchId)) {
    return node.stateNode;
  }
  return _findNode(node.sibling, matchId) || _findNode(node.child, matchId);
};

/**
 * 获取page页面下的组件实例
 * @param id 组件id
 * @private
 */
const _getCmp = (id: string): ICurrentObject => {
  const ins: any = depUtil.getPageInstance();
  const map = depUtil.getCompMap();
  const dv = {
    getApi(): any {
      return undefined;
    },
    error: true
  };

  if (id && map) {
    if (map.has(id)) {
      return map.get(id);
    } else if (ins) {
      let currentNode = (ins._reactInternalFiber || ins._reactInternals).child; // 当前节点
      return _findNode(currentNode, id) || dv;
    }
  }
  return dv;
};

/**
 * 返回一个对象属性读取器
 * @param get 方法
 */
function _getProxy(get: (target: any, p: any) => any): any {
  if (global.Proxy) {
    return new Proxy({}, { get });
  }
  console.warn('browser not support proxy!');
  return {};
}

/**
 * 注册page ready事件
 * @param fn
 * @param eventKey
 */
function registerReadyEvents(fn: Function, eventKey = CacheObj.ALL_READY_EVENTS, priorityTop: boolean = false) {
  if (CacheObj[eventKey]) {
    if (priorityTop) {
      CacheObj[eventKey].unshift(fn);
    } else {
      CacheObj[eventKey].push(fn);
    }
  } else {
    CacheObj[eventKey] = [fn];
  }
}

export function safeExec(func: Function) {
  try {
    func();
  } catch (e) {
    console.warn(e);
  }
}

const pcExternalObj: any = {};

const appExternalObj: any = {};

export function isPC() {
  return global['__env__'] === 'pc';
}

const externalObj = _getProxy((_, p) => {
  const result = pcExternalObj[p];
  if (isPC()) {
    return result;
  }
  return appExternalObj[p] || result;
});

/**
 * 注册外部扩展方法到zh
 * @param obj
 * @param isApp 是否app注册
 */
export function registerExternal(obj: IObject, isApp = false) {
  if (isApp) {
    Object.assign(appExternalObj, obj);
  } else {
    Object.assign(pcExternalObj, obj);
  }
}

/**
 * 执行AllReady
 */
function execReadyEvents(eventKey = CacheObj.ALL_READY_EVENTS) {
  const readyEvents = CacheObj[eventKey];
  if (readyEvents) {
    let event = readyEvents.shift();
    while (event) {
      safeExec(event);
      event = readyEvents.shift();
    }
  }
}

export enum PageState {
  UnInit = -2,
  Destroy = -1,
  Init = 0,
  PageReady = 1,
  AllReady = 2
}

global['currentPageInstance'] = {
  page: null,
  state: PageState.UnInit,
  compMap: new Map(),
  unSubscribeFn: new Set<Function>()
};

function destroyPage() {
  const currentPageInstance = global['currentPageInstance'];
  const pageIns = currentPageInstance.page;
  if (!pageIns) {
    return;
  }
  const unSets = currentPageInstance.unSubscribeFn;
  if (unSets) {
    for (let fn of unSets) {
      util.isFunction(fn) && fn();
    }
    unSets.clear();
  }
  currentPageInstance.page.destroyPage?.();
  currentPageInstance.page = null;
  currentPageInstance.state = PageState.Destroy;
  currentPageInstance.compMap.clear();
  // 取消脚本事件
  CacheObj[CacheObj.ALL_READY_EVENTS] = [];
  CacheObj[CacheObj.PAGE_READY_EVENTS] = [];
}

/**
 * 是否当前页面
 * @param page
 */
function isCurrentPage(page) {
  return page === global['currentPageInstance']?.page;
}

/**
 * 设置当前页面的page实例
 * @param ins page实例
 * @param state 状态
 */
export function setPageInstance(ins: any, state: PageState) {
  const currentPageInstance = global['currentPageInstance'];
  switch (state) {
    case PageState.Init:
      destroyPage();
      global['currentPageInstance'] = {
        page: ins,
        state: PageState.Init,
        compMap: new Map(),
        unSubscribeFn: new Set()
      };
      break;
    case PageState.PageReady:
      if (isCurrentPage(ins) && currentPageInstance.state !== PageState.PageReady) {
        currentPageInstance.state = PageState.PageReady;
        execReadyEvents(CacheObj.PAGE_READY_EVENTS);
      }
      break;
    case PageState.AllReady:
      if (ins.asyncEffectCount > 0 || ins.unmount) {
        return;
      }
      if (isCurrentPage(ins) && currentPageInstance.state !== PageState.AllReady) {
        currentPageInstance.state = PageState.AllReady;
        execReadyEvents(CacheObj.ALL_READY_EVENTS);
      }
      break;
    case PageState.Destroy: {
      if (isCurrentPage(ins) && currentPageInstance.state !== PageState.Destroy) {
        destroyPage();
        clearTemporaryCache(ins.href);
        const dvaNs = ins.props.getDvaName?.();
        const app = getDvaApp();
        if (app) {
          app._clearDevUI?.();
          if (dvaNs) {
            const initState = app._initState?.[dvaNs];
            const currentState = ins.props.getDvaState?.();
            if (initState && currentState) {
              // 卸载时还原数据状态，直接修改数据源的值可以避免多次render
              Object.keys(currentState).forEach((k) => {
                if (initState.hasOwnProperty(k)) {
                  currentState[k] = initState[k];
                } else {
                  delete currentState[k];
                }
              });
            }
          }
        }
      }
      break;
    }
    default:
      break;
  }
}

export function setPageCompMap(key, comp, setCompType = false) {
  const compInPage = comp._page;
  const map = depUtil.getCompMap();
  if (map && isCurrentPage(compInPage)) {
    if (setCompType) {
      const typeIns = map.get(key) || [];
      typeIns.push?.(comp);
      map.set(key, typeIns);
    } else {
      if (map.has(key)) {
        console.warn(`组件id:[${key}]出现重复`);
      }
      map.set(key, comp);
    }
  }
}

export function removePageCompMap(comp, key, compType?) {
  const compInPage = comp._page;
  if (isCurrentPage(compInPage)) {
    const map = depUtil.getCompMap();
    if (key && map.has(key)) {
      map.delete(key);
    }
    if (compType) {
      const typeIns = map.get(compType);
      if (!typeIns) return;
      typeIns.splice(typeIns.indexOf(comp), 1);
      if (typeIns.length === 0) {
        map.delete(compType);
      }
    }
  }
}

function getPageLoadState() {
  return global['currentPageInstance']?.state;
}

const globalObserver = new Observer();
const gloablRequest = new CreateRequest();

/**
 * 依赖其他库或当前环境的对象和方法
 */
export const depUtil = {
  external: externalObj,
  request: gloablRequest,
  batchedUpdates,
  getObserver(): Observer {
    return (
      externalObj.getMasterObserver?.() ||
      externalObj.getQianKun?.()?.getMasterInfo?.()?.getObserver?.() ||
      globalObserver
    );
  },
  /**
   * 获取页面实例的observer对象，用于监听事件
   */
  getPageObserver(): Observer {
    return depUtil.getPageInstance()?.observer || depUtil.getObserver();
  },
  /**
   * 是否ReactElement元素
   * @param obj
   */
  isReactElement: (obj: any) => React.isValidElement(obj),
  /**
   * 是否运行在主应用中（子应用模式下有效）
   */
  isRunMaster: !!global['__POWERED_BY_QIANKUN__'],
  /**
   * 获取当前page实例
   */
  getPageInstance() {
    return global['currentPageInstance']?.page?.compRef?.current || global['currentPageInstance']?.page;
  },
  getPageLoadState,
  getCompMap() {
    return global['currentPageInstance']?.compMap;
  },
  getPageLang() {
    const ins = depUtil.getPageInstance();
    return ins?.getLang?.() || {};
  },
  getPageUI() {
    return global['ui_layout_config']?.layout;
  },
  getPageState() {
    const ins = depUtil.getPageInstance();
    return ins?.getDvaState?.() || {};
  },
  getCmp(id: string) {
    return _getCmp(id);
  },
  getCmpByType(type: string) {
    return _getCmp(`__${type}__`);
  },
  getCmpApi(id: string) {
    return _getCmp(id)?.getApi();
  },
  getComponentRef(id: string) {
    return _getCmp(id)?.getRef();
  },
  /**
   * 获取当前加载的form实例
   */
  getForms() {
    return depUtil.getCompMap()?.get('__Form__') || [];
  },
  /**
   * 获取当前加载的grid实例
   */
  getGrids() {
    return depUtil.getCompMap()?.get('__Grid__') || [];
  },
  /**
   * 组件示例代理，直接通过id获取组件示例
   */
  compIns: _getProxy((target, p) => {
    return typeof p === 'string' ? _getCmp(p) : target;
  }),
  query(type: string) {
    if (!type) return [];
    return depUtil.compIns[`__${type}__`] || [];
  },
  /**
   * alert提示框
   * @param content alert内容
   * @param type 弹出方式
   * @param others 其他可选配置项
   */
  alert(content: React.ReactNode, type: 'default' | 'single' | 'multiple' = 'default', others: IObject = {}) {
    if (!content) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      if (externalObj['showModal']) {
        if (global['currentAlert']?.ins && type !== 'multiple') {
          if (type === 'single') {
            global['currentAlert'].content = [content];
          } else {
            global['currentAlert'].content.push(content);
          }
          global['currentAlert'].ins.updateContent(
            getReactNodeContent(global['currentAlert'].content.join('\r\n')),
            others
          );
          return;
        }
        global['currentAlert'] = { ins: null, content: [content] };
        global['currentAlert'].ins = externalObj['showModal']({
          title: '提示',
          content: getReactNodeContent(content),
          width: 426,
          contentStyle: { padding: '24px 24px 0 24px', minHeight: 46 },
          zIndex: 1001,
          contentIcon: {
            type: 'InfoCircleFilled',
            style: {}
          },
          ...others,
          cancelText: false,
          closable: false,
          centered: false,
          okButtonProps: { style: { fontSize: 14, borderRadius: 6, height: 32, minWidth: 72 } },
          type: 'alert',
          onOk: (ins) => {
            global['currentAlert'] = null;
            ins.destroy();
            resolve('');
          }
        });
      } else {
        global.alert(content?.toString());
        resolve('');
      }
    });
  },

  /**
   * 确认提示框
   * @param content 确认内容
   * @param others 其他可选配置项
   */
  confirm(content: React.ReactNode, others: IObject = {}) {
    if (!content) {
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      if (externalObj['showModal']) {
        externalObj['showModal']({
          title: '提示',
          type: 'confirm',
          contentIcon: {
            type: 'QuestionCircleFilled',
            style: { color: '#faad14' }
          },
          content: getReactNodeContent(content),
          getContainer() {
            return document.body;
          },
          width: 426,
          contentStyle: { padding: '24px 24px 0 24px', minHeight: 46 },
          size: 'large',
          okText: '确定',
          cancelText: '取消',
          centered: false,
          okButtonProps: { style: { fontSize: 14, borderRadius: 6, height: 32, minWidth: 72 } },
          cancelButtonProps: { style: { fontSize: 14, borderRadius: 6, height: 32, minWidth: 72 } },
          zIndex: 1001,
          ...others,
          closable: false,
          onOk: (ins) => {
            ins.destroy();
            resolve(true);
          },
          onCancel: (ins) => {
            ins.destroy();
            resolve(false);
          }
        });
      } else {
        const ret: boolean = global.confirm(content?.toString());
        resolve(ret);
      }
    });
  },

  /**
   * 显示loading状态
   * @param visible
   */
  showLoading(visible: boolean | string = true) {
    if (externalObj['maskLoading']) {
      externalObj['maskLoading'](visible);
    } else {
      console.log(`showLoading:${visible}`);
    }
  },

  /**
   * 轻量级提示方式
   * @param content 提示信息
   * @param type 提示方式
   */
  message(content: string, type = 'info') {
    if (!content) {
      return Promise.resolve();
    }
    const message = externalObj['message'];
    if (message) {
      const ctx = getReactNodeContent(content, { paddingLeft: 21 });
      return message[type] ? message[type](ctx) : message['info']?.(ctx);
    } else {
      return new Promise((resolve) => {
        global.alert(content);
        resolve('');
      });
    }
  },
  openBlankUrl(url) {
    const btn: any = document.createElement('a');
    btn.target = '_blank';
    btn.href = url;
    btn.click();
  }
};

function getReactNodeContent(content, divStyle = {}) {
  let tmpContent: any = content;
  if (isPC() && util.isString(tmpContent) && tmpContent.indexOf('\r\n')) {
    tmpContent = React.createElement('span', {
      key: 'p0',
      children: tmpContent.split('\r\n').map((str, index) => {
        return index === 0 ? str : React.createElement('div', { key: `c${index}`, children: str, style: divStyle });
      })
    });
  }
  return tmpContent;
}

/**
 * AllReady 页面加载完成，包括useAsyncEffect内部的异步请求
 * @param fn 回调函数
 * @param options  delay是否需要延迟执行 from执行来源 priorityTop制定优先级
 * @param _from 同options.from,兼容历史版本，已废弃
 * @returns
 */
export function AllReady(
  fn: Function,
  options: { delay?: boolean; from?: string; priorityTop?: boolean } | boolean = {},
  _from = 'script'
) {
  if (!util.isFunction(fn)) {
    return;
  }
  const { delay = true, from = _from, priorityTop = false } = util.isObject(options) ? options : { delay: options };
  const wrapFn = delay ? setTimeout : (handler: () => any) => handler();
  wrapFn(() => {
    const readyFn = () => {
      from && util.debug({ msg: `执行${from}的AllReady回调` });
      // 批处理回调函数中的状态更新
      batchedUpdates(() => {
        fn(depUtil.getPageInstance() || {}, from);
      });
    };
    const pageState = getPageLoadState();
    if (pageState === PageState.UnInit) {
      // 没有用definePage定义的页面,加一个延迟以后直接执行
      setTimeout(() => {
        safeExec(readyFn);
      });
    } else {
      pageState === PageState.AllReady
        ? safeExec(readyFn)
        : registerReadyEvents(readyFn, CacheObj.ALL_READY_EVENTS, priorityTop);
    }
  });
}

export function PageReady<T = any>(fn: (page: any, config: any) => T) {
  if (!util.isFunction(fn)) {
    return;
  }
  const readyFn = () => {
    util.debug({ msg: `执行PageReady回调` });
    // 批处理回调函数中的状态更新
    batchedUpdates(() => {
      const page = depUtil.getPageInstance() || {};
      const hooks = fn(page, { ...util, ...depUtil }); // fn的返回值作为page的内置hooks
      if (util.isObject(hooks)) {
        page.customHooks = page.customHooks || {};
        Object.keys(hooks).forEach((k) => {
          if (util.isFunction(hooks[k])) {
            const lastHook = page.customHooks[k];
            page.customHooks[k] = async (...args) => {
              const prevResult = await lastHook?.(...args);
              const result = await hooks[k](...args);
              if (util.isObject(prevResult?.params) || util.isObject(result?.params)) {
                return { ...prevResult, ...result, params: { ...prevResult?.params, ...result?.params } };
              } else if (util.isObject(prevResult) || util.isObject(result)) {
                return { ...prevResult, ...result };
              }
              return result;
            };
          }
        });
      }
    });
  };
  [PageState.PageReady, PageState.AllReady].includes(getPageLoadState())
    ? safeExec(readyFn)
    : registerReadyEvents(readyFn, CacheObj.PAGE_READY_EVENTS);
}
