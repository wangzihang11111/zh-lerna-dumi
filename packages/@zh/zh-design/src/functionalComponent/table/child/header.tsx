import {
  EditOutlined,
  HolderOutlined,
  MoreOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined
} from '@ant-design/icons';
import { Checkbox, Dropdown, Space } from 'antd';
import React, { CSSProperties, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Resizable } from 'react-resizable';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Menu } from '../../antd/menu';
import { Tooltip } from '../../antd/tooltip';
import { TableContext } from '../base/common';
import { TableInstance } from '../interface';
import {
  convertStyle,
  cssVar,
  domContains,
  getScrollBarInfo,
  useDraggableSort,
  useRefCallback,
  useReturnCallback,
  useZhEffect,
  util
} from '../util';
import { FilterIcon } from './filter';
import { OrderIcon } from './order';

/**
 * 拖拽调整列宽
 * @param propColumnIndex
 * @param resizable
 * @param width
 * @param restProps
 * @constructor
 */
const HeaderCellResize = ({ column: { propColumnIndex, resizable, width }, ...restProps }) => {
  const { table } = useContext(TableContext);
  const [offset, setOffset] = useState({ width, x: 0, h: '100%', isResizing: false });
  const resizeRef = useRef<any>();
  const tmpRef = useRef<any>();

  useEffect(() => {
    if (!offset.isResizing && offset.width !== width) {
      setOffset((prevState) => ({ ...prevState, width, x: 0 }));
    }
  });

  if (resizable) {
    const onResizeStart = () => {
      if (!tmpRef.current) {
        tmpRef.current = util.closest(resizeRef.current, (el) => el.classList.contains('virtual-table'));
      }
      tmpRef.current.style.pointerEvents = 'none';
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      resizeRef.current.parentElement.classList.add('is-resizing');
    };

    const onResize = (_e: any, { size }: any) => {
      if (size.width !== offset.width) {
        setOffset({
          width: size.width,
          x: size.width - width,
          h: table.state.height,
          isResizing: true
        });
      }
    };

    const onResizeStop = (_e, { size }) => {
      tmpRef.current && (tmpRef.current.style.pointerEvents = 'auto');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      resizeRef.current.parentElement.classList.remove('is-resizing');
      setOffset((prev) => ({ ...prev, x: 0, h: '100%', isResizing: false }));
      if (size.width !== width) {
        table.refreshView({
          state: () => {
            const { columns } = table.state;
            columns[propColumnIndex].offsetWidth = size.width;
            return { columns: [...columns] };
          },
          rowColumnIndex: { columnIndex: 0 },
          cacheState: true
        });
      }
    };

    return (
      <Resizable
        width={offset.width}
        height={0}
        handle={(_, ref) => {
          const setRef = (nodeCurrent) => {
            ref.current = nodeCurrent;
            resizeRef.current = nodeCurrent;
          };
          return (
            <span
              className={`stop-propagation resizable-handle${offset.isResizing ? ' is-resizing' : ''}`}
              ref={setRef}
              style={{ transform: `translateX(${offset.x}px)`, height: offset.h }}
            />
          );
        }}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeStop={onResizeStop}
        draggableOpts={{ enableUserSelectHack: false }}
      >
        <div {...restProps} />
      </Resizable>
    );
  } else {
    return <div {...restProps} />;
  }
};

/**
 * 编辑列头标记
 * @param editor
 * @param dataIndex
 * @constructor
 */
const EditFlag = ({ editor, dataIndex }) => {
  const { table } = useContext(TableContext);
  if (!editor || !table.props.editColumnIcon) {
    return null;
  }
  const { required } = editor;
  const style: CSSProperties = { marginRight: 2, fontWeight: 'normal', opacity: 0.5, transform: 'scale(0.7)' };
  if (required) {
    style.color = 'var(--primary-color)';
  }
  if (util.isFunction(table.props.editColumnIcon)) {
    return table.props.editColumnIcon({ table, dataIndex, editor, style });
  }
  return <EditOutlined style={style} />;
};

