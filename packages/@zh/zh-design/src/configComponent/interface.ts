import { Rule } from 'antd/lib/form';
import { Dispatch } from 'dva';

interface commonItem {
  // label: string;
}

//form表单
type customRule = { test: Function; message: string };

type formItem = {
  name: string;
  customRule?: customRule; //校验
  rules?: Rule[];
  [propskey: string]: any;
} & commonItem;

export type form = {
  name: string;
  children: Array<formItem>;
  [propskey: string]: any;
};

//列表grid
type gridItem = {
  datafield: string;
  [propskey: string]: any;
} & commonItem;

export type grid = {
  name: string;
  children: Array<gridItem>;
};

export interface commonConf {
  form?: {
    [propskey: string]: form;
  };
  grid?: {
    [propskey: string]: grid;
  };
  fieldSetForm?: {
    [propskey: string]: {
      name: string;
      children: Array<{
        name: string;
        [propskey: string]: string | number | boolean;
      }>;
    };
  };
}

export type script = (payload: { getState: Function; dispatch: Dispatch }) => commonConf;

export type Layout = 'horizontal' | 'vertical' | 'inline';

export type LabelPosition = 'top' | 'left';

export interface eventHandler {
  children?: eventHandler;
  [propskey: string]: Function | object | eventHandler | undefined | Array<Function>;
}
