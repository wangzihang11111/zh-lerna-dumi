---
title: 表单状态更新(推荐)
order: 7
toc: false
group: 二次开发
---

# 表单状态更新(推荐)

通过二开代码来更新表单项组件。

```tsx
/**
 * hideActions: ["CSB"]
 * defaultShowCode: true
 */
import React from 'react';
import { definePage, BaseComponent, Form, FormSet } from '@zh/zh-design';
import model from './store/form/index';

// 二开脚本，实际开发时，不需要手动导入，框架会根据busType自动加载
import initForm from './use_def/form2';

export default definePage({
  model,
  initLoad: { script: false },
  component: class extends BaseComponent {
    constructor(props) {
      super(props);
      initForm();
    }

    /**
     * 初始化(请求)页面数据，此钩子函数能够保证二开脚本拿到初始数据源
     */
    async componentAsyncMount() {
      await this.umiDispatch({
        type: 'loadFormData'
      });
    }

    render() {
      console.log('render');
      const { form, fieldSetForm } = this.getDvaState();
      return (
        <>
          <Form id="form2" {...form} />
          <FormSet id="formset2" {...fieldSetForm} />
        </>
      );
    }
  }
});
```
