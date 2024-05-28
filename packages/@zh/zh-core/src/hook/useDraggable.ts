import { useCallback, useEffect, useRef, useState } from 'react';
import { core } from '../util';
import { useRefCallback } from './useRefCallback';

/**
 * 元素拖拽移动位置
 * @param dragHandler
 * @param options
 */
export function useDraggable(
  dragHandler,
  options: Function | { shouldCancel?: Function; direction?: 'x' | 'y' | 'xy' } = {}
) {
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });
  const divDom = useRef<any>();
  const lastXY = useRef({ dx: 0, dy: 0 });

  const shouldCancel = useRefCallback((e) => {
    return core.isFunction(options) ? options(e) : options?.shouldCancel?.(e);
  });
  const getDirection = useRefCallback(() => {
    return (options as any)?.direction || 'xy';
  });

  useEffect(() => {
    function handleMouseDown(e) {
      if (shouldCancel && shouldCancel(e)) {
        return;
      }

      const { dx, dy } = lastXY.current;

      const startX = e.pageX - dx;
      const startY = e.pageY - dy;

      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'move';

      function handleMouseMove(event) {
        const newDx = event.pageX - startX;
        const newDy = event.pageY - startY;
        if (newDx !== dx || newDy !== dy) {
          if (!divDom.current) {
            // 增加遮罩，防止触发拖动区域点击事件
            divDom.current = document.createElement('div');
            divDom.current.style.cssText =
              'position:absolute;top:0;right:0;bottom:0;left:0;z-index:11;opacity:0;cursor:move;';
            dragHandler.current.appendChild(divDom.current);
          }
          setOffset((prevState) => {
            const direction = getDirection();
            return direction === 'x'
              ? { ...prevState, dx: newDx }
              : direction === 'y'
                ? {
                  ...prevState,
                  dy: newDy
                }
                : { dx: newDx, dy: newDy };
          });
        }
        event.stopPropagation();
        return false;
      }

      document.addEventListener('mousemove', handleMouseMove);

      document.addEventListener(
        'mouseup',
        () => {
          document.body.style.userSelect = '';
          document.body.style.cursor = '';
          if (divDom.current) {
            dragHandler.current.removeChild(divDom.current);
            divDom.current = null;
          }
          document.removeEventListener('mousemove', handleMouseMove);
        },
        { once: true }
      );
    }

    dragHandler.current.addEventListener('mousedown', handleMouseDown);
    return () => dragHandler.current?.removeEventListener('mousedown', handleMouseDown);
  }, [offset.dx, offset.dy]);

  return useCallback(
    (el?, options?: { dx?: number; dy?: number }) => {
      el = el || dragHandler.current;
      if (el) {
        const { clientHeight, clientWidth } = document.body;
        const { top, left, right, bottom } = el.getBoundingClientRect();
        const nx = Math.min(
          clientWidth - right + lastXY.current.dx,
          Math.max(lastXY.current.dx - left, options?.dx ?? offset.dx)
        );
        const ny = Math.min(
          clientHeight - bottom + lastXY.current.dy,
          Math.max(lastXY.current.dy - top, options?.dy ?? offset.dy)
        );
        lastXY.current.dx = nx;
        lastXY.current.dy = ny;
        el.style.transform = `translate3d(${nx}px,${ny}px,0)`;
      }
    },
    [offset.dx, offset.dy]
  );
}
