import { useMemo, useRef, useState } from 'react';
import { useZhEffect, useRefCallback, util } from '../util';

export function useValue<S>(value: S, isHelp: boolean): [S, (value: S, callback?: (value: S) => void) => void] {
  const ref = useRef<{ value: S; forceUpdate: boolean; callback?: (value: S) => void }>({ value, forceUpdate: false });
  const [forceUpdate, setForceUpdate] = useState({ value });

  useMemo(() => {
    const oldValue: any = ref.current.value;
    if (isHelp && (util.isObject(oldValue) || util.isArray(oldValue))) {
      const tmp = util.isArray(oldValue) ? oldValue.map((v) => v.value ?? v).join(',') : oldValue.value ?? oldValue;
      if (tmp === value) {
        return;
      }
    }
    ref.current.value = value;
    ref.current.forceUpdate = true;
  }, [value, isHelp]);

  const update = useRefCallback((newValue: S, callback?: (value: S) => void, _forceUpdate?: boolean) => {
    ref.current.value = newValue;
    ref.current.callback = callback;
    if (_forceUpdate || ref.current.value !== forceUpdate.value || ref.current.forceUpdate) {
      ref.current.forceUpdate = false;
      setForceUpdate({ value: newValue });
    }
  });

  useZhEffect(
    () => {
      ref.current.callback?.(forceUpdate.value);
    },
    [forceUpdate],
    false
  );

  return [ref.current.value, update];
}
