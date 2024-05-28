import { CheckOutlined, CopyOutlined, LoadingOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Tooltip } from '../../antd/tooltip';
import { areEqual, CellTypeEnum, IS_GROUP, TableContext, UpdateFlagEnum } from '../base/common';
import Base from '../base/index';
import { EditorFactory } from '../editor/factory';
import { useAutoScroll } from '../hook/useAutoScroll';
import { useKeyDown } from '../hook/useKeyDown';
import {
  convertStyle,
  displayText,
  getCellInfoByEvent,
  getGlobalConfig,
  useDraggableSort,
  useRefCallback,
  useRefState,
  useReturnCallback,
  useThrottle,
  useUpdateEffect,
  util,
  type IObject
} from '../util';

const aggregateTitle = {
  min: '最小值：',
  max: '最大值：',
  avg: '平均值：',
  sum: '合计：',
  count: '记录数：'
};

const CopyIcon = ({ text }) => {
  const [copy, setCopy] = useState<any>(null);

  const copyText = (e) => {
    e.stopPropagation();
    util.copyText(text);

    setCopy(
      setTimeout(() => {
        setCopy(null);
      }, 3000)
    );
  };

  useEffect(() => {
    return () => copy && clearTimeout(copy);
  }, []);

  return (
    <a>
      {copy ? (
        <CheckOutlined className="cell-content-copy" style={{ color: '#52c41a' }} />
      ) : (
        <CopyOutlined className="cell-content-copy" onClick={copyText} />
      )}
    </a>
  );
};

const ContentCell = ({ row, rowIndex, column }: IObject) => {
  const {
    table,
    table: {
      props: { rowHeight },
      state: {
        params: { pageIndex, pageSize }
      }
    }
  } = useContext(TableContext);
  const { dataIndex, dataIndexField, tooltip, copyable, editor, render } = column;
  const { overflow = undefined, type: tooltipType } = util.isObject(tooltip) ? (tooltip as any) : { type: tooltip };
  const tooltipOverflow = overflow ?? !util.isFunction(tooltipType);
  const di = dataIndexField || dataIndex;
  const params = {
    table,
    row,
    value: util.getObjValue(row, di),
    dataIndex: di,
    rowIndex,
    pageIndex,
    pageSize,
    onChange(val) {
      table.updateRowDataByIndex(rowIndex, { [di]: val }, true);
    }
  };
  const contentInfo = useMemo(() => {
    if (render) {
      return render(params);
    } else {
      let displayField = editor?.nameField || editor?.displayField;
      const xType = util.isString(editor?.xtype) ? editor.xtype.toLowerCase() : '';
      if (editor && !displayField && (['select', 'help'].indexOf(xType) > -1 || xType.endsWith('help'))) {
        displayField = `${dataIndex}EXName`;
      }
      const key = displayField || di;
      return (
        <span
          className="nowrap"
          style={{ whiteSpace: `${rowHeight === 'auto' ? 'pre-wrap' : 'nowrap'}`, wordBreak: 'break-all' }}
        >
          {displayText(util.getObjValue(row, key, dataIndex !== key ? util.getObjValue(row, dataIndex) : ''))}
        </span>
      );
    }
  }, [
    row,
    row.__update__,
    row.children?.length,
    params.value,
    rowHeight,
    di,
    editor?.nameField,
    editor?.displayField,
    editor?.xtype
  ]);
  const tooltipFn = useReturnCallback(() => {
    return util.isFunction(tooltipType)
      ? tooltipType(params)
      : tooltipType === 'render'
      ? contentInfo
      : displayText(util.getObjValue(row, editor?.nameField || editor?.displayField || di));
  }, [contentInfo]);
  return (
    <>
      {!tooltipType ? (
        contentInfo
      ) : (
        <Tooltip title={tooltipFn} overflow={tooltipOverflow}>
          <span className="nowrap">{contentInfo}</span>
        </Tooltip>
      )}
      {copyable && params.value && <CopyIcon text={params.value} />}
    </>
  );
};

