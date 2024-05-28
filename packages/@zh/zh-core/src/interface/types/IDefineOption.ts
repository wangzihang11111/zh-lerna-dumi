import type { ComponentClass, FunctionComponent } from 'react';
import type { IModelType } from './IModelType';

export interface IComponentOptions<P = any> {
  model?: IModelType | IModelType[];
  component: FunctionComponent<P> | ComponentClass<P>;
}

export interface IPageOptions {
  /**
   * @description     初始化加载：二开脚本、多语言、ui元数据、按钮权限
   * @default         { script: true, language: true, ui: true, buttonRights: true }
   */
  initLoad?: { script?: boolean; language?: boolean; ui?: boolean; buttonRights?: boolean | string };
  uiConfig?: Record<string, any> | Function;
  busType?: string;
  customFormType?: 'app' | 'pc'; // 自定义表单类型
  injectSrc?: string | string[];
  injectCss?: string | string[];
  model?: IModelType | IModelType[];
  component: ComponentClass<any>;
  injectProps?: (state: any) => Promise<any>;
}
