---
order: 6
title: CustomerBusinessHelp 客商帮助
group: 帮助组件
---

## CustomerBusinessHelp 客商帮助

基于 BaseHelp 封装。

### CustomerBusinessHelp

```tsx
/**
 * title: 基本使用
 * description: 基于BaseHelp组件封装，实现客商单选、多选。
 */
import React from 'react';
import { zh, Button, CustomerBusinessHelp } from '@zh/zh-design';

export default () => {
  const [result, setResult] = React.useState<any>([]);
  const open = async () => {
    const ret = await zh.external.openHelp({
      type: 'CustomerBusinessHelp',
      multiple: true,
      value: result
    });
    ret && setResult(ret);
  };
  return (
    <>
      <CustomerBusinessHelp />
      <p style={{ marginTop: 10 }}>
        <Button type="primary" onClick={open}>
          客商帮助多选(已选{result.length})
        </Button>
      </p>
    </>
  );
};
```
## API

### 客商帮助属性

<API id="CustomerBusinessHelp"></API>
