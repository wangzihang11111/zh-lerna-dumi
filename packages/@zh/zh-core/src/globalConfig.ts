import CryptoJS from 'crypto-js';
import React from 'react';
import type { IObject, PartialAll } from './interface';
import { defaultTheme } from './theme';
import { baseCore } from './util/core';

export const BaseColor = defaultTheme.antdTheme.token?.colorPrimary || '#008EE0';

// 颜色变量，需要在 base.less定义
export const cssVar = {
  gap: 'var(--outer-margin, 16px)',
  componentColor: 'var(--component-background, #FFFFFF)',
  borderColorSplit: 'var(--border-color-split, #ECECEC)',
  border: '1px solid var(--border-color-split, #ECECEC)',
  primaryColor: `var(--primary-color, ${BaseColor})`,
  linkColor: `var(--link-color, ${BaseColor})`,
  formLabelWidth: 'var(--form-label-width, 98px)',
  borderRadius: 'var(--border-radius-base, 4px)'
};

type PlatformType = 'pc' | 'app' | 'global';
type ComponentType = { isHelp?: boolean; defaultProps: IObject; component: React.ComponentType<any> };
const _components: Record<PlatformType, Record<string, ComponentType>> = {
  pc: {},
  app: {},
  global: {}
};

interface IGlobalConfig {
  /**
   * @description        服务端环境
   * @default            java
   */
  environment: 'java';
  /**
   * @description        平台api接口地址
   */
  apiUrl: {
    /**
     * @description       app自定义表单UI元数据接口
     */
    appCustomFormUrl: string;
    /**
     * @description       apc自定义表单UI元数据接口
     */
    pcCustomFormUrl: string;
    /**
     * @description       系统表单UI元数据接口
     */
    individualUIContent: string | Function;
    /**
     * @description       多模式下系统表单UI元数据接口
     */
    individualUIContentByMenu: [string, string] | [Function, Function];
    /**
     * @description       二开脚本地址接口
     */
    userDefScript: string;
    /**
     * @description       灵动菜单数据接口
     */
    floatMenu: string;
    /**
     * @description       多语言接口
     */
    languageInfo: string;
    /**
     * @description       登录信息接口
     */
    appInfo: string;
    /**
     * @description       打印接口的根路径
     */
    printRoot: string;
    /**
     * @description       附件接口的根路径
     */
    appAttachmentRoot: string;
  };
  default: {
    tableConfig: {
      /**
       * @description       自定义批量操作工具栏信息区域, false 时不显示(在checkbox选择模式下有效)
       * @default           true
       */
      tableAlertRender: boolean;
      /**
       * @description       表头行高
       * @default           40
       */
      headerHeight: number;
      /**
       * @description       表体行高
       * @default           40
       */
      rowHeight: number;
      /**
       * @description       header的高级菜单, 列隐藏或显示功能
       * @default           true
       */
      headerMenu: boolean;
      /**
       * @description       数据在单元格的显示位置
       * @default           left
       */
      align: 'left' | 'center' | 'right';
      /**
       * @description       表头默认是否开启浮窗提示
       * @default           true
       */
      headerTooltip: boolean;
      /**
       * @description       单元格默认是否开启浮窗提示
       * @default           false
       */
      tooltip: boolean | 'render';
    };
    helpConfig: {
      /**
       * @description       弹出帮助的宽度
       * @default           1000
       */
      width: number;
      /**
       * @description       弹出帮助的高度
       * @default           600
       */
      height: number;
    };
    /**
     * @description       金额数值精度
     * @default           {}
     */
    precision: {
      prc?: number; // 单价
      amt?: number; // 合价
      qty?: number; // 工程量
      rate?: number; // 百分比
      amount?: number; // 金额
    };
    /**
     * @description       默认主题
     * @default           BaseColor
     */
    theme: string;
  };
  iconScriptUrl: string;
  disableDva: boolean;
  /**
   * 加密相关参数
   */
  cryptoDefaultParams: {
    keyStr: string;
    mode: any;
    encodePadding: any;
    decodePadding: any;
  };
}

export type CryptoParamsType = Partial<IGlobalConfig['cryptoDefaultParams']>;

