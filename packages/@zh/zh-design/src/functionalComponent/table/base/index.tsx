import { Empty } from 'antd';
import React, { createElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SortableElement } from 'react-sortable-hoc';
import { Button } from '../../antd/Button';
import { getScrollBarInfo, util } from '../util';
import { CellTypeEnum, IS_GROUP, TableContext } from './common';
import createGridComponent, { Props, ScrollToAlign } from './factory';

const DEFAULT_ESTIMATED_ITEM_SIZE = 50;

type ItemType = 'column' | 'row';

type ItemMetadata = {
  offset: number;
  size: number;
};
type ItemMetadataMap = { [index: number]: ItemMetadata };
type InstanceProps = {
  columnMetadataMap: ItemMetadataMap;
  estimatedColumnWidth: number;
  estimatedRowHeight: number;
  lastMeasuredColumnIndex: number;
  lastMeasuredRowIndex: number;
  rowMetadataMap: ItemMetadataMap;
};

const getEstimatedTotalHeight = (
  { rowCount }: Props<any>,
  { rowMetadataMap, estimatedRowHeight, lastMeasuredRowIndex }: InstanceProps
) => {
  let totalSizeOfMeasuredRows = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastMeasuredRowIndex >= rowCount) {
    lastMeasuredRowIndex = rowCount - 1;
  }

  if (lastMeasuredRowIndex >= 0) {
    const itemMetadata = rowMetadataMap[lastMeasuredRowIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }

  const numUnmeasuredItems = rowCount - lastMeasuredRowIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedRowHeight;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
};

const getEstimatedTotalWidth = (
  { columnCount }: Props<any>,
  { columnMetadataMap, estimatedColumnWidth, lastMeasuredColumnIndex }: InstanceProps
) => {
  let totalSizeOfMeasuredRows = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastMeasuredColumnIndex >= columnCount) {
    lastMeasuredColumnIndex = columnCount - 1;
  }

  if (lastMeasuredColumnIndex >= 0) {
    const itemMetadata = columnMetadataMap[lastMeasuredColumnIndex];
    totalSizeOfMeasuredRows = itemMetadata.offset + itemMetadata.size;
  }

  const numUnmeasuredItems = columnCount - lastMeasuredColumnIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedColumnWidth;

  return totalSizeOfMeasuredRows + totalSizeOfUnmeasuredItems;
};

const getItemMetadata = (
  itemType: ItemType,
  props: Props<any>,
  index: number,
  instanceProps: InstanceProps
): ItemMetadata => {
  let itemMetadataMap, itemSize, lastMeasuredIndex;
  if (itemType === 'column') {
    itemMetadataMap = instanceProps.columnMetadataMap;
    itemSize = props.columnWidth;
    lastMeasuredIndex = instanceProps.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = instanceProps.rowMetadataMap;
    itemSize = props.rowHeight;
    lastMeasuredIndex = instanceProps.lastMeasuredRowIndex;
  }

  if (index > lastMeasuredIndex) {
    let offset = 0;
    if (lastMeasuredIndex >= 0) {
      const itemMetadata = itemMetadataMap[lastMeasuredIndex];
      offset = itemMetadata.offset + itemMetadata.size;
    }

    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      let size = itemSize(i);

      itemMetadataMap[i] = {
        offset,
        size
      };

      offset += size;
    }

    if (itemType === 'column') {
      instanceProps.lastMeasuredColumnIndex = index;
    } else {
      instanceProps.lastMeasuredRowIndex = index;
    }
  }

  return itemMetadataMap[index];
};

