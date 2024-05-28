import { useMemo } from 'react';
import { core } from '../util';

export function useUniqueId(key?: string, len?: number) {
  return useMemo(() => {
    return core.uniqueId(key || '', len || 36);
  }, [key]);
}
