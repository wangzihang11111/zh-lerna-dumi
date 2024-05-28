import { useEffect, useState } from 'react';
import { Tabs } from '../../functionalComponent';
import {
  compHoc,
  getRegisterComponentWithProps,
  registerComponent,
  zh,
  useRefCallback,
  useRefValue
} from '../../util';
import { LayConfWrap } from '../common';
import { Comp_Info } from '../config/baseConfig';
import { formConfProps } from '../config/interface';
import { CompHocProps } from '../props.dt';
import './index.less';
import { TabPanelInfo, TabPanelPropsInfo } from './interface';

export type { TabPanelInfo } from './interface';

function TabPanelComp(props: TabPanelPropsInfo) {
  const { formConf, outRef, type = 'line', forceRender, panelHeight, ...others } = props as any;

  const [panes, setPanes] = useState<any>(() => []);
  const [activeKey, setActiveKey] = useRefValue(props.activeKey, props.defaultActiveKey);

  useEffect(() => {
    const p = (Array.isArray(formConf) ? formConf : formConf.children || []).map((item: any) => {
      item['key'] = item.id;
      return item;
    });
    setPanes(p);
    p.every(({ key }) => key !== activeKey) && setActiveKey(p[0]?.key);
  }, [formConf]);

  const onInnerChange = useRefCallback((key: string) => {
    setActiveKey(key);
    props.onChange?.(key);
  });

  const getItems = () => {
    const childArray = zh.flatArray(props.children || []);
    const t = childArray.reduce((acc: any, it: any) => {
      const tabId = (it.props && it.props['data-tabid']) || it.key;
      tabId && (acc[tabId] = it);
      return acc;
    }, {});

    const getChildItem = (item) => {
      if (t[item.id]) {
        return t[item.id];
      } else {
        const Comp: any = (
          Comp_Info[item.xtype] || {
            instance: getRegisterComponentWithProps(item.xtype)[0] || item.xtype
          }
        ).instance;
        if (Comp_Info[item.xtype]) return <Comp config={item} />;
        return zh.isFunction(Comp) ? <Comp config={item} /> : Comp;
      }
    };

    return panes
      .filter((p) => !p.hidden)
      .map((pane: any) => {
        const contentItemProps = t[pane.id]?.props || {};
        return {
          label: pane.title,
          key: pane.id,
          forceRender: contentItemProps['data-forceRender'] || pane.forceRender || forceRender,
          children: (
            <div style={{ minHeight: contentItemProps.panelHeight || pane.height || panelHeight }}>
              {getChildItem(pane)}
            </div>
          )
        };
      });
  };

  return (
    <Tabs
      {...others}
      type={type}
      ref={outRef}
      fitHeight
      size={'small'}
      onChange={onInnerChange}
      activeKey={activeKey + ''}
      style={props.style}
      className={zh.classNames('zh-tab-panel', props.className)}
      items={getItems()}
    />
  );
}

const TabPanel = compHoc<CompHocProps<formConfProps.TabPanel, TabPanelInfo>>(LayConfWrap(TabPanelComp));

export default TabPanel;
registerComponent({ TabPanel });
