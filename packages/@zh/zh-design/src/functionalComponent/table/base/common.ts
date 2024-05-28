import { createContext } from 'react';

const hasNativePerformanceNow = typeof performance === 'object' && typeof performance.now === 'function';

const now = hasNativePerformanceNow ? () => performance.now() : () => Date.now();

export type TimeoutID = {
  id: number;
};

export function cancelTimeout(timeoutID: TimeoutID) {
  cancelAnimationFrame(timeoutID.id);
}

export function requestTimeout(callback: Function, delay: number): TimeoutID {
  const start = now();

  function tick() {
    if (now() - start >= delay) {
      callback.call(null);
    } else {
      timeoutID.id = requestAnimationFrame(tick);
    }
  }

  const timeoutID: TimeoutID = {
    id: requestAnimationFrame(tick)
  };

  return timeoutID;
}

export function shallowDiffers(prev: Object, next: Object, exceptKey = ''): boolean {
  for (let attribute in prev) {
    if (attribute !== exceptKey && !next.hasOwnProperty(attribute)) {
      return true;
    }
  }
  for (let attribute in next) {
    if (attribute !== exceptKey && prev[attribute] !== next[attribute]) {
      return true;
    }
  }
  return false;
}

export function areEqual(prevProps: any, nextProps: any): boolean {
  return (
    !shallowDiffers(prevProps.style || {}, nextProps.style || {}) && !shallowDiffers(prevProps, nextProps, 'style')
  );
}

export enum CellTypeEnum {
  BodyCell,
  MergeCell,
  AggregateCell,
  FixedBodyCell,
  ExpandRowCell,
  GroupRowCell,
  ZwCell
}

export enum UpdateFlagEnum {
  None,
  ColumnChecked, // 复选框更新
  RowUpdate, // 数据行更新
  UserUpdate, // 自定义更新
  ForceUpdate // 强制更新
}

// table 数据行的选择模式
export enum TableSelectionModel {
  ROW, // 单选模式
  CHECKBOX, // checkbox多选模式
  MULTIPLE_INTERVAL // 单选或ctrl、shift多选混合模式
}

export const IS_GROUP = Symbol('isGroup');
export const IS_EXPANDED = Symbol('isExpanded');
export const TableContext = createContext<{ table: Record<string, any>; columns: Record<string, any> }>({
  table: {},
  columns: []
}); //创建context
export const DsContext = createContext<Record<string, any>[]>([]); //创建context
