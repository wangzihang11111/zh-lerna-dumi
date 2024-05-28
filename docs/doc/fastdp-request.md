---
title: http 请求
order: 3
toc: content
group: 二次开发
---

# http 请求

基于 umi-request 封装的网络请求。

## get

GET 请求。

示例：

```javascript
$zh.AllReady(function (page) {
  $zh.request.get({ url: '', data: {} }).then((res) => {
    // TODO
  });
});
```

## post

POST 请求，默认 form 提交。

示例：

```javascript
$zh.AllReady(function (page) {
  $zh.request.post({ url: '', data: {} }).then((res) => {
    // TODO
  });
});
```

## body

POST 请求，默认 body 参数提交。

示例：

```javascript
$zh.AllReady(function (page) {
  $zh.request.body({ url: '', data: {} }).then((res) => {
    // TODO
  });
});
```

## withCancel

自定义请求方式及参数格式，返回取消函数。

参数：

- @param {string} requestType post 类型, 用来简化写 content-Type, 默认 json
- @param {\*} data post 数据
- @param {object} params query 参数
- @param {string} responseType 服务端返回的数据类型, 用来解析数据, 默认 json
- @param {boolean} useCache 是否使用缓存,只有 get 时有效, 默认关闭, 启用后如果命中缓存, response 中有 useCache=true. 另: 内存缓存, 刷新就没.
- @param {number} ttl 缓存生命周期, 默认 60 秒, 单位毫秒
- @param {number} timeout 超时时长, 默认未设, 单位毫秒
- @param {boolean} getResponse 是否获取 response 源
- @param {function} errorHandler 错误处理
- @param {string} prefix 前缀
- @param {string} suffix 后缀
- @param {string} charset 字符集, 默认 utf8
- @param {string} method 设置请求方式
- @param {boolean} dataToJson 返回值是否自动转换 json 对象，默认 true

示例：

```javascript
$zh.AllReady(function (page) {
  var [promise, cancel] = $zh.request.withCancel({ url: '', method: 'GET' });

  promise.then((res) => {
    // TODO
  });

  cancel('取消');
});
```

## on

请求拦截。

示例：

```javascript
$zh.AllReady(function (page) {
  // 请求前拦截器
  $zh.request.on('request', (url, options) => {
    return { url: url, options: options };
  });

  // 请求后拦截器
  $zh.request.on('response', async (response, requestOptions) => {
    const data = await response[requestOptions.responseType || 'json']();
    if (data.status === 401) {
    } // 错误处理
    return response;
  });
});
```

## abort

取消请求。

示例：

```javascript
$zh.AllReady(function (page) {
  var cancelId = $zh.uniqueId('post');

  // cancel配置唯一请求id，多次发送，会默认取消上一次的请求
  $zh.request.post({ url: '', data: {}, cancel: cancelId }).then((res) => {
    // TODO
  });

  // cancel配置为钩子函数，参数：execCancel 为取消请求的执行函数， id 为cancelId
  $zh.request
    .post({
      url: '',
      data: {},
      cancel: function (execCancel, id) {
        cancelId = id;
      }
    })
    .then((res) => {
      // TODO
    });

  // 取消请求
  $zh.request.abort({ msg: '取消消息', cancelId: cancelId });
});
```
