import type { ButtonType } from 'antd/lib/button';
import React, { CSSProperties, ReactNode } from 'react';
import { BussDataType } from './bridge';
import { candidateButtons } from './candidate';

type ToolBarType = keyof typeof candidateButtons | { type: 'flex' };

type IClickParams = {
  id: string;
  text: string;
  toolbar: Object;
  origin: Object;
};

export interface IToolBarItemProps {
  /**
   * @description       设置按钮的key
   */
  id: string;
  /**
   * @description       设置按钮的图标
   */
  icon?: string | React.ReactNode;
  /**
   * @description       设置多语言的key，默认取id属性值
   */
  langKey?: string;
  /**
   * @description       设置按钮权限的key，默认取id属性值
   */
  rightKey?: string;
  /**
   * @description       设置按钮类型
   * @default           text
   */
  type?: ButtonType;
  /**
   * @description       设置按钮大小
   * @default           small
   */
  size?: 'small' | 'middle' | 'large' | 'simple';
  /**
   * @description       设置按钮的文本
   */
  text?: ReactNode;
  /**
   * @description       是否隐藏
   */
  hidden?: boolean;
  /**
   * @description        是否不可点击
   */
  disabled?: boolean;
  /**
   * @description       是否简约显示，只显示icon
   */
  simple?: boolean;
  /**
   * @description       点击按钮时回调
   */
  onClick?: (event: IClickParams) => void;
  /**
   * @description       配置分组按钮
   */
  children?: Array<IToolBarItemProps | ToolBarType | React.ReactNode>;
  /**
   * @description       按钮的样式
   */
  style?: CSSProperties;
  /**
   * @description       返回业务数据的函数，用于按钮公共业务封装使用，(btnId: string) => Promise<{}> | {}
   */
  getData?: BussDataType;
}

export type ToolBarItemType = Array<IToolBarItemProps | ToolBarType | React.ReactNode>;

export interface IToolBarProps {
  /**
   * @description       阻止事件向往冒泡
   * @default           true
   */
  stopPropagation?: boolean;
  /**
   * 所属容器id，一般在表格操作列使用
   */
  containerId?: string;
  /**
   * @description       更多按钮的icon
   */
  moreIcon?: ReactNode | ((buttons: Array<IToolBarItemProps>) => React.ReactNode);
  /**
   * @description       自定义按钮图标颜色
   */
  iconColor?: string;
  /**
   * @description       显示按钮图标
   * @default           true
   */
  showIcon?: boolean;
  /**
   * @description       设置按钮类型
   * @default           text
   */
  type?: ButtonType;
  /**
   * @description       设置按钮大小
   * @default           small
   */
  size?: 'small' | 'middle' | 'large' | 'simple';
  /**
   * @description       配置 buttons 子项
   */
  buttons: Array<IToolBarItemProps | ToolBarType | React.ReactNode>;
  /**
   * @description       设置buttons的排列位置
   * @default           left
   */
  direction?: 'left' | 'right' | 'center' | 'space-between' | 'space-around'; // 默认靠左
  /**
   * @description       点击按钮时的回调事件
   */
  onClick?: (event: IClickParams) => void;
  /**
   * @description       设置样式属性
   */
  style?: CSSProperties;
  /**
   * @description       样式类
   */
  className?: string;
  /**
   * @description       设置失效状态的按钮 id 数组
   */
  disabledKeys?: Array<string>;
  /**
   * @description       设置隐藏状态的按钮 id 数组
   */
  hiddenKeys?: Array<string>;
  /**
   * @description       设置权限名，自动获取权限接口
   */
  rightName?: string;
  /**
   * @description       返回业务数据的函数，用于按钮公共业务封装使用，(btnId: string) => Promise<{}> | {}
   */
  getData?: BussDataType;
  /**
   * @description       将toolbar元素钉在可视范围
   * @default           false
   */
  affix?: boolean | { target?: () => Window | HTMLElement | null; offsetTop?: number; offsetBottom?: number };
  /**
   * @description       徽标数，用于显示需要处理的消息或提醒
   */
  badge?: ((id: string) => number | ReactNode) | Record<any, any>;
  /**
   * @description       dropdown下拉按钮切换时的事件，用于处理楼工报表控件的显示隐藏问题
   */
  onOpenChange?: (open: boolean, button?: Record<string, any>) => void;
}
