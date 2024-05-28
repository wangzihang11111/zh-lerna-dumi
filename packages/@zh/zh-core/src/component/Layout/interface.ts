import React, { CSSProperties, FunctionComponent, RefObject } from 'react';

interface IBaseTypes {
  children: React.ReactNode;
  /**
   * @description       当前容器的类名
   */
  className?: string;
  /**
   * @description       当前容器的 style 属性
   */
  style?: CSSProperties;
  /**
   * @description       当前容器的宽度
   */
  width?: number | string;
  /**
   * @description       当前容器的高度
   */
  height?: number | string;
  /**
   * @description       当前容器的 style 属性
   * @default           column
   */
  direction?: 'row' | 'column';
  /**
   * @description       是否居中
   * @default           false
   */
  center?: boolean | [boolean, boolean];
}

export interface LayoutComponent<P = {}> extends FunctionComponent<P> {
  Flex: React.FC<ILayoutFlex>;
  Slider: React.FC<ILayoutSlider>;
}

export type ILayoutSlider = {
  /**
   * @description       根据父容器direction的值决定宽度还是高度大小
   * @default           180
   */
  size?: number | string;
  /**
   * @description       是否自动展开，鼠标移入展开，移出折叠
   * @default           false
   */
  autoExpand?: boolean;
  /**
   * @description       是否支持拖动调整大小
   * @default           true
   */
  draggable?: boolean;
  /**
   * @description       拖动条的样式
   */
  draggableStyle?: CSSProperties;
  /**
   * @description       初始是否收起
   * @default           false
   */
  defaultCollapsed?: boolean;
  /**
   * @description       指定当前是否收起
   * @default           false
   */
  collapsed?: boolean;
  /**
   * @description       大小变化时回调函数
   */
  resize?: (size, propName) => void;
  /**
   * @description       自定义拖动条，默认拖动条不显示
   */
  icon?: React.ReactElement;
  /**
   * @description       边框
   */
  bordered?: boolean;
  /**
   * @description       resize大小变化的范围
   */
  resizeOption?: {
    minSize?: number;
    maxSize?: number;
    doubleClick?: boolean;
  };
  /**
   * @description       启用带title的默认收起展开功能
   */
  collapseOptions?: {
    title?: React.ReactNode | ((collapsed: boolean) => React.ReactNode);
    icon?: null | React.ReactElement | ((collapsed: boolean) => React.ReactElement);
    align?: 'left' | 'center' | 'right' | 'top' | 'bottom';
    style?: CSSProperties;
  };
  /**
   * @description       是否开启记忆功能
   */
  remeberKey?: string;
} & Pick<IBaseTypes, 'children' | 'className' | 'style'>;

export interface ILayoutFlex extends IBaseTypes {
  /**
   * @description       设置元素如何分配空间
   */
  flex?: number;
}

export interface ILayout extends IBaseTypes {
  /**
   * @description       是否为加载中状态
   * @default           false
   */
  loading?: boolean;
  /**
   * @description       是否占满父容器
   * @default           false
   */
  autoFit?: boolean;
  /**
   * @description       获取当前layout的dom实例
   */
  outRef?: RefObject<HTMLDivElement>;
}
