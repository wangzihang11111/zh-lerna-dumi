import { useMemo, useRef, useState } from 'react';
import { useRefCallback } from './useRefCallback';

/**
 * 外部传入的value高于内部更新的value
 * @param value 受控值，更新替换当前内部的value，利用useMemo代替useEffect，减少不必要的更新
 * @param defaultValue 默认值，第一次有效
 */
export function useRefValue<S = any>(value: S, defaultValue?: S): [S, (value: S) => void] {
  const ref = useRef<any>(value ?? defaultValue);

  useMemo(() => {
    ref.current = value;
  }, [value]);

  const [, setForceUpdate] = useState(value);

  const update = useRefCallback((newValue) => {
    ref.current = newValue;
    setForceUpdate(newValue);
  });

  return [ref.current, update];
}
