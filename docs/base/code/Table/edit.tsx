/**
 * title: 可编辑表格
 * description: 通过配置列 editor 属性，开启列编辑功能，支持增行、删行；
 */

import { ColumnProps, zh, Layout, Grid, ToolBar, ToolBarItemType, TableInstance, useApi, useUpdateRow, useUpdateRows } from '@zh/zh-design';
import { useMemo, useState } from 'react';
import { gridData } from './data';
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
    header: 'switch',
    width: 100,
    dataIndex: 'switch',
    align: 'center',
    editor: {
      xtype: 'switch'
    }
  },
  {
    title: '百分比',
    width: 80,
    dataIndex: 'percent',
    editor: {
      xtype: 'input',
      precision: 2,
      type: 'percent'
    }
  },
  {
    title: '出生日期',
    width: 130,
    flex: 1,
    dataIndex: 'birthday',
    editor: {
      xtype: 'datepicker',
      type: 'date',
      disabled: ({ row }) => {
        return row.percent > 50;
      }
    }
  },
  {
    title: '性别(下拉选择)',
    width: 130,
    flex: 1,
    dataIndex: 'sex',
    // format: {
    //   type: 'option',
    //   formatter: [
    //     { value: 0, label: '男' },
    //     { value: 1, label: '女' }
    //   ]
    // },
    editor: {
      xtype: 'select',
      // request: async () => {
      //   await zh.delay(100);
      //   return [
      //     { value: 0, label: '男', id: 111 },
      //     { value: 1, label: '女', id: 22 }
      //   ];
      // },
      listeners: {
        onBeforeInit({ row }) {
          if (row.percent > 50) {
            return {
              xtype: 'help',
              helpId: 'user'
            };
          } else {
            return {
              xtype: 'select',
              request: async () => {
                await zh.delay(100);
                return [
                  { value: 0, label: '男', id: 111 },
                  { value: 1, label: '女', id: 22 }
                ];
              },
            };
          }
        }
      }
      // data: [{value: 0, label: '男'}, {value: 1, label: '女'}]
    }
  },
  {
    title: '出生地(通用帮助)',
    width: 130,
    flex: 1,
    dataIndex: 'address',
    tooltip: true,
    editor: {
      xtype: 'help',
      type: 'MultipleProjectHelp',  // 注册过的业务组件
      // type: 'SingleHelp', 
      helpId: 'tableName',
      labelField: 'table_name',
      async clientSqlFilter({ row }) {
        await zh.delay(16);
        return {};
      },
      listeners: {
        onChange({ row, originValue }) {
          //  row.adr = originValue ? `${originValue?.[0].label}-${originValue?.[0]?.value}` : '';
        },
        onBeforeInit({ row }) {
          // return { helpId: 'user' };
        }
      }
      //  clientSqlFilter: {c_type: '$R.sex'}
      //  clientSqlFilter: '"c_type=" + $R.sex'
    }
  },
  {
    title: '详细地址',
    width: 100,
    flex: 1,
    dataIndex: 'adr',
    editor: {
      xtype: 'input',
      type: 'textarea',
      required: true
    }
  },
  {
    header: '选中互斥',
    width: 100,
    dataIndex: 'flag',
    align: 'center',
    editor: {
      xtype: 'checkbox',
      antProps: {
        checkedValue: true,
        unCheckedValue: false,
        onClick: (e) => e.stopPropagation?.()
      },
      incompatible: true,
      disabled({ row }) {
        return row.percent > 50;
      }
    }
  },
  {
    title: "radio", dataIndex: 'radio', width: 500, editor: {
      xtype: "RadioGroup",
      data: [{ "label": "扩展text单选1", "value": "1" }, { "label": "扩展text单选2", "value": "2" }, { "label": "扩展text单选3", "value": "3" }],
    }
  },
  {
    title: "checkbox", dataIndex: 'checkbox', width: 500, editor: {
      xtype: "CheckboxGroup",
      data: [{ "label": "扩展text单选1", "value": "1" }, { "label": "扩展text单选2", "value": "2" }, { "label": "扩展text单选3", "value": "3" }],
    }
  },
  {
    header: '操作',
    dataIndex: 'op',
    fixed: 'right',
    align: 'center',
    width: 60,
    render() {
      return <a>编辑</a>;
    }
  }
];

export default function () {
  const [ds, setDs] = useState<any>(() => gridData.map(r => ({ ...r, sexEXName: ['男', '女'][r.sex], id: r.phId })));
  const [col, setCol] = useState(columns);

  const ds1 = useMemo<any>(() => gridData.map(r => ({ ...r, sexEXName: ['男', '女'][r.sex], id: r.phId })), []);
  const col1 = useMemo<any>(() => columns.slice(0, 1), []);

  const buttons: ToolBarItemType = [
    {
      id: 'save',
      onClick: async () => {
        console.log(zh.getCmpApi('editTable').validData());
      }
    },
    {
      id: 'addrow',
      onClick: () => {
        zh.getCmpApi('subTab').addRows({ name: '', address: '', sex: 0, age: 18 });
        // 或者直接操作数据源
        //setDs(prevState => ([...prevState, {name: '', address: [], sex: 0, age: 18}]));
      }
    },
    {
      id: 'deleterow',
      onClick: () => {
        zh.getCmpApi('editTable').deleteCheckedRows();
      }
    },
    {
      id: 'addcolumn',
      text: '增加列',
      onClick: () => {
        setCol([...col, { dataIndex: `d${Date.now()}`, title: 'newCol', editor: true }]);
      }
    }
  ];

  const onCheckedChange = (...args) => {
    console.log(args);
  };

  const apiRef = useApi<TableInstance>();
  const apiRef1 = useApi<TableInstance>();

  useUpdateRow(e => {
    console.log('useUpdateRow', e);
  }, ['editTable']);
  useUpdateRows(e => {
    console.log('useUpdateRows', e);
  }, ['editTable']);

  return (
    <Layout style={{ height: 600 }}>
      <ToolBar buttons={buttons} />
      <Layout.Flex>
        <Grid
          bordered
          checkbox
          rowChecked
          showRowNumber
          rowSelected
          ref={apiRef}
          editColumnIcon={true}
          onCheckedChange={onCheckedChange}
          id="editTable"
          columns={col}
          dataSource={ds}
        />
      </Layout.Flex>
      <Layout.Flex>
        <Grid
          bordered
          ref={apiRef1}
          showRowNumber
          rowFilter="editTable.sex"
          id="subTab"
          columns={col1}
          dataSource={ds1}
        />
      </Layout.Flex>
    </Layout>
  );
}
