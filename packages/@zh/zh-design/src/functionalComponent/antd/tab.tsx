import { Tabs as AntTabs } from 'antd';
import type { TabsProps } from 'antd/es/tabs';
import React from 'react';
import { compHoc, zh, ZhComponent, type CompHocOption } from '../../util';

const TabsComp = compHoc<TabsProps & { fitHeight?: boolean; overflowVisible?: boolean }>(
  class extends ZhComponent {
    static getDerivedStateFromProps(nextProps, prevState) {
      return ZhComponent.propsToState(nextProps, prevState, ['defaultActiveKey|activeKey', 'activeKey']);
    }

    setActiveKey = (key) => {
      const lastKey = this.state.activeKey;
      const innerChange = () => {
        if (this.props.onChange?.(key) !== false) {
          this.innerNotify([key], 'onChange').then();
          zh.getPageObserver().notify(
            {
              key,
              containerId: this.getId(),
              instance: this,
              args: [key, lastKey]
            },
            'onActiveKeyChange'
          );
          return true;
        }
        return false;
      };
      if (key !== this.state.activeKey) {
        if (this.props.onChange && this.props.hasOwnProperty('activeKey')) {
          if (innerChange()) {
            this.state.activeKey = key;
          }
        } else {
          this.setState({ activeKey: key }, () => {
            innerChange();
          });
        }
      }
    };

    getActiveKey() {
      return this.state.activeKey;
    }

    render() {
      const {
        onChange,
        fitHeight = true,
        overflowVisible = false,
        className,
        children,
        tabBarStyle,
        style,
        observer,
        ...props
      } = this.props as any;

      if (children && !props.items) {
        // 新版本 antd 将移除children属性，此处兼容历史属性
        props.items = [];
        React.Children.forEach(children, (item: any) => {
          if (item) {
            const { children, tab: label, ...others } = item.props;
            props.items.push({ key: item.key, label, children, ...others });
          }
        });
      }

      const newStyle = fitHeight ? { ...style, height: '100%' } : style;

      return (
        <AntTabs
          className={zh.classNames(className, { 'fit-height': fitHeight, 'overflow-visible': overflowVisible })}
          tabBarStyle={{ ...tabBarStyle }}
          style={newStyle}
          {...props}
          activeKey={this.state.activeKey}
          onChange={this.setActiveKey}
        />
      );
    }
  },
  'Tabs'
);

const Tabs = TabsComp as CompHocOption<typeof TabsComp, typeof AntTabs.TabPane>;
Tabs.Option = AntTabs.TabPane;

export { Tabs };