const findNearestItem = (itemType: ItemType, props: Props<any>, instanceProps: InstanceProps, offset: number) => {
  let itemMetadataMap, lastMeasuredIndex;
  if (itemType === 'column') {
    itemMetadataMap = instanceProps.columnMetadataMap;
    lastMeasuredIndex = instanceProps.lastMeasuredColumnIndex;
  } else {
    itemMetadataMap = instanceProps.rowMetadataMap;
    lastMeasuredIndex = instanceProps.lastMeasuredRowIndex;
  }

  const lastMeasuredItemOffset = lastMeasuredIndex > 0 ? itemMetadataMap[lastMeasuredIndex].offset : 0;

  if (lastMeasuredItemOffset >= offset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    return findNearestItemBinarySearch(itemType, props, instanceProps, lastMeasuredIndex, 0, offset);
  } else {
    // If we haven't yet measured this high, fallback to an exponential search with an inner binary search.
    // The exponential search avoids pre-computing sizes for the full set of items as a binary search would.
    // The overall complexity for this approach is O(log n).
    return findNearestItemExponentialSearch(itemType, props, instanceProps, Math.max(0, lastMeasuredIndex), offset);
  }
};

const findNearestItemBinarySearch = (
  itemType: ItemType,
  props: Props<any>,
  instanceProps: InstanceProps,
  high: number,
  low: number,
  offset: number
): number => {
  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const currentOffset = getItemMetadata(itemType, props, middle, instanceProps).offset;

    if (currentOffset === offset) {
      return middle;
    } else if (currentOffset < offset) {
      low = middle + 1;
    } else if (currentOffset > offset) {
      high = middle - 1;
    }
  }

  if (low > 0) {
    return low - 1;
  } else {
    return 0;
  }
};

const findNearestItemExponentialSearch = (
  itemType: ItemType,
  props: Props<any>,
  instanceProps: InstanceProps,
  index: number,
  offset: number
): number => {
  const itemCount = itemType === 'column' ? props.columnCount : props.rowCount;
  let interval = 1;

  while (index < itemCount && getItemMetadata(itemType, props, index, instanceProps).offset < offset) {
    index += interval;
    interval *= 2;
  }

  return findNearestItemBinarySearch(
    itemType,
    props,
    instanceProps,
    Math.min(index, itemCount - 1),
    Math.floor(index / 2),
    offset
  );
};

const getOffsetForIndexAndAlignment = (
  itemType: ItemType,
  props: Props<any>,
  index: number,
  align: ScrollToAlign,
  scrollOffset: number,
  instanceProps: InstanceProps,
  scrollbarSize: number
): number => {
  const {
    itemData: { fixedColumns, aggregates = [] }
  } = props;
  const offset = itemType === 'column' ? (fixedColumns?.left?.width || 0) + (fixedColumns?.right?.width || 0) : 0;
  const size =
    itemType === 'column' ? props.width : props.height - (aggregates.length > 0 ? aggregates.length * 21 + 10 : 0);
  const itemMetadata = getItemMetadata(itemType, props, index, instanceProps);

  // Get estimated total size after ItemMetadata is computed,
  // To ensure it reflects actual measurements instead of just estimates.
  const estimatedTotalSize =
    itemType === 'column'
      ? getEstimatedTotalWidth(props, instanceProps) + offset
      : getEstimatedTotalHeight(props, instanceProps);

  const maxOffset = Math.max(0, Math.min(estimatedTotalSize - size, itemMetadata.offset));
  const minOffset = Math.max(0, itemMetadata.offset - size + offset + scrollbarSize + itemMetadata.size);

  if (align === 'smart') {
    if (scrollOffset >= minOffset - size && scrollOffset <= maxOffset + size) {
      align = 'auto';
    } else {
      align = 'center';
    }
  }

  switch (align) {
    case 'start':
      return maxOffset;
    case 'end':
      return minOffset;
    case 'center':
      return Math.round(minOffset + (maxOffset - minOffset) / 2);
    case 'auto':
    default:
      if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
        return scrollOffset;
      } else if (minOffset > maxOffset) {
        // Because we only take into account the scrollbar size when calculating minOffset
        // this value can be larger than maxOffset when at the end of the list
        return minOffset;
      } else if (scrollOffset < minOffset) {
        return minOffset;
      } else {
        return maxOffset;
      }
  }
};

/**
 * grid的行组件
 */
