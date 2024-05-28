import { CSSProperties, ForwardRefExoticComponent, PropsWithoutRef, RefAttributes } from 'react';

export type InnerCompPropsInfo<T> = {
  formConf?: any;
} & T;

export type CompDefaultPropsInfo<R> = {
  /**
   * @description   组件id
   */
  id?: string;
  /**
   * @description   表单项的配置
   */
  config?: R;
  /**
   * @description   重写config配置信息
   */
  setConfig?: (config: R) => R;
  /**
   * @description   UI元数据的路径
   */
  confKey?: Array<string>;
  formStyle?: CSSProperties;
  style?: CSSProperties;
  size?: 'small' | 'middle' | 'large' | undefined;
  compact?: boolean; // 紧凑模式
  className?: any;
  onLoad?: () => void;
  initSc?: any;
  formConf?: any;
  disabledNotify?: boolean; // 禁用内部通知
} & InnerCompPropsInfo<unknown>;

export type InnerComp<T> = ForwardRefExoticComponent<PropsWithoutRef<T> & RefAttributes<any>>;

export type CompHocProps<BaseProps, CompProps> = CompDefaultPropsInfo<BaseProps> & CompProps;
