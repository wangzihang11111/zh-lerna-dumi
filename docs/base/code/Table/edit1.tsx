/**
 * title: 可编辑表格，支持序号列新增删除
 * description: 通过配置表格属性showRowNumber={{editOptions: {}}}开启
 */

import { ColumnProps, zh, Layout, Table, ToolBar } from '@zh/zh-design';
import { useState } from 'react';
import React from 'react';

const columns: ColumnProps[] = [
  {
    title: '姓名',
    width: 80, // flex 存在时，width 为最小宽度
    flex: 1,
    dataIndex: 'name',
    editor: {
      xtype: 'input',
      required: true
    }
  },
  {
    title: '性别(下拉选择)',
    width: 130,
    flex: 1,
    dataIndex: 'sex',
    editor: {
      xtype: 'select',
      data: [
        { value: 0, label: '男', id: 111 },
        { value: 1, label: '女', id: 22 }
      ]
    }
  },
  {
    title: '详细地址',
    width: 100,
    flex: 1,
    dataIndex: 'adr',
    editor: {
      xtype: 'input',
      required: true
    }
  }
];

export default function () {
  const [ds] = useState([]);

  return (
    <Layout height={300}>
      <ToolBar
        buttons={[
          {
            id: 'delete',
            onClick() {
              zh.getCmpApi('editTable1').deleteCheckedRows();
            }
          }
        ]}
      />
      <Layout.Flex>
        <Table
          bordered
          checkbox
          // showRowNumber={{editOptions: {}}}
          showRowNumber={{
            editOptions: {
              // disabled: () => true,
              disabled({ rowIndex }) {
                return rowIndex % 2 ? ['delete'] : [];
              },
              add({ table, rowIndex }) {
                table.addRows({ name: Date.now() }, rowIndex + 1);
              },
              delete({ table, rowIndex }) {
                table.deleteRows(rowIndex);
              }
            }
          }}
          editColumnIcon
          style={{ height: 250 }}
          id="editTable1"
          columns={columns}
          dataSource={ds}
        />
      </Layout.Flex>
    </Layout>
  );
}
