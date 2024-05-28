/**
 * title: 表达式计算
 * description: format可以代替render函数格式化单元格的`显示内容`，不会改变数据源的值；
 * expr属于列计算属性，通过表达式或函数返回计算值，会改变数据源的值($D:所有行、$R:当前行、$V:当前单元格、$DI:dataIndex)
 */

import { ColumnProps, zh, Layout, Table, ToolBar, ToolBarItemType } from '@zh/zh-design';
import { useState } from 'react';
import React from 'react';

const columns: ColumnProps[] = [
  {
    title: 'qty',
    dataIndex: 'qty',
    editor: { xtype: 'input', type: 'qty', precision: 3 }
  },
  {
    title: '单价',
    dataIndex: 'price',
    expr: '$R.amount && $R.num ? $R.amount / $R.num : $R.price',
    editor: { xtype: 'input', type: 'amount', precision: 3 }
  },
  {
    title: '数量',
    dataIndex: 'num',
    expr: '$R.amount && $R.price ? $R.amount / $R.price : $R.num',
    editor: { xtype: 'input', type: 'number' }
  },
  {
    title: '总额',
    dataIndex: 'amount',
    expr: '$R.price && $R.num ? $R.num * $R.price : $R.amount',
    editor: { xtype: 'input', type: 'amount' },
    aggregates: ['sum']
  },
  {
    title: '总额*系数(0.5)',
    align: 'right',
    dataIndex: 'amount1',
    format: {
      type: 'expr',
      formatter: '$R.price && $R.num ? ("￥" + $R.num * $R.price * 0.5) : "--"'
    },
    aggregates: [
      {
        title: '合计：',
        calc: (dataArr, ds) => {
          return (
            ds.reduce((t, c) => {
              return t + (c.price * c.num || 0);
            }, 0) * 0.5
          );
        }
      }
    ]
  }
];

const data = [
  {
    price: 10,
    num: 2,
    amount: 20
  },
  {
    price: 12,
    num: 1,
    amount: 12
  }
];

export default function () {
  const [ds, setDs] = useState<any>(data);

  const buttons: ToolBarItemType = [
    {
      id: 'addrow',
      onClick: () => {
        setDs((prevState) => [
          ...prevState,
          {
            price: 1,
            num: 2,
            amount: 2
          }
        ]);
      }
    },
    {
      id: 'deleterow',
      onClick: () => {
        zh.getCmpApi('exprFormat').deleteCheckedRows();
      }
    }
  ];

  return (
    <Layout style={{ height: 260 }}>
      <ToolBar buttons={buttons} />
      <Layout.Flex style={{ position: 'relative' }}>
        <Table bordered checkbox rowChecked id="exprFormat" columns={columns} dataSource={ds} />
      </Layout.Flex>
    </Layout>
  );
}
