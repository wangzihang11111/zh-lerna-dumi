/**
 * title: 表头分组
 * description: columns[n] 可以内嵌 columns，以渲染分组表头；或者使用 groupIn 数组配置。
 */

import React from 'react';
import { ColumnProps, Table } from '@zh/zh-design';
import { gridData } from './data';

const columns: ColumnProps[] = [
  {
    title: '姓名',
    width: 80,
    flex: 1,
    fixed: 'left',
    dataIndex: 'name'
  },
  {
    title: '出生情况',
    fixed: 'left',
    columns: [
      {
        title: '出生日期',
        width: 120,
        flex: 1,
        dataIndex: 'birthday'
      },
      {
        title: '年龄',
        width: 80,
        flex: 1,
        dataIndex: 'age'
      }
    ]
  },
  {
    groupIn: ['其他'],
    title: '性别',
    width: 320,
    flex: 1,
    dataIndex: 'sex',
    format: {
      type: 'option',
      formatter: [
        { value: 0, label: '男' },
        { value: 1, label: '女' }
      ]
    }
  },
  {
    groupIn: ['其他', '出生地'],
    title: '省',
    width: 320,
    flex: 1,
    dataIndex: 'province'
  },
  {
    groupIn: ['其他', '出生地'],
    title: '市',
    width: 320,
    flex: 1,
    dataIndex: 'city',
    editor: {
      xtype: 'help',
      type: 'SingleHelp', // 注册过的业务组件
      helpId: 'test',
      displayField: 'city_name'
    }
  }
];

export default function () {
  return <Table id="groupTable" bordered style={{ height: 260 }} columns={columns} dataSource={gridData} />;
}
