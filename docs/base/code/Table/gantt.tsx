/**
 * title: 简易甘特图
 * description: 通过rowRender实现简单版的甘特图效果。
 */

import { DeleteRowOutlined, SisternodeOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import { ColumnProps, cssVar, zh, Table, useDraggable, useZhEffect } from '@zh/zh-design';
import { useRef } from 'react';
import { taskData } from './data';
import React from 'react';

function getMonthDays(year, month) {
  const dateCount = new Date(year, month, 0).getDate();
  return new Array(dateCount).fill(1).map((_, i) => ({
    dataIndex: `${year}${month}${i}`,
    title: `${i + 1}`.padStart(2, '0')
  }));
}

function AddTask({ table, row }) {
  const addRow = () => {
    if (row) {
      const len = (row.children?.length || 0) + 1;
      table.addChildrenRow(row, {
        name: `${row.name.replace('Project', 'Task')}.${len}`,
        startTime: `2022-03-${len % 30}`,
        duration: 240,
        complete: 0
      });
    } else {
      const len = table.getData().length + 1;
      table.addRows({
        name: `Project#${len}`,
        startTime: `2022-03-${len % 30}`,
        duration: 240,
        complete: 0
      });
    }
  };
  return (
    <a style={{ fontSize: 18 }} onClick={addRow}>
      <SisternodeOutlined />
    </a>
  );
}

function DeleteTask({ table, row }) {
  const deleteRow = () => {
    const len = (row.children?.length || 0) + 1;
    table.deleteRow(row, {
      name: `${row.name.replace('Project', 'Task')}.${len}`,
      startTime: `2022-03-${len % 30}`,
      duration: 240,
      complete: 0
    });
  };
  return (
    <a style={{ fontSize: 18 }} onClick={deleteRow}>
      <DeleteRowOutlined />
    </a>
  );
}

const columns: ColumnProps[] = [
  {
    title: '任务名',
    width: 120,
    flex: 1,
    fixed: 'left',
    dataIndex: 'name',
    sortable: false,
    columnSort: false,
    align: 'left'
  },
  {
    title: '开始时间',
    width: 90,
    flex: 1,
    fixed: 'left',
    dataIndex: 'startTime',
    sortable: false,
    columnSort: false
  },
  {
    title: '时长',
    width: 60,
    flex: 1,
    fixed: 'left',
    dataIndex: 'duration',
    sortable: false,
    columnSort: false
  },
  {
    dataIndex: 'addTask',
    width: 80,
    header: ({ table }) => <AddTask table={table} row={null} />,
    sortable: false,
    columnSort: false,
    fixed: 'left',
    render({ table, row }) {
      return [
        <AddTask key="add" table={table} row={row} />,
        <Divider key="split" type="vertical" />,
        <DeleteTask key="delete" table={table} row={row} />
      ];
    }
  },
  {
    title: '2020/03',
    columns: getMonthDays(2022, 3),
    sortable: false,
    columnSort: false
  },
  {
    title: '2020/04',
    columns: getMonthDays(2022, 4),
    sortable: false,
    columnSort: false
  },
  {
    title: '2020/05',
    columns: getMonthDays(2022, 5),
    sortable: false,
    columnSort: false
  },
  {
    title: '2020/06',
    columns: getMonthDays(2022, 6),
    sortable: false,
    columnSort: false
  }
];

function TaskProgress({ progress, start, duration }) {
  const elRef = useRef<HTMLDivElement>(null);
  const peerDay = 40;
  const stamp = (zh.strToDate(start).getTime() - zh.strToDate('2022-03-01').getTime()) / (3600000 * 24.0);
  const setTransform = useDraggable(elRef, { direction: 'x' });

  useZhEffect(
    () => {
      setTransform?.();
    },
    [setTransform],
    false
  );

  return (
    <div
      ref={elRef}
      style={{
        backgroundColor: 'var(--primary-3)',
        borderRadius: 2,
        marginLeft: stamp * peerDay,
        width: (duration / 24.0) * peerDay,
        height: '72%'
      }}
    >
      <div
        style={{
          borderRadius: 2,
          transition: 'width .3s',
          backgroundColor: cssVar.primaryColor,
          height: '100%',
          width: `${progress * 100}%`
        }}
      />
    </div>
  );
}

export default function () {
  return (
    <div style={{ height: 400, border: `1px solid ${cssVar.borderColorSplit}` }}>
      <Table
        id="gantTable"
        isTree
        align="center"
        rowHeight={36}
        headerHeight={30}
        defaultExpand="all"
        onRow={(rowIndex, table, row) => {
          return {
            rowRender({ style }) {
              return (
                <div style={{ ...style, display: 'flex', alignItems: 'center' }}>
                  <TaskProgress start={row.startTime} duration={row.duration} progress={row.complete} />
                </div>
              );
            }
          };
        }}
        columns={columns}
        dataSource={taskData}
      />
    </div>
  );
}