const Row = React.memo<any>(
  ({ delayLoading, isGroup, style, scrollingStyle, rowIndex, children }: any) => {
    const {
      table,
      table: { props },
      columns: { fixedColumns }
    } = useContext(TableContext);
    const [keyField, row] = [table.getKeyField(), table.getRow(rowIndex)];
    const keyValue = row[keyField];
    const checkedIndex = table.getCheckBoxDataIndex();
    const checked = row[checkedIndex];
    const highlight = useRef(false);
    highlight.current = table.getSelectedKeys(true).has(keyValue);
    const [, forceUpdate] = useState({});
    const delayClick = useRef<boolean>(false);
    table._setKeyMap(row);
    useEffect(() => {
      return table.subscribe(({ rowIndex: rIndex, incompatible }) => {
        const newHighlight = table.getSelectedKeys(true).has(keyValue);
        if (
          newHighlight !== highlight.current &&
          !table._setCheckedByRowSelection(rowIndex, newHighlight, incompatible)
        ) {
          forceUpdate({});
        }
      }, 'clickHighlight');
    }, [keyValue]);

    useEffect(() => {
      if (row.__update__) {
        delete row.__update__;
      }
    }, [row.__update__]);

    useEffect(() => {
      return () => {
        table._setKeyMap(row, true);
      };
    }, []);

    useMemo(() => {
      if (table.isMultipleInterval() && table.props.checkbox) {
        checked ? table._selectedKeys.add(keyValue) : table._selectedKeys.delete(keyValue);
        highlight.current = !!checked;
      }
    }, [checked, keyValue]);

    if (delayLoading) {
      return (
        <div style={style}>
          <div className="row-loading" style={scrollingStyle} />
        </div>
      );
    }
    const onRow = (props.onRow && !isGroup ? props.onRow(rowIndex, table, row) : {}) as any;
    const selectedCls = props.rowChecked && checked ? ' row-selected' : '';
    const highlightCls = highlight.current ? ` ${props.rowChecked ? 'row-active' : 'row-selected'}` : '';
    const { style: rowStyle, className: rowClassName, onClick, onSelect, rowRender, ...others } = onRow || {};
    const delay = async (ms = 300) => {
      await util.delay(ms); // 防止单击事件重复执行，延迟300ms
      delayClick.current = false;
    };
    const rowProps: any = {
      ...others,
      onMouseDown: (e) => {
        if (e.ctrlKey || e.shiftKey) {
          e.preventDefault(); // 阻止文本默认选中
        }
      },
      onClick: async (e) => {
        if (isGroup || delayClick.current) {
          return;
        }
        delayClick.current = true;
        const cell = util.closest(e.target, (el) => el.classList.contains('virtual-table-cell'));
        if (cell?.dataset?.key) {
          const result = await table.notify({ table, dataIndex: cell.dataset.key, row }, 'onCellClick');
          // 单元格事件取消行事件执行
          if (result.some((r) => r === false)) {
            return await delay(300); // 防止单击事件重复执行，延迟300ms
          }
        }
        const disableSelected = table.isRowSelectionDisabled(row);
        if (!disableSelected) {
          if ((await onSelect?.(e)) === false) {
            return await delay(300); // 防止单击事件重复执行，延迟300ms
          }
          if (props.rowChecked && props.checkbox && !checked) {
            table.setSelected(rowIndex, true);
          }
          if (props.rowSelected) {
            table.setHighlight(rowIndex, { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey });
            if (props.activeCellEditor === 'doubleClick' && table.state.selected.rowIndex !== rowIndex) {
              table.endEditing(true);
            }
          }
        }
        await onClick?.(e);
        return await delay(300); // 防止单击事件重复执行，延迟300ms
      },
      style: {
        ...rowStyle,
        ...style,
        cursor:
          (table.props.rowChecked || table.props.rowSelected) && !selectedCls && !highlightCls && !isGroup
            ? 'pointer'
            : ''
      },
      className: `${isGroup ? 'table-group-row' : 'table-row'} index-${rowIndex}${
        rowClassName ? ' ' + rowClassName : ''
      }${selectedCls}${highlightCls}`,
      children: rowRender ? (
        <>
          {rowRender({
            style: {
              top: 0,
              height: style.height,
              left: style.left + fixedColumns.left.width,
              zIndex: 1,
              position: 'absolute'
            }
          })}
          {children}
        </>
      ) : (
        children
      )
    };
    return <div {...rowProps} />;
  },
  (p, n) => {
    return n.delayLoading && !p.delayLoading;
  }
);

