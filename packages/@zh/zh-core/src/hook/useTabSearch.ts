import { useRef } from 'react';
import { useZhEffect } from './useEffect';

/**
 * tab页切换和查询值变化时查询规则
 * @param callback 执行查询函数
 * @param searchValue 查询值
 * @param isActive tab页是否已经激活
 */
export function useTabSearch(callback: Function, [searchValue, isActive]: [string, boolean]) {
  const searchState = useRef<0 | 1 | 2>(0); // 0表示初始 1表示待查询 2表示已查询
  useZhEffect(
    () => {
      if (isActive) {
        searchState.current = 2;
        callback();
      } else {
        searchState.current = 1;
      }
    },
    [searchValue],
    false
  );

  useZhEffect(
    () => {
      if (isActive && searchState.current === 1) {
        searchState.current = 2;
        callback();
      }
    },
    [isActive],
    false
  );
}
