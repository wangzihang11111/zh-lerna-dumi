/**
 * title: 自定义editor
 * description:  内置编辑器不满足业务需求的情况，可以通过自定义editor组件实现
 */

import { ColumnProps, BaseHelp, Table, zh } from '@zh/zh-design';
import React from 'react';
import { gridData } from './data';

/**
 * 模拟请求
 * @param params: {pageIndex, pageSize, treeNodes}
 */
const dataRequest = async (params) => {
  console.log(params);
  await zh.delay(100);
  return [
    { code: '01', name: 'bj' },
    { code: '02', name: 'hz' }
  ];
};

const columns: ColumnProps[] = [
  {
    title: '姓名',
    width: 80,
    flex: 1,
    dataIndex: 'name',
    editor: false
  },
  {
    title: '出生日期',
    width: 150,
    flex: 1,
    dataIndex: 'birthday',
    editor: {
      xtype: 'datepicker',
      type: 'date'
    }
  },
  {
    title: '年龄',
    width: 60,
    flex: 1,
    dataIndex: 'age',
    editor: {
      xtype: 'input',
      type: 'number'
    }
  },
  {
    title: '性别(下拉选择)',
    width: 150,
    flex: 1,
    dataIndex: 'sex',
    format: {
      type: 'option'
    },
    editor: {
      xtype: 'select',
      data: [
        { value: 0, label: '男' },
        { value: 1, label: '女' }
      ]
    }
  },
  {
    title: '自定义编辑器',
    width: 150,
    flex: 1,
    dataIndex: 'address',
    editor: {
      xtype: ({ props }) => {
        const { ref, ORMMode, clientSqlFilter, helpId, ...helpProps } = props('help');
        return (
          <BaseHelp
            modal
            {...helpProps}  // 表格的内置逻辑，对onChange、下拉等操作进行封装
            userCodeField='code'  // 下拉数据列配置，有些业务点有逻辑主键id和业务主键code，默认显示的是逻辑主键id，可以手动指定业务主键code
            valueField='code'   // request数据源中的value字段，会把这个值赋值给dataIndex配置的字段（address）
            labelField='name'   // request数据源中的label字段，会把这个值赋值给dispalyField配置的字段(address_name)
            request={dataRequest} />
        );
      },
      displayField: 'address_name'
    }
  }
];

export default function () {
  return (
    <div style={{ height: 200 }}>
      <Table
        bordered
        editColumnIcon={true}
        rowHeight={36}
        id="editColumnTable"
        columns={columns}
        dataSource={gridData}
      />
    </div>
  );
}
