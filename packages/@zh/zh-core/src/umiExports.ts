// @ts-nocheck
import type { History } from '@umijs/renderer-react';
import {
  connect,
  Provider,
  useDispatch as dispatchHook,
  useSelector as selectorHook,
  useStore as storeHook
} from 'dva';
import React from 'react';
import { Connect, DefaultRootState, RootStateOrAny } from 'react-redux';
import { Action, AnyAction, Dispatch, Store } from 'redux';
import { getGlobalConfig } from './globalConfig';
import { IObject } from './interface';
import { core } from './util';
import { getCurrentWindow } from './util/core';

const global = getCurrentWindow();
const getApp = () => null;
const modelHook = () => null;

global['umi_hooks'] = null;

const proxyHistory = new Proxy(
  {},
  {
    get(target, key) {
      const umiHistory = window.history;
      // 兼容 umi4 前版本
      if (key === 'location') {
        return { ...umiHistory[key], query: core.getQueryValue('') };
      }
      if (core.isString(key) && !umiHistory.hasOwnProperty(key) && !['$$typeof'].includes(key)) {
        if (key === 'goBack') {
          return () => umiHistory.go(-1);
        }
        console.error(`history.${key} not support in umi4`);
      }
      return umiHistory[key];
    }
  }
);

function getUmiApp(name, defaultExport) {
  const umiExport = global['umi_hooks']?.()?.[name];

  if (name.indexOf('use') === 0 && getGlobalConfig().disableDva) {
    return () => void 0;
  }

  if (name === 'history' && umiExport) {
    // 兼容 umi4 前版本
    !umiExport.goBack &&
      Object.defineProperty(umiExport, 'goBack', {
        get() {
          return () => umiExport.go(-1);
        }
      });
  }
  return umiExport || defaultExport;
}

/**
 * 设置项目中umi的导出对象引用，解决启用mfsu模式，getDvaApp获取不到返回值
 * @param umiHooks
 */
export function setUmiHooks(umiHooks: () => { getDvaApp: () => any } & IObject) {
  global['umi_hooks'] = umiHooks;
}

export function getDvaApp() {
  return getUmiApp('getDvaApp', getApp)();
}

export function getConnect(): Connect {
  return getUmiApp('connect', connect);
}

export function getHistory(): History & { goBack(): void; location: History['location'] & { query: IObject } } {
  return getUmiApp('history', proxyHistory);
}

export function useHistory() {
  return getHistory();
}

export function useDispatch<A extends Action = AnyAction>(): Dispatch<A> {
  return getUmiApp('useDispatch', dispatchHook)();
}

export function useStore<S = RootStateOrAny, A extends Action = AnyAction>(): Store<S, A> {
  return getUmiApp('useStore', storeHook)();
}

export function useSelector<TState = DefaultRootState, TSelected = unknown>(
  selector: (state: TState) => TSelected,
  equalityFn?: (left: TSelected, right: TSelected) => boolean
): TSelected {
  return getUmiApp('useSelector', selectorHook)(selector, equalityFn);
}

export function useModel<T = any>(namespace, selector?): T {
  return getUmiApp('useModel', modelHook)(namespace, selector);
}

export function getDvaProvider() {
  const InnerProvider = getUmiApp('Provider', Provider);
  const { _store: store } = getDvaApp() || {};
  return ({ children }) => React.createElement(InnerProvider, { store, children });
}

/**
 * 获取乾坤主应用的props传递状态
 */
export function useQkState() {
  const state = useModel('@@qiankunStateFromMaster') || { isRunMaster: false };
  if (!state.hasOwnProperty('isRunMaster')) {
    state.isRunMaster = true;
  }
  return state;
}
