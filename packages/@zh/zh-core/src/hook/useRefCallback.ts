import { useCallback, useRef } from 'react';

/**
 * 利用ref返回useCallback
 * @param callback 函数
 */
export function useRefCallback<T extends (...args: any[]) => any>(callback: T) {
  const ref = useRef(callback);
  ref.current = callback;
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}
