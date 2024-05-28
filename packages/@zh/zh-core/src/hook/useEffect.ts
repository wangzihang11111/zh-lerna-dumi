import { useEffect, useLayoutEffect, useRef } from 'react';
import { core, getCurrentWindow } from '../util';
import { PageState, setPageInstance } from '../util/base';

/**
 * 增强版的effect
 * @param cb 副作用回调
 * @param dep 依赖
 * @param firstUpdate 第一次是否执行副作用，默认执行
 */
export function useZhEffect(cb, dep?, firstUpdate = true) {
  const update = useRef(firstUpdate);
  useEffect(() => {
    if (!update.current) {
      update.current = true;
      return;
    }
    return cb();
  }, dep);
}

/**
 * 增强版的effect
 * @param cb 副作用回调
 * @param dep 依赖
 * @param firstUpdate 第一次是否执行副作用，默认执行
 */
export function useZhLayoutEffect(cb, dep?, firstUpdate = true) {
  const update = useRef(firstUpdate);
  useLayoutEffect(() => {
    if (!update.current) {
      update.current = true;
      return;
    }
    return cb();
  }, dep);
}

/**
 * 监听对象属性或值变化后的副作用
 * @param cb
 * @param obj
 * @param firstUpdate
 */
export function useObjectEffect(cb, obj, firstUpdate = true) {
  const deps = core.isObject(obj) ? [core.jsonString(obj)] : core.isArray(obj) ? obj : [obj];
  useZhEffect(cb, deps, firstUpdate);
}

export function useUpdateEffect(cb, dep) {
  useZhEffect(cb, dep, false);
}

export function useLayoutUpdateEffect(cb, dep) {
  useZhLayoutEffect(cb, dep, false);
}

interface ICtx {
  isMounted: boolean;
  page?: any;
}

const defaultPage = { asyncEffectCount: 0, unmount: false };

/**
 * 根据依赖变化同步计算数据，据说useMemo有时会重复计算，所以用此方法替代
 * @param effect 计算函数
 * @param deps 依赖项
 * @returns 计算值
 */
export function useCompute<T>(effect: (...args) => T, deps: any[]) {
  const { current } = useRef({
    deps,
    obj: undefined as undefined | T,
    initialized: false
  });

  if (current.initialized === false || !core.isArrayEqual(current.deps, deps)) {
    current.deps = deps;
    current.initialized = true;
    current.obj = effect(current);
  }
  return current.obj as T;
}

/**
 * 执行异步方法的effect
 * @param effect
 * @param deps
 */
export function useAsyncEffect<T>(effect: (ctx: ICtx) => Promise<T>, deps: any[]) {
  const ref = useRef<ICtx>({ isMounted: true, page: getCurrentWindow('currentPageInstance')?.page || defaultPage });

  useLayoutEffect(() => {
    defaultPage.unmount = false;
    return () => {
      defaultPage.unmount = true;
      ref.current.isMounted = false;
    };
  }, []);

  useLayoutEffect(() => {
    try {
      ref.current.page.asyncEffectCount++;
      effect(ref.current).finally(() => {
        endPromise(ref);
      });
    } catch (e) {
      endPromise(ref);
    }
  }, deps);
}

const delayTask = (callback) => {
  let cancel;
  let rAF: any;
  if (window.requestIdleCallback) {
    cancel = window.cancelIdleCallback;
    rAF = window.requestIdleCallback(callback);
  } else {
    rAF = window.requestAnimationFrame(() => {
      cancel = clearTimeout;
      rAF = setTimeout(callback, 16);
    });
    cancel = window.cancelAnimationFrame;
  }
  return () => {
    rAF && cancel(rAF);
  };
};

function endPromise(ref) {
  const { page } = ref.current;
  if (page.asyncEffectCount > 0) {
    page.asyncEffectCount--;
    if (page.asyncEffectCount === 0) {
      page.__cancelDelayTask?.();
      page.__cancelDelayTask = delayTask(() => {
        page.requestHandleId = null;
        ref.current.isMounted && setPageInstance(page, PageState.AllReady);
      });
    }
  }
}
