import { CSSProperties, ReactNode, RefObject } from 'react';
import type { IObject } from '../../util';

interface ItemProps {
  name?: string;
  clientSqlFilter?: string | IObject | Function;
  helpId?: string;
  valueField?: string;
  displayField?: string;
}

export interface IQueryPanelProps<LocaleType extends string> {
  /**
   * @description       获取内嵌查询元数据接口的重要参数
   */
  pageId?: string;
  items?: Array<{
    xtype?: string | ((props: any) => ReactNode);
    label?: string;
    name: string;
    helpId?: string;
    colSpan?: number;
    itemId?: string;
    [key: string]: any;
  }>;
  id?: string;
  /**
   * @description       重写对应name的item属性
   */
  fieldProps?: {
    [key: string]: ItemProps | ((item: ItemProps) => ItemProps);
  };
  /**
   * @description       按钮的样式属性
   */
  buttonProps?: any;
  /**
   * @description       查询组件外部样式
   */
  style?: CSSProperties;
  /**
   * @description       关联的列表组件实例或者id
   */
  gridRef?: string | RefObject<any>;
  /**
   * @description       查询字段的size属性
   * @default           default
   */
  size?: 'small' | 'default';
  /**
   * @description       点击查询事件
   */
  onSearch?: (...args) => void;
  /**
   * @description       点击重置事件
   */
  onReset?: (...args) => void;
  /**
   * @description       组件元数据加载完成后的事件
   */
  onLoad?: (...args) => void | Promise<any>;
  /**
   * @description       设置字段的只读id集合
   */
  readonlyItems?: Array<string>;
  /**
   * @description       重写字段组件
   */
  fieldInput?: (field: any, disabled: boolean, placeholder: string) => React.ReactNode;
  /**
   * @description       设置一行显示列数
   * @default           4
   */
  columns?: 1 | 2 | 3 | 4 | 6;
  /**
   * @description       是否显示所有字段，设置true不显示收起展开按钮
   * @default           false
   */
  showAll?: boolean;
  /**
   * @description       是否默认展开所有
   * @default           false
   */
  defaultExpand?: boolean;
  /**
   * @description       是否显示记忆搜索选项框
   * @default           true
   */
  needRemember?: boolean;
  /**
   * @description       是否显示设置按钮
   * @default           true
   */
  needSetting?: Boolean;
  /**
   * @description       字段值改变后执行事件
   */
  onValuesChange?: (...args) => any;
  /**
   * @description       自定义多语言配置
   */
  locale?: { [key in LocaleType]?: string };
  /**
   * @description       是否显示label文案
   * @default           true
   */
  showLabel?: boolean;
  /**
   * @description       查询表单控件的外部受控values,优先级大于记忆值
   */
  values?: IObject;
  /**
   * @description       查询方案所在容器id
   */
  querySchemeContainer?: string;
}

export interface IQueryInfo {
  fields: Array<any>;
  values: any;
  isChecked: boolean;
}
