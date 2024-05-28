---
order: 10
title: Panel 容器
---

## Panel 容器

带标题的容器组件

```tsx
/**
 * title: 基本用法
 * description: 带标题的容器组件
 * background: '#f0f2f5'
 */
import React from 'react';
import { Panel, Table, ToolBar } from '@zh/zh-design';

const buttons = ['save', 'export', 'import'];
export default () => {
  return (
    <div>
      <Panel title="没有内容"></Panel>
      <Panel title="我是标题1" extra={<ToolBar buttons={buttons} style={{width:'auto'}}/>} fullScreen collapsible>
         这是一段内容1
      </Panel>
      <Panel title="我是标题2">这是一段内容2</Panel>
      <Panel>没有标题</Panel>
    </div>
  );
};
```

## API

### IPanelProps

<API id="Panel"></API>
