/**
 * title: 前端分页
 * description: 前端分页表格，通过分页参数，前端分割数据源进行分页。
 */

import { ColumnProps, Table, useAsyncEffect, useRefState } from '@zh/zh-design';
import { loadData1 } from './pagination.service';
import React from 'react';

const columns: ColumnProps[] = [
  {
    title: '姓名',
    dataIndex: 'name',
    width: 120,
    filter: true,
    flex: 1,
    fixed: 'left', // 固定列
    render: ({ value }) => <a>{value}</a>
  },
  {
    title: '年龄',
    dataIndex: 'age',
    filter: {
      clientFilter({ value, filterValue }) {
        return value > filterValue;
      }
    },
    width: 120,
    flex: 1
  },
  {
    title: '性别',
    dataIndex: 'sex',
    width: 120,
    flex: 1
  },
  {
    title: '出生地',
    dataIndex: 'address',
    width: 120,
    flex: 1
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 300,
    flex: 1
  }
];

export default function () {
  const [dataSource, setDataSource] = useRefState<object[]>([]);

  useAsyncEffect(async () => {
    const d = await loadData1();
    setDataSource(d);
  }, []);

  return (
    <>
      {dataSource.length > 0 && (
        <Table
          id="t1"
          pagination={{ pageSize: 5 }}
          keyField='id'
          cache={['selected']}
          defaultSelectedRowIndex={1}
          style={{ height: 360 }}
          columns={columns}
          dataSource={dataSource}
        />
      )}
      <Table id="t2" pagination={{ pageSize: 5 }} style={{ height: 360 }} bordered columns={columns} request={loadData1} />
    </>
  );
}