const EditorCell = (props) => {
  const { table } = useContext(TableContext);
  const { row, column, rowIndex, editing, active } = props;
  const disabled = table.isDisabled({ row, dataIndex: column.dataIndex, column });
  const startEditing = () => {
    if (table._movement > 5) {
      table._movement = 0;
      return;
    }
    if (disabled) {
      return;
    }
    table.setEditLock(true);
    setTimeout(() => {
      table.setEditLock(false);
    }, 16);
    table.startEditing({ rowIndex, dataIndex: column.dataIndex });
  };

  const keyValue = row[table.getKeyField()];
  const errorInfo =
    editing || disabled
      ? ''
      : table.state.errors[`${keyValue}:${column.dataIndex}`]?.info.map(([, error]) => error).join(';');
  const tmpProps: any = {
    [`${table.props.activeCellEditor === 'doubleClick' ? 'onDoubleClick' : 'onClick'}`]: startEditing
  };

  // 编辑单元格支持内容复制
  if (table.props.activeCellEditor !== 'doubleClick') {
    tmpProps.onMouseDown = (e) => {
      table._movement = e.screenX;
    };
    tmpProps.onMouseUp = (e) => {
      table._movement = Math.abs(e.screenX - table._movement || 0);
    };
  }

  return (
    <div
      className={util.classNames(
        'editor-container',
        `${editing ? 'cell-editing' : active ? 'cell-active' : ''}`,
        `${disabled ? 'cell-disabled' : 'input'}`
      )}
      style={{
        ...table.cellStyle,
        ...(editing && !disabled ? { padding: 1 } : {}),
        ...convertStyle(column.cellStyle),
        tabIndex: 1
      }}
      {...tmpProps}
    >
      <EditorFactory column={column} row={row} table={table} editing={editing}>
        <ContentCell {...props} />
        {errorInfo && (
          <Tooltip title={errorInfo} color="#f50">
            <span className="cell-error" />
          </Tooltip>
        )}
      </EditorFactory>
    </div>
  );
};

const RenderCell = React.memo<IObject>(
  (props) => {
    const { editor } = props.column;
    return editor ? <EditorCell {...props} /> : <ContentCell {...props} />;
  },
  (prevProps, nextProps) => {
    const { row: prevRow, table: prevTable, ...prevRest } = prevProps;
    const { row: nextRow, table, ...nextRest } = nextProps;
    const checkedIndex = table.getCheckBoxDataIndex();

    if (nextRow.__update__ || table.updateFlag === UpdateFlagEnum.ForceUpdate) {
      return false;
    }
    if (table.updateFlag === UpdateFlagEnum.ColumnChecked) {
      if (nextRest.column.dataIndex === checkedIndex) {
        return false;
      }
      const { [checkedIndex]: c1, ...p } = prevRow;
      const { [checkedIndex]: c2, ...n } = nextRow;
      return areEqual(p, n) && areEqual(prevRest, nextRest);
    }

    return prevRow === nextRow && areEqual(prevRest, nextRest);
  }
);

