import React, { MutableRefObject, useCallback, useLayoutEffect, useRef } from 'react';
import type { ICurrentObject, IObject } from '../interface';
import { core } from '../util';

/**
 * 获取compHoc的api实例
 */
export function useApi<T = any>() {
  return useRef<ICurrentObject<T>>({
    getApi() {
      return {} as T;
    }
  });
}

/**
 * 返回一个获取ref的方法及移除ref的方法
 * 获取ref时需要传递一个key值
 */
export function useRefs<RefType = any>(): [
  (key: React.Key) => React.RefObject<RefType>,
  (key: React.Key) => void,
  Map<React.Key, React.RefObject<RefType>>
] {
  const cacheRefs = useRef(new Map<React.Key, React.RefObject<RefType>>());

  const getRef = useCallback((key) => {
    if (!cacheRefs.current.has(key)) {
      cacheRefs.current.set(key, React.createRef<RefType>());
    }
    return cacheRefs.current.get(key) as React.RefObject<RefType>;
  }, []);

  const removeRef = useCallback((key) => {
    cacheRefs.current.delete(key);
  }, []);

  return [getRef, removeRef, cacheRefs.current];
}

/**
 * 对属性outRef重写或者新增api
 * @param outRef 外部透传过来的ref
 * @param inject 注入或需要重写的api
 */
export function useExtendRef<T = IObject>(outRef: MutableRefObject<any>, inject: T | (() => T) | MutableRefObject<T>) {
  useLayoutEffect(() => {
    if (outRef) {
      const api = core.isFunction(inject) ? inject() : (inject as any).current || inject;
      if (outRef.current?.componentIns) {
        outRef.current['__injectApi__'] = api;
      } else if (outRef.current) {
        Object.assign(outRef.current, api);
      } else {
        outRef.current = api;
      }
    }
  }, [outRef, inject]);
}