const HeaderCell = ({ column, cellStyle }) => {
  const { table } = useContext(TableContext);
  const { title, width, dataIndex, columnIndex, headerStyle, columnSort, sortable, header, filter, originEditor } =
    column;
  const style: CSSProperties = { ...cellStyle, width, ...convertStyle(headerStyle) };

  if (column.groupIn?.length && !title && !header) {
    return <div style={{ ...style, height: 0 }} />;
  }
  const headerCellClick = useRefCallback((e) => {
    table.notify({ e, column }, 'onHeaderCellClick');
  });
  sortable && (style.cursor = 'pointer');
  const renderIcon = (cStyle) => (
    <span className="stop-propagation" style={cStyle}>
      {sortable && <OrderIcon column={column} />}
      {filter && <FilterIcon column={column} table={table as TableInstance} />}
    </span>
  );
  const titleInfo = util.isFunction(header) ? header({ title, dataIndex, column, table }) : header || title;
  const info = util.isString(titleInfo) ? <span className="nowrap">{titleInfo}</span> : titleInfo;
  return (
    <HeaderCellResize
      index={columnIndex}
      column={column}
      onClick={headerCellClick}
      className={util.classNames('header-cell', `${columnSort ? 'react-sortable' : ''}`)}
      key={columnIndex}
      style={style}
    >
      {style.textAlign === 'right' && renderIcon({ marginRight: 4, display: 'inline-block' })}
      <EditFlag editor={originEditor} dataIndex={dataIndex} />
      {table.props.headerTooltip ? (
        <Tooltip title={info} overflow>
          {info}
        </Tooltip>
      ) : (
        info
      )}
      {style.textAlign !== 'right' && renderIcon({ marginLeft: 4, position: 'absolute', display: 'flex', right: 8 })}
    </HeaderCellResize>
  );
};

const FixedHeader = ({ type, children }: any) => {
  const {
    table: { groupColumns, cellStyle },
    columns: { headerLineHeight, unUsedWidth }
  } = useContext(TableContext);

  const columns = groupColumns[type];

  if (columns.length === 0) {
    return children ? (
      <div
        style={{
          display: 'inline-flex',
          position: 'absolute',
          right: 0,
          zIndex: -1,
          top: 0,
          bottom: 0
        }}
      >
        {children}
      </div>
    ) : (
      <span />
    );
  }
  const style = type === 'left' ? { left: 0, zIndex: 1 } : { right: 0, zIndex: 2, marginRight: unUsedWidth };
  return (
    <div className={`fc fixed-cell-${type}`} style={style}>
      {getGroupContainer(columns, headerLineHeight, cellStyle)}
      {children}
    </div>
  );
};

function getGroupContainer(groupColumns, headerLineHeight, cellStyle, SortCell?) {
  return groupColumns.map((groupColumn, groupIndex) => {
    if (groupColumn.children) {
      return (
        <div
          key={groupIndex}
          style={{
            height: '100%',
            display: 'inline-flex',
            flexDirection: 'column'
          }}
        >
          <div
            className="column-group"
            style={{
              height: headerLineHeight,
              width: '100%',
              fontSize: 14,
              justifyContent: 'center'
            }}
          >
            <div
              className="nowrap"
              style={{
                width: 0,
                minWidth: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                paddingRight: 1,
                display: 'flex'
              }}
            >
              {util.isFunction(groupColumn.groupTitle)
                ? groupColumn.groupTitle({ column: groupColumn })
                : groupColumn.groupTitle}
            </div>
          </div>
          <div style={{ flex: 1, display: 'inline-flex' }}>
            {getGroupContainer(groupColumn.children, headerLineHeight, cellStyle, null)}
          </div>
        </div>
      );
    } else {
      const ColumnCell = groupColumn.columnSort ? SortCell ?? HeaderCell : HeaderCell;
      return (
        <ColumnCell
          key={(groupColumn.dataIndex || '-') + groupIndex}
          index={groupColumn.propColumnIndex}
          disabled={!groupColumn.columnSort}
          cellStyle={cellStyle}
          column={groupColumn}
        />
      );
    }
  });
}

function getSortEnd(table) {
  return ({ oldIndex, newIndex }) => {
    if (oldIndex !== newIndex) {
      table.refreshView({
        state: () => {
          const { columns } = table.state;
          const item = columns.splice(oldIndex, 1)[0];
          columns.splice(newIndex, 0, item);
          return { columns: [...columns] };
        },
        rowColumnIndex: { columnIndex: 0 },
        cacheState: true
      });
    }
  };
}

/**
 * 拖拽表头进行列排序
 * @constructor
 */
