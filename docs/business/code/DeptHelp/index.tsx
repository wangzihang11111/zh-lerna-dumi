/**
 * title: DeptHelp 部门帮助
 * description: 基于asyncTree 组件封装，实现组织单选、多选。
 */
import { zh, Button, DeptHelp } from '@zh/zh-design';
import React from 'react';

export default () => {
  const [result, setResult] = React.useState<any>([]);
  const open = async () => {
    const ret = await zh.external.openHelp({
      type: 'DeptHelp',
      multiple: true,
      value: result
    });
    ret && setResult(ret);
  };
  return (
    <>
      <DeptHelp multiple={false} />
      <p style={{ marginTop: 10 }}>
        <Button type="primary" onClick={open}>
          部门帮助(已选{result.length})
        </Button>
      </p>
    </>
  );
};
