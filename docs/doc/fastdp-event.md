---
title: 事件监听
order: 2
toc: false
group: 二次开发
---

## 事件监听

基础组件事件扩展（支持多次绑定），前置、后置事件监听。

```javascript
$zh.AllReady(function (page, options) {
  var useBeforeClick = options.useBeforeClick;
  var useClick = options.useClick;

  var tb = $zh.getCmpApi('toolbar3');

  // 监听保存按钮的点击事件
  tb.subscribe(async function ({ args }) {}, 'onClick');

  // 监听前置事件，返回false则取消向下执行
  tb.subscribe(async function ({ args }) {
    return false; // 取消向下执行
  }, 'onBeforeClick');

  useBeforeClick(function ({ args }) {
    return new Promise(function(resolve){
      setTimeout(()=>{ resolve(false) }, 2000);
    });
  }, 'save');

  useBeforeClick(async function ({ args }) {
    await $zh.delay(2000);
    return false; // 取消向下执行
  }, 'save');

  useClick(async function ({ args }) {}, 'save');
});
```

## Demo 演示

```tsx
/**
 * hideActions: ["CSB"]
 * defaultShowCode: true
 * title: 备注
 * description: 可以代替 bindEvent 订阅前置事件或者后置事件
 */
import React from 'react';
import { definePage, BaseComponent, ToolBar, ToolBarItemType } from '@zh/zh-design';

// 二开脚本，实际开发时，不需要手动导入，框架会根据busType自动加载
import eventJs from './use_def/event';

const buttons: ToolBarItemType = ['add', 'edit', 'delete', 'save', '->', 'help', 'back'];

export default definePage({
  component: class extends BaseComponent {
    constructor(props) {
      super(props);
      eventJs();
    }

    render() {
      return <ToolBar id="toolbar1" buttons={buttons} style={{ backgroundColor: '#f9fafb' }} />;
    }
  }
});
```
