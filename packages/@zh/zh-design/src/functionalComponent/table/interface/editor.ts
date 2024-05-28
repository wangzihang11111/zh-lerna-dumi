import type { CheckboxProps } from 'antd/es/checkbox';
import type { PickerProps } from 'antd/es/date-picker/generatePicker';
import type { InputProps, TextAreaProps } from 'antd/es/input';
import type { InputNumberProps } from 'antd/es/input-number';
import type { SelectProps } from 'antd/es/select';
import type { SwitchProps } from 'antd/es/switch';
import type { Dayjs } from 'dayjs';
import React, { CSSProperties, type RefObject } from 'react';
import type { ICheckboxExtraProps } from '../../../baseComponent';
import type { BaseHelpProps } from '../../base-help';
import type { ICurrentObject, IObject } from '../util';

declare type optionType = {
  value: any;
  label: React.ReactNode;
};

interface IBaseFormat {
  nullValue?: string;
}

// 日期格式化
interface IDateFormat extends IBaseFormat {
  type: 'date';
  formatter: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm' | 'HH:mm' | String;
}

// 选项格式化（状态转换）
interface IOptionFormat extends IBaseFormat {
  type: 'option';
  formatter?: optionType[];
}

// 数字格式化
interface INumberFormat extends IBaseFormat {
  type: 'number';
  prefix?: string; // 前缀字符
  suffix?: string; // 后缀字符
  precision?: number; // 数值精度
  formatter?: ',' | String | false | Function; // 千分位格式化分隔符, 默认','
}

// icon列
interface IIconFormat extends IBaseFormat {
  type: 'icon';
  formatter: Array<{
    value: any;
    label?: React.ReactNode;
    icon: string | React.ReactElement;
    style?: CSSProperties;
  }>;
}

// 附件列
interface IAttachmentFormat extends IBaseFormat {
  type: 'attachment';
  formatter: {
    icon: string | React.ReactElement; // 附件列的图标，默认PaperClipOutlined
    style?: CSSProperties;
    showValue?: boolean; // 默认true
  };
}

// 表达式计算
interface IExprFormat extends IBaseFormat {
  type: 'expr';
  formatter: string; // $D:table数据、$R:单行数据源、$V:当前数据、$DI:当前dataIndex (例子：$R.type===1?$R.orgName:$R.projectName)
}

export declare type IFormat =
  | IDateFormat
  | IOptionFormat
  | INumberFormat
  | IIconFormat
  | IExprFormat
  | IAttachmentFormat;
export declare type IExpr = String | (($R, $D, $V, $DI) => any); // 同 IExprFormat 的 formatter

declare type getEditor = (dataIndex?: string) => ICurrentObject;
declare type onBeforeInit = ({ editor, row, dataIndex, table }) => boolean | void | IObject;
declare type onInit = ({ editor, row, dataIndex, rowIndex, table }) => void;
declare type onChange = {
  value: any;
  row: any;
  lastRow: any;
  rowIndex: number;
  dataIndex;
  table: any;
  getEditor: getEditor;
  originValue: any;
};

interface IEditor<P = any> extends IObject {
  /**
   * @description       设置是否必输项
   */
  required?: boolean;
  /**
   * @description       设置编辑器内部组件的属性，不会被过滤，直接传入组件内部
   */
  antProps?: P;
  /**
   * @description       设置编辑器的监听事件
   */
  listeners?: {
    /**
     * @description       返回false阻止编辑器渲染，相当于只读
     */
    onBeforeInit?: onBeforeInit;
    onInit?: onInit;
    onChange?: (args: onChange) => void;
  };
  /**
   * @description       设置编辑器的条件隐藏函数
   */
  hidden?: ({ row, dataIndex }) => Boolean;
  /**
   * @description       设置编辑器的条件禁用函数
   */
  disabled?: ({ row, dataIndex }) => Boolean;
  /**
   * @description       设置非编辑状态下单元格需要显示的字段
   */
  displayField?: string;
}

interface CustomizedTypeProps extends IObject {
  value: any;
  onChange: Function;
  onKeyDown: Function;
  outRef: RefObject<any>;
  editorOptions: any;
}

type regExp = string | ((value: any) => boolean | string);

type regExpType = regExp | { exp: regExp; info?: string };

export interface ICustomizedEditor extends IEditor {
  /**
   * @description       自定义组件类型（string表示注册过的业务组件）
   */
  xtype: String | ((props: CustomizedTypeProps) => React.ReactNode);
  /**
   * @description       设置编辑器的验证表达式或函数
   */
  regExp?: regExpType;
}

