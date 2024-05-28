---
order: 5
title: StaticDicHelp 静态字典帮助
group: 帮助组件
---

## 静态数据字典帮助

基于 BaseHelp 封装。

### StaticDicHelp

```tsx
/**
 * title: 基本使用
 * description: 基于BaseHelp组件封装，实现用户单选、多选。
 */
import React from 'react';
import { zh, Button, StaticDicHelp } from '@zh/zh-design';

export default () => {
  const [result, setResult] = React.useState<any>([]);
  const open = async () => {
    const ret = await zh.external.openHelp({
      type: 'StaticDicHelp',
      typeCode: 'mdmSkillsCert',
      title: '证件类型',
      multiple: true,
      value: result
    });
    console.log(ret);
    ret && setResult(ret);
  };
  return (
    <>
      <StaticDicHelp multiple={false} typeCode='mdmSkillsCert' title='证件类型' />
      <p style={{ marginTop: 10 }}>
        <Button type="primary" onClick={open}>
          静态数据字典帮助(已选{result.length})
        </Button>
      </p>
    </>
  );
};
```