import {
  core,
  getRegisterCpt,
  getRegisterCptWithProps,
  registerCpts,
  setGlobalVar,
  type IObject,
  type IRegisterComponentOptions
} from '@zh/zh-core';
import React, { useEffect } from 'react';
import { CommonUtil } from './common';

export * from '@zh/zh-core';

export const zh = {
  ...core,
  ...CommonUtil,
  registerExternal(obj: IObject) {
    core.registerExternal(obj, false);
  }
};

export function registerComponent(
  Components: Record<string, React.ComponentType<any>>,
  options?: IRegisterComponentOptions
) {
  registerCpts(Components, { ...options, platform: 'pc' });
}

export function getRegisterComponent<T = any>(type: string = '', candidate = '') {
  return getRegisterCpt(type, 'pc', candidate) as T;
}

export function getRegisterComponentWithProps<T = any>(type: string = '', candidate = '') {
  return getRegisterCptWithProps(type, 'pc', candidate) as [T, IObject, IObject];
}

/**
 * 回刷列表hook
 * @param effect 回刷列表的副作用函数
 * @param busType 业务类型
 */
export function useRefreshList(effect: (data: any) => void, busType: string) {
  useEffect(() => {
    return CommonUtil.onRefreshList(busType, effect);
  }, []);
}

/**
 * 暴露全局变量api
 */
setGlobalVar('$zh', zh);