const SortableHeaderContainer = () => {
  const {
    table,
    columns: {
      fixedColumns: { left, right },
      columnSort,
      groupable,
      headerLineHeight
    }
  } = useContext(TableContext);
  const {
    outRef: { current: gridIns },
    groupColumns,
    props: { bordered }
  } = table;

  const headStyle: CSSProperties = {
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    height: '100%',
    paddingLeft: left.width,
    paddingRight: right.width,
    transform: `translateX(-${gridIns?.state?.scrollLeft || 0}px)`
  };
  const zwLeft = !groupable && !bordered && left.width > 0;
  const zwStyle: CSSProperties = { padding: 0, width: 0, left: 1, zIndex: 2 };
  const { SortContainer, SortElement: SortCell } = useDraggableSort(columnSort, HeaderCell);
  if (SortContainer) {
    const shouldCancelStart = (e) => domContains('stop-propagation', e.target);
    return (
      <SortContainer
        axis="x"
        lockAxis="xy"
        pressDelay={250}
        shouldCancelStart={shouldCancelStart}
        onSortEnd={getSortEnd(table)}
      >
        <span style={headStyle} className="normal-cells">
          {zwLeft && <div className="header-cell" style={zwStyle} />}
          {getGroupContainer(groupColumns.normal, headerLineHeight, table.cellStyle, SortCell)}
          {right.width > 0 && <div className="header-cell" hidden />}
        </span>
      </SortContainer>
    );
  } else {
    return (
      <span style={headStyle} className="normal-cells">
        {zwLeft && <div className="header-cell" style={zwStyle} />}
        {getGroupContainer(groupColumns.normal, headerLineHeight, table.cellStyle)}
        {right.width > 0 && <div className="header-cell" hidden />}
      </span>
    );
  }
};

