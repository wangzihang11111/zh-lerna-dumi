/**
 * title: OrgHelp 组织帮助
 * description: 基于asyncTree 组件封装，实现组织单选、多选。。
 */
import { zh, Button, OrgHelp } from '@zh/zh-design';
import React from 'react';

export default () => {
  const [result, setResult] = React.useState<any>([]);
  const open = async () => {
    const ret = await zh.external.openHelp({
      type: 'OrgHelp',
      multiple: true,
      value: result
    });
    if (ret) {
      console.log(ret);
      setResult(ret);
    }
  };
  return (
    <>
      <OrgHelp multiple={false} params={{ orgattr: '14' }} />
      <p style={{ marginTop: 10 }}>
        <Button type="primary" onClick={open}>
          组织帮助(已选{result.length})
        </Button>
      </p>
    </>
  );
};
