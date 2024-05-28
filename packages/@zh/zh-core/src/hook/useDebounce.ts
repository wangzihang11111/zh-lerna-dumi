import { useMemo } from 'react';
import { util } from '../util/tool';
import { useRefCallback } from './useRefCallback';

/**
 * 函数防抖hooks
 * @param callback
 * @param options
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  options?: { wait?: number; immediate?: boolean }
) {
  const { wait = 250, immediate = false } = options || {};
  const refCallback = useRefCallback(callback);
  return useMemo(() => {
    return util.debounce(refCallback, wait, immediate);
  }, [wait, immediate]);
}

/**
 * 函数节流
 * @param callback
 * @param options 第一次调用时默认会立刻执行一次function，如果传入{leading: false}，则第一次调用时不执行function。{trailing: false}参数则表示禁止最后那一次延迟的调用
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  options?: { wait?: number; leading?: boolean; trailing?: boolean }
) {
  const { wait = 250, leading = true, trailing = false } = options || {};
  const refCallback = useRefCallback(callback);
  return useMemo(() => {
    return util.throttle(refCallback, wait, { leading, trailing });
  }, [wait, leading, trailing]);
}
