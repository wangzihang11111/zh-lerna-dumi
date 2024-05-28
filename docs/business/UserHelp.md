---
order: 3
title: UserHelp 用户帮助
group: 帮助组件
---

## UserHelp 用户帮助

基于 BaseHelp 封装。

### UserHelp

```tsx
/**
 * title: 基本使用
 * description: 基于BaseHelp组件封装，实现用户单选、多选。
 */
import React from 'react';
import { zh, Button, UserHelp } from '@zh/zh-design';

export default () => {
  const [result, setResult] = React.useState<any>([]);
  const open = async () => {
    const ret = await zh.external.openHelp({
      type: 'UserHelp',
      multiple: true,
      value: result
    });
    ret && setResult(ret);
  };
  return (
    <>
      <UserHelp multiple={false} />
      <p style={{ marginTop: 10 }}>
        <Button type="primary" onClick={open}>
          用户帮助(已选{result.length})
        </Button>
      </p>
    </>
  );
};
```