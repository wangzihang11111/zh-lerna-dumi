import { CSSProperties, ReactElement, RefObject } from 'react';
import type { IObject } from '../../util';
import type { formConfProps } from '../config/interface';
import type { LabelPosition } from '../interface';
import type { CompDefaultPropsInfo } from '../props.dt';

export type TitlePropsDefaultType = {
  show?: boolean;
  position?: 'left' | 'right';
  layIcon?: ReactElement;
  title?: string;
  style?: CSSProperties;
};

export type TitlePropsType = TitlePropsDefaultType | ReactElement;

export type FooterBtnType = {
  text: string;
  loading?: boolean;
};

export type FooterDefaultPropsType = {
  save?: FooterBtnType;
  reset?: FooterBtnType;
  position?: 'left' | 'right';
};

export type FooterPropsType = FooterDefaultPropsType | ReactElement;

export type OptType = 'modifiedRow' | 'newRow' | 'deletedRow';

type rule = Record<string, any> & { message?: string };

/**
 * @description   表单属性
 */
export type FormInfo = {
  form?: any;
  /**
   * @description   是否是查看状态
   * @default       false
   */
  view?: boolean;
  /**
   * @description   labe宽度
   * @default       85
   */
  labelWidth?: number | string;

  /**
   * @description   表格表单
   * @default       false
   */
  bordered?: boolean;

  /**
   * @description   label标签是否显示冒号
   * @default       true
   */
  colon?: boolean;

  /**
   * @description   表单属性
   */
  value?: object;

  /**
   * @description   label标签未知
   * @default       left
   */
  labelPosition?: LabelPosition;

  /**
   * @description   表单判断是新增、修改用来格式化数据
   */
  opt?: OptType;

  /**
   * @description   表单主键（判断是新增、修改用来格式化数据）
   */
  busKey?: string;

  /**
   * @description   表单禁用
   * @default       false
   */
  disabled?: boolean;

  /**
   * @description   表单属性
   * @default       right
   */
  labelAlign?: 'left' | 'center' | 'right';

  /**
   * @description   表单列数配置
   */
  colspan?:
    | number
    | Array<number>
    | {
        [propsKey: number]: number;
      };

  /**
   * @description   表单校验规则
   */
  rules?: { [propsKey: string]: Array<rule> };

  /**
   * @description   表单值改变事件
   */
  onValuesChange?: (changeval: Object, allvalues: Object) => void;

  // titleProps?: TitlePropsType;
  footerProps?: FooterPropsType;
  layout?: 'horizontal' | 'vertical' | 'inline';
  onSave?: (vals: any, errors: any, formRef?: any) => any;
  onReset?: () => any;
  onVertify?: () => any;
  getPopupContainer?: () => Document;
  forceRender?: boolean;
  panelHeight?: string | number;
  outRef?: any;
  design?: boolean;
  defaultValue?: any;
  /**
   * form表单集的ref对象
   */
  formSetRef?: RefObject<any>;
  /**
   * @description       重写对应name的item属性
   */
  fieldProps?: {
    [key: string]: IObject | ((item: IObject) => IObject);
  };
};

export type FormPropsInfo = FormInfo & CompDefaultPropsInfo<formConfProps.FormLayout>;
