import { ColumnProps } from '../../functionalComponent';
import React, { ComponentClass, FunctionComponent } from 'react';
import { LabelPosition, Layout } from '../interface';

//组件配置
export interface CONF_INFO {
  form?: {
    [propskey: string]: FORM_ENTRY;
  };
  fieldSetForm?: {
    desTitle: string;
    id?: string;
    itemId?: string;
    fieldSets: Array<FORM_ENTRY>;
    [propskey: string]: any;
  };
  grid?: { [propskey: string]: {} };
  tabPanel: {
    id: string;
    desTitle: string;
    items: Array<TabPanelItem>;
  };
}

export interface TabPanelItem {
  /**
   * @description   标签页Id
   */
  id: string;
  /**
   * @description   标签页标题
   */
  title: string;
  /**
   * @description   标签页内容组件
   */
  xtype?: React.ReactNode;
  /**
   * @description   是否强制渲染
   * @default       false
   */
  forceRender?: boolean;
  height?: number | string;
}

interface COMMON_LAYOUT_ENTRY {
  id?: string;
  name?: string;
  label?: React.ReactNode;
}

//表单
export type FORM_ENTRY = {
  /**
   * @description   标签宽度
   * @default       85
   */
  labelWidth?: number | string;
  /**
   * @description   绑定的数据库表名
   */
  bindtable?: string;
  /**
   * @description   表单条目配置
   */
  children: Array<FIELD_PROPERTYS>;
  /**
   * @description   标签位置
   * @default       right
   */
  labelPosition?: LabelPosition;
  /**
   * @description   表格表单
   */
  bordered?: boolean;
  /**
   * @description   表格列数
   */
  colspan?:
    | number
    | Array<number>
    | {
        [propsKey: number]: number;
      };
  layout?: Layout;
  [propskey: string]: any;
} & COMMON_LAYOUT_ENTRY;

//组件属性 也是属性的元数据
export type FIELD_PROPERTYS = {
  /**
   * @description   组件类型
   * @default       Input
   */
  xtype?: COMP_TYPE;
  /**
   * @description   跨列
   * @default       1
   */
  colspan?: number;
  /**
   * @description   提示
   */
  placeholder?: string;
  /**
   * @description   是否必填
   */
  required?: boolean;
  /**
   * @description   是否禁用
   */
  disabled?: boolean;
  /**
   * @description   表填条目组件私有属性
   */
  antProps?: object;
  /**
   * @description   多语言的key值
   */
  langKey?: string;
  /**
   * @description   子元素
   */
  children?: FIELD_PROPERTYS[];
  /**
   * @description   子元素，元数据配置中原ext配置
   */
  items?: FIELD_PROPERTYS[];
  /**
   * @description 额外的提示信息
   */
  extra?: React.ReactNode;
  /**
   * @description   其他属性，根据xtype进行配置
   */
  [propskey: string]: any;
} & Partial<DataItemType> &
  COMMON_LAYOUT_ENTRY;

export type CONF_INFO_KEY = keyof CONF_INFO;

//组件类型元数据
export type COMP_TYPE =
  | 'FormPanel'
  | 'container'
  | 'CheckBoxGroup'
  | 'Input'
  | 'InputNumber'
  | 'Select'
  | 'DatePicker'
  | 'DateTimePicker'
  | 'TimePicker'
  | 'SingleHelp'
  | 'MultipleHelp'
  | 'Password'
  | 'Button'
  | 'TextArea'
  | 'Radio'
  | 'RadioGroup'
  | String
  | React.ComponentType<any>;

//树节点类型
export type DataItemType = {
  value?: string;
  label?: React.ReactNode;
  children?: Array<DataItemType>;
  [propskey: string]: any;
};

//组件及属性配置
export interface Common_Property {
  type: string;
  defaultValue?: any;
  editor: ComponentClass<any, any> | FunctionComponent<any>;
  writeable: boolean;
  cnLabel?: string;
}

export type Comp_Props = {
  [propskey: string]: Common_Property;
};

//组件配置
export interface COMP_ENTRY {
  instance: React.ComponentType<any> | string;
  defaultProps?: Record<string, any>;
  props?: Comp_Props;
  children?: any;
  listener?: {
    [propskey: string]: string;
  };
  // valueType?: string;
}

export interface COMP_CONF {
  [xtype: string]: COMP_ENTRY;
}

export interface treeNode {
  value: any;
  name: string;
  label: React.ReactNode;
  children: Array<treeNode> | null;
}

type Lay_Config_Props = Comp_Props | { childItem?: Comp_Props };

export type Config_Props = {
  grid: Lay_Config_Props;
  tabPanel: Lay_Config_Props;
  fieldSetForm: Lay_Config_Props | { childItem: Lay_Config_Props };
  form: Lay_Config_Props;
};

export namespace formConfProps {
  export type FormFieldSet = Array<FIELD_PROPERTYS> | FORM_ENTRY;
  export type FormLayout = FormFieldSet;
  export type FormSet = Array<FORM_ENTRY> | { children: Array<FORM_ENTRY>; [propskey: string]: any };
  export type GridView = { children: Array<ColumnProps>; [propskey: string]: any } | Array<ColumnProps>;
  export type TabPanel = Array<TabPanelItem>;
}