/**
 * 单元格是否编辑状态
 * @param itemData
 * @param rowIndex
 * @param columnIndex
 */
function isEditing(itemData, rowIndex, columnIndex) {
  const selected = itemData?.table.state.selected || { editing: false };
  if (columnIndex > -1) {
    return (
      selected.editing &&
      selected.rowIndex === rowIndex &&
      selected.dataIndex === itemData.columns[columnIndex].dataIndex
    );
  } else {
    return selected.editing && selected.rowIndex === rowIndex ? selected.rowIndex + ':' + selected.dataIndex : ':';
  }
}

/**
 * 单元格是否选中且非编辑状态
 * @param itemData
 * @param rowIndex
 * @param columnIndex
 */
function isActive(itemData, rowIndex, columnIndex) {
  const disabled = !!itemData?.table.props.disabled;
  if (disabled) return columnIndex > -1 ? false : ':';
  const selected = itemData?.table.state.selected || { editing: false };
  if (columnIndex > -1) {
    return (
      !selected.editing &&
      selected.rowIndex === rowIndex &&
      selected.dataIndex === itemData.columns[columnIndex].dataIndex
    );
  } else {
    return !selected.editing && selected.rowIndex === rowIndex ? selected.rowIndex + ':' + selected.dataIndex : ':';
  }
}

/**
 * 创建单元格节点
 * @param children
 * @param columnIndex
 * @param rowIndex
 * @param data
 * @param itemData
 * @param edit
 * @param others
 */
function createCellNode({ children, columnIndex, rowIndex, data, itemData, edit = false, ...others }) {
  return createElement(children, {
    data,
    columnIndex,
    rowIndex,
    table: itemData.table,
    key: `${rowIndex}:${itemData.columns[columnIndex]?.dataIndex || columnIndex}`,
    ...(edit
      ? {
          active: isActive(itemData, rowIndex, columnIndex),
          editing: isEditing(itemData, rowIndex, columnIndex)
        }
      : {}),
    ...others
  });
}

/**
 * 优化延迟加载方案
 * @param instance grid实例
 */
function optimize(instance) {
  const { itemData, useIsScrolling } = instance.props;
  const { isScrolling, scrollLeft, scrollTop } = instance.state;
  let delayLoading = useIsScrolling && isScrolling;
  if (!itemData.memoLastScroll) {
    itemData.memoLastScroll = { scrollLeft, scrollTop };
  }

  if (delayLoading) {
    if (itemData.memoLastScroll.scrollLeft !== scrollLeft && itemData.memoLastScroll.scrollTop === scrollTop) {
      delayLoading = false; // 水平滚动暂时不需要延迟加载
    } else {
      const abs = Math.abs(scrollTop - itemData.memoLastScroll.scrollTop);
      if (abs > 0 && abs < 760) {
        delayLoading = false; // 垂直滚动且滚动范围较小时不需要延迟加载
      }
    }
  }
  itemData.delayLoading = delayLoading;
  itemData.memoLastScroll = { scrollLeft, scrollTop };

  return delayLoading;
}

