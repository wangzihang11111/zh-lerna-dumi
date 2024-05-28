---
order: 0
title: QueryPanel 内嵌查询
---

## QueryPanel 内嵌查询

通过业务系统元数据渲染查询组件。

```tsx
/**
 * title: 基本使用
 * description: 通过配置pageId属性，获取业务元数据，渲染组件。
 * background: '#f0f2f5'
 */
import React from 'react';
import { QueryPanel } from '@zh/zh-design';

export default () => {
  return (
    <QueryPanel pageId="dmcgjh" showLabel={true} />
  );
};
```

```tsx
/**
 * title: 配置方式
 * description: 通过配置items属性，渲染组件。
 * background: '#f0f2f5'
 */
import React from 'react';
import { QueryPanel } from '@zh/zh-design';

const items = [{
    xtype: "RangePicker", label: "单据日期", name: "a",
    antProps: {
      showTime: true
    }
  },
  {
    xtype: "DatePicker", label: "单据日期", name: "b"
  },
  {
    xtype: "Input", label: "文本", name: "c", placeholder:'aaa'
  },
  {
    xtype: "DatePicker", label: "单据日期", name: "d"
  }
];
const items1 = [{
    xtype: "RangePicker", label: "单据日期", name: "a",
    antProps: {
      showTime: true
    }
  },
  {
    xtype: "DatePicker", label: "单据日期", name: "b"
  },
  {
    xtype: "Input", label: "文本", name: "c", placeholder:'aaa'
  }
];

export default () => {
  const onSearch = (_, values) => { console.log(values); };
  
  return (
    <>
     <QueryPanel items={items} onSearch={onSearch}/>
     <QueryPanel items={items1} onSearch={onSearch}/>
    </>
  );
};
```

## API

### 属性

<API id="QueryPanel"></API>
