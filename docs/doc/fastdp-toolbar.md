---
title: toolbar工具条
order: 4
toc: false
group: 二次开发
---

# toolbar 工具条

通过二开代码来监听按钮的点击事件以及操作按钮的显示或隐藏。

```tsx
/**
 * hideActions: ["CSB"]
 * defaultShowCode: true
 */
import React from 'react';
import { definePage, BaseComponent, ToolBar, ToolBarItemType } from '@zh/zh-design';

// 二开脚本，实际开发时，不需要手动导入，框架会根据busType自动加载
import initToolbar from './use_def/toolbar';

const buttons: ToolBarItemType = ['save', '->', 'help', 'back'];

export default definePage({
  component: class extends BaseComponent {
    constructor(props) {
      super(props);
      initToolbar();
    }

    render() {
      return <ToolBar id="toolbar" onClick={()=>{debugger}} buttons={buttons} style={{ backgroundColor: '#f9fafb' }} />;
    }
  }
});
```
