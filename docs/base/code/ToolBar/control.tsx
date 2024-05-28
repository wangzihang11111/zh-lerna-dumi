/**
 * title: 动态控制toolbar属性
 * description: 选择不同配置组合查看效果。
 */
import { DownOutlined } from '@ant-design/icons';
import { Checkbox, IToolBarProps, ToolBar, ConfirmButton } from '@zh/zh-design';
import React from 'react';
import { useState } from 'react';

export default function () {
  const handleClick = (key, value) => () => {
    setButtonConfig((prevState) => ({ ...prevState, [key]: value }));
  };

  const [buttonConfig, setButtonConfig] = useState<IToolBarProps>({
    buttons: [
      'add',
      'edit',
      'delete',
      '|',
      <ConfirmButton key="delete" type="link" disabled size="small" title="确认删除当前选中的接口？"
        buttonStyle={{ padding: 0, marginLeft: -5, marginRight: 3 }}>confirm</ConfirmButton>,
      <Checkbox defaultChecked checkedValue={true} unCheckedValue={false} onChange={v => {
        setButtonConfig((prevState) => ({
          ...prevState,
          showIcon: v
        }));
      }}>显示图标</Checkbox>,
      '|',
      {
        id: 'disabled_keys',
        text: '切换disabled',
        onClick: () => {
          setButtonConfig((prevState) => ({
            ...prevState,
            disabledKeys: prevState.disabledKeys?.length ? [] : ['delete']
          }));
        }
      },
      {
        id: 'type_group',
        text: '切换类型',
        icon: <DownOutlined />,
        children: ["default", "primary", "ghost", "dashed", "link", "text"].map(type => {
          return { id: type, text: type, icon: null, onClick: handleClick('type', type) };
        })
      },
      {
        id: 'size_group',
        text: '切换大小',
        icon: <DownOutlined />,
        children: ['small', 'middle', 'large'].map(size => {
          return { id: size, text: size, icon: null, onClick: handleClick('size', size) };
        })
      },
      {
        id: 'direction_group',
        text: 'direction',
        icon: <DownOutlined />,
        children: ["left", "center", "right", "space-between", "space-around"].map(direction => {
          return { id: direction, text: direction, icon: null, onClick: handleClick('direction', direction) };
        })
      }
    ],
    disabledKeys: ['delete'],
    direction: 'left'
  });

  return (
    <ToolBar
      buttons={buttonConfig.buttons}
      type={buttonConfig.type}
      size={buttonConfig.size}
      id="opToolbar"
      style={{ backgroundColor: '#f9fafb' }}
      showIcon={buttonConfig.showIcon}
      disabledKeys={buttonConfig.disabledKeys}
      direction={buttonConfig.direction}
    />
  );
}
