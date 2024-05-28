import type { ILayout, ILayoutFlex, ILayoutSlider } from '@zh/zh-core/src/component/Layout/interface';
export const Layout = (props: ILayout) => null;
export const layout_Flex = (props: ILayoutFlex) => null;
export const layout_Slider = (props: ILayoutSlider) => null;

import type { IToolBarItemProps, IToolBarProps } from '@zh/zh-design/src/functionalComponent/toolbar/interface';
export const ToolBar = (props: IToolBarProps) => null;
export const ButtonProps = (props: IToolBarItemProps) => null;

import type { TableProps } from '@zh/zh-design/src/functionalComponent/table';
import type {
  ICheckBoxEditor,
  ICustomizedEditor,
  IDatePickerEditor,
  IHelpEditor,
  ISelectEditor,
  ITextEditor
} from '@zh/zh-design/src/functionalComponent/table/interface/editor';
import type { ColumnProps } from '@zh/zh-design/src/functionalComponent/table/interface/table';
export const Table = (props: TableProps) => null;
export const TableColumn = (props: ColumnProps) => null;
export const TextEditor = (props: ITextEditor) => null;
export const SelectEditor = (props: ISelectEditor) => null;
export const CheckBoxEditor = (props: ICheckBoxEditor) => null;
export const DatePickerEditor = (props: IDatePickerEditor) => null;
export const HelpEditor = (props: IHelpEditor) => null;
export const CustomizedEditor = (props: ICustomizedEditor) => null;

import type { IModalParamProps } from '@zh/zh-design/src/functionalComponent/modal';
export const Modal = (props: IModalParamProps) => null;

import type { IAsyncTreeProps } from '@zh/zh-design/src/functionalComponent/AsyncTree';
export const AsyncTree = (props: IAsyncTreeProps) => null;

import type { IPanel } from '@zh/zh-design/src/functionalComponent/panel';
export const Panel = (props: IPanel) => null;
