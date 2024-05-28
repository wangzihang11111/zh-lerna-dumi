/**
 * title: 可展开表格
 * description: 当表格内容较多不能一次性完全展示时，可通过配置该属性显示更多信息。
 */
import { ColumnProps, Layout, Table } from '@zh/zh-design';
import { gridData } from './data';
import React from 'react';

const columns: ColumnProps[] = [
  { title: 'Name', dataIndex: 'name', width: 100 },
  { title: 'Age', dataIndex: 'age', width: 200 },
  { title: 'Address', dataIndex: 'address', width: 300, flex: 1 },
  {
    title: 'ToDo',
    dataIndex: 'todo',
    align: 'center',
    width: 100,
    fixed: 'right',
    render() {
      return <a>edit</a>;
    }
  }
];

export default function () {
  return (
    <Layout style={{ height: 300 }}>
      <Layout.Flex>
        <Table
          id="expandTable"
          rowSelected
          columns={columns}
          dataSource={gridData}
          defaultExpand={'first'}
          rowHeight="auto"
          // expandCfg={{
          //   dataIndex: 'age'
          // }}
          expandRow={{
            height: ({ rowIndex }) => {
              return rowIndex % 2 === 0 ? 60 : 120;
            },
            render({ row, rowIndex }) {
              return (
                <div style={{ padding: 10, height: '100%' }}>
                  {rowIndex % 2 === 0 ? (
                    row.description
                  ) : (
                    <Table
                      bordered
                      compact
                      headerHeight={26}
                      rowSelected={false}
                      borderColor="#dddddd"
                      columns={[{ title: 'Description', dataIndex: 'description' }]}
                      dataSource={[{ description: row.description + '1' }, { description: row.description + '2' }]}
                    />
                  )}
                </div>
              );
            }
          }}
        />
      </Layout.Flex>
    </Layout>
  );
}
