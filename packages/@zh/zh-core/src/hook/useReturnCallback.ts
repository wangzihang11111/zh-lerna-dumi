import { useMemo, useRef } from 'react';

/**
 * 返回一个函数，该函数返回值为callback的返回值，且返回值依赖deps缓存
 * 例如Dropdown组件的dropdownRender属性使用此hooks返回，可以提升性能
 * @param callback
 * @param deps
 */
export function useReturnCallback<T extends (...args: any[]) => any>(callback: T, deps) {
  const ref = useRef();

  useMemo(() => {
    ref.current = undefined;
  }, deps);

  return (...args) => {
    if (!ref.current) {
      ref.current = callback(...args);
    }
    return ref.current;
  };
}
