import { ReactNode, RefObject } from 'react';
import type { IObject } from '../../util';
import type { formConfProps } from '../config/interface';
import type { FormInfo } from '../form/interface';
import type { CompDefaultPropsInfo } from '../props.dt';

export type FormFieldSetInfo = {
  cid?: string;
  /**
   * @description   是否开启展开折叠
   * @default       true
   */
  collapsible?: boolean;
  /**
   * @description   是否折叠
   * @default       false
   */
  collapse?: boolean | string[];
  /**
   * @description   折叠表头
   */
  title?: string;
  /**
   * @description   子元素
   */
  children?: ReactNode;
  /**
   * form表单集的ref对象
   */
  formSetRef?: RefObject<any>;
  panelProps?: IObject;
} & FormInfo;

export type FormFieldSetPropsInfo = FormFieldSetInfo & CompDefaultPropsInfo<formConfProps.FormFieldSet>;

export type FormSetInfo = {
  /**
   * @description   是否折叠
   * @default       true
   */
  collapsible?: boolean;
  /**
   * @description   是否折叠
   * @default       false
   */
  collapse?: boolean | string[];
  /**
   * @description   表单集值
   */
  value?: any;
  /**
   * @description   表单值
   * @default       false
   */
  defaultValue?: boolean | string[];
  /**
   * @description   禁用
   */
  disabled?: any;
  panelProps?: IObject;
} & FormInfo;

export type FormSetPropsInfo = FormFieldSetInfo & FormSetInfo & CompDefaultPropsInfo<formConfProps.FormSet>;
