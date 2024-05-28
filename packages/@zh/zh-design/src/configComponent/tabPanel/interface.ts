import { formConfProps } from '../config/interface';
import { CompDefaultPropsInfo } from '../props.dt';

export type TabPanelInfo = {
  /**
   * @description   默认选中标签页
   */
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?(key: string): void;
  /**
   * @description   标签页样式
   */
  type?: 'line' | 'card' | 'editable-card';
  children?: any;
  forceRender?: boolean;
  panelHeight?: string | number;
  panes?: Array<{ id: string; title: string; item: string }>;
  formConf?: any;
};

export type TabPanelPropsInfo = TabPanelInfo & CompDefaultPropsInfo<formConfProps.TabPanel>;
