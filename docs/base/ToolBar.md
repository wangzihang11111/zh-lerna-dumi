---
order: 10
title: ToolBar 工具条
---

## ToolBar 工具条

显示多按钮。

```tsx
/**
 * title: 基本用法
 * description: 显示一组按钮集合
 */
import React, { useState } from 'react';
import { ToolBar, type ToolBarItemType, useAllReady } from '@zh/zh-design';
import { BulbOutlined } from '@ant-design/icons';

export default () => {
  const [count, setCount] = useState(6);
  const buttons: ToolBarItemType = [
    'add',
    'delete',
    {
      id: 'group',
      text: '分组',
      children: ['addrow', 'deleterow', { id: 'group1', text: '分组1', children: ['save', 'edit'] }]
    },
    '->',
    'help',
    'back'
  ];

  const onToolbarClick = ({ id }) => {
    if (id === 'add') {
      setCount((c) => c + 1);
    } else if (id === 'delete') {
      setCount((c) => c - 1);
    }
    console.log(id);
  };

  useAllReady((_, { useClick }) => {
    useClick(() => {
      console.log(111);
    }, 'help');
  });

  return <ToolBar style={{ backgroundColor: '#f9fafb' }} id="toolbar1" badge={(id) => (id === 'add' ? count : null)} buttons={buttons} onClick={onToolbarClick} />;
};
```

```tsx
/**
 * title: 自定义按钮
 * description: 按钮项支持配置 ReactNode 节点
 */
import React from 'react';
import { ToolBar, ToolBarItemType, Button, Search, cssVar } from '@zh/zh-design';
import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export default () => {
  const buttons: ToolBarItemType = [
    <Upload>
      <Button type="text" icon={<UploadOutlined className="ng-btn-icon" />}>
        上传
      </Button>
    </Upload>,
    'attachment',
    <Button type="primary">
      自定义按钮
    </Button>,
    '->',
    <Search enterButton style={{ width: 180 }} />,
    'help'
  ];

  const onToolbarClick = ({ id }) => {
    console.log(id);
  };

  return <ToolBar style={{ backgroundColor: '#f9fafb' }} buttons={buttons} onClick={onToolbarClick} />;
};
```

<code src="./code/ToolBar/control.tsx"></code>

<code src="./code/ToolBar/bussiness.tsx"></code>

## API

### ToolBar
<API id="ToolBar"></API>

### ButtonProps
<API id="ButtonProps"></API>