const HeaderMenu = ({ showHeaderMenu }) => {
  const {
    table,
    columns: { headerLineHeight }
  } = useContext(TableContext);
  const [visible, setVisible] = useState(false);
  const [change, setChange] = useState<any>([]);

  const onChange = useRefCallback((column, columnIndex, e) => {
    const index = change.indexOf(columnIndex);
    column.hidden = !e.target.checked;
    if (index > -1) {
      change.splice(index, 1);
    } else {
      change.push(columnIndex);
    }
    setChange([...change]);
  });

  useZhEffect(() => {
    if (change.length > 0) {
      table.refreshView({
        state: { columns: [...table.state.columns] },
        rowColumnIndex: { columnIndex: 0 },
        cacheState: true
      });
      setChange([]);
    }
  }, [change]);

  const onVisibleChange = (flag) => {
    setVisible(flag);
    flag && setChange([]);
  };

  const items = useMemo(() => {
    const columnItems = table.state.columns.filter((c) => !c.propHidden);
    const DraggableHandle: any = SortableHandle(({ disabled }) => (
      <HolderOutlined
        style={{
          fontSize: 14,
          opacity: disabled ? 0.1 : 0.4,
          cursor: disabled ? '' : 'grab',
          marginRight: 7,
          padding: '3px 3px 3px 0'
        }}
      />
    ));
    const DraggableItem: any = SortableElement(({ children, column }) => {
      const setFixed = (fixed) => () => {
        column.fixed = fixed;
        table.refreshView({
          state: { columns: [...columnItems] },
          rowColumnIndex: { columnIndex: 0 },
          cacheState: true
        });
      };
      return (
        <div
          className="column-setting-item"
          style={{ padding: '5px 12px', display: 'flex', userSelect: 'none', minWidth: 120 }}
        >
          <DraggableHandle disabled={column.hidden} />
          <div style={{ flex: 1 }}>{children}</div>
          <span
            className="column-fixed-icon"
            style={{
              color: cssVar.primaryColor,
              fontSize: 14,
              gap: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'right',
              width: 35
            }}
          >
            {(!column.fixed || column.fixed === 'right') && (
              <Tooltip title="固定在左侧">
                <VerticalAlignTopOutlined onClick={setFixed('left')} />
              </Tooltip>
            )}
            {column.fixed && (
              <Tooltip title="取消固定">
                <VerticalAlignMiddleOutlined onClick={setFixed(false)} />
              </Tooltip>
            )}
            {column.fixed !== 'right' && (
              <Tooltip title="固定在右侧">
                <VerticalAlignBottomOutlined onClick={setFixed('right')} />
              </Tooltip>
            )}
          </span>
        </div>
      );
    });
    const tmp: any[] = [[], [], [], []];
    const [left, center, right, _items] = tmp;
    columnItems.forEach((column) => {
      const { header, title, dataIndex, propColumnIndex, hidden, fixed, editor = {} } = column;
      const collection = fixed ? (fixed === 'right' ? 2 : 0) : 1;
      const headTxt = util.isFunction(header)
        ? header({
            title,
            dataIndex,
            column,
            table
          })
        : header || title || dataIndex;
      const item = {
        key: `${dataIndex}_${propColumnIndex}`,
        label: (
          <DraggableItem index={propColumnIndex} collection={collection} disabled={hidden} column={column}>
            <Checkbox
              onChange={(e) => onChange(column, propColumnIndex, e)}
              disabled={editor?.required}
              style={{ whiteSpace: 'nowrap' }}
              defaultChecked={!hidden}
            >
              {headTxt}
            </Checkbox>
          </DraggableItem>
        )
      };
      if (collection === 0) {
        left.push(item);
      } else if (collection === 1) {
        center.push(item);
      } else {
        right.push(item);
      }
    });
    left.length > 0 && _items.push({ label: '固定在左侧', key: 'left', type: 'group', children: left });
    center.length > 0 && _items.push({ label: '不固定', key: 'center', type: 'group', children: center });
    right.length > 0 && _items.push({ label: '固定在右侧', key: 'right', type: 'group', children: right });
    return [
      {
        label: (
          <Space.Compact
            block
            style={{
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff',
              cursor: 'default',
              padding: '5px 12px'
            }}
          >
            列设置
            <a
              onClick={() => {
                util.setCache(table.stateId, undefined);
                table.refreshView({
                  rowColumnIndex: { columnIndex: 0 },
                  cacheState: false,
                  state: {
                    columns: table._initColumns()
                  }
                });
              }}
            >
              重置
            </a>
          </Space.Compact>
        ),
        key: 'op'
      },
      {
        type: 'divider'
      },
      ..._items
    ];
  }, [showHeaderMenu, table.state.columns]);
  const dropdownRender = useReturnCallback(() => {
    const DraggableContainer: any = SortableContainer(() => <Menu className="advanced-drop-menu" items={items} />);
    return <DraggableContainer useDragHandle onSortEnd={getSortEnd(table)} helperClass="row-dragging menu-checkbox" />;
  }, [items]);

  const rendererElement = (createPortal = false) => {
    if (util.isFunction(showHeaderMenu)) {
      return showHeaderMenu({ table });
    }
    return (
      <Dropdown
        className={util.classNames({ advanced: !createPortal })}
        placement="bottomRight"
        overlayStyle={{ marginRight: 1 }}
        dropdownRender={dropdownRender}
        trigger={['click']}
        open={visible}
        onOpenChange={onVisibleChange}
      >
        {showHeaderMenu.icon || <MoreOutlined style={{ height: headerLineHeight - 1 }} />}
      </Dropdown>
    );
  };

  if (showHeaderMenu.inTableAlert) {
    if (!table.settingContainer) {
      table.settingContainer = document.createElement('div');
      table.settingContainer.style.display = 'flex';
    }
    return ReactDOM.createPortal(rendererElement(true), table.settingContainer);
  }

  if (showHeaderMenu.getContainer) {
    const container = util.isFunction(showHeaderMenu.getContainer)
      ? showHeaderMenu.getContainer()
      : document.getElementById(showHeaderMenu.getContainer);

    if (container) {
      return ReactDOM.createPortal(rendererElement(true), container);
    }
  }
  return rendererElement();
};

const TableHeader = React.memo<any>(() => {
  const {
    table,
    columns: { groupable }
  } = useContext(TableContext);
  const headerHeight = table.headerHeight;
  const { hiddenHeader = false, headerMenu = true } = table.props;
  const headContainerStyle: CSSProperties = { height: headerHeight };
  const [scrollBarWidth] = useState(getScrollBarInfo().width);

  const showHeaderMenu = table.state.columns.length > 0 ? headerMenu : false;

  if (hiddenHeader || headerHeight <= 1) {
    return null;
  }
  return (
    <div
      ref={table.headerRef}
      className={`virtual-table-header${groupable ? ' header-group' : ''}`}
      style={headContainerStyle}
    >
      <FixedHeader type="left" />
      <SortableHeaderContainer />
      <FixedHeader type="right">
        <span className="scrollbar-placeholder" style={{ width: scrollBarWidth, display: 'none' }} />
      </FixedHeader>
      {showHeaderMenu && <HeaderMenu showHeaderMenu={showHeaderMenu} />}
    </div>
  );
});

export { TableHeader };