const FixedBodyCell = (props) => {
  const {
    table,
    columns: { fixedColumns }
  } = useContext(TableContext);
  const {
    rowIndex,
    fixedRight,
    style: { left, right, marginLeft, ...others },
    editing,
    active,
    data: row
  } = props;
  const [editingIndex, editingDataIndex] = editing.split(':');
  const [activeIndex, activeDataIndex] = active.split(':');
  const [editingRowIndex, activeRowIndex] = [parseInt(editingIndex), parseInt(activeIndex)];

  const render = (fixed) => {
    const fixedCols = fixedColumns[fixed].columns;
    if (fixedCols.length === 0 || (fixed === 'right' && row[IS_GROUP])) {
      return null;
    }

    return (
      <div
        className={`fc fixed-cell-${fixed}`}
        style={{
          ...others,
          width: 'auto',
          position: 'sticky',
          left: fixed === 'left' ? 0 : fixedRight,
          zIndex: `${rowIndex + (fixed === 'left' ? 2 : 3)}`
        }}
      >
        {fixedCols.map((column, index) => {
          return row[IS_GROUP] && index > 0 ? null : (
            <div
              key={index}
              data-key={column.dataIndex}
              className="virtual-table-cell"
              style={{
                ...table.cellStyle,
                width: column.width,
                position: 'relative',
                minHeight: '100%',
                ...convertStyle(column.cellStyle)
              }}
            >
              <RenderCell
                table={table}
                rowIndex={rowIndex}
                row={row}
                column={column}
                active={activeRowIndex === rowIndex && activeDataIndex === column.dataIndex}
                editing={editingRowIndex === rowIndex && editingDataIndex === column.dataIndex}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {render('left')}
      {render('right')}
    </>
  );
};

const BodyCell = (props) => {
  const {
    table,
    columns: { fixedColumns, normalColumns: columns }
  } = useContext(TableContext);
  const { columnIndex, rowIndex, style, className, editing, active, data } = props;
  const { cellStyle, dataIndex } = columns[columnIndex];
  return (
    <div
      data-key={dataIndex}
      className={util.classNames('virtual-table-cell', className)}
      style={{
        ...table.cellStyle,
        ...style,
        left: style.left + fixedColumns.left.width,
        ...convertStyle(cellStyle)
      }}
    >
      <RenderCell
        table={table}
        rowIndex={rowIndex}
        row={data}
        column={columns[columnIndex]}
        editing={editing}
        active={active}
      />
    </div>
  );
};

const RowDetail = React.memo<IObject>(({ rowIndex, data }) => {
  const {
    table,
    table: {
      props: {
        expandRow: { render: Cmp }
      }
    }
  } = useContext(TableContext);
  return <Cmp table={table} row={data} rowIndex={rowIndex} />;
}, areEqual);

const ExpandRowCell = (props) => {
  const { rowIndex, data, contentWidth } = props;
  return (
    <div style={{ width: contentWidth }}>
      <RowDetail key={rowIndex} rowIndex={rowIndex} data={data} style={{ width: '100%' }} />
    </div>
  );
};

const AggregateContent = ({ table, column, dataSource, style, inGroup }) => {
  const { aggregates, dataIndex } = column;
  const [aggregateResult, setAggregateResult] = useRefState({});
  const calc = useRefCallback(async () => {
    if (aggregates) {
      // 处理服务端返回的计算数据，前端不需要重复计算
      const aggregateData = table.state.aggregates?.[dataIndex] || {};
      const summaryData = table.state.summaryData || {};
      const stateAggregates = summaryData.hasOwnProperty(dataIndex)
        ? { ...aggregateData, totalSummary: summaryData[dataIndex] }
        : aggregateData;
      const dataArr = aggregates.some((a) => !stateAggregates.hasOwnProperty(a.type || a))
        ? dataSource.map((d) => d[dataIndex])
        : [];
      const tmpObj = {};
      for (let i = 0, len = aggregates.length; i < len; i++) {
        const ag = aggregates[i];
        const type = ag.type || ag;
        if (stateAggregates.hasOwnProperty(type)) {
          tmpObj[i] = stateAggregates[type];
        } else if (util.isFunction(ag.calc)) {
          tmpObj[i] = await ag.calc(dataArr, dataSource, dataIndex, inGroup);
        } else {
          tmpObj[i] = util.getAggregate(type, dataArr);
        }
        if (util.isFunction(ag.formatter) && tmpObj.hasOwnProperty(i)) {
          tmpObj[i] = ag.formatter(tmpObj[i], { type, dataIndex, data: dataSource, inGroup });
        }
      }
      setAggregateResult(tmpObj);
    }
  });

  useEffect(() => {
    const it = setTimeout(calc);
    return () => clearTimeout(it);
  }, [dataIndex, dataSource, aggregates]);

  const getTitle = (ag) => {
    return aggregateTitle[ag] || (util.isFunction(ag.title) ? ag.title(inGroup) : ag.title);
  };

  return (
    <div className="virtual-table-cell" style={style}>
      <div style={{ maxHeight: '100%', width: '100%' }}>
        {aggregates?.map((ag, idx) => (
          <div key={idx} className="nowrap" style={{ lineHeight: 1.5, ...ag.style }}>
            <span style={{ fontWeight: `${inGroup ? 'normal' : 600}` }}>{getTitle(ag)}</span>
            <span style={{ fontWeight: 600 }}>{aggregateResult[idx] ?? <LoadingOutlined />}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 小计单元格
const AggregateCell = (props) => {
  const {
    table,
    columns: { fixedColumns, normalColumns: columns }
  } = useContext(TableContext);
  const {
    columnIndex,
    fixedRight,
    style,
    style: { height, left, right, marginLeft, ...others },
    subDataSource
  } = props;
  const dataSource = subDataSource || table.getAggregateData();
  const inGroup = !!subDataSource;

  if (columnIndex === -1) {
    // 固定列
    const getColumnStyle = (column) => ({
      ...table.cellStyle,
      ...convertStyle(column.cellStyle),
      ...table.props.aggregateStyle,
      position: 'relative',
      width: column.width
    });
    const render = (fixed) => {
      const fixedCols = fixedColumns[fixed].columns;
      if (fixedCols.length === 0) {
        return null;
      }
      return (
        <div
          className={`fc fixed-cell-${fixed}`}
          style={{
            ...others,
            width: 'auto',
            position: 'sticky',
            left: fixed === 'left' ? 0 : fixedRight,
            zIndex: fixed === 'left' ? 2 : 3
          }}
        >
          {fixedCols.map((column, index) => (
            <AggregateContent
              key={index}
              table={table}
              column={column}
              inGroup={inGroup}
              dataSource={dataSource}
              style={getColumnStyle(column)}
            />
          ))}
        </div>
      );
    };
    return (
      <>
        {render('left')}
        {render('right')}
      </>
    );
  } else {
    const column = columns[columnIndex];
    return (
      <AggregateContent
        inGroup={inGroup}
        table={table}
        column={column}
        dataSource={dataSource}
        style={{
          ...table.cellStyle,
          ...style,
          height: '100%',
          left: style.left + fixedColumns.left.width,
          ...convertStyle(column.cellStyle),
          ...table.props.aggregateStyle
        }}
      />
    );
  }
};

// 分组行单元格
const GroupRowCell = (props) => {
  const { table } = useContext(TableContext);
  const { rowIndex, style, data: row } = props;
  const {
    title,
    header,
    dataIndex,
    dataIndexField,
    render = ({ row, dataIndex }) => `${util.getObjValue(row, dataIndex)}(${row.children.length})`
  } = row.column;
  const expandIconWidth = table.props.expandWidth?.width || 24;

  const di = dataIndexField || dataIndex;
  const tip = util.isFunction(header) ? (
    header({ title, dataIndex, column: row.column, inGroup: true })
  ) : (
    <span style={{ fontWeight: 600 }}>{`${header || title}:`}</span>
  );

  return (
    <div className="virtual-table-cell" style={{ ...table.cellStyle, ...style, left: style.left + expandIconWidth }}>
      {tip}
      <span style={{ margin: `${tip ? '0 4px' : 0}` }}>
        {render({
          table,
          row,
          dataIndex: di,
          rowIndex,
          value: util.getObjValue(row, di),
          inGroup: true
        })}
      </span>
    </div>
  );
};

const Cell = React.memo<any>(
  (props) => {
    switch (props.cellType) {
      case CellTypeEnum.BodyCell:
        return <BodyCell {...props} />;
      case CellTypeEnum.MergeCell:
        return <BodyCell {...props} className="merge-cell" />;
      case CellTypeEnum.FixedBodyCell:
        return <FixedBodyCell {...props} />;
      case CellTypeEnum.ExpandRowCell:
        return <ExpandRowCell {...props} />;
      case CellTypeEnum.AggregateCell:
        return <AggregateCell {...props} />;
      case CellTypeEnum.GroupRowCell:
        return <GroupRowCell {...props} />;
      default:
        return null;
    }
  },
  (prevProps, nextProps) => {
    if (nextProps.data.__update__ || nextProps.table?.updateFlag === UpdateFlagEnum.ForceUpdate) {
      return false;
    }
    return areEqual(prevProps, nextProps);
  }
);

function TableBody() {
  const {
    table,
    columns: {
      fixedColumns,
      normalColumns,
      editableColumnIndex = [],
      aggregates,
      useFlex,
      allColumns,
      totalColumnWidth,
      avgColumnWidth = 50
    }
  } = useContext(TableContext);
  const headerHeight = table.headerHeight;
  const {
    hiddenHeader,
    rowHeight = 32,
    compact,
    rowDrag,
    isTree = false,
    pagination = false,
    virtualScrolling = true,
    optimize = {},
    expandRow
  } = table.props;
  const [paginationHeight, setPaginationHeight] = useState(
    pagination && !pagination.targetContainer ? pagination.height || 48 : 0
  );
  const { width, height, dataSource = [] } = table.state;
  const calcHeaderHeight = hiddenHeader || headerHeight <= 0 ? 0 : headerHeight;
  const tmpRef = useRef<any>();

  const itemData = useMemo(() => {
    table._renderDataSource = util.isFunction(table._rowFilter) ? dataSource.filter(table._rowFilter) : dataSource;
    return {
      gridData: {
        table,
        columns: normalColumns,
        fixedColumns,
        aggregates,
        dataSource: table._renderDataSource || [],
        totalColumnWidth,
        scrollbar: { vertical: table.state.vertical }
      }
    };
  }, [normalColumns, fixedColumns, dataSource, aggregates, totalColumnWidth, table._rowFilter]);

  const rowCount = Math.max(1, itemData.gridData.dataSource.length);
  const editable = editableColumnIndex.length > 0 && itemData.gridData.dataSource.length > 0;

  const scrollThrottle = useThrottle((scrollParams) => table.notify({ ...scrollParams, table }, 'onScroll'), {
    trailing: true,
    leading: false
  });

  const onScroll = (params) => {
    const { scrollLeft } = params;
    const headerDom = table.headerRef.current;
    if (headerDom && headerDom.lastScrollLeft !== scrollLeft) {
      headerDom.lastScrollLeft = scrollLeft;
      headerDom.querySelector('.normal-cells').style.transform = `translateX(-${scrollLeft}px)`;
    }
    scrollThrottle(params);
  };

  useEffect(() => {
    return table.subscribe(({ height }) => {
      setPaginationHeight(height);
    }, 'hideOnSinglePage');
  }, []);

  useEffect(() => {
    const { scrollbar } = itemData.gridData as any;
    const scrollbarPlaceHolder = table.headerRef.current?.querySelector('.scrollbar-placeholder');
    if (scrollbarPlaceHolder && scrollbar) {
      scrollbarPlaceHolder.style.display = scrollbar.vertical ? 'inline-block' : 'none';
      // 滚动区域的高度和内容高度相等时，垂直滚动条没有显示(因为水平滚动条占位，应该出现垂直滚动条才对)
      table.outRef.current._outerRef.style.overflowY = scrollbar.vertical ? 'scroll' : 'auto';
    }
  }, [itemData.gridData.dataSource.length, width, height]);

  useAutoScroll({ table, scrollbar: itemData.gridData.scrollbar });

  useLayoutEffect(() => {
    const vertical = itemData.gridData?.scrollbar?.vertical;

    if (table.state.vertical !== vertical) {
      if ((itemData.gridData.dataSource.length > 0 && optimize.vertical) || !optimize.vertical) {
        table.refreshView({ state: { vertical }, rowColumnIndex: { columnIndex: 0 } });
      }
    }
  }, [itemData.gridData.dataSource.length, height, width]);

  useUpdateEffect(() => {
    table.outRef.current?.resetAfterColumnIndex(0, true);
  }, [width]);

  useLayoutEffect(() => {
    if (rowHeight === 'auto') {
      if (table.props.estimateRowHeight) {
        tmpRef.current = true;
      } else {
        const cellPadding = table._getCellPadding();
        tmpRef.current = document.createElement('div');
        tmpRef.current.style.cssText = `white-space:pre-wrap;word-break:break-all;position:absolute;padding: ${cellPadding}px; font-size: 12px;top:-999px;z-index:-1;visibility: hidden;`;
        document.body.appendChild(tmpRef.current);
      }
    }
    return () => {
      if (tmpRef.current && tmpRef.current !== true) {
        document.body.removeChild(tmpRef.current);
      }
      tmpRef.current = undefined;
    };
  }, [rowHeight]);

  useUpdateEffect(() => {
    table.refreshView({ rowColumnIndex: { rowIndex: 0 } });
  }, [rowHeight]);

  useUpdateEffect(() => {
    rowHeight === 'auto' && table.outRef.current?.resetAfterRowIndex(0, false);
  }, [itemData.gridData.dataSource]);

  const defaultHeight = compact ? 28 : getGlobalConfig().default.tableConfig.rowHeight;

  const tableRowHeight = (rowIndex) => {
    if (!itemData.gridData.dataSource?.length) {
      return defaultHeight;
    }
    const padding = table._getCellPadding();

    switch (itemData.gridData.dataSource[rowIndex].cellType) {
      case CellTypeEnum.AggregateCell:
        return Math.max(defaultHeight, aggregates.length * 21 + padding);
      case CellTypeEnum.ExpandRowCell:
        const tmp = itemData.gridData.dataSource[rowIndex];
        return Math.max(
          0,
          util.isFunction(expandRow.height)
            ? expandRow.height({
                row: tmp.parent,
                rowIndex: tmp.groupIndex
              })
            : expandRow.height
        );
      default: {
        if (tmpRef.current) {
          const row = itemData.gridData.dataSource[rowIndex];
          const obj = { height: defaultHeight, width: 0, maxContent: '' };
          allColumns.forEach(({ dataIndex }) => {
            const { dataIndexField, width, editor, hidden } = table.getDataIndexMap()[dataIndex];
            if (hidden || width <= 0) {
              return;
            }
            let displayField = dataIndexField || dataIndex;
            const xType = util.isString(editor?.xtype) ? editor.xtype.toLowerCase() : '';
            if (editor && (['select', 'help'].indexOf(xType) > -1 || xType.endsWith('help'))) {
              displayField = editor?.nameField || editor?.displayField || `${displayField}EXName`;
            }
            const value = util.getObjValue(row, displayField, '') + '';
            const enLen = value ? value.split('\n').length - 1 : 0;
            const cw = width - padding * 2;

            const esCalcHeight = Math.max(
              Math.ceil(((util.strLen(value) - enLen) * 6.5) / cw + enLen) * 21 + 2,
              obj.height
            );
            if (esCalcHeight > obj.height) {
              obj.maxContent = value;
              obj.width = cw;
              obj.height = esCalcHeight;
            }
          });
          if (obj.maxContent && tmpRef.current !== true) {
            tmpRef.current.style.width = `${obj.width}px`;
            tmpRef.current.innerText = obj.maxContent;
            obj.height = Math.max(tmpRef.current.offsetHeight, obj.height);
          }
          return obj.height;
        }
        break;
      }
    }

    return (util.isFunction(rowHeight) ? rowHeight(rowIndex) : Number(rowHeight)) || defaultHeight;
  };

  const onKeyDown: any = useKeyDown(table.bodyRef, [
    table,
    editableColumnIndex,
    itemData.gridData.dataSource.length - 1,
    editable
  ]);

  const draggable = !!rowDrag && !table.groupByColumn;
  const { SortContainer } = useDraggableSort(draggable);
  const sortProps = draggable
    ? {
        ...rowDrag.listeners,
        helperClass: 'row-dragging',
        axis: 'y',
        lockAxis: 'xy',
        pressDelay: rowDrag.pressDelay ?? 250,
        shouldCancelStart: (e) => {
          const node = util.closest(e.target, (el) => el.sortableInfo);
          if (node && node.sortableInfo) {
            const listeners = rowDrag.listeners || {};
            if (rowDrag.handleIndex && !util.closest(e.target, (el) => el.dataset.key === rowDrag.handleIndex)) {
              return true;
            }
            return !!listeners.shouldCancelStart?.(e, node.sortableInfo.index);
          }
          return true;
        },
        onSortEnd: (sortInfo, e) => {
          const { oldIndex, newIndex } = sortInfo;
          if (oldIndex !== newIndex) {
            const listeners = rowDrag.listeners || {};
            if (listeners.onSortEnd?.(sortInfo, e) === false) {
              return;
            }
            if (isTree) {
              table.moveTreeNode(oldIndex, newIndex);
            } else {
              table.moveRow(oldIndex, newIndex);
            }
          }
        }
      }
    : null;

  const keyProps: any = onKeyDown
    ? {
        tabIndex: 1,
        onKeyDown
      }
    : null;

  const otherHeight = calcHeaderHeight + paginationHeight;
  const baseHeight = height - otherHeight;
  const estimatedRowHeight = tableRowHeight(0);
  const minHeight = Math.max(0, parseFloat(table.props.style?.minHeight || 0) - otherHeight);

  const el = (
    <div ref={table.bodyRef} {...keyProps}>
      <SortContainer {...sortProps}>
        <Base
          ref={table.outRef}
          estimatedRowHeight={estimatedRowHeight}
          estimatedColumnWidth={avgColumnWidth}
          itemData={itemData.gridData}
          className={`${editable ? 'editable' : ''} row-hover rows-container`}
          style={{ overflow: `${useFlex ? 'hidden' : 'auto'} auto`, zIndex: 1 }}
          columnCount={itemData.gridData.columns.length}
          columnWidth={(index) => itemData.gridData.columns[index].width}
          minHeight={minHeight}
          height={baseHeight > 0 ? baseHeight : rowCount * estimatedRowHeight}
          rowCount={rowCount}
          virtualScrolling={virtualScrolling}
          overscanRowCount={virtualScrolling ? 1 : rowCount}
          overscanColumnCount={virtualScrolling ? 10 : itemData.gridData.columns.length}
          useIsScrolling={rowCount > 35}
          onScroll={onScroll}
          rowHeight={tableRowHeight}
          width={width}
        >
          {Cell}
        </Base>
      </SortContainer>
    </div>
  );

  return table.props.bodyContextMenu || table.props.rowContextMenu ? (
    <TableBodyCtx table={table} children={el} ds={itemData.gridData.dataSource} />
  ) : (
    el
  );
}

function TableBodyCtx({ children, table, ds }) {
  const { rowContextMenu, bodyContextMenu } = table.props;
  const [visible, setVisible] = useState(false);
  const onVisibleChange = useRefCallback((open) => {
    setVisible(open);
  });
  const hidden = useRefCallback(() => {
    setVisible(false);
  });
  const dropdownRender = useRefCallback(() => {
    const { rowIndex, dataIndex } = getCellInfoByEvent();
    let cloneEl: any;
    if (rowIndex > -1 && rowContextMenu) {
      cloneEl = rowContextMenu(ds[rowIndex], { rowIndex, table, hidden, dataIndex });
    } else if (bodyContextMenu) {
      cloneEl = bodyContextMenu({ table, hidden, rowIndex, dataIndex });
    } else {
      return <></>;
    }
    const cloneElClick = cloneEl.props.onClick;
    return React.cloneElement(cloneEl, {
      onClick(...args) {
        cloneElClick?.(...args);
        hidden();
      }
    });
  });

  useEffect(() => {
    if (visible) {
      document.body.addEventListener('contextmenu', hidden, true);
      return () => {
        document.body.removeEventListener('contextmenu', hidden, true);
      };
    }
  }, [visible]);

  return (
    <Dropdown
      destroyPopupOnHide
      open={visible}
      onOpenChange={onVisibleChange}
      trigger={['contextMenu']}
      children={children}
      dropdownRender={dropdownRender}
    />
  );
}

export { TableBody };
