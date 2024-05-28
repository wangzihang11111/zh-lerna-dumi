---
title: 基础api
order: 1
toc: content
group:
  title: 二次开发
  order: 20
---

# 基础 api

二开脚本，所有 api 都暴露在 window.$zh 全局对象下，系统业务代码中，请使用 `import { zh } from "@zh/zh-design" 。`

## AllReady

二开脚本的入口，在回调函数中编写二开代码。

示例：

```javascript
$zh.AllReady(function (page) {
  // TODO
});
```

## getPageInstance

获取当前路由页面的实例。

## getPageUI

获取当前路由页面的 UI 状态。

## getPageState

获取当前路由页面的业务数据状态。

## getCmpApi

通过组件 id 获取组件实例暴露的 api。

返回对象内置以下公共 API：

- setReadOnly(`readonly: boolean | ((...args) => boolean) = true`)：设置组件是否可编辑
- setProps(`props: object | ((prevProps: object) => object)`)：设置组件的属性
- getObserver()：获取组件的观察者，通过`subscribe`订阅组件内部`notify`通知
- bindEvent(`event: string, callback: Function`)：绑定唯一事件，会覆盖之前事件，常用于注入前置事件
- on(`event: string, callback: Function, once: boolean = false`)：给同一事件绑定多个回调，前置事件不支持多次绑定，once 表示执行后移除
- refreshComponent()：强制刷新组件

示例：

```javascript
$zh.AllReady(function (page) {
  // 设置input组件的值
  $zh.getCmpApi('input1').setValue('我是新设置的值');

  // 获取input组件的值
  var value = $zh.getCmpApi('input1').getValue();

  // 获取grid表格的数据行
  var rows = $zh.getCmpApi('grid1').getRows();

  // 获取form表单的值
  var values = $zh.getCmpApi('form1').getValues();
});
```

## updateUI

更新 UI 元数据。

示例：

```javascript
$zh.AllReady(function (page) {
  // 函数形式更新 ui layout
  $zh.updateUI(function (updater, state) {
    // 修改customfilebilltoform表单BilltoId字段的required属性
    updater.form.customfilebilltoform.BilltoId.setProps({
      required: true
    });
  });

  // 对象形式更新 ui layout
  // 格式：{form#field: 0}， 0只读 1可编辑 2不可见 3必输项
  $zh.updateUI({ 'form#customfilebilltoform#BilltoId': 0 });
});
```

## updateState

更新业务数据状态。

示例：

```javascript
$zh.AllReady(function () {
  // 函数形式更新当前 page model 的状态
  $zh.updateState(function (updater, state) {
    // 修改formData状态的字段属性值
    updater.formData.setProps({ field1: '修改后的值' });
  });

  // 对象形式更新当前 page model 的状态，不推荐
  $zh.updateState({ formData: { field1: '测试1' } });
});
```

## message | alert | confirm

操作反馈信息。

示例：

```javascript
$zh.AllReady(function () {
  // 模态框弹出提示
  $zh.alert('模态弹出提示框');

  // 顶部居中显示并自动消失，是一种不打断用户操作的轻量级提示
  $zh.message('自动消失');

  // 确认提示框
  $zh.confirm('确认提交？').then(function (result) {
    //TODO，true or false
  });
});
```
