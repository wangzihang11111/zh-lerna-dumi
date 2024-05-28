/**
 * title: 树形数据展示
 * description:  配置表格isTree=true，数据源中有 children 字段时会自动展示为树形表格
 */

import { ColumnProps, Layout, Table, TableSelectionModel } from '@zh/zh-design';
import React from 'react';
import { treeData } from './data';

const columns: ColumnProps[] = [
  {
    title: '姓名',
    width: 80,
    flex: 1,
    dataIndex: 'name'
  },
  {
    title: '年龄',
    width: 80,
    flex: 1,
    dataIndex: 'age',
    levelSummary: true,
    editor: {
      xtype: 'input',
      type: 'number'
    },
    aggregates: ['sum']
  },
  {
    title: '性别',
    width: 150,
    flex: 1,
    dataIndex: 'sex',
    render({ value }) {
      return ['男', '女'][value];
    }
  },
  {
    title: '出生地',
    width: 150,
    flex: 1,
    dataIndex: 'address'
  },
  {
    title: '复选',
    dataIndex: 'checked1',
    editor: {
      xtype: 'checkbox',
      checkStrictly: false,
      disabled({ row }) {
        return row.checked;
      }
    }
  },
  {
    title: '选中',
    dataIndex: 'checked',
    editor: {
      xtype: 'checkbox',
      listeners: {
        onChange({ value, row, table }) {
          table.updateChildren(row, (r) => {
            r.checked = value;
          });
        }
      }
    }
  }
];

export default function () {
  return (
    <Layout style={{ height: 300 }}>
      <Layout.Flex>
        <Table
          id="treeTable"
          isTree
          expandCfg={{ dataIndex: 'age' }}
          tableAlertRender={false}
          rowSelection={{
            type: TableSelectionModel.CHECKBOX,
            autoCheckedChildren: true
          }}
          rowDrag
          checkbox={true}
          keyField="id"
          columns={columns}
          dataSource={treeData}
        />
      </Layout.Flex>
    </Layout>
  );
}
