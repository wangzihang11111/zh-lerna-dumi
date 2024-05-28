---
order: 50
title: Attachment 附件
---

## 点击按钮打开附件

```tsx
import React, { useState, useRef, useMemo } from 'react';
import { Button, openAttachment } from '@zh/zh-design';

export default () => {
  const apiRef = useRef({});
  return (
    <>
      <Button
        style={{ marginRight: 10 }}
        onClick={async () => {
          const res = await openAttachment({
            asrTable: '222',
            asrCode: '222',
            busTypeCode: 'DMCORGList',
            orgId: '438201029000001',
          });
          apiRef.current = res;
          console.log(res);
        }}
      >
        打开附件
      </Button>
      <Button
        type="primary"
        onClick={() => {
          if (apiRef.current.handleValid?.()) {
            apiRef.current.handleSave?.();
          }
        }}
      >
        保存附件
      </Button>
    </>
  );
};
```

## FormAttachment 表单附件

```tsx
import React, { useRef, useMemo } from 'react';
import { zh, Button, AntForm, FormAttachment } from '@zh/zh-design';

export default () => {
  const apiRef = useRef({});
  const asrSessionGuid = useMemo(() => Math.random().toString(36).slice(2), []);
  return (
    <AntForm
      onFinish={async (v) => {
        console.log(v);
        {/* const res1 = await apiRef.current?.getApi().handleSave?.(); */}
      }}
    >
      <AntForm.Item className="ng-attachment-form-item" label="测试附件1" name="test1">
        <FormAttachment
          asrSessionGuid={asrSessionGuid}
          asrTable="222"
          asrCode="222"
          busTypeCode="DMCORGList"
          orgId="438201029000001"
          ref={apiRef}
        />
      </AntForm.Item>
      <Button style={{ marginTop: 10 }} htmlType="submit">
        提交
      </Button>
    </AntForm>
  );
};
```

## TableAttachment 表格附件

```tsx
import React, { useState, useRef, useMemo } from 'react';
import { zh, Button, Table, getAttachmentCountBatch, openAttachment, useAsyncEffect } from '@zh/zh-design';
import { PaperClipOutlined } from '@ant-design/icons';

const mockData = [
  { name: 'aaa', asrTable: '222', asrCode: '111' },
  { name: 'bbb', asrTable: '222', asrCode: '222' },
  { name: 'ccc', asrTable: '222', asrCode: '333' },
  { name: 'ddd', asrTable: '666', asrCode: '555' },
]
export default () => {
  const apiRef = useRef({});
  const tableRef = useRef()
  const [dataSource, setDataSource] = useState([])
  const tableConfig: ColumnProps[] = [
    {
      title: '名称',
      dataIndex: 'name',
      flex: 1,
    },
    {
      title: '附件',
      dataIndex: 'attachment',
      flex: 1,
      render: ({ row, rowIndex }) => <Button
        size="small"
        type="link" 
        icon={<PaperClipOutlined />}
        onClick={async () => {
          const res = await openAttachment({
            asrTable: row.asrTable,
            asrCode: row.asrCode,
          });
          apiRef.current[row.asrCode] = res
          tableRef.current.getApi().updateRowDataByIndex(rowIndex, { ...row, attachmentCount: res.attachmentRecordList.length ?? 0 })
        }}>附件({row.attachmentCount})</Button>
    },
  ];
  useAsyncEffect(async () => {
    const asrObj = {}
    let countObj = {}
    for (const item of mockData) {
      if (asrObj[item.asrTable]) {
        asrObj[item.asrTable].push(item.asrCode)
      } else {
        asrObj[item.asrTable] = [item.asrCode]
      }
    }
    const keys = Object.keys(asrObj)
    for (const key of keys) {
      const res = await getAttachmentCountBatch({ asrTable: key, asrCode: asrObj[key] })
      if (res?.code === 0) {
        countObj = { ...countObj, ...(res?.data ?? {}) }
      }
    }
    setDataSource(mockData.map(item => ({ ...item, attachmentCount: countObj[item.asrCode] ?? 0 })))
  }, [])
  return (
    <>
      <Table
        ref={tableRef}
        style={{ height: 300 }}
        showRowNumber
        columns={tableConfig}
        dataSource={dataSource}
      />
      <Button style={{ marginTop: 10 }} onClick={() => {
        console.log(apiRef.current)
        const keys = Object.keys(apiRef.current)
        for (const key of keys) {
          apiRef.current[key].handleSave()
        }
      }} >
        保存
      </Button>
    </>
  );
};
```