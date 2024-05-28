import React, { useMemo } from 'react';
import { SortableContainer, SortableElement } from 'react-sortable-hoc';

/**
 * 拖拽排序
 * @param draggable 是否可拖拽
 * @param DragComp 需要拖拽组件
 */
export function useDraggableSort(draggable = true, DragComp?) {
  const SortContainer = useMemo<any>(
    () => (draggable ? SortableContainer(({ children }) => children) : ({ children }) => children),
    [draggable]
  );

  const SortElement = useMemo<any>(() => {
    if (draggable) {
      return DragComp
        ? SortableElement(DragComp)
        : SortableElement(({ children, ...props }) => {
            return React.cloneElement(children, props);
          });
    }
    return DragComp;
  }, [DragComp]);

  return { SortContainer, SortElement };
}
