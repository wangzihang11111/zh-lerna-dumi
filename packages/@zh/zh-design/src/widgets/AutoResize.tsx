import React, { CSSProperties, useLayoutEffect, useRef } from 'react';
import { zh } from '../util';

interface IAutoResize {
  children: React.ReactNode;
  onResize?: ({ width, height }, options?: { flushSync?: boolean }) => void;
  delay?: number;
  style?: CSSProperties;
  beforeResize?: Function;
}

const globalWindow = window as any;

/**
 * 组件自适应容器
 * @param children 需要自适应的组件
 * @param style
 * @param onResize 父容器高宽变化时回调，undefined 则直接返回children组件
 * @param delay
 * @constructor
 */
export function AutoResize({ children, style, onResize, beforeResize, delay = undefined }: IAutoResize) {
  const objRef = useRef<any>();
  const mountRef = useRef(false);
  const beforeResizeRef = useRef(beforeResize);
  beforeResizeRef.current = beforeResize;
  const supportResizeObserver = globalWindow.ResizeObserver;
  useLayoutEffect(() => {
    mountRef.current = true;
    if (onResize) {
      const lastBcr = { width: 0, height: 0 };
      const pEl = objRef.current.parentElement;
      const offset = pEl
        ? {
          x: (parseFloat(zh.getStyle(pEl, 'paddingLeft')) || 0) + (parseFloat(zh.getStyle(pEl, 'paddingRight')) || 0),
          y: (parseFloat(zh.getStyle(pEl, 'paddingTop')) || 0) + (parseFloat(zh.getStyle(pEl, 'paddingBottom')) || 0)
        }
        : { x: 0, y: 0 };
      const onResizeEvent = (options = {}) => {
        if (!mountRef.current || !objRef.current || !objRef.current.offsetParent) {
          return;
        }
        const bcr = {
          width: objRef.current.clientWidth,
          height: objRef.current.clientHeight
        };
        if (bcr.width !== lastBcr.width || bcr.height !== lastBcr.height) {
          lastBcr.width = bcr.width;
          lastBcr.height = bcr.height;
          onResize(
            {
              width: bcr.width - offset.x,
              height: bcr.height - offset.y
            },
            options
          );
        }
      };

      const debounce = (func: Function, delayTime: number) => {
        let timer: any = null;
        let exec = delayTime ? setTimeout : window['requestIdleCallback'] || window['requestAnimationFrame'];
        let cancel = delayTime ? clearTimeout : window['cancelIdleCallback'] || window['cancelAnimationFrame'];
        return () => {
          timer && cancel(timer);
          !timer && func({ flushSync: true });
          timer = exec(() => {
            timer = null;
            func();
          }, delayTime || undefined);
        };
      };

      let resizeObserver: any;
      let targetView: any;
      const debounceFn = debounce(onResizeEvent, delay ?? 60);
      const resize = () => {
        if (!mountRef.current || !objRef.current) {
          return;
        }
        beforeResizeRef.current?.({
          width: objRef.current.clientWidth,
          height: objRef.current.clientHeight
        });
        debounceFn();
      };
      if (supportResizeObserver) {
        resizeObserver = new supportResizeObserver(resize);
        resizeObserver.observe(objRef.current);
      } else {
        targetView = objRef.current.contentWindow;
        if (targetView) {
          targetView.addEventListener('resize', resize);
        } else {
          setTimeout(() => {
            objRef.current?.contentWindow?.addEventListener('resize', resize);
          });
        }
      }
      if (objRef.current.clientWidth > 0) {
        onResizeEvent();
      } else if (!supportResizeObserver) {
        // 不会自动触发resize，导致数据渲染不出来
        setTimeout(() => {
          objRef.current.clientWidth > 0 && onResizeEvent();
        });
      }
      return () => {
        mountRef.current = false;
        if (resizeObserver) {
          resizeObserver.disconnect();
          resizeObserver = null;
        } else {
          objRef.current?.contentWindow?.removeEventListener('resize', resize);
        }
      };
    }
    return () => {
      mountRef.current = false;
    };
  }, [onResize]);

  const props = supportResizeObserver
    ? {}
    : {
      type: 'text/html',
      data: 'about:blank'
    };

  return (
    <>
      {children}
      {onResize &&
        React.createElement(supportResizeObserver ? 'div' : 'iframe', {
          ref: objRef,
          tabIndex: -1,
          style: {
            display: 'block',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
            ...style
          },
          ...props
        })}
    </>
  );
}

/**
 * 不支持ResizeObserver的浏览器，resize事件绑定在window页面，需要手动调用触发
 */
export function polyfillResize() {
  const supportResizeObserver = globalWindow.ResizeObserver;
  if (!supportResizeObserver) {
    window.dispatchEvent(new Event('resize'));
  }
}
