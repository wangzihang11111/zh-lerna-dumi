---
title: 表格二开
order: 8
toc: false
group: 二次开发
---

# 表格二开

通过二开代码来更新表单项组件。

```tsx
/**
 * hideActions: ["CSB"]
 * defaultShowCode: true
 */
import React from 'react';
import { definePage, BaseComponent, GridView } from '@zh/zh-design';
import model from './store/table/index';
import { getList } from './store/table/service';

// 二开脚本，实际开发时，不需要手动导入，框架会根据busType自动加载
import initTable from './use_def/table';

export default definePage({
  model,
  initLoad: { script: false },
  component: class extends BaseComponent {
    constructor(props) {
      super(props);
      initTable();
    }

    render() {
      const { table } = this.getDvaState();
      return <GridView disabled={false} id="table1" {...table} request={getList} />;
    }
  }
});
```
