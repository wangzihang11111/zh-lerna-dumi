---
order: 10
title: OrgTree 通用组织树
demo:
  cols: 2
group: 树组件
---

## OrgTree 通用组织树

基于 AsyncTree 封装。

### OrgTree

```tsx
/**
 * title: 基本使用
 * description:  基于asyncTree 组件封装。
 */
import React from 'react';
import { zh, OrgTree, Layout, Checkbox, Button, useRefState } from '@zh/zh-design';

export default () => {
    const [state, setState] = useRefState({ checkable: false });

    return (
        <Layout style={{ height: 390 }}>
            <Layout direction='row' center style={{padding: '0 6px', justifyContent: 'space-between'}}>
                <Checkbox onChange={v => setState({ checkable: v })}>复选模式</Checkbox>
                <Button onClick={() => console.log(zh.getCmpApi('orgTree')?.getSelectedNodes?.())}>getSelectedNodes in console</Button>
            </Layout>
            <Layout.Flex >
                <OrgTree id="orgTree" {...state} />
            </Layout.Flex >
        </Layout>
    );
};
```

## API

### 组织树属性

<API id="OrgTree"></API>

### 组织树请求参数

<API id="OrgTreeParam"></API>
