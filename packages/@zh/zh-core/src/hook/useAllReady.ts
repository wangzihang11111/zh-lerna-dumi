import { useEffect, useLayoutEffect, useRef } from 'react';
import { core, getCurrentWindow, getSubscribeCondition, type IPageCallbackParams } from '../util';
import { useRefCallback } from './useRefCallback';

export function useAllReady(fn: (page: any, params: IPageCallbackParams) => void) {
  const callback = useRefCallback(fn);
  useLayoutEffect(() => {
    // 页面级的ready必须优先二开执行
    //AllReady(callback, { delay: false, priorityTop: true, from: 'page' });
    core.AllReady(callback, null, { delay: false, priorityTop: true, from: 'page' });
  }, []);
}

interface IOptions {
  loading?: boolean | string;
}

function useSubscribe(
  type: 'onValuesChange' | 'onDataIndexChange' | 'onUpdateRow' | 'onUpdateRows',
  effect: Function,
  key: string | string[],
  options?: IOptions
) {
  const ref = useRef<Function>();
  ref.current = effect;
  useEffect(() => {
    const { loading } = options || {};
    const un = core.getPageObserver().subscribe(
      async (value) => {
        loading && core.showLoading(loading);
        try {
          return await ref.current?.(value);
        } finally {
          loading && core.showLoading(false);
        }
      },
      type,
      getSubscribeCondition(key)
    );
    return () => {
      ref.current = undefined;
      un();
    };
  }, []);
}

/**
 * 监听表单字段值变化
 * @param effect 处理事件
 * @param key 监听控件name，相同name情况建议用 containerId.name 的方式区分，containerId为form表单的id, key为*表示监听所有字段
 * @param options {loading:boolean|string}
 */
export function useValuesChange(effect: Function, key: string | string[], options?: IOptions) {
  useSubscribe('onValuesChange', effect, key, options);
}

/**
 * 监听表格字段值变化，目前仅支持pc表格
 * @param effect 处理事件
 * @param key 监听dataIndex，相同dataIndex情况建议用 containerId.dataIndex 的方式区分，containerId为表格组件的id
 * @param options {loading:boolean|string}
 */
export function useDataIndexChange(effect: Function, key: string | string[], options?: IOptions) {
  useSubscribe('onDataIndexChange', effect, key, options);
}

/**
 * 监听表格行变化
 * @param effect
 * @param key  表格id
 * @param options {loading:boolean|string}
 */
export function useUpdateRow(effect: Function, key: string | string[], options?: IOptions) {
  useSubscribe('onUpdateRow', effect, key, options);
}

/**
 * 监听表格所有行记录变化
 * @param effect
 * @param key 表格id
 * @param options {loading:boolean|string}
 */
export function useUpdateRows(effect: Function, key: string | string[], options?: IOptions) {
  useSubscribe('onUpdateRows', effect, key, options);
}

/**
 * 监听 core.observer.notify 发送的通知
 * @param effect 监听事件
 * @param type 事件类型
 */
export function useNotifyListener(effect: Function, type: 'print' | 'searchSwitch' | String) {
  const callbck = useRefCallback(({ activeTabKey }) => {
    return activeTabKey === getCurrentWindow('activeTabKey') ? effect() : void 0;
  });
  useEffect(() => {
    return core.getObserver().subscribe(callbck, `button_${type}`);
  }, [type]);
}

/**
 * 监听页面打印事件
 * @param effect 打印执行函数
 */
export function usePagePrint<T extends (...args: any[]) => any>(effect: T) {
  useNotifyListener(effect, 'print');
}