/**
 * 文本输入框
 */
export interface ITextEditor extends IEditor<InputProps | TextAreaProps | InputNumberProps> {
  /**
   * @description       文本输入框
   */
  xtype: 'input' | 'NGInput' | 'NGInputNumber' | 'NGTextArea';
  /**
   * @description       设置输入框的类型
   * @default           text
   */
  type?: 'text' | 'number' | 'amount' | 'percent' | 'textarea';
  /**
   * @description       设置输入字段中的字符的最大长度
   */
  maxLength?: number;
  /**
   * @description       设置输入字段的最小值
   */
  min?: number;
  /**
   * @description       设置输入字段的最大值
   */
  max?: number;
  /**
   * @description       设置编辑器的验证表达式或函数
   */
  regExp?: regExpType;
  /**
   * @description       设置输入数字的合法数字间隔
   */
  step?: number;
  /**
   * @description       设置数字的精度
   */
  precision?: number;
}

/**
 * 时间选择
 */
export interface IDatePickerEditor extends IEditor<PickerProps<Dayjs | string>> {
  /**
   * @description       时间选择器
   */
  xtype: 'datepicker' | 'NGDatePicker';
  /**
   * @description       设置时间选择器的类型（日期、日期+时间、时间、周、月、季度、年）
   * @default           date
   */
  type?: 'date' | 'datetime' | 'time' | 'week' | 'month' | 'quarter' | 'year';
  /**
   * @description       设置时间格式
   */
  dateFormat?: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm' | 'HH:mm' | String;
}

/**
 * 下拉选择
 */
export interface ISelectEditor
  extends IEditor<
    SelectProps<any> & {
      data?: Array<any>;
      valueField?: string;
      labelField?: string;
      request?: (params: any) => any; // 数据请求，返回promise对象
    }
  > {
  /**
   * @description       下拉选择器
   */
  xtype: 'select' | 'NGSelect';
  /**
   * @description       设置下拉数据源中的value字段
   * @default           value
   */
  valueField?: 'value' | String;
  /**
   * @description       设置下拉数据源中的label字段
   * @default           label
   */
  labelField?: 'label' | String;
  /**
   * @description       设置非编辑状态下单元格需要显示的字段，默认为：`${当前列的dataIndex}EXName`
   */
  displayField?: string;
  /**
   * @description       是否多选
   * @default           false
   */
  multiple?: boolean;
  /**
   * @description       固定数据源
   */
  data?: optionType[];
  /**
   * @description       动态数据源
   */
  request?: (...args) => Promise<any>;
  /**
   * @description       是否缓存动态数据源
   * @default           true
   */
  cache?: boolean;
}

/**
 * CheckBox复选框
 */
export interface ICheckBoxEditor
  extends IEditor<(CheckboxProps & ICheckboxExtraProps) | (SwitchProps & ICheckboxExtraProps)> {
  /**
   * @description       状态切换
   */
  xtype: 'checkbox' | 'NGCheckbox';
  /**
   * @description       选择框或开关
   * @default           checkbox
   */
  type?: 'checkbox' | 'switch';
  /**
   * @description       状态与其他行互斥的
   * @default           false
   */
  incompatible?: boolean;
}

/**
 * 通用帮助或业务帮助
 */
export interface IHelpEditor extends IEditor<BaseHelpProps & IObject> {
  /**
   * @description       通用帮助
   */
  xtype: 'help' | 'NGHelp';
  /**
   * @description       设置通用帮助的类型（可以是注册过的业务帮助）
   */
  type?: 'NGSingleHelp' | 'NGMultipleHelp' | String;
  /**
   * @description       ORMMode
   * @default           true
   */
  ORMMode?: boolean; // 默认true
  /**
   * @description       过滤条件
   */
  clientSqlFilter?:
    | string
    | IObject
    | (({
        ds,
        row,
        value,
        dataIndex,
        helpId
      }: {
        ds: Array<any>;
        row: any;
        value: any;
        dataIndex: string;
        helpId: string;
      }) => string | IObject);
  /**
   * @description       设置下拉数据源中的value字段
   * @default           value
   */
  valueField?: 'value' | String;
  /**
   * @description       设置下拉数据源中的label字段
   * @default           label
   */
  labelField?: 'label' | String;
  /**
   * @description       帮助标识id，通用帮助必须设置helpId（业务帮助看需求设置）
   */
  helpId?: string; // 帮助标识id，通用帮助必须设置helpId
  /**
   * @description       设置非编辑状态下单元格需要显示的字段，默认为：`${当前列的dataIndex}EXName`
   */
  displayField?: string;
}