function getTotalWidth(instance) {
  const { itemData, width } = instance.props;
  const { scrollLeft } = instance.state;
  const addFixedColumn =
    itemData.fixedColumns &&
    (itemData.fixedColumns.left.columns.length > 0 || itemData.fixedColumns.right.columns.length > 0);
  let totalWidth = itemData.totalColumnWidth;
  if (addFixedColumn && itemData.table && itemData.table.containerRef?.current) {
    let containerClassName = itemData.table.containerRef.current.className.replace(
      /(\s*scroll-leave-left)|(\s*scroll-leave-right)/g,
      ''
    );

    if (width < totalWidth) {
      if (scrollLeft > 0) {
        containerClassName += ' scroll-leave-left';
      }
      if (scrollLeft < totalWidth - width) {
        containerClassName += ' scroll-leave-right';
      }
    }
    if (containerClassName !== itemData.table.containerRef.current.className) {
      itemData.table.containerRef.current.className = containerClassName;
    }
  }
  return totalWidth;
}

/**
 * 创建合计行
 * @param instance
 * @param fixedRight
 * @param rowIndex
 * @param columnStartIndex
 * @param columnStopIndex
 * @param ds 子数据源，分组小计用
 */
function createAggregateItems(instance, fixedRight, rowIndex, columnStartIndex, columnStopIndex, ds?) {
  const { children, itemData } = instance.props;
  const addFixedColumn =
    itemData.fixedColumns &&
    (itemData.fixedColumns.left.columns.length > 0 || itemData.fixedColumns.right.columns.length > 0);
  const aggregateItems: any = [];
  if (addFixedColumn) {
    aggregateItems.push(
      createCellNode({
        children,
        columnIndex: -1,
        fixedRight,
        rowIndex,
        cellType: CellTypeEnum.AggregateCell,
        itemData,
        data: itemData.dataSource,
        subDataSource: ds,
        style: {
          ...instance._getItemStyle(0, 0),
          top: 0
        }
      })
    );
  }
  for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
    aggregateItems.push(
      createCellNode({
        children,
        rowIndex,
        columnIndex,
        cellType: CellTypeEnum.AggregateCell,
        itemData,
        data: itemData,
        subDataSource: ds,
        style: {
          ...instance._getItemStyle(0, columnIndex),
          top: 0
        }
      })
    );
  }
  return aggregateItems;
}

