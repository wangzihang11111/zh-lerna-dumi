/**
 * title: 服务端分页
 * description: 标准分页表格，配合服务端接口使用，合计行支持服务端计算汇总返回，最后一列是各种操作。
 */

import { SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { ColumnProps, cssVar, Input, Menu, Table, TableSelectionModel, ToolBar, zh, useZhEffect } from '@zh/zh-design';
import React from 'react';
import { loadData } from './pagination.service';

const columns: ColumnProps[] = [
  {
    title: '姓名',
    dataIndex: 'name',
    width: 86,
    flex: 1,
    fixed: 'left', // 固定列
    filter: true,
    tooltip: ({ row, value }) => {
      return `姓名:${value},年龄:${row.age},性别:${['男', '女'][row.sex]}`;
    },
    render: ({ value }) => <a >{value}</a>,
    aggregates: [{ type: 'custom', title: '自定义：' }]
  },
  {
    title: '年龄',
    dataIndex: 'age',
    width: 80,
    sortable: { local: false },
    filter: {
      icon: ({ color }) => <SearchOutlined style={{ color }} />,
      inputProps: {
        type: 'number'
      }
    },
    fixed: 'left', // 固定列
    flex: 1,
    aggregates: ['max', 'avg']
  },
  {
    title: '性别',
    dataIndex: 'sex',
    width: 80,
    filter: {
      inputProps: {
        type: 'select'
      }
    },
    format: {
      type: 'icon',
      formatter: [
        { value: 0, icon: 'ManOutlined', label: '男', style: { color: 'blue' } },
        { value: 1, icon: 'WomanOutlined', label: '女', style: { color: 'hotpink' } }
      ]
    },
    flex: 1
  },
  {
    title: '出生地',
    dataIndex: 'address',
    width: 100,
    flex: 1,
    tooltip: true,
    filter: {
      inputProps: {
        type: 'checkbox'
      }
    }
  },
  {
    title: '备注1',
    dataIndex: 'remark1',
    width: 80,
    flex: 1,
    render({ onChange }) {
      return <Input onChange={onChange} />;
    }
  },
  {
    title: '附件',
    dataIndex: 'attachment',
    width: 80,
    flex: 1,
    cellStyle: { color: cssVar.primaryColor },
    format: {
      type: 'attachment'
    }
  },
  {
    title: '备注3',
    dataIndex: 'remark3',
    width: 80,
    flex: 1
  },
  {
    title: '入库数量',
    dataIndex: 'ts',
    aggregates: [{ type: 'totalSummary', formatter: (value) => `${value}人` }],
    width: 80,
    fixed: 'right',
    flex: 1
  },
  {
    title: '操作',
    dataIndex: 'opColumn',
    width: 120,
    flex: 1,
    fixed: 'right',
    render(params) {
      return (
        <ToolBar rightName='test' getData={() => params} containerId="table1" buttons={['edit', 'view']} showIcon={false} type="link" size="small" style={{ padding: 0 }} />
      );
    }
  }
];

const headerMenu = {
  icon: <SettingOutlined style={{ fontSize: 14, color: cssVar.primaryColor }} />,
  //getContainer: () => document.querySelector('div.ng-toolbar button[originid=sz]')
  inTableAlert: true
};

export default function () {
  const onCheckedChange = (...args) => {
    console.log(...args);
  };

  useZhEffect(() => {
    const tableInstance = zh.getCmpApi('table1');
    return tableInstance?.subscribe(function ({ rowIndex, table }) {
      console.log(rowIndex);
    }, 'clickHighlight');
  }, []);

  return (
    <>
      <Table
        pagination={{ pageSize: 5, pageIndex: 1 }}
        id="table1"
        rowContextMenu={(row) => (
          <Menu>
            <Menu.Item key="1" onClick={() => console.log(row)}>
              编辑
            </Menu.Item>
            <Menu.Item key="2">查看</Menu.Item>
          </Menu>
        )}
        showRowNumber={{
          aggregates: [{ type: 'custom', title: '合计' }]
        }}
        checkbox
        onCheckedChange={onCheckedChange}
        rowSelection={{
          type: TableSelectionModel.MULTIPLE_INTERVAL,
          keyField: 'id',
          disabled(row) {
            return row.age < 6;
          }
        }}
        tableAlertRender
        aggregateStyle={{ backgroundColor: 'var(--primary-1-5)' }}
        headerMenu={headerMenu}
        style={{ height: 400 }}
        columns={columns}
        request={loadData}
      />
    </>
  );
}
