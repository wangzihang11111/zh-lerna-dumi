export * from './Attachment';
export * from './BMap';
export * from './grid';
export * from './help';
export * from './imp';
export * from './org-tree';
export * from './project-tree';
export * from './query-panel';
export * from './work-flow';

import React from 'react';
import { IRegisterComponentOptions, registerComponent } from '../util';
import { Grid } from './grid';
import * as HelpCpts from './help';

// 是否默认导入标记
let hasDefaultRegister = false;

/**
 * 注入业务组件到@zh/zh-core
 */
export function injectBusinessComponents(
  cpt?: Record<string, React.ComponentType<any>>,
  options?: IRegisterComponentOptions
) {
  if (!hasDefaultRegister) {
    hasDefaultRegister = true;
    registerComponent(HelpCpts, { isHelp: true });
    Object.keys(HelpCpts).forEach((key) => {
      if (!['SingleHelp', 'MultipleHelp'].includes(key)) {
        registerComponent({ [`Multiple${key}`]: HelpCpts[key] }, { isHelp: true, defaultProps: { multiple: true } });
      }
    });
    registerComponent({ Grid });
  }
  cpt && registerComponent(cpt, options);
}