const VariableSizeGrid: any = createGridComponent({
  getColumnOffset: (props: Props<any>, index: number, instanceProps: InstanceProps): number =>
    getItemMetadata('column', props, index, instanceProps).offset,

  getColumnStartIndexForOffset: (props: Props<any>, scrollLeft: number, instanceProps: InstanceProps): number =>
    findNearestItem('column', props, instanceProps, scrollLeft),

  getColumnStopIndexForStartIndex: (
    props: Props<any>,
    startIndex: number,
    scrollLeft: number,
    instanceProps: InstanceProps
  ): number => {
    const { columnCount, width } = props;

    const itemMetadata = getItemMetadata('column', props, startIndex, instanceProps);
    const maxOffset = scrollLeft + width;

    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = startIndex;

    while (stopIndex < columnCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += getItemMetadata('column', props, stopIndex, instanceProps).size;
    }

    return stopIndex;
  },

  getColumnWidth: (props: Props<any>, index: number, instanceProps: InstanceProps): number =>
    instanceProps.columnMetadataMap[index].size,

  getEstimatedTotalHeight,
  getEstimatedTotalWidth,

  getOffsetForColumnAndAlignment: (
    props: Props<any>,
    index: number,
    align: ScrollToAlign,
    scrollOffset: number,
    instanceProps: InstanceProps,
    scrollbarSize: number
  ): number => getOffsetForIndexAndAlignment('column', props, index, align, scrollOffset, instanceProps, scrollbarSize),

  getOffsetForRowAndAlignment: (
    props: Props<any>,
    index: number,
    align: ScrollToAlign,
    scrollOffset: number,
    instanceProps: InstanceProps,
    scrollbarSize: number
  ): number => getOffsetForIndexAndAlignment('row', props, index, align, scrollOffset, instanceProps, scrollbarSize),

  getRowOffset: (props: Props<any>, index: number, instanceProps: InstanceProps): number =>
    getItemMetadata('row', props, index, instanceProps).offset,

  getRowHeight: (props: Props<any>, index: number, instanceProps: InstanceProps): number =>
    instanceProps.rowMetadataMap[index].size,

  getRowStartIndexForOffset: (props: Props<any>, scrollTop: number, instanceProps: InstanceProps): number =>
    findNearestItem('row', props, instanceProps, scrollTop),

  getRowStopIndexForStartIndex: (
    props: Props<any>,
    startIndex: number,
    scrollTop: number,
    instanceProps: InstanceProps
  ): number => {
    const { rowCount, height } = props;

    const itemMetadata = getItemMetadata('row', props, startIndex, instanceProps);
    const maxOffset = scrollTop + height;

    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = startIndex;

    while (stopIndex < rowCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += getItemMetadata('row', props, stopIndex, instanceProps).size;
    }

    return stopIndex;
  },

  initInstanceProps(props: Props<any>, instance: any): InstanceProps {
    const { estimatedColumnWidth, estimatedRowHeight } = props as any;

    const instanceProps = {
      columnMetadataMap: {},
      estimatedColumnWidth: estimatedColumnWidth || DEFAULT_ESTIMATED_ITEM_SIZE,
      estimatedRowHeight: estimatedRowHeight || DEFAULT_ESTIMATED_ITEM_SIZE,
      lastMeasuredColumnIndex: -1,
      lastMeasuredRowIndex: -1,
      rowMetadataMap: {}
    };

    instance.resetAfterColumnIndex = (columnIndex: number, shouldForceUpdate: boolean = true) => {
      instance.resetAfterIndices({ columnIndex, shouldForceUpdate });
    };

    instance.resetAfterRowIndex = (rowIndex: number, shouldForceUpdate: boolean = true) => {
      instance.resetAfterIndices({ rowIndex, shouldForceUpdate });
    };

    instance.resetAfterIndices = ({
      columnIndex,
      rowIndex,
      shouldForceUpdate = true
    }: {
      columnIndex?: number;
      rowIndex?: number;
      shouldForceUpdate: boolean;
    }) => {
      if (typeof columnIndex === 'number') {
        instanceProps.lastMeasuredColumnIndex = Math.min(instanceProps.lastMeasuredColumnIndex, columnIndex - 1);
      }
      if (typeof rowIndex === 'number') {
        instanceProps.lastMeasuredRowIndex = Math.min(instanceProps.lastMeasuredRowIndex, rowIndex - 1);
      }

      // We could potentially optimize further by only evicting styles after this index,
      // But since styles are only cached while scrolling is in progress-
      // It seems an unnecessary optimization.
      // It's unlikely that resetAfterIndex() will be called while a user is scrolling.
      instance._getItemStyleCache(-1);

      if (shouldForceUpdate) {
        instance.forceUpdate();
      }
    };

    return instanceProps;
  },

  shouldResetStyleCacheOnItemSizeChange: false
});

VariableSizeGrid.prototype._getSortElement = function () {
  if (!this._sortElement) {
    this._sortElement = SortableElement(Row);
  }
  return this._sortElement;
};

