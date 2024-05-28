import {
  ColumnProps,
  Button,
  Layout,
  Menu,
  Table,
  TableInstance,
  TableSelectionModel,
  TableSymbol,
  useApi,
  useRefCallback,
  zh
} from '@zh/zh-design';
import { Dropdown } from 'antd';
import { useRef, useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import './treeGridEx.less';
import React from 'react';

const columns: ColumnProps[] = [
  {
    title: '序号',
    width: 80,
    dataIndex: 'id'
  },
  {
    title: '编码',
    width: 80,
    flex: 1,
    dataIndex: 'cno'
  },
  {
    title: '费用项名称',
    width: 150,
    flex: 1,
    dataIndex: 'name',
    filter: { type: 'find' },
    editor: true
  },
  {
    title: '费用项特征',
    width: 200,
    flex: 1,
    dataIndex: 'tz'
  },
  {
    title: '单位',
    width: 100,
    flex: 1,
    dataIndex: 'unit'
  },
  {
    title: '数量',
    width: 100,
    flex: 1,
    dataIndex: 'count',
    editor: true
  },
  {
    title: '对应CBS',
    width: 100,
    flex: 1,
    dataIndex: 'cbs'
  },
  {
    title: 'A',
    width: 100,
    flex: 1,
    dataIndex: 'A'
  },
  {
    title: 'B',
    width: 100,
    flex: 1,
    dataIndex: 'B'
  }
];

function IconBar({ collapsed, onChange, style, className }: any) {
  return (
    <div className={className} onClick={onChange} style={style}>
      <span
        style={{
          transform: `rotate(${collapsed ? 0 : 180}deg)`,
          borderLeft: '4px solid #fff',
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent'
        }}
      />
    </div>
  );
}

export default function () {
  const ref = useRef<any>({ dataLen: 0, dataLoad: 0, viewLoad: 0 });
  const [count, setCount] = useState(0);
  const [rowHeight, setRowHeight] = useState<number | 'auto'>(28);
  const tableRef = useApi<TableInstance>();

  const requestData = useRefCallback(async () => {
    await zh.delay(0);
    ref.current.dataLoad = performance.now();
    const dept = 3;
    const loop = (prevId, prevName, index) => {
      const data: any = [];
      for (let i = 1; i <= dept; i++) {
        ref.current.dataLen++;
        data.push({
          id: `${prevId}${i}`,
          cno: `${prevName}${i}`,
          name: i % 3 ? '安全文明施工费' : '回填土夯填（人工配合机械填土，取土±200m，不区分部位）',
          tz:
            index === dept
              ? ['模板定制', '钢结构焊接和钢管搭设，四周设置橡胶垫，坠落处地面设置标准厚度；地台尺寸以实际需求为准'][
              i % 2
              ]
              : '',
          unit: ['项', '套'][i % 2],
          count: 1,
          cbs: '-',
          children: index < dept ? loop(`${prevId}${i}.`, `${prevName}${i}0`, index + 1) : undefined
        });
      }
      return data;
    };
    const result: any = [];
    for (let i = 1; i <= 10000; i++) {
      ref.current.dataLen++;
      result.push({
        id: i,
        cno: `CS${i}`,
        name: '安全文明施工费',
        tz: '',
        unit: ['项', '套'][i % 2],
        count: 1,
        cbs: '-',
        children: loop(`${i}.`, `CS${i}0`, 1)
      });
    }
    ref.current.dataLoad = performance.now() - ref.current.dataLoad;
    ref.current.viewLoad = performance.now();
    return result;
  });

  const onDataLoad = () => {
    ref.current.viewLoad = performance.now() - ref.current.viewLoad;
    setCount(ref.current.dataLen);
  };

  const onRow = (rowIndex, table) => {
    const row = table.getRow(rowIndex);
    const level = row[TableSymbol.TREE_LEVEL];
    return {
      className: `${level === 1 ? 'parent-tree-node-row' : ''}`,
      style: { opacity: row.opacity || 1 },
      onClick() {
        console.log(table.getSelectedData());
      }
    };
  };

  const expandTreeLevel = (level) => {
    tableRef.current.getApi().expandTree(level);
  };

  const addChildrenRow = () => {
    const api = tableRef.current.getApi();
    const selectedRow = api.getSelectedRow();
    selectedRow && api.addChildrenRow(selectedRow, {}, 0);
  };

  const fitRowContent = () => {
    setRowHeight((rh) => (rh === 28 ? 'auto' : 28));
  };

  const setDisabled = () => {
    const api = tableRef.current.getApi();
    api.refreshView({
      state: ({ dataSource }) => {
        const opacity = Math.random();
        dataSource.forEach((row) => {
          zh.loopChildren(row, (r) => {
            r.opacity = opacity;
          });
        });
      }
    });
  };

  const [collapsed, setCollapsed] = useState(false);

  const onBodyContextMenu = useRefCallback(({ table, rowIndex, dataIndex }) => {
    console.log({ rowIndex, dataIndex });
    return (
      <Menu onClick={(e) => console.log(e.key)}>
        <Menu.Item key="1" onClick={() => console.log(table.getSelectedData().length)}>
          选中的行数
        </Menu.Item>
        <Menu.Item key="2" onClick={() => console.log(table.getSelectedData())}>
          console输出选中行
        </Menu.Item>
      </Menu>
    );
  });

  const onRowContextMenu = useRefCallback((row, { table, rowIndex, dataIndex }) => {
    console.log({ rowIndex, dataIndex });
    return (
      <Menu onClick={(e) => console.log(e.key)}>
        <Menu.Item
          key="1"
          onClick={() => {
            console.log(rowIndex);
            table.setExpand(rowIndex, true);
          }}
        >
          展开当前行
        </Menu.Item>
        <Menu.Item key="2" onClick={() => table.setExpand(rowIndex, false)}>
          收起当前行
        </Menu.Item>
        <Menu.Item key="3" onClick={() => table.setExpand(rowIndex, { level: 2 + row[TableSymbol.TREE_LEVEL] })}>
          展开节点后两级
        </Menu.Item>
      </Menu>
    );
  });

  const menu = {
    onClick(e) {
      expandTreeLevel(e.key);
    },
    items: [
      { key: '1', label: '展开一级' },
      { key: '2', label: '展开二级' },
      { key: '3', label: '展开三级' }
    ]
  };

  return (
    <Layout style={{ height: 500 }}>
      <Layout.Flex direction="row">
        <Layout.Slider
          size={180}
          draggable={false}
          collapsed={collapsed}
          bordered
          style={{ padding: 5 }}
          icon={<IconBar collapsed={collapsed} onChange={() => setCollapsed(!collapsed)} />}
        >
          <div className="nowrap">
            <div>数据总数：</div>
            <strong>{count || '-'}</strong>
            <div>数据加载时间：</div>
            <strong>{ref.current.dataLoad}ms</strong>
            <div>数据渲染时间：</div>
            <strong>{ref.current.viewLoad}ms</strong>
          </div>
          <div style={{ marginTop: 20 }}>
            <Button size="small" type="primary" onClick={fitRowContent} block style={{ marginBottom: 10 }}>
              内容高度切换({rowHeight})
            </Button>
            <Dropdown menu={menu}>
              <Button size="small" type="primary" block style={{ marginBottom: 10 }}>
                展开树下级 <DownOutlined />
              </Button>
            </Dropdown>
            <Button size="small" type="primary" block onClick={addChildrenRow} style={{ marginBottom: 10 }}>
              选中行增加下级节点
            </Button>
            <Button size="small" type="primary" block onClick={setDisabled} style={{ marginBottom: 10 }}>
              设置子节点的样式
            </Button>
          </div>
        </Layout.Slider>
        <Layout.Flex>
          <Table
            id="treeTableEx"
            ref={tableRef}
            compact
            expandCfg={{ defaultExpand: 1, showLine: true, fitContent: true, width: 17, block: false }}
            optimize={{ vertical: true }}
            rowHeight={rowHeight}
            estimateRowHeight={true}
            onRow={onRow}
            isTree
            bordered
            activeCellEditor="doubleClick"
            rowSelection={{
              disabled(row) {
                return row[TableSymbol.TREE_LEVEL] === 1;
              },
              type: TableSelectionModel.MULTIPLE_INTERVAL
            }}
            rowContextMenu={onRowContextMenu}
            bodyContextMenu={onBodyContextMenu}
            columns={columns}
            onDataLoad={onDataLoad}
            request={requestData}
          />
        </Layout.Flex>
      </Layout.Flex>
    </Layout>
  );
}
