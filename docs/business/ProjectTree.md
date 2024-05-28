---
order: 11
title: ProjectTree 项目组织树
demo:
  cols: 2
group: 树组件
---

## ProjectTree 项目组织树

基于 OrgTree 封装。

### ProjectTree

```tsx
/**
 * title: 基本使用
 * description:  基于 OrgTree 组件封装。
 */
import React from 'react';
import { zh, ProjectTree, Layout, Checkbox, Button, useRefState } from '@zh/zh-design';

export default () => {
    const [state, setState] = useRefState({ checkable: false });

    return (
        <Layout style={{ height: 390 }}>
            <Layout direction='row' center style={{padding: '0 6px', justifyContent: 'space-between'}}>
                <Checkbox onChange={v => setState({ checkable: v })}>复选模式</Checkbox>
                <Button onClick={() => console.log(zh.getCmpApi('projectTree')?.getSelectedNodes?.())}>getSelectedNodes in console</Button>
            </Layout>
            <Layout.Flex >
                <ProjectTree id="projectTree" {...state} />
            </Layout.Flex >
        </Layout>
    );
};
```
