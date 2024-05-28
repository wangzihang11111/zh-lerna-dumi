import { cssVar, useRefCallback, useUpdateEffect } from '../util';
import { useContext, useEffect, useState } from 'react';
import { TableContext } from '../base/common';

/**
 * 排序按钮
 * @param dataIndex
 * @param sortable
 * @constructor
 */
export function OrderIcon({ column: { dataIndex, sortable } }) {
  const {
    table,
    table: {
      state: { orderBy, columns }
    }
  } = useContext(TableContext);
  const orderIndex = orderBy.findIndex((o) => o[dataIndex] !== undefined);
  const [direction, setDirection] = useState(orderIndex > -1 ? orderBy[orderIndex][dataIndex] : '');
  const comStyle = {
    margin: 2,
    cursor: 'pointer',
    borderLeft: '4px solid transparent',
    borderRight: '4px solid transparent'
  };
  const setOrder = useRefCallback(() => {
    const order = direction === 'desc' ? 'asc' : direction === 'asc' ? '' : 'desc';
    if (orderIndex > -1) {
      if (order) {
        orderBy[orderIndex][dataIndex] = order;
      } else {
        orderBy.splice(orderIndex, 1);
      }
    } else {
      orderBy.push({ [dataIndex]: order, local: sortable.local !== false });
    }
    const orders = [
      ...orderBy.sort(function (a, b) {
        const [aIndex, bIndex] = [Object.keys(a)[0], Object.keys(b)[0]];
        return (
          (columns.find((c) => c.dataIndex === aIndex)?.idx || 0) -
          (columns.find((c) => c.dataIndex === bIndex)?.idx || 0)
        );
      })
    ];
    setDirection(order);
    if (sortable.local !== false) {
      table.setOrderBy(orders, sortable.callback);
    } else {
      table.setExtraParam({ orderBy: orders.filter(o => !o.local).map(({ local, ...item }) => item) });
    }
  });

  useEffect(() => {
    return table.subscribe(({ column }) => {
      column.dataIndex === dataIndex && setOrder();
    }, 'onHeaderCellClick');
  }, [dataIndex]);

  useUpdateEffect(() => {
    table.notify({ direction, dataIndex }, 'onDataSort');
  }, [direction]);

  return (
    <div className="order hover-icon" style={{ padding: '2px 0', display: direction ? 'block' : '' }}>
      <div
        style={{
          ...comStyle,
          borderBottom: `5px solid ${direction === 'asc' ? cssVar.primaryColor : '#bfbfbf'}`
        }}
      />
      <div
        style={{
          ...comStyle,
          borderTop: `5px solid ${direction === 'desc' ? cssVar.primaryColor : '#bfbfbf'}`
        }}
      />
    </div>
  );
}
