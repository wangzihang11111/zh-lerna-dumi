import { Alert, Divider } from 'antd';
import React, { CSSProperties, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { DsContext } from '../base/common';
import { TableInstance } from '../interface';
import { util, Layout, useRefState, useUpdateEffect } from '../util';

type IState = NonNullable<TableInstance['alertObj']['state']>;

const numberStyle: CSSProperties = { fontWeight: 600, color: '#000' };
const supportType = { avg: ['平均'], max: ['最大'], min: ['最小'], sum: ['总'], totalSummary: ['总', 'sum'] };
const defaultState: IState = { selectedRows: [], selectedRowKeys: [], aggregateColumns: [] };

/**
 * 表格顶部的警告提示，展现需要汇总的数据
 */
export const TableAlert = React.memo<{ table: TableInstance }>(({ table }) => {
  const pageCahce = useRef<{ state: IState }>({ state: defaultState });
  const { pageIndex, pageSize } = table.state.params;
  const [state, setState] = useRefState<IState>(defaultState);
  const ds = useContext(DsContext);
  const checkDataIndex = table.getCheckBoxDataIndex();

  useMemo(() => {
    pageCahce.current.state = state;
  }, [pageIndex, pageSize]);

  const newState = useMemo<IState>(() => {
    const innerState: IState = {
      selectedRows: [...pageCahce.current.state.selectedRows],
      selectedRowKeys: [...pageCahce.current.state.selectedRowKeys],
      aggregateColumns: []
    };
    table.getAggregateData().forEach((r) => {
      const keyV = r[table.getKeyField()];
      const startIndex = pageCahce.current.state.selectedRowKeys.indexOf(keyV);
      if (startIndex > -1) {
        r[checkDataIndex] = true;
        // 清除当前页的缓存记录，保证选中行状态切换的准确性
        pageCahce.current.state.selectedRowKeys.splice(startIndex, 1);
        pageCahce.current.state.selectedRows.splice(startIndex, 1);
      } else if (r[checkDataIndex]) {
        innerState.selectedRows.push(r);
        innerState.selectedRowKeys.push(keyV);
      }
    });
    table.alertObj.state = innerState;
    return innerState;
  }, [ds, checkDataIndex]);

  useEffect(() => {
    const { normalColumns, fixedColumns } = table.generateColumns();

    const allColumns = [...normalColumns, ...fixedColumns.left.columns, ...fixedColumns.right.columns];
    allColumns.forEach((c) => {
      if (!c.hidden && c.dataIndex && c.aggregates) {
        const supportAggregates = c.aggregates.filter((a) => supportType.hasOwnProperty(a.type || a));
        if (supportAggregates.length) {
          newState.aggregateColumns.push({
            dataIndex: c.dataIndex,
            aggregates: supportAggregates.map((ag) => ({
              label: getAgName(c, ag, table),
              type: supportType[ag.type || ag][1] || ag.type || ag,
              formatter(value, options) {
                return util.isFunction(ag.formatter) ? ag.formatter(value, options) : value;
              }
            }))
          });
        }
      }
    });

    setState(newState);
  }, [newState]);

  useEffect(() => {
    table.alertObj.state = state;
  }, [state]);

  useUpdateEffect(() => {
    pageCahce.current.state.selectedRowKeys.length && table.refreshView({});
  }, [pageCahce.current.state]);

  useEffect(() => {
    return table.subscribe(() => {
      table.alertObj.state = defaultState;
      pageCahce.current.state = defaultState;
      setState(defaultState);
    }, 'clearCacheCheckState');
  }, []);

  const isMessageRender = state.selectedRowKeys.length > (table.settingContainer ? 0 : 1);

  const messageRender = () => {
    if (isMessageRender) {
      const tableAlertRender = util.isFunction(table.props.tableAlertRender)
        ? table.props.tableAlertRender
        : ({ selectedRowKeys, selectedRows, onClear }) => {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 12 }}>
              <div>
                已选 <span style={numberStyle}>{selectedRowKeys.length}</span> 项
                <a onClick={onClear} style={{ marginInlineStart: 8 }}>
                  取消选择
                </a>
              </div>
              {state.aggregateColumns.map((c) => (
                <div key={c.dataIndex}>
                  {c.aggregates.map(({ label, type, formatter }, index) => (
                    <React.Fragment key={type}>
                      {index > 0 && <Divider type="vertical" />}
                      {label}
                      <span style={numberStyle}>
                        {formatter(util.getAggregate(type, selectedRows, c.dataIndex), {
                          type,
                          dataIndex: c.dataIndex,
                          data: selectedRows
                        })}
                      </span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          );
        };
      return tableAlertRender({
        selectedRowKeys: state.selectedRowKeys,
        selectedRows: state.selectedRows,
        onClear: () => table.clearSelected()
      });
    }
    return null;
  };

  const render = (layout = false) => {
    const content = messageRender();
    const message = layout ? (
      <Layout direction="row">
        <Layout.Flex>{content}</Layout.Flex>
        <Extra container={table.settingContainer} />
      </Layout>
    ) : (
      content
    );
    return <Alert message={message} type="info" showIcon={!!content} />;
  };

  if (table.settingContainer) {
    return render(true);
  }
  if (isMessageRender) {
    return render(false);
  }
  return null;
});

function Extra({ container }) {
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (container && innerRef.current) {
      innerRef.current.appendChild(container);
      return () => innerRef.current?.removeChild(container);
    }
  }, []);

  return <div ref={innerRef} style={{ display: 'flex', minHeight: 18, alignItems: 'center', fontSize: 12 }} />;
}

function getAgName(c, ag, table) {
  const title = util.isFunction(c.header)
    ? c.header({ title: c.title, dataIndex: c.dataIndex, column: c, table: table })
    : c.header || c.title;
  return `${supportType[ag.type || ag][0]}${title}: `;
}
