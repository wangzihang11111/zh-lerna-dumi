import { Menu as AntMenu } from 'antd';
import { MenuProps } from 'antd/lib/menu';
import React from 'react';

function loopChildren(items, pKey = null) {
  return items.filter(Boolean).map((item, index) => {
    const { children: label, title, ...others } = item.props;
    const key = item.key ?? (pKey ? `${pKey}-${index}` : `${index}`);
    if (Array.isArray(label) && title) {
      return { key, label: title, ...others, children: loopChildren(label, key) };
    }
    return { key, label, ...others };
  });
}

export class Menu extends React.Component<MenuProps, {}> {
  static SubMenu = AntMenu.SubMenu;
  static Divider = AntMenu.Divider;
  static Item = AntMenu.Item;
  static ItemGroup: typeof AntMenu.ItemGroup = AntMenu.ItemGroup;

  render() {
    const { children, ...props } = this.props;
    const newProps: any = {};

    if (children && !props.items) {
      const tmp = Array.isArray(children) ? children : [children];
      // 新版本 antd 将移除children属性，此处兼容历史属性
      newProps.items = loopChildren(tmp);
    }

    return <AntMenu {...props} {...newProps} />;
  }
}
