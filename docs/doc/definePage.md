---
order: 2
title: 起始路由页面
toc: false
---

# definePage

定义一个路由页面。

```tsx
/**
 * hideActions: ["CSB"]
 * defaultShowCode: true
 */
import React, {useState} from 'react';
import { definePage, BaseComponent, Layout, getHistory, OType, Button } from '@zh/zh-design';
import model from './store';
import { getPageParams } from './service';
const { Flex } = Layout;

/**
 * 声明 dva 的 model，支持导入，自动和page组件绑定
 * this.umiDispatch 执行effects方法更新数据状态
 */
export default definePage({
  model, // 声明 dva 的 model，支持导入
  injectProps: getPageParams,
  component: class extends BaseComponent {
    /**
     * 初始化(请求)页面数据，此钩子函数能够保证二开脚本拿到初始数据源
     */
    async componentAsyncMount() {
      if (getHistory().location.query?.oType === OType.Add) {
        // to do
      } else {
        await this.umiDispatch({
          type: 'getDetail',
          id: getHistory().location.query?.id
        });
      }
    }

    render() {
      return <UILayout page={this} />;
    }
  }
});

/**
 * 视图UI
 * @param page 当前页面实例，获取公共api或业务逻辑
 * @constructor
 */
function UILayout({ page }) {
  const { loading, pageParams } = page.props;
  const { title, detail, params } = page.getDvaState();
  
  return (
    <Layout loading={loading?.global}>
      <Flex>
        <ul>
          {pageParams.map((p) => (
            <li key={p.key}>
              <b>{p.key}</b>，{p.des}
            </li>
          ))}
        </ul>
      </Flex>
    </Layout>
  );
}
```