const defaultApiUrl: IGlobalConfig['apiUrl'] = {
  appCustomFormUrl: 'SUP/ReactMobileCustom/GetMobileUI',
  pcCustomFormUrl: 'SUP/ReactPCCustom/GetPCUI',
  individualUIContent: 'engine/metadata/uiExtendScheme/getUiSchemeInfoByBizCode',
  individualUIContentByMenu: [
    'SUP/IndividualUI/getIndividualUiByMenuAndQuery',
    'SUP/IndividualUI/getIndividualUiByConfigId'
  ],
  userDefScript: 'engine/metadata/uiExtendScheme/getScriptByBizCode',
  floatMenu: 'SUP/CustomFloatMenu/GetFloatMenuByCode',
  languageInfo: 'engine/metadata/langSet/getlangMap',
  appInfo: 'SUP/GetAppInfoForPage',
  printRoot: '/RW',
  appAttachmentRoot: '/API'
};

/**
 * 全局配置信息
 */
const globalConfig: IGlobalConfig = {
  environment: 'java',
  apiUrl: defaultApiUrl,
  default: {
    tableConfig: {
      tableAlertRender: true,
      headerHeight: 40,
      rowHeight: 40,
      headerMenu: true,
      align: 'left',
      tooltip: false,
      headerTooltip: true
    },
    helpConfig: {
      width: 1000,
      height: 600
    },
    precision: {},
    theme: BaseColor
  },
  iconScriptUrl: '',
  disableDva: false,
  cryptoDefaultParams: {
    keyStr: 'd(3D0;Ia',
    mode: CryptoJS.mode.ECB,
    encodePadding: CryptoJS.pad.Pkcs7,
    decodePadding: CryptoJS.pad.Pkcs7
  }
};

function getGlobalConfig() {
  return globalConfig;
}

type ConfigParam<T> = PartialAll<T> | ((config: T) => T);

function setGlobalConfig(config?: ConfigParam<IGlobalConfig>) {
  if (config) {
    if (baseCore.isFunction(config)) {
      Object.assign(globalConfig, config(globalConfig));
    } else {
      const loop = (oldCfg, newCfg) => {
        Object.keys(newCfg).forEach((key) => {
          if (baseCore.isObject(oldCfg[key])) {
            loop(oldCfg[key], newCfg[key]);
          } else {
            oldCfg[key] = newCfg[key];
          }
        });
      };
      loop(globalConfig, config);
    }
  }
}

export interface IRegisterComponentOptions {
  /**
   * 是否帮助组件
   */
  isHelp?: boolean;
  /**
   * 是否多选帮助
   */
  multiple?: boolean;
  defaultProps?: IObject;
}

/**
 * 注册外部组件
 * @param Components
 * @param options
 */
function registerCpts(
  Components: Record<string, React.ComponentType<any>>,
  options?: IRegisterComponentOptions & { platform?: PlatformType }
) {
  const cpts: Record<string, ComponentType> = {};
  const platform = options?.platform || 'global';
  if (Components) {
    Object.keys(Components).forEach((key) => {
      const component = Components[key] as any;
      const value: ComponentType = { component, defaultProps: {} };
      if (options?.isHelp) {
        value.isHelp = true;
      }
      if (options?.multiple) {
        value.defaultProps.multiple = true;
      }
      if (options?.defaultProps) {
        value.defaultProps = { ...value.defaultProps, ...options.defaultProps };
      }
      cpts[key.toLowerCase()] = value;
    });
  }
  Object.assign(_components[platform], cpts);
}

function getRegisterCpt(type: string = '', platform: PlatformType = 'global', candidate = '') {
  if (type === '__') {
    return _components[platform];
  }
  if (type) {
    if (baseCore.isString(type)) {
      const value = _components[platform][type.toLowerCase()] || _components[platform][candidate.toLowerCase()];
      return value?.component;
    }
    return void 0;
  }
  return void 0;
}

function getRegisterCptWithProps(type: string = '', platform: PlatformType = 'global', candidate = '') {
  if (type) {
    if (baseCore.isString(type)) {
      const value = _components[platform][type.toLowerCase()] || _components[platform][candidate.toLowerCase()];
      return [value?.component, value?.defaultProps, { isHelp: value?.isHelp }];
    }
  }
  return [void 0, {}, {}];
}

export { getRegisterCpt, registerCpts, getGlobalConfig, setGlobalConfig, getRegisterCptWithProps };
