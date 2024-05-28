---
title: 表单Api更新
order: 6
toc: false
group: 二次开发
---

# 表单 Api 更新

通过二开代码来更新表单项组件。

```tsx
/**
 * hideActions: ["CSB"]
 * defaultShowCode: true
 */
import React from 'react';
import { definePage, BaseComponent, Form } from '@zh/zh-design';

// 二开脚本，实际开发时，不需要手动导入，框架会根据busType自动加载
import initForm from './use_def/form1';

const config = [
  { name: ['group', 'input1'], label: '数字输入', xtype: 'InputNumber' },
  { name: ['group', 'input2'], label: '文本输入', xtype: 'Input' },
  {
    name: 'input3',
    label: '下拉选择',
    xtype: 'Select',
    data: [
      { value: 1, label: '类型1' },
      { value: 2, label: '类型2' }
    ]
  },
  { name: 'input4', label: '通用帮助', xtype: 'SingleHelp', helpId: 'help1' }
];

export default definePage({
  component: class extends BaseComponent {
    constructor(props) {
      super(props);
      initForm();
    }

    render() {
      return <Form id="form1" colspan={2} config={config} />;
    }
  }
});
```
