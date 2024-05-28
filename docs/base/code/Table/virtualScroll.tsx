/**
 * title: 虚拟滚动
 * description: 默认只渲染一页的数据行，滚动时渲染，提升页面速度。
 */
import { Layout, Table } from '@zh/zh-design';
import React from 'react';

const headUrl =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0xMS41IC0xMC4yMzE3NCAyMyAyMC40NjM0OCI+CiAgPHRpdGxlPlJlYWN0IExvZ288L3RpdGxlPgogIDxjaXJjbGUgY3g9IjAiIGN5PSIwIiByPSIyLjA1IiBmaWxsPSIjNjFkYWZiIi8+CiAgPGcgc3Ryb2tlPSIjNjFkYWZiIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIi8+CiAgICA8ZWxsaXBzZSByeD0iMTEiIHJ5PSI0LjIiIHRyYW5zZm9ybT0icm90YXRlKDYwKSIvPgogICAgPGVsbGlwc2Ugcng9IjExIiByeT0iNC4yIiB0cmFuc2Zvcm09InJvdGF0ZSgxMjApIi8+CiAgPC9nPgo8L3N2Zz4K';

const columns: any = new Array(26).fill('Title').map((name, index) => {
  return {
    title: `${name}${index}`,
    dataIndex: `field${index}`,
    width: 120,
    editor: true,
    render: ({ row, dataIndex, rowIndex }) => {
      if (dataIndex === 'field0') {
        return <img alt="" src={headUrl} width={39} height={39} />;
      }
      return <>{row[dataIndex] ?? `T${rowIndex}`}</>;
    }
  };
});

const httpRequest = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const dataSource = new Array(10000).fill(1).map((_, index) => {
        return { phid: index };
      });
      resolve(dataSource);
    });
  });
};

export default function () {
  return (
    <Layout style={{ height: 300 }}>
      <Layout.Flex>
        <Table
          id="virtualTable"
          autoScroll
          optimize={{ vertical: true }}
          rowSelected
          showRowNumber
          columns={columns}
          request={httpRequest}
          rowHeight={64}
        />
      </Layout.Flex>
    </Layout>
  );
}
