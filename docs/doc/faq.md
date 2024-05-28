---
order: 20
title: 常见问题
toc: content
group: 
  title: 其他
  order: 90
---

## 二开脚本拿不到页面初始数据？

1、请确认当前页面是否绑定 mode 状态；

2、异步获取请求是否在`useAsyncEffect(函数hooks)`或`componentAsyncMount(类钩子)`内部执行。

## 如何获取页面数据状态？

1、在业务代码中，通过页面 page 实例的`page.getDvaState()`方法获取；

2、在二开脚本中，通过 AllReady(function(page){ var dataState = page.getDvaState(); });

3、全局获取，通过`zh.getPageInstance().getDvaState()` 或者 `zh.getPageState()`方法获取。