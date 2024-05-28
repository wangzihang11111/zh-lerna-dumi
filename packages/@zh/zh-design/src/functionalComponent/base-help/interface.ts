import { ButtonProps } from 'antd/lib/button';
import { SelectProps } from 'antd/lib/select';
import React, { CSSProperties, FunctionComponent, ReactNode } from 'react';
import type { PromiseType } from '../../util';

type ColumnProps = { title: string; dataIndex: string };

interface LabeledValue<V = any, L = string> {
  value: V;
  label: L;
}

export interface IBaseHelpQuery {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  treeNodes?: any[];
  isInputSearch?: boolean;
}

export interface IHeader {
  /**
   * @description       设置标题
   * @default           通用帮助
   */
  title?: string | ReactNode;
  /**
   * @description       顶部空白区域组件
   */
  children?: ReactNode;
}

export interface IFooter {
  /**
   * @description       设置返回值函数
   */
  getResult: () => any;
  /**
   * @description       确定按钮文本
   * @default           确定
   */
  okText?: string;
  /**
   * @description       取消按钮文本
   * @default           取消
   */
  cancelText?: string;
  /**
   * @description       底部空白区域组件
   */
  children?: ReactNode;
}

export interface IMultipleButtons {
  /**
   * @description       获取按钮区域对外接口实例
   */
  outRef?: React.MutableRefObject<any>;
  /**
   * @description       获取行的key值（不设置addResult\removeResult时，为必选属性）
   */
  getRowKey?: (row: object) => any;
  /**
   * @description       获取当前待选的table实例
   */
  getActiveTable: () => any;
  /**
   * @description       获取已选区域的table实例
   */
  getResultTable: () => any;
  /**
   * @description       按钮区域的样式
   */
  style?: CSSProperties;
  /**
   * @description       选择数据到结果区域
   */
  addResult?: (values: any) => void;
  /**
   * @description       从结果区域移除数据
   */
  removeResult?: (indexes?: number[] | number) => void;
}

export interface BaseHelpComponent<P = {}> extends FunctionComponent<P> {
  Header: React.FC<IHeader>;
  Footer: React.FC<IFooter>;
  MultipleButtons: React.FC<IMultipleButtons>;
}

export interface BaseHelpProps extends SelectProps<any> {
  /**
   * @description       自定义tooltip
   */
  tooltip?: string | ((value) => React.ReactNode);
  /**
   * @description       按钮模式
   */
  buttonMode?: { text: string; onResult: Function } & ButtonProps;
  /**
   * @description       没有匹配的下拉选项时，是否回填手动输入的值
   * @default           false
   */
  acceptInput?: boolean;
  /**
   * @description       输入框的样式
   */
  style?: CSSProperties;
  /**
   * @description       输入框是否可用
   * @default           false
   */
  disabled?: boolean;
  /**
   * @description       是否支持输入框输入选择
   * @default           true
   */
  input?: boolean;
  /**
   * @description       支持模态弹出窗口
   */
  modal?: boolean;
  /**
   * @description       选择值后，调用此函数
   */
  onChange?: (value) => void;
  /**
   * @description       帮助模态窗弹出前的事件，返回false，阻止弹出；支持返回request方法属性来动态修改数据源
   */
  onBeforeOpen?: (isDropDown?: boolean) => PromiseType<any>;
  /**
   * @description       帮助（下拉）打开或关闭时触发
   */
  onOpenChange?: (open: boolean, type: 'dropdown' | 'modal') => void;
  /**
   * @description       指定当前选中的条目，多选时为一个数组
   */
  value?: LabeledValue | LabeledValue[];
  /**
   * @description       输入框下拉option，是否强制在同一行显示
   * @default           false
   */
  nowrap?: boolean;
  /**
   * @description       回填到选中项value属性的数据源的字段值
   * @default           value
   */
  valueField?: string | Function;
  /**
   * @description       回填到选中项label属性的数据源的字段值
   * @default           label
   */
  labelField?: string | Function;
  /**
   * @description       输入框下拉option对应的数据源的字段值, 例：'value,label'
   */
  userCodeField?: string;
  /**
   * @description       userCodeField是否自动包含labelField
   * @default           false
   */
  userCodeFieldWithLabel?: boolean;
  /**
   * @description       设置帮助弹出模态窗的属性
   */
  modalProps?: any;
  /**
   * @description       双击输入框回调
   */
  onDoubleClick?: Function;
  /**
   * @description       静态数据源，可以代替select组件使用
   */
  data?: Array<any>;
  /**
   * @description       获取已选择数据源接口
   */
  selectedRequest?: ({ codes }: { codes: string }) => PromiseType<any[]>;
  /**
   * @description       动态数据源
   */
  request?: (query: IBaseHelpQuery) => PromiseType<{ total: number; record: any[] }>;
  /**
   * @description       帮助信息
   */
  getHelpInfo?: () => { valueField: string; labelField: string; userCodeField: string };
}

export interface IBaseHelpProps extends BaseHelpProps {
  /**
   * @description       是否多选
   */
  multiple?: boolean;
  /**
   * @description       传入模态框内部额外参数（合并onBeforeOpen返回的属性），可以重写外部传入的属性
   */
  contentParams?: {
    helpTitle?: string;
    FilterTree?: ({ onSelectedChange, tableRef }) => React.ReactNode;
    columns?: { left: ColumnProps[]; right: ColumnProps[] } | ColumnProps[];
    [key: string]: any;
  };
  onOk?(): (...args) => PromiseType<boolean>;
  onCancel?(): (...args) => PromiseType<boolean>;
  /**
   * @description       自定义帮助模态窗的内容区域
   */
  helpContent?: () => React.ReactNode;
  /**
   * @description       获取帮助对外提供的api
   */
  outRef?: React.MutableRefObject<any>;
  /**
   * @description       获取焦点时即加载请求数据
   * @default           false
   */
  loadByFocus?: boolean;
}
