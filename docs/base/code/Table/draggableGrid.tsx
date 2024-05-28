/**
 * title: 拖拽排序
 * description: 配置列表rowDrag属性开启拖拽排序功能；pressDelay设置拖拽延迟以解决点击事件冲突问题（默认200ms）；handleIndex 指定可拖拽手柄列；也可以通过配置shouldCancelStart函数实现自定义拖拽手柄
 */

import { MenuOutlined } from '@ant-design/icons';
import React from 'react';
import { ColumnProps, Table } from '@zh/zh-design';
import { gridData } from './data';

const columns: ColumnProps[] = [
  {
    title: 'sort',
    dataIndex: 'sort',
    render() {
      return <MenuOutlined style={{ color: '#999' }} />;
    }
  },
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
    dataIndex: 'age'
  },
  {
    title: '性别(下拉选',
    width: 150,
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
    title: '出生地',
    width: 150,
    flex: 1,
    dataIndex: 'address_name'
  }
];

export default function () {
  return (
    <div style={{ height: 180 }}>
      <Table
        id="draggableTable"
        rowDrag={{
          pressDelay: 60,
          handleIndex: 'sort',
          listeners: {
            // shouldCancelStart(e) {
            //   // 自定义非拖拽元素返回
            //   return e.target.className !== 'drag-handle';
            // },
            onSortEnd({ oldIndex, newIndex }) {
              console.log({ oldIndex, newIndex });
            }
          }
        }}
        columns={columns}
        dataSource={gridData}
      />
    </div>
  );
}
