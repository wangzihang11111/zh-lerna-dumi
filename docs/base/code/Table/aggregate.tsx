/**
 * title: 分组小计
 * description: 通过配置groupBy属性，开启分组功能
 */

import { ColumnProps, zh, Layout, Table } from '@zh/zh-design';
import { generateData } from './data';
import React from 'react';

const columns: ColumnProps[] = [
  {
    title: '姓名',
    width: 80,
    flex: 1,
    dataIndex: 'name',
    aggregates: ['count']
  },
  {
    title: '出生日期',
    width: 150,
    flex: 1,
    dataIndex: 'birthday'
  },
  {
    title: '年龄',
    width: 80,
    flex: 1,
    dataIndex: 'age',
    editor: {
      xtype: 'input',
      type: 'number'
    },
    aggregates: [
      {
        title: (inGroup) => {
          return inGroup ? '最小年龄：' : '平均年龄：';
        },
        calc: (d, ds, di, inGroup) => {
          return inGroup ? zh.getAggregate('min', d) : zh.getAggregate('avg', d);
        }
      },
      'max'
    ]
  },
  {
    //  title: '性别',
    width: 150,
    flex: 1,
    dataIndex: 'sex',
    header({ inGroup }) {
      return inGroup ? '自定义:' : '性别';
    },
    render({ value, inGroup }) {
      return inGroup ? ['男', '女'][value] : value;
    },
    // format: {
    //   type: 'option',
    //   formatter: [
    //     { value: 0, label: '男' },
    //     { value: 1, label: '女' }
    //   ]
    // }
  },
  {
    title: '出生地',
    width: 150,
    flex: 1,
    dataIndex: 'address'
  }
];

const data = generateData(
  {
    name: '张三',
    age: 32,
    sex: 0,
    address: '北京'
  },
  8
);

export default function () {
  return (
    <Layout style={{ height: 360 }}>
      <Layout.Flex>
        <Table id="aggregateTable" groupBy="sex"
          groupAggregatePosition="start"
          aggregatePosition='start'
          columns={columns} defaultExpand="all" dataSource={data} />
      </Layout.Flex>
    </Layout>
  );
}
