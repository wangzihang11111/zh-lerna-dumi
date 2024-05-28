---
order: 4
title: ProjectHelp 项目帮助
group: 帮助组件
---

## ProjectHelp 项目帮助

基于 BaseHelp 封装。

### ProjectHelp

```tsx
/**
 * title: 基本使用
 */
import React from 'react';
import { zh, Button, ProjectHelp } from '@zh/zh-design';

export default () => {
  const [result, setResult] = React.useState<any>([]);
  const open = async () => {
    const ret = await zh.external.openHelp({
      type: 'ProjectHelp',
      multiple: true,
      value: result
    });
    ret && setResult(ret);
  };
  return (
    <>
      <ProjectHelp multiple={false} />
      <p style={{ marginTop: 10 }}>
        <Button type="primary" onClick={open}>
          项目帮助(已选{result.length})
        </Button>
      </p>
    </>
  );
};
```