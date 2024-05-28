import { RefObject, useLayoutEffect, useRef } from 'react';
import { core } from '../util';
import { useThrottle } from './useDebounce';

/**
 * 元素resize
 * @param callback 回调
 * @param elRef
 */
export function useResize(callback, elRef: RefObject<any> | (() => HTMLElement)) {
  const ref = useRef(true);

  const onResizeCallback = useThrottle(
    (...args) => {
      ref.current && callback(...args);
    },
    { wait: 60 }
  );

  useLayoutEffect(() => {
    const tmp = elRef as any;
    const el = core.isFunction(elRef) ? tmp() : tmp.current;
    if (!el) return;
    let resizeObserver: any;

    if (window.ResizeObserver) {
      resizeObserver = new window.ResizeObserver(onResizeCallback);
      resizeObserver.observe(el);
    } else {
      window.addEventListener('resize', onResizeCallback);
    }
    if (el.clientWidth > 0) {
      callback();
    } else if (!resizeObserver) {
      // 第一次不会自动触发resize，导致宽度计算有问题
      setTimeout(() => {
        el.clientWidth > 0 && callback();
      });
    }

    return () => {
      ref.current = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
      } else {
        window.removeEventListener('resize', onResizeCallback);
      }
    };
  }, [elRef]);
}