VariableSizeGrid.prototype.render = function () {
  const {
    children,
    className,
    columnCount,
    direction,
    height,
    innerRef,
    innerElementType,
    innerTagName,
    itemData = {},
    outerElementType,
    outerTagName,
    style,
    width,
    minHeight,
    virtualScrolling
  } = this.props;
  const scrollerInfo = getScrollBarInfo();
  const { rowDrag } = itemData.table?.props || {};
  const addFixedColumn =
    itemData.fixedColumns &&
    (itemData.fixedColumns.left.columns.length > 0 || itemData.fixedColumns.right.columns.length > 0);
  const dataSource = itemData.dataSource || [];
  const hasData = dataSource.length > 0;
  const TableRow = rowDrag ? this._getSortElement() : Row;

  const delayLoading = optimize(this);

  const [columnStartIndex, columnStopIndex] = this._getHorizontalRangeToRender();
  let [rowStartIndex, rowStopIndex] = this._getVerticalRangeToRender();

  this._rangeToRender = {
    rowIndex: [rowStartIndex, rowStopIndex],
    columnIndex: [columnStartIndex, columnStopIndex]
  };

  let totalHeight = getEstimatedTotalHeight(this.props, this._instanceProps);
  const totalWidth = getTotalWidth(this);
  const keyField = itemData.table.getKeyField();

  // 合计行相关信息
  const aggregates = itemData.aggregates || [];
  let aggregateItems: any = [];
  const aggregateHeight =
    itemData.table.props.aggregatePosition !== 'start' && aggregates.length > 0
      ? Math.max(32, aggregates.length * 21 + itemData.table._getCellPadding())
      : 0;

  const items: any = [];

  const horizontal = totalWidth > width;
  const vertical = totalHeight + aggregateHeight > Math.max(minHeight, height - (horizontal ? scrollerInfo.height : 0));
  itemData.scrollbar = { horizontal, vertical };

  const lastRowInfo: any = {};
  const loading = itemData?.table?.state?.loading;
  if (columnCount > 0 && hasData) {
    const scrollWidth = vertical ? scrollerInfo.width : 0;
    const fixedRight = width - itemData.fixedColumns.right.width - scrollWidth;
    for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
      const rowItems: any = [];
      const cellStyle = this._getItemStyle(rowIndex, 0);
      const row = dataSource[rowIndex] || {};
      // 增加展开行
      if (row.cellType === CellTypeEnum.ExpandRowCell) {
        items.push(
          createElement('div', {
            key: `expand_${row.groupIndex}`,
            children:
              cellStyle.height > 0
                ? createCellNode({
                    children,
                    rowIndex: row.groupIndex,
                    columnIndex: -2,
                    contentWidth: width - scrollWidth,
                    cellType: CellTypeEnum.ExpandRowCell,
                    itemData,
                    data: row.parent
                  })
                : null,
            className: `expand-row`,
            style: {
              position: 'absolute',
              left: 0,
              width: totalWidth,
              height: cellStyle.height,
              top: cellStyle.top
            }
          })
        );
      }
      // 增加分组小计或合计行
      else if (row.cellType === CellTypeEnum.AggregateCell) {
        items.push(
          createElement('div', {
            key: `ag_${row.groupIndex}`,
            children: createAggregateItems(
              this,
              fixedRight,
              `ag_${row.groupIndex}`,
              columnStartIndex,
              columnStopIndex,
              row.parent?.children
            ),
            className: `aggregates-row ag-cell`,
            style: {
              position: 'absolute',
              left: 0,
              width: totalWidth,
              height: cellStyle.height,
              top: cellStyle.top
            }
          })
        );
      } else {
        if (!delayLoading) {
          // 增加固定列
          addFixedColumn &&
            rowItems.push(
              createCellNode({
                children,
                rowIndex,
                edit: true,
                cellType: CellTypeEnum.FixedBodyCell,
                fixedRight,
                itemData,
                data: itemData.dataSource[rowIndex],
                columnIndex: -1,
                style: { ...cellStyle, top: 0 }
              })
            );
          if (row[IS_GROUP]) {
            // 分组行
            rowItems.push(
              createCellNode({
                children,
                rowIndex,
                cellType: CellTypeEnum.GroupRowCell,
                data: itemData.dataSource[rowIndex],
                itemData,
                columnIndex: 0,
                style: {
                  ...cellStyle,
                  left: 0,
                  position: 'sticky',
                  top: 0,
                  width: 'auto'
                }
              })
            );
          } else {
            for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
              const dataIndex = itemData.columns[columnIndex].dataIndex;
              let offset = 0;
              if (
                itemData.columns &&
                itemData.columns[columnIndex].mergeCell &&
                !itemData.columns[columnIndex].editor
              ) {
                const cellValue = row[dataIndex];
                let _info = lastRowInfo[columnIndex] || [rowIndex, cellValue, 0];
                if (_info[1] === cellValue && cellValue !== undefined) {
                  if (rowIndex < rowStopIndex && _info[1] === dataSource[rowIndex + 1][dataIndex]) {
                    _info[2] += cellStyle.height;
                    offset = -1; // 跳过渲染
                  } else {
                    offset = _info[2];
                    _info = null;
                  }
                }
                lastRowInfo[columnIndex] = _info;
              }
              if (offset > -1) {
                rowItems.push(
                  createCellNode({
                    children,
                    rowIndex,
                    columnIndex,
                    edit: offset <= 0,
                    cellType: offset > 0 ? CellTypeEnum.MergeCell : CellTypeEnum.BodyCell,
                    itemData,
                    data: itemData.dataSource[rowIndex],
                    style: {
                      ...this._getItemStyle(rowIndex, columnIndex),
                      top: 0 - offset,
                      height: cellStyle.height + offset
                    }
                  })
                );
              }
            }
          }
        }
        const rowData = itemData.dataSource[rowIndex];
        if (rowData[keyField] === undefined) {
          rowData[keyField] = util.uniqueId(rowIndex);
        }
        items.push(
          <TableRow
            index={rowIndex}
            key={rowData[keyField]}
            rowIndex={rowIndex}
            width={totalWidth}
            delayLoading={delayLoading}
            isGroup={row[IS_GROUP]}
            scrollingStyle={{
              width: totalWidth,
              height: cellStyle.height
            }}
            style={{
              position: 'absolute',
              left: 0,
              // right: 0,
              width: totalWidth,
              height: cellStyle.height,
              top: cellStyle.top
            }}
          >
            {rowItems}
          </TableRow>
        );
      }
    }

    if (aggregateHeight > 0) {
      // 需要汇总，则在最后一行增加汇总行
      aggregateItems = createAggregateItems(this, fixedRight, `ag`, columnStartIndex, columnStopIndex);
    }
  } else {
    this.resetAfterRowIndex(0, false);
  }

  const bodyElement: any = createElement(innerElementType || innerTagName || 'div', {
    children: items,
    ref: innerRef,
    style: {
      height: totalHeight,
      // pointerEvents: isScrolling ? 'none' : undefined,
      width: totalWidth
    }
  });
  const emptyData = (items.length === 0 || !hasData) && loading === false;

  let addRow;
  const opt = itemData.table.props.showRowNumber?.editOptions;
  if (emptyData && opt) {
    const disableAdd = util.isFunction(opt.disabled)
      ? opt.disabled({ table: itemData.table, rowIndex: -1 })
      : opt.disabled;
    const needAdd = !(disableAdd === true || disableAdd?.includes?.('add'));
    if (needAdd) {
      addRow = async () => {
        if (opt.add) {
          await opt.add({ table: itemData.table, rowIndex: -1 });
        } else {
          await itemData.table.addRows({});
        }
      };
    }
  }

  return createElement(
    outerElementType || outerTagName || 'div',
    {
      className,
      onScroll: this._onScroll,
      ref: this._outerRefSetter,
      style: {
        position: 'relative',
        width,
        height: virtualScrolling ? height : '100%',
        WebkitOverflowScrolling: 'touch',
        direction,
        ...style,
        minHeight
      }
    },
    bodyElement,
    createElement('div', {
      children:
        items.length === 0 && hasData && loading === false ? null : emptyData ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                暂无数据{addRow && <br />}
                {addRow && (
                  <Button type="primary" onClick={addRow} style={{ marginTop: 8 }}>
                    立即新增
                  </Button>
                )}
              </span>
            }
          />
        ) : (
          aggregateItems
        ),
      className: emptyData ? 'empty-row' : aggregateItems.length > 0 ? 'aggregates-row' : '',
      style:
        aggregateItems.length > 0
          ? {
              position: 'sticky',
              height: aggregateHeight,
              width: totalWidth,
              zIndex: dataSource.length * 2 + 2
            }
          : { position: 'sticky', left: 0 }
    })
  );
};

export default VariableSizeGrid;
