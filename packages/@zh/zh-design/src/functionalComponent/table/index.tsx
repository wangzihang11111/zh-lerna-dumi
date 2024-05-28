import { MinusCircleFilled, PlusCircleFilled } from '@ant-design/icons';
import { Spin } from 'antd';
import React, { CSSProperties, useEffect, useLayoutEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { AutoResize } from '../../widgets';
import { message } from '../antd/message';
import {
  CellTypeEnum,
  DsContext,
  IS_EXPANDED,
  IS_GROUP,
  TableContext,
  TableSelectionModel,
  UpdateFlagEnum
} from './base/common';
import { TableAlert } from './child/alert';
import { TableBody } from './child/body';
import { AllCheckBox, loopChildren, RowCheckBox } from './child/check';
import { ExpandIcon } from './child/expand';
import { TableHeader } from './child/header';
import { TablePagination } from './child/pagination';
import { EditorFactory } from './editor/factory';
import './index.less';
import type { ColumnProps, IRefreshParams, TableInstance, TablePropsType } from './interface';
import {
  clientColumnFilter,
  compHoc,
  convertStyle,
  dataSortOrder,
  displayText,
  getColumnHeader,
  getGlobalConfig,
  getRender,
  getScrollBarInfo,
  IObject,
  Observer,
  syncDefaultProps,
  ZhComponent,
  useAsyncEffect,
  util
} from './util';

const TREE_LEVEL = Symbol('__treeLevel');
const TREE_INDEX = Symbol('__treeIndex');
const TREE_LAST_CHILD = Symbol('__treeLastChild');
const TREE_LEAF_NODE = Symbol('__treeLeafNode');
const TREE_PARENT = Symbol('__treeParent');
const GROUP_PARENT = Symbol('__groupParent');
const DEFAULT_CHECKED = Symbol('__defaultChecked');
const ROW_KEY_FIELD = Symbol('__id');

export const TableSymbol = { TREE_LEVEL, TREE_INDEX, TREE_LAST_CHILD, TREE_PARENT, GROUP_PARENT, TREE_LEAF_NODE };

export { TableSelectionModel };
export type { ColumnProps, TableInstance };

function updateTreeSymbol({ parentNode, node, index, level, isLeaf }) {
  node[TREE_LEVEL] = level;
  node[TREE_INDEX] = index;
  node[TREE_PARENT] = parentNode;
  node[TREE_LEAF_NODE] = isLeaf;
}

const TableGrid = React.memo<{ columns: any; table: any; state: any; props: any }>(
  ({ table, columns }) => {
    const providerValue = useMemo(() => {
      return { table, columns };
    }, [columns]);

    useEffect(() => {
      const rows = table.store.data;
      // 很关键，回填业务dataSource
      if (table.props.dataSource && table.props.dataSource !== rows) {
        table.props.dataSource.splice(0, table.props.dataSource.length, ...rows);
      }
      if (table.dsUpdateCallback) {
        table.dsUpdateCallback(table);
        table.dsUpdateCallback = undefined;
      }

      if (!table.state.dataSource?.length) {
        table._lastHighlightRow = -1;
        table._updateSubTable(null).then();
      }
      if (table.lastUpdateFlag !== UpdateFlagEnum.ColumnChecked) {
        table.notify({ updateRow: rows, table: this }, 'onUpdateRows');
      }
    }, [table.state.dataSource]);

    if (table.state.width > 0) {
      return (
        <TableContext.Provider value={providerValue}>
          <DsContext.Provider value={table.state.dataSource}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 1
              }}
            >
              {table.alertObj.container &&
                ReactDOM.createPortal(<TableAlert key="alert" table={table} />, table.alertObj.container)}
              <TableHeader key="header" />
              <div key="content" style={{ flex: 1, zIndex: 1, overflow: 'hidden' }}>
                <TableBody />
              </div>
              {table.props.pagination && <TablePagination key="footer" table={table} />}
            </div>
          </DsContext.Provider>
        </TableContext.Provider>
      );
    }
    return <div style={{ height: '100%' }} />;
  },
  (p, n) => {
    if (n.table.updateFlag !== UpdateFlagEnum.None) {
      return false;
    }
    return (
      util.isPropsEqual(p, n, { shallow: true, exclude: ['table', 'props', 'state'] }) &&
      util.isPropsEqual(p.state, n.state, {
        shallow: true,
        exclude: ['loading', 'columns', 'props', 'changedFields']
      }) &&
      util.isPropsEqual(p.props, n.props, {
        shallow: true,
        exclude: [
          'optimize',
          'expandCfg',
          'cache',
          'pagination',
          'request',
          'onDataLoad',
          'response',
          'loading',
          'onRow',
          'rowFilter',
          'rowContextMenu',
          'bodyContextMenu',
          'expandRow',
          'onCheckedChange',
          'rowSelection'
        ]
      })
    );
  }
);

// 默认属性
const defaultProps = {
  /**
   * @description       紧凑表格
   * @default           false
   */
  compact: false,
  /**
   * @description       表格延迟resize的毫秒数
   * @default           16
   */
  resizeDelay: 16,
  /**
   * @description       是否加载中
   * @default           false
   */
  loading: false,
  /**
   * @description       配置request属性，是否自动加载数据
   * @default           true
   */
  autoLoad: true,
  /**
   * @description       是否树形列表
   * @default           false
   */
  isTree: false,
  /**
   * @description       是否显示单元格边框
   * @default           false
   */
  bordered: false,
  /**
   * @description       是否隐藏表头
   * @default           false
   */
  hiddenHeader: false,
  /**
   * @description       是否支持单击行选中checkbox
   * @default           false
   */
  rowChecked: false,
  /**
   * @description       点击数据行高亮选中行
   * @default           true
   */
  rowSelected: true,
  /**
   * @description       点击checkbox列高亮选中行
   * @default           false
   */
  checkboxSelected: false,
  /**
   * @description       是否启用虚拟滚动，建议开启；如果需要高度随内容自动撑开，设置false
   * @default           true
   */
  virtualScrolling: true,
  /**
   * @description       编辑状态，是否支持最后一行按"下方向键"及最后一列按"回车"或"tab"自动增加行
   * @default           false
   */
  keyBoardToAddRow: false,
  /**
   * @description       编辑状态，键盘事件的是否绑定在document上，注意多个Grid会产生冲突
   * @default           false
   */
  listenerOnDocument: false,
  /**
   * @description       是否开启记忆列状态功能
   * @default           true
   */
  remember: true,
  /**
   * @description       行高使用估算模式，因为采用字符串长度计算模式，行高可能因为特殊字符或字体原因有误差，但是性能更优，rowHeight=auto有效
   * @default           true
   */
  estimateRowHeight: true
};

export type TableProps = TablePropsType<typeof defaultProps>;

class TableClass extends ZhComponent<TableProps> {
  // 设置默认属性
  static defaultProps = defaultProps;

  private readonly _observer: Observer;
  private readonly uniqueId: string;
  private readonly stateId: string;
  private cacheColumns: any;
  private readonly store: {
    raw: Promise<object[]>;
    data: object[];
    aggregateData: object[];
  };
  private groupByColumn: ColumnProps | undefined;
  containerRef = React.createRef<any>();
  headerRef = React.createRef<any>();
  bodyRef = React.createRef<any>();
  alertObj: TableInstance['alertObj'] = { container: null };
  showEditor = ['checkbox', 'switch', 'radiogroup', 'checkboxgroup'];
  headerHeight = 0;
  groupColumns: any = { left: [], normal: [], right: [] };
  private groupDs: any = [];
  private unmount: boolean = false;
  private _lastHighlightRow: number = -1;
  private lastHighlightKey?: string = undefined;
  private _lastProps: any;
  private updateFlag: UpdateFlagEnum = UpdateFlagEnum.None;
  private lastUpdateFlag: UpdateFlagEnum = UpdateFlagEnum.None;
  private currentUpdateRow: any = null;
  private _activeEditor: any;
  private _copyRow: any;
  private rootEl: HTMLElement | null | undefined;
  private _requestPaginationData: any; // 缓存前端分页的请求数据
  private _isPagination: boolean = false; // 分页操作
  private _lockEdit: boolean = false; // 锁定编辑状态，防止自动取消编辑
  private cellStyle: CSSProperties = {}; // 单元格公共样式
  private expandColumn: any = null;
  private dataIndexMap: any = {};
  private expandLevel: number = 0;
  private rawData: any = [];
  private _expandedKeys: Set<any> = new Set(); // 展开行的key值
  private _selectedKeys: Set<any> = new Set();
  private _keyMap = new Map();
  private parentInfo: { data: any; key: string } | undefined = undefined;
  private _lastParentRow: any = null; // 缓存上一次更新子表的数据行
  private dsUpdateCallback: ((...args) => void) | undefined;
  private _rowFilter: undefined | ((row: IObject) => boolean);
  private _renderDataSource: IObject[] | undefined;

  setReadOnly(readOnly: boolean | Function = true) {
    this._compIns?.setProps({ readOnly });
  }

  getObj() {
    return this.alertObj;
  }

  getTableSymbol() {
    return TableSymbol;
  }

  _isCacheKey(key) {
    const cache = this.props.cache;
    return util.isArray(cache) && cache.includes(key);
  }

  private _setKeyMap(row, del = false) {
    const key = row[this.getKeyField()];
    if (del) {
      this._keyMap.delete(key);
      this._selectedKeys.delete(key);
    } else {
      this._keyMap.set(key, row);
    }
  }

  private _setExpandedKeys(row, index) {
    const { groupBy, keyField } = this.props;
    if (!keyField) {
      return;
    }
    let keyV = groupBy ? row[groupBy] : row[keyField];
    const expanded = row[this.getExpandField()];
    if (expanded && keyV === undefined && !groupBy) {
      keyV = util.uniqueId(index);
      row[keyField] = keyV;
    }
    if (expanded) {
      this._expandedKeys.add(keyV);
    } else if (this._expandedKeys.has(keyV)) {
      this._expandedKeys.delete(keyV);
    }
  }

  private _updateParentInfo(rows) {
    if (this.parentInfo) {
      const { data, key } = this.parentInfo;
      data && (data[key] = rows);
    }
  }

  private _updateSubTable = async (row) => {
    const subTable = this.props.subTable;
    if (subTable && this._lastParentRow !== row) {
      this._lastParentRow = row;
      const ids = Object.keys(subTable);
      const promiseArray = ids.map((id) => {
        const [subDataField, subDataFunction] = subTable[id].dataSource;
        const fn = async () => {
          if (row && subDataFunction) {
            row[subDataField] = await subDataFunction(row);
          }
          return [subDataField, row?.[subDataField] || []];
        };
        return fn();
      });
      const subTableData = await Promise.all(promiseArray);
      subTableData.forEach(([key, data], idx) => {
        const id = ids[idx];
        util.getCmpApi(id)?.setSubDataSource(data, { data: row, key });
      });
    }
  };

  /**
   * 列分组格式化
   * @private
   */
  private _initColumns(originColumns, initPropsColumn) {
    const allCol: any = [[], [], []];
    const { dataIndexProps = {}, columns: propColumns } = this.props;

    const columns = originColumns || propColumns;

    const fn = (cols, groups, parentProps) => {
      cols.forEach((c) => {
        const getCol = () => {
          if (initPropsColumn) {
            c.propHidden = !!c.hidden;
          }
          if (c.dataIndex) {
            const dip: any = util.isFunction(dataIndexProps) ? dataIndexProps : dataIndexProps[c.dataIndex];
            const dp = util.isFunction(dip) ? dip(c) : dip;
            if (dp?.editor) {
              dp.editor = { ...c.editor, ...dp.editor };
            }
            const nCol: any = { ...c, ...dp };
            nCol.header = getColumnHeader(nCol);
            if (nCol.editor) {
              const outProps: any = {};
              // 抽取外部的属性到editor
              c.hasOwnProperty('disabled') && (outProps.disabled = c.disabled);
              c.hasOwnProperty('required') && (outProps.required = c.required);
              nCol.editor = { ...outProps, ...nCol.editor };
            }
            return nCol;
          }
          return { ...c, header: getColumnHeader(c) };
        };
        const column = getCol();
        const { columns, children, dataIndex, editor, ...others } = column;
        const childrenColumns = columns || children || [];
        if (childrenColumns.length) {
          fn(childrenColumns, [...groups, column.header || parentProps.header], {
            ...parentProps,
            ...others
          });
        } else {
          if (groups.length) {
            column.groupIn = groups;
          }
          if (column.groupIn && !util.isArray(column.groupIn)) {
            column.groupIn = [column.groupIn];
          }
          const tmp: any = { ...parentProps, ...column };
          const pos = tmp.fixed ? (tmp.fixed === 'right' ? 2 : 0) : 1;
          allCol[pos].push(tmp);
        }
      });
    };

    fn(columns, [], {
      sortable: true,
      resizable: true,
      columnSort: true
    });
    return util.flatArray(allCol);
  }

  /**
   * 加载columns的状态
   */
  private _loadColumnState(columns, initPropsColumn = false) {
    const columnState = this.getColumnState();
    if (columnState) {
      const fn = (newColumns) => {
        return newColumns
          .map((column) => {
            if (initPropsColumn) {
              column.propHidden = !!column.hidden;
            }
            const columns = column.columns || column.children || [];
            if (columns.length > 0) {
              column.columns = fn(columns);
              return column;
            } else if (column.dataIndex) {
              const idx = columnState[column.dataIndex]?.idx ?? 999999;
              return { ...column, ...columnState[column.dataIndex], idx };
            } else {
              return column;
            }
          })
          .sort((a, b) => a.idx - b.idx);
      };
      columns = fn(columns);
      initPropsColumn = false;
    }
    return this._initColumns(columns, initPropsColumn);
  }

  /**
   * 保存columns的状态
   */
  private _saveColumnState() {
    const columnState = {};
    const fn = (stateColumns) => {
      stateColumns.forEach(({ dataIndex, width, hidden, columns, fixed }, idx) => {
        if (columns && columns.length > 0) {
          fn(columns);
        } else if (dataIndex) {
          columnState[dataIndex] = { width, hidden, idx, fixed };
        }
      });
    };
    fn(this.state.columns);
    if (this.props.columnStateChange) {
      this.props.columnStateChange({
        key: this.stateId,
        columnState
      });
    } else if (this.props.remember) {
      util.setCache(this.stateId, columnState);
    }
  }

  private _defaultDs = Promise.resolve([]);

  private _initDefaultSelected(dataSource) {
    let cacheRowIndex;
    const cacheKey = `${this.uniqueId}_selected`;
    if (this._isCacheKey('selected') && dataSource.length) {
      const obj = util.getCache(cacheKey, { type: 'session', toObject: true }) || {};
      cacheRowIndex = obj.highlight;
      obj.selected?.forEach((i) => {
        const r = dataSource[i];
        if (this.props.checkbox) {
          r[this.getCheckBoxDataIndex()] = true;
        }
        this._selectedKeys.add(r[this.getKeyField()]);
      });
      util.removeCache(cacheKey, { type: 'session' }); // 一定要清除掉，保证第一次有效
    }
    const getLastRowIndexByKey = () => {
      const { keyField } = this.props;
      if (this.lastHighlightKey && keyField) {
        for (let i = 0, len = dataSource.length; i < len; i++) {
          if (dataSource[i][keyField] === this.lastHighlightKey) {
            return i;
          }
        }
      }
      return void 0;
    };
    const defaultSelectedRowIndex = cacheRowIndex ?? getLastRowIndexByKey() ?? this.props.defaultSelectedRowIndex;
    if (!util.isNullOrEmpty(defaultSelectedRowIndex)) {
      this._lastHighlightRow = util.isFunction(defaultSelectedRowIndex)
        ? defaultSelectedRowIndex(dataSource)
        : Number(defaultSelectedRowIndex);
    }
  }

  private _getDefaultPagination() {
    const { pagination } = this.props as any;
    if (!pagination) {
      return {};
    }
    if (this._isCacheKey('page')) {
      const cacheObj = util.getCache(`${this.uniqueId}_page`, { type: 'session', toObject: true });
      if (cacheObj) {
        return {
          pageIndex: cacheObj.pageIndex ?? 1,
          pageSize: cacheObj.pageSize ?? 15
        };
      }
    }
    return {
      pageIndex: pagination.pageIndex ?? 1,
      pageSize: pagination.pageSize ?? 15
    };
  }

  private _generateGroupDs(ds, parent, groupIndex) {
    const { groupAggregatePosition } = this.props;
    ds.push(parent);
    let insertIndex = ds.length;
    if (parent[this.getExpandField()]) {
      parent.children.forEach((r) => ds.push(r));
      if (groupAggregatePosition === 'end') {
        insertIndex = ds.length;
      }
      if (this.generateColumns().aggregates.length > 0) {
        ds.splice(insertIndex, 0, {
          cellType: CellTypeEnum.AggregateCell,
          parent,
          groupIndex
        });
      }
    }
  }

  // 构造函数
  constructor(props) {
    super(props);
    const { dataSource, optimize = {}, stateId, rowFilter } = props;
    const copyData = dataSource ? this.deepCopyRaw(dataSource) : this._defaultDs;
    this._observer = props.observer || new Observer();
    this.uniqueId = `${
      util.getHistory().location.pathname || window.location.hash || window.location.pathname
    }-${this.getId()}`;
    this.stateId = stateId || this.uniqueId;
    this._rowFilter = util.isFunction(rowFilter) ? rowFilter : null;
    this.store = {
      raw: copyData,
      data: dataSource || [],
      aggregateData: dataSource || []
    };
    this.state = {
      props,
      vertical: !!optimize.vertical,
      changedFields: [],
      updateTime: 0,
      width: 0,
      height: 0,
      loading: props.loading ?? props.defaultLoading,
      errors: {},
      params: {
        ...this._getDefaultPagination()
      },
      currentExpandRow: null,
      dataSource: [],
      orderBy: [],
      columns: this._loadColumnState(props.columns || [], true),
      selected: { rowIndex: -1, dataIndex: null, editing: false }
    };
    this.state.dataSource = this.generateDataSource(this.store.data, {});

    this._initDefaultSelected(this.state.dataSource);

    this.subscribe((activeEditor) => {
      this._activeEditor = activeEditor;
    }, 'activeEditor');
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const stateFromPropKeys = {
      convert: ['dataSource', 'columns'],
      normal: ['loading']
    };
    // 当传入的dataSource\columns\loading发生变化的时候，更新state, 这个props可以被当做缓存，仅用作判断
    let hasChanged = false;
    const updateState: any = {
      props: { ...prevState.props },
      changedFields: []
    };
    stateFromPropKeys.convert.forEach((key) => {
      if (nextProps[key] !== prevState.props[key]) {
        updateState.props[key] = nextProps[key];
        updateState.changedFields.push(key);
        hasChanged = true;
      }
    });
    stateFromPropKeys.normal.forEach((key) => {
      if (nextProps[key] !== prevState.props[key]) {
        updateState.props[key] = nextProps[key];
        updateState[key] = nextProps[key];
        hasChanged = true;
      }
    });

    return hasChanged ? updateState : null;
  }

  /**
   * 发布通知消息
   */
  notify(value, type) {
    const containerId = this.getId(false);
    if (containerId) {
      util.getPageObserver().notify(
        {
          key: containerId,
          containerId,
          instance: this,
          table: this,
          args: [value?.updateRow || {}, value]
        },
        type
      );
    }
    if (type === 'onUpdateRow') {
      if (value?.dataIndex) {
        util.getPageObserver().notify(
          {
            key: value.dataIndex,
            containerId,
            instance: this,
            table: this,
            args: [value.updateRow || {}, value]
          },
          'onDataIndexChange'
        );
      }
      this._observer.notify(value, 'updateRow'); // 兼容历史数据，后期删除
      return this._observer.notify(value, 'onUpdateRow');
    }
    return this._observer.notify(value, type);
  }

  /**
   * 订阅消息
   * @param fn
   * @param notifyType
   */
  subscribe(fn, notifyType) {
    return this._observer.subscribe(fn, notifyType);
  }

  /**
   * 获取columns的状态
   */
  getColumnState() {
    return this.props.remember ? util.getCache(this.stateId, true) : undefined;
  }

  getGroupColumns(columns, type) {
    const newColumns: any = [];
    this.groupColumns[type] = [];
    const getChildren = (c, index) => {
      if (c.groupIn[index]) {
        return [
          {
            groupTitle: c.groupIn[index],
            children: getChildren(c, index + 1)
          }
        ];
      } else {
        return [c];
      }
    };
    const findGroup = (arr, c, index) => {
      const groupIn = c.groupIn;
      const find = arr.find(({ groupTitle }) => groupTitle === groupIn[index]);
      if (find) {
        if (groupIn.length > index + 1) {
          findGroup(find.children, c, index + 1);
        } else {
          find.children.push(c);
        }
      } else {
        arr.push({
          groupTitle: groupIn[index],
          children: getChildren(c, index + 1)
        });
      }
    };
    columns.forEach((c: any) => {
      if (c.groupIn) {
        findGroup(this.groupColumns[type], c, 0);
      } else {
        this.groupColumns[type].push(c);
      }
    });

    const pushColumn = (g) => {
      if (g.children) {
        g.children.forEach((c) => pushColumn(c));
      } else {
        newColumns.push(g);
      }
    };
    this.groupColumns[type].forEach((g) => pushColumn(g));
    return newColumns;
  }

  getDataIndexMap() {
    return this.dataIndexMap;
  }

  /**
   * 重置行高，行高根据内容自适应
   * @param rowIndex 刷新的起始索引位置
   * @param immediate 立即刷新
   */
  private _resetRowHeight({ rowIndex, immediate = true }: { rowIndex?: number; immediate?: boolean }) {
    const { rowHeight } = this.props;
    if (this.shouldResetStyleCacheOnItemSizeChange() || rowHeight === 'auto' || util.isFunction(rowHeight)) {
      rowIndex = rowIndex ?? this.getRenderRange().rowIndex[0];
      this.outRef.current?.resetAfterRowIndex(rowIndex, false);
      if (immediate) {
        this.refreshView();
      }
    }
  }

  proxyUpdateRow(row) {
    return new Proxy(row, {
      set(target, key, value) {
        target.__update__ = {};
        return Reflect.set(target, key, value);
      }
    });
  }

  updateChildren(row, todo, updateView = false) {
    util.loopChildren(row, (r) => {
      return todo(this.proxyUpdateRow(r));
    });
    updateView && this.setDataSource([...this.state.dataSource], false);
  }

  updateParent(row, todo, updateView = false) {
    const loop = (data, todo) => {
      const r = data[TREE_PARENT];
      if (!r) {
        return;
      }
      if (todo(this.proxyUpdateRow(r)) === false) {
        return;
      }
      loop(r, todo);
    };
    loop(row, todo);
    updateView && this.setDataSource([...this.state.dataSource], false);
  }

  /**
   * 展开树层级
   * @param level
   * @param strictly 严格按照level展开树节点
   */
  expandTree(level, strictly = true) {
    if (!this.props.isTree || level < 0) {
      return;
    }
    const rowIndex = this.getRenderRange().rowIndex[0];
    this.outRef.current?.resetAfterRowIndex(rowIndex, false);
    this.refreshView({
      state: {
        dataSource: this.generateDataSource(this.store.data, { level, strictly })
      }
    });
  }

  generateColumns() {
    if (!this.cacheColumns) {
      const offsetWidth = this.state.width - (this.state.vertical ? getScrollBarInfo().width : 0);
      const variable: IObject = {
        totalColumnWidth: 0,
        headerLine: 1,
        usedWidth: 0,
        totalFlex: 0,
        aggregates: [],
        columnSort: false,
        groupable: false,
        useFlex: false,
        dataIndexExpr: [],
        summaryCols: []
      };
      const editableColumnIndex: number[] = [];
      const unsetWidthColumns: any = [];
      const columnIndex = { left: 0, right: 0, normal: 0 };
      const allColumns: Array<any> = this.state.columns;
      const { checkbox, showRowNumber = false, expandRow, isTree = false, align, compact, expandCfg = {} } = this.props;

      this._resetRowHeight({ immediate: false });

      const { dataIndex: expandCfgDataIndex, icon, fixed, width: expandWidth, showLine, block = true }: any = expandCfg;
      const expandIconWidth = Math.max(0, expandWidth ?? 24);
      const cellPadding = this._getCellPadding();
      const leftFixedColumns: any = [];
      const tableIns = this as unknown as TableInstance;
      if ((expandRow && !expandCfgDataIndex) || this.groupByColumn) {
        leftFixedColumns.push({
          header: () => void 0,
          width: expandIconWidth,
          columnIndex: columnIndex.left++,
          render: ({ rowIndex }) => {
            const row = this.getRow(rowIndex);
            if (expandIconWidth === 0 || (this.groupByColumn && !row[IS_GROUP])) {
              return null;
            }
            return <ExpandIcon row={row} table={tableIns} rowIndex={rowIndex} icon={icon} />;
          }
        });
        variable.usedWidth += expandIconWidth;
      }
      if (checkbox) {
        leftFixedColumns.push({
          header: () => <AllCheckBox table={tableIns} />,
          width: 34,
          columnIndex: columnIndex.left++,
          dataIndex: this.getCheckBoxDataIndex(),
          render: ({ rowIndex, dataIndex }) => {
            return (
              <RowCheckBox table={tableIns} dataIndex={dataIndex} row={this.getRow(rowIndex)} rowIndex={rowIndex} />
            );
          }
        });
        variable.usedWidth += 34;
      }
      if (showRowNumber) {
        const cfg: ColumnProps = { title: '行号', width: 43, dataIndex: '_number_index_' };
        let opt: any;
        if (util.isObject(showRowNumber)) {
          const { editOptions, ..._cfg } = showRowNumber;
          if (editOptions) {
            cfg.width = 52;
            opt = editOptions;
          }
          util.assign(cfg, _cfg);
        }
        leftFixedColumns.push({
          ...cfg,
          columnIndex: columnIndex.left++,
          headerStyle: { textAlign: 'center', ...cfg.headerStyle },
          cellStyle: { textAlign: 'center', ...cfg.cellStyle },
          render: (param: any) => {
            const { row, rowIndex, pageIndex = 1, pageSize = 15 } = param;
            const index = cfg.render
              ? cfg.render(param)
              : util.isNullOrEmpty(row['__index__'])
              ? `${pageSize * (pageIndex - 1) + rowIndex + 1}`
              : row['__index__'];
            const [add, del] = [
              (e) => {
                e.stopPropagation();
                if (opt?.add) {
                  opt?.add({ table: this, rowIndex });
                } else {
                  this.addRows({}, rowIndex + 1);
                }
              },
              (e) => {
                e.stopPropagation();
                if (opt?.delete) {
                  opt?.delete({ table: this, rowIndex });
                } else {
                  this.deleteRows(rowIndex);
                }
              }
            ];
            const disableKeys = util.isBoolean(opt?.disabled)
              ? opt.disabled
              : opt?.disabled?.({ table: this, rowIndex });
            const disableAdd = disableKeys === true || disableKeys?.includes?.('add');
            const disableDel = disableKeys === true || disableKeys?.includes?.('delete');
            const hasBtn = !!opt && !(disableAdd && disableDel);
            return (
              <>
                <span className={util.classNames('nowrap', { 'rn-index': hasBtn })}>{index}</span>
                {hasBtn && (
                  <div className="rn-op">
                    <a onClick={add} hidden={disableAdd}>
                      <PlusCircleFilled />
                    </a>
                    <a onClick={del} hidden={disableDel} style={{ color: 'red', marginLeft: 6 }}>
                      <MinusCircleFilled />
                    </a>
                  </div>
                )}
              </>
            );
          }
        });
        variable.usedWidth += cfg.width;
      }
      variable.totalColumnWidth = variable.usedWidth;
      const normalColumns: any = [];
      const rightFixedColumns: any = [];
      this.expandColumn = null;
      this.dataIndexMap = {};
      let expandDataIndex = expandCfgDataIndex;

      allColumns.forEach((column, index) => {
        if (column.dataIndex) {
          if (column.expr) {
            const exprType = util.isFunction(column.expr) ? 'function' : 'string';
            variable.dataIndexExpr.push({
              exprType,
              dIdx: column.dataIndex,
              expr: column.expr,
              fn: exprType === 'function' ? column.expr : new Function('$R', '$D', '$V', '$DI', `return ${column.expr}`)
            });
          } else {
            variable.dataIndexExpr.push({ dIdx: column.dataIndex, expr: '' });
          }
          if (column.aggregates?.some((a) => (a.type || a) === 'totalSummary')) {
            variable.summaryCols.push(column.dataIndex);
          }
        }

        column.idx = column.idx ?? index;

        if (column.hidden) {
          column.propColumnIndex = index;
          column.dataIndex && (this.dataIndexMap[column.dataIndex] = { ...column });
          return;
        }

        if (!column.dataIndex) {
          column.dataIndex = column.stateId || `${this.uniqueId}_${index}`;
        }

        let textAlign = column.align || align;
        if (['amount', 'amt', 'qty', 'prc', 'rate', 'percent'].includes(column.editor?.type)) {
          const defaultCfg = {
            amount: {
              prefix: '￥',
              nullValue: '--'
            },
            percent: {
              formatter: false,
              suffix: '%'
            },
            rate: {
              suffix: '%',
              formatter({ value, precision }) {
                const p = precision ? Math.max(0, precision - 2) : undefined;
                const f = util.numberPrecision(value * 100, p);
                if (p !== undefined && f) {
                  return f.toFixed(p);
                }
                return p;
              }
            }
          };
          textAlign = column.align || 'right';
          column.format = {
            type: 'number',
            precision: getGlobalConfig().default.precision[column.editor.type] ?? column.editor.precision,
            ...defaultCfg[column.editor.type],
            ...column.format
          };
        }
        if (textAlign) {
          column.headerStyle = { textAlign, ...column.headerStyle };
          column.cellStyle = { textAlign, ...column.cellStyle };
        }

        if ((!util.isFunction(column.render) && (column.format || column.render)) || column.encrypted) {
          column.render = getRender(column);
        }

        expandDataIndex = expandDataIndex || column.dataIndex;
        if (column.hasOwnProperty('oldRender')) {
          column.render = column.oldRender; // 还原oldRender，避免嵌套render
          delete column.oldRender;
        }

        if (expandDataIndex === column.dataIndex) {
          if (isTree || (expandRow && expandCfgDataIndex)) {
            this.expandColumn = column;
            column.oldRender = column.render;
            fixed !== undefined && (column.fixed = fixed);
            if (textAlign === 'left') {
              column.headerStyle = {
                ...column.headerStyle,
                paddingLeft: expandIconWidth
              };
            }
          }
          if (isTree) {
            column.render = (...args) => {
              const { dataIndex, rowIndex, table } = args[0];
              const row = this.getRow(rowIndex);
              const children = column.oldRender ? column.oldRender(...args) : displayText(row[dataIndex]);
              const level = row[TREE_LEVEL] || 1;
              const isLastChild = row[TREE_LAST_CHILD] || rowIndex === table.getRows().length - 1;
              const hasIcon = row.children && row.children.length > 0;
              return (
                <span
                  className={`level-${level}${isLastChild ? ' tree-last-child' : ''}${showLine ? ' show-line' : ''}${
                    block ? '' : ' tree-unblock'
                  }`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    minWidth: '100%',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap',
                    marginLeft: 0 - cellPadding
                  }}
                >
                  {new Array(level - 1).fill(1).map((v, i) => {
                    return <span key={i} className={`empty-zw`} style={{ width: expandIconWidth }} />;
                  })}
                  {hasIcon ? (
                    <ExpandIcon
                      key="icon"
                      rowIndex={rowIndex}
                      row={row}
                      table={tableIns}
                      icon={
                        icon ||
                        ((expanded) => (
                          <span
                            className={`zh-row-expand-icon ${
                              expanded ? 'zh-row-expand-icon-expanded' : 'zh-row-expand-icon-collapsed'
                            }`}
                            style={{ zIndex: 1, width: `${compact ? 12 : 16}px`, height: `${compact ? 12 : 16}px` }}
                          />
                        ))
                      }
                      style={{ width: expandIconWidth }}
                    />
                  ) : (
                    <span key="leaf-line" className={`empty-zw leaf-node`} style={{ width: expandIconWidth }} />
                  )}
                  <span style={{ flex: 1, textAlign }}>{children}</span>
                </span>
              );
            };
            column.cellStyle = {
              ...column.cellStyle,
              textAlign: 'left'
            };
          } else if (expandRow && expandCfgDataIndex) {
            column.render = (...args) => {
              const { dataIndex, rowIndex } = args[0];
              const row = this.getRow(rowIndex);
              const children = column.oldRender ? column.oldRender(...args) : displayText(row[dataIndex]);
              return (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    minWidth: '100%',
                    whiteSpace: 'nowrap',
                    flexWrap: 'nowrap',
                    justifyContent: textAlign,
                    marginLeft: 0 - cellPadding
                  }}
                >
                  {expandIconWidth > 0 ? (
                    <ExpandIcon
                      key="icon"
                      rowIndex={rowIndex}
                      row={row}
                      table={tableIns}
                      icon={
                        icon ||
                        ((expanded) => (
                          <span
                            className={`ant-table-row-expand-icon ${
                              expanded ? 'ant-table-row-expand-icon-expanded' : 'ant-table-row-expand-icon-collapsed'
                            }`}
                            style={{ zIndex: 1, transform: `scale(${compact ? 0.65 : 0.8})` }}
                          />
                        ))
                      }
                      style={{ width: expandIconWidth }}
                    />
                  ) : null}
                  {children}
                </span>
              );
            };
          }
          delete column.columnSort; // 展开列不支持拖拽排序
        }

        if (isTree || column.editor) {
          delete column.mergeCell; //  树形或编辑列不支持单元格合并
        }

        if (isTree) {
          delete column.sortable; // 树形不支持数据排序
        }

        if (column.aggregates && column.aggregates.length > variable.aggregates.length) {
          variable.aggregates = column.aggregates;
        }
        if (!column.width && !column.flex) {
          column.flex = 1;
        }
        if (column.offsetWidth) {
          delete column.flex;
          column.width = column.offsetWidth;
        }
        if (!column.flex && column.width) {
          variable.usedWidth += column.width;
          variable.totalColumnWidth += column.width;
        }

        let newColumn: any;
        if (column.groupIn) {
          if (util.isString(column.groupIn)) {
            column.groupIn = [column.groupIn];
          }
          if (column.groupIn.length > 0) {
            variable.headerLine = Math.max(variable.headerLine, column.groupIn.length + (column.title ? 1 : 0));
            variable.groupable = true;
            delete column.columnSort; // 分组表头不支持拖拽排序
          } else {
            delete column.groupIn;
          }
        }
        if (!column.dataIndex) {
          util.debug({ msg: `column dataIndex is empty, auto generate dataIndex_${index}`, type: 'warn' });
          column.dataIndex = `dataIndex_${index}`;
          delete column.sortable; // dataIndex为空不支持数据排序
        }
        column.propColumnIndex = index;
        if (column.fixed) {
          delete column.mergeCell; //  固定列不支持单元格合并
          delete column.columnSort; // 固定列不支持排序
          if (column.fixed === 'right') {
            newColumn = {
              ...column,
              columnIndex: columnIndex.right++
            };
            rightFixedColumns.push(newColumn);
          } else {
            newColumn = {
              ...column,
              columnIndex: columnIndex.left++
            };
            leftFixedColumns.push(newColumn);
          }
        } else {
          newColumn = {
            ...column,
            columnIndex: columnIndex.normal++
          };
          if (column.columnSort) {
            variable.columnSort = column.columnSort;
          }
          normalColumns.push(newColumn);
        }

        if (newColumn.editor) {
          newColumn.originEditor = newColumn.editor;
          const xType = util.isString(column.editor.xtype) ? column.editor.xtype.toLowerCase() : '';
          if (this.showEditor.includes(xType)) {
            // 是否需要全选
            const checkedAll = column.editor.checkedAll ?? true;
            if (xType === 'checkbox' && column.editor.checkStrictly === false) {
              if (column.header && !checkedAll) {
                column.headerStyle = { ...column.headerStyle, ...convertStyle({ textAlign: 'center' }) };
              } else {
                newColumn.header = () => (
                  <AllCheckBox
                    table={tableIns}
                    dataIndex={column.dataIndex}
                    checkDisabled={column.editor.disabled}
                    children={column.header}
                  />
                );
              }
            }
            newColumn.render = ({ table, rowIndex, dataIndex }) => {
              const row = this.getRow(rowIndex);
              if (xType === 'checkbox' && column.editor.checkStrictly === false) {
                return (
                  <RowCheckBox
                    table={tableIns}
                    dataIndex={dataIndex}
                    row={row}
                    rowIndex={rowIndex}
                    checkDisabled={column.editor.disabled}
                  />
                );
              }
              const style: CSSProperties = column.align ? convertStyle({ textAlign: column.align }) : {};
              return (
                <EditorFactory
                  column={{ ...column }}
                  style={style}
                  row={row}
                  table={table}
                  editing={true}
                  rendered={true}
                />
              );
            };
            delete newColumn.editor;
          } else {
            editableColumnIndex.push(index);
          }
        }
        if (newColumn.flex) {
          variable.totalFlex += newColumn.flex;
          unsetWidthColumns.push(newColumn);
        }
        if (this.dataIndexMap.hasOwnProperty(column.dataIndex)) {
          util.debug({ msg: `column dataIndex is duplicate, delete from column ${index}`, type: 'warn' });
        } else {
          column.columnIndex = newColumn.columnIndex;
          this.dataIndexMap[column.dataIndex] = { ...column };
        }
      });
      const columnDefaultWidth = 80;
      // 设置flex列宽
      let unUsedWidth =
        offsetWidth - variable.usedWidth - unsetWidthColumns.reduce((p, c) => p + (c.width ?? columnDefaultWidth), 0);
      const flexWidth = Math.ceil(unUsedWidth / variable.totalFlex);
      unsetWidthColumns.forEach((column, idx) => {
        const defaultColumn = this.dataIndexMap[column.dataIndex];
        const minWidth = column.width ?? columnDefaultWidth;
        if (flexWidth <= 0) {
          column.width = minWidth;
        } else if (idx < unsetWidthColumns.length - 1) {
          column.width = minWidth + column.flex * flexWidth;
          unUsedWidth -= column.flex * flexWidth;
        } else {
          column.width = minWidth + unUsedWidth;
        }
        if (this.expandColumn && this.expandColumn.dataIndex === column.dataIndex) {
          this.expandColumn.offsetWidth = column.width;
        }
        variable.totalColumnWidth += column.width;
        defaultColumn && (defaultColumn.width = column.width);
      });

      let [leftW, rightW] = [
        leftFixedColumns.reduce((w, c) => w + c.width, 0),
        rightFixedColumns.reduce((w, c) => w + c.width, 0)
      ];

      // 固定列宽度大于最大宽度，取消列固定，保证数据完整显示
      if (leftW + rightW > offsetWidth) {
        if (leftW > offsetWidth) {
          [].unshift.apply(normalColumns, leftFixedColumns);
          leftW = 0;
          leftFixedColumns.length = 0;
        }
        [].push.apply(normalColumns, rightFixedColumns);
        rightW = 0;
        rightFixedColumns.length = 0;
      }

      this.cacheColumns = {
        headerLineHeight: this.props.headerHeight || 39,
        groupable: variable.groupable,
        columnSort: variable.columnSort,
        dataIndexExpr: variable.dataIndexExpr,
        editableColumnIndex,
        totalColumnWidth: variable.totalColumnWidth,
        avgColumnWidth: Math.floor(variable.totalColumnWidth / Math.max(1, normalColumns.length)), // 平均列宽
        aggregates: variable.aggregates,
        normalColumns: this.getGroupColumns(normalColumns, 'normal'),
        fixedColumns: {
          left: {
            columns: this.getGroupColumns(leftFixedColumns, 'left'),
            width: leftW
          },
          right: {
            columns: this.getGroupColumns(rightFixedColumns, 'right'),
            width: rightW
          }
        },
        unUsedWidth: unsetWidthColumns.length > 0 ? 0 : Math.max(0, offsetWidth - variable.usedWidth),
        useFlex: offsetWidth >= variable.totalColumnWidth,
        allColumns: allColumns,
        summaryCols: variable.summaryCols
      };

      this.headerHeight = this.cacheColumns.headerLineHeight * variable.headerLine + 1;

      this.outRef.current?.resetAfterColumnIndex(0, false);
    }
    return this.cacheColumns;
  }

  /**
   * 生成ds
   * @param ds
   * @param expandTree
   */
  generateDataSource(ds, expandTree: undefined | { level?: number; strictly?: boolean } = undefined) {
    const { groupBy, expandCfg, isTree, expandRow } = this.props;
    const defaultExpand = expandCfg?.defaultExpand ?? this.props.defaultExpand;
    const { columns } = this.state;
    const newDs: any =
      this.props.aggregatePosition === 'start' && this.generateColumns().aggregates.length > 0
        ? [
            {
              cellType: CellTypeEnum.AggregateCell,
              parent: null,
              groupIndex: -1
            }
          ]
        : [];
    const expandField = this.getExpandField();
    const keyField = this.getKeyField();
    if (expandRow) {
      let idx = 1;
      this.groupDs = [];
      ds.forEach((r, index) => {
        let expand = r[expandField];
        if (expand === undefined) {
          if (r[keyField] && this._expandedKeys.has(r[keyField])) {
            expand = true;
            r[expandField] = expand;
          } else if (defaultExpand) {
            expand = util.isFunction(defaultExpand)
              ? defaultExpand({
                  row: r,
                  index
                })
              : defaultExpand === 'all' || index === 0;
            r[expandField] = expand;
          }
        }
        r['__index__'] = idx++;
        this._setExpandedKeys(r, idx);
        this.groupDs.push(r);
        newDs.push(r);
        if (expand) {
          newDs.push({
            cellType: CellTypeEnum.ExpandRowCell,
            parent: r,
            groupIndex: index
          });
        }
      });
      return newDs;
    } else if (groupBy && columns) {
      const lastGroupDs = this.groupDs;
      const groupArr = util.groupBy(ds, (data) => data[groupBy]);
      if (!this.groupByColumn) {
        this.groupByColumn = columns.find(({ dataIndex }) => dataIndex === groupBy);
      }
      let idx = 1;
      this.groupDs = [];
      groupArr.forEach((group, index) => {
        let expand =
          this._expandedKeys.has(group.groupKey) ||
          lastGroupDs.find((g) => g[groupBy] === group.groupKey)?.[expandField];
        if (expand === undefined && defaultExpand) {
          expand = util.isFunction(defaultExpand)
            ? defaultExpand({
                row: group,
                index
              })
            : defaultExpand === 'all' || index === 0;
        }
        const dr = {
          [IS_GROUP]: true,
          column: this.groupByColumn,
          [groupBy]: group.groupKey,
          children: group.children,
          [expandField]: expand
        };
        this._setExpandedKeys(dr, index);
        this.groupDs.push(dr);
        group.children.forEach((r) => {
          r['__index__'] = idx++;
          r[GROUP_PARENT] = dr;
        });
        this._generateGroupDs(newDs, dr, index);
      });
      return newDs;
    } else if (isTree && (expandTree || defaultExpand)) {
      const paramLevel = Number(expandTree?.level ?? -1);
      const strictly = expandTree?.strictly;
      this.expandLevel = 0;
      const isExpand = (param) => {
        if (!param.row.children || param.row.children.length === 0) {
          return false;
        }
        if (paramLevel > -1) {
          return param.level <= paramLevel;
        }
        if (param.row[keyField] && this._expandedKeys.has(param.row[keyField])) {
          return true;
        }
        if (util.isFunction(defaultExpand)) {
          return defaultExpand(param);
        }
        return param.level <= (defaultExpand === 'all' ? 99 : Number(defaultExpand));
      };
      const loop = (dataRows, parentRow, level, todo?) => {
        if (!dataRows) return;
        const len = dataRows.length - 1;
        dataRows.forEach((r, index) => {
          const children = r.children;
          updateTreeSymbol({ parentNode: parentRow, node: r, index, level, isLeaf: !children?.length });
          r[TREE_LAST_CHILD] = index === len;
          if (todo?.(r, index, level)) {
            loop(children, r, level + 1, todo);
          } else {
            r[expandField] = false;
            loop(children, r, level + 1);
          }
        });
      };
      const createDs = (dataRows, parentRow, firstLevel) => {
        loop(dataRows, parentRow, firstLevel, (r, index, level) => {
          this.expandLevel = Math.max(this.expandLevel, level);
          if (strictly || !r[expandField]) {
            r[expandField] = isExpand({ row: r, index, level });
          }
          this._setExpandedKeys(r, index + '' + level);
          newDs.push(r);
          return r[expandField];
        });
      };
      createDs(ds, undefined, 1);
      return newDs;
    }
    if (this.props.aggregatePosition === 'start') {
      return this.generateColumns().aggregates.length > 0
        ? [
            {
              cellType: CellTypeEnum.AggregateCell,
              parent: null,
              groupIndex: -1
            },
            ...ds
          ]
        : ds;
    }
    return ds;
  }

  private _getCellPadding = () => {
    return this.props.compact ? 2 : 6;
  };

  private _onBeforeResize = ({ width }) => {
    if (this.outRef.current?._outerRef && width > this.state.width) {
      this.outRef.current._outerRef.style.overflow = 'visible';
    }
  };

  private _onResize = (wh, options = {}) => {
    const { flushSync = false } = options as any;
    if (wh.width !== this.state.width || wh.height !== this.state.height) {
      const updateState = (state) => {
        flushSync
          ? ReactDOM.flushSync(() => {
              this.setState(state);
            })
          : this.setState(state);
      };

      const minHeight = this.props.style?.minHeight || 0;
      if (wh.height > minHeight) {
        updateState(wh);
      } else if (wh.width !== this.state.width) {
        updateState({ width: wh.width });
      }
    }
  };

  private _onRootElementClick = () => {
    if (
      this.state.selected.editing &&
      !this._lockEdit
      //  && !util.closest(e.target, (el) => el === this.containerRef.current) // 放开注释有且仅点击table外部取消编辑
    ) {
      this.endEditing(true, false);
    }
  };

  setEditLock(lock: boolean) {
    this._lockEdit = lock;
  }

  componentDidMount() {
    this.subscribe((keyCode) => {
      this.props.onKeyDown?.({ keyCode });
    }, 'keyboardEvent');

    this.subscribe(() => {
      if (!this.rootEl) {
        this.rootEl = document.body;
        this.rootEl?.addEventListener('click', this._onRootElementClick, false);
      }
    }, 'startEditing');
  }

  componentWillUnmount() {
    if (this._isCacheKey('selected')) {
      util.setCache(
        `${this.uniqueId}_selected`,
        {
          selected: this.getSelectedIndexes(),
          highlight: this.getSelectedIndex()
        },
        { type: 'session' }
      );
    }
    if (this._isCacheKey('page') && this.props.pagination) {
      const { pageIndex, pageSize } = this.state.params;
      util.setCache(`${this.uniqueId}_page`, { pageIndex, pageSize }, { type: 'session' });
    }
    this.unmount = true;
    this._observer.clear();
    this._expandedKeys.clear();
    this.resetSelected();
    this.rootEl?.removeEventListener('click', this._onRootElementClick, false);
    this.rootEl = null;
  }

  componentDidUpdate(): void {
    this.lastUpdateFlag = this.updateFlag;
    this.updateFlag = UpdateFlagEnum.None;
    if (this.expandLevel) {
      const { isTree, expandCfg = {} } = this.props;
      if (isTree && expandCfg.fitContent !== false) {
        const expandColumn = this.expandColumn || {};
        const initWidth = expandColumn.offsetWidth || expandColumn.width;
        let maxWidth = 0;
        this.bodyRef.current?.querySelectorAll(`.level-${this.expandLevel}`).forEach((el) => {
          maxWidth = Math.max(el.scrollWidth + this._getCellPadding() * 2, maxWidth);
        });
        this.expandLevel = 0;
        if (maxWidth > initWidth) {
          this.setColumnProps(this.expandColumn?.dataIndex, { offsetWidth: maxWidth });
        }
      }
    }
  }

  private updateStateByProps() {
    if (this.state.changedFields.length > 0) {
      if (this.state.changedFields.indexOf('dataSource') > -1) {
        const ds = this.props.dataSource;
        if (this.store.raw === this._defaultDs && ds) {
          this.store.raw = this.deepCopyRaw(ds);
          this.resetSelected();
        } else {
          this._keyMap.clear();
          this._selectedKeys.clear();
        }
        this.store.aggregateData = ds || [];
        this.store.data = ds || [];
        this.state.dataSource = this.generateDataSource(this.store.data, {});
        this.updateFlag = UpdateFlagEnum.ForceUpdate;
        this._resetRowHeight({ immediate: false });
      }
      if (this.state.changedFields.indexOf('columns') > -1) {
        this.cacheColumns = null;
        this.state.columns = this._loadColumnState(this.props.columns, true);
      }
      this.state.changedFields = [];
    } else if (this._lastProps?.dataIndexProps !== this.props.dataIndexProps) {
      this.cacheColumns = null;
      this.state.columns = this._loadColumnState(this.state.columns);
    }
    this.cellStyle = { padding: `0 ${this._getCellPadding()}px` };
  }

  shouldComponentUpdate(nextProps: Readonly<any>, nextState: Readonly<any>): boolean {
    const compareProps = ['checkbox', 'showRowNumber', 'dataIndexProps', 'disabled'];
    const compareStates = ['width', 'columns', 'updateTime'];
    if (
      compareStates.some((prop) => this.state[prop] !== nextState[prop]) ||
      compareProps.some((prop) => this.props[prop] !== nextProps[prop])
    ) {
      this.cacheColumns = null;
    }
    this._lastProps = this.props;
    return true;
  }

  async _queryPromise(params: any = {}) {
    const { request, response, pagination, fullyControlled, queryResetIndex } = this.props;
    if (fullyControlled) {
      return;
    }
    if (this._isPagination) {
      // 如果是切换分页操作，还原分页标记，不清空前端分页数据的缓存，直接从缓存分隔数据
      this._isPagination = false;
    } else {
      this._requestPaginationData = null;
      queryResetIndex && (params.pageIndex = 1);
    }
    if (request) {
      if (!this._requestPaginationData) {
        this.startLoading();
        const newParams = this.cacheColumns.summaryCols?.length
          ? { ...params, summaryCols: this.cacheColumns.summaryCols.join() }
          : params;
        const res = util.parseJson(await request(newParams, this)) || [];
        const result = response ? response(res) : res;

        if (pagination && util.isArray(result)) {
          this._requestPaginationData = result; //缓存前端分页的请求数据
        } else {
          this._requestPaginationData = null;
          return result;
        }
      }

      if (this._requestPaginationData) {
        return {
          total: this._requestPaginationData.length,
          record: this._requestPaginationData.slice(
            (params.pageIndex - 1) * params.pageSize,
            params.pageIndex * params.pageSize
          )
        };
      }
    }
    return [...this.store.data];
  }

  /**
   * 设置loading状态
   */
  startLoading() {
    if (!this.state.loading) {
      this.setState({ loading: true });
    }
  }

  /**
   * 取消loading状态
   */
  endLoading() {
    if (this.state.loading) {
      this.setState({ loading: false });
    }
  }

  /**
   * 获取单元格的错误信息
   * @param row 行
   * @param dataIndex 列字段
   * @param errors 错误信息
   */
  private _cellError(row, dataIndex, errors?) {
    errors = errors || this.state.errors;
    if (row && dataIndex) {
      const keyValue = row[this.getKeyField()];
      const columns = this.cacheColumns.allColumns || this.state.columns;
      const column = columns.find((c) => c.dataIndex === dataIndex);
      if (column && column.editor && row) {
        const value = row[column.dataIndex];
        const { required = false, regExp, min, max, maxLength } = column.editor;
        const errorArr: any = [];
        if (regExp) {
          const exp = regExp.exp || regExp;
          const info = regExp.info || '数据格式错误';
          const result = util.regExpTest(exp, util.isFunction(exp) ? { row, value, dataIndex } : value);
          if (result !== true) {
            errorArr.push(['regExp', util.isString(result) ? result || info : info]);
          }
        } else if (util.isNullOrEmpty(value) || (util.isArray(value) && value.length === 0)) {
          if (required) {
            errorArr.push(['required', '必输项']);
          }
        } else {
          if (util.isNumber(maxLength) && util.strLen(value) > maxLength) {
            errorArr.push(['maxLength', `最大长度不能超过${maxLength}`]);
          }

          if (util.isNumber(min) && value < min) {
            errorArr.push(['min', `最小值不能小于${min}`]);
          }

          if (util.isNumber(max) && value > max) {
            errorArr.push(['max', `最大值不能大于${max}`]);
          }
        }
        if (errorArr.length > 0) {
          errors[`${keyValue}:${dataIndex}`] = {
            title: this.getDataIndexMap()[dataIndex]?.title,
            rowIndex: this.getRowIndex(row),
            dataIndex,
            info: errorArr
          };
        } else {
          delete errors[`${keyValue}:${dataIndex}`];
        }
      }
    }
    return errors;
  }

  /**
   * 获取错误信息
   */
  getErrors() {
    return new Promise((resolve) => {
      this.validData(() => {
        resolve(this.state.errors);
      });
    });
  }

  /**
   * 数据验证
   */
  validData(callback?: Function) {
    const { dataSource } = this.state;
    const validRow = (row) => {
      const errors: any = {};
      const columns = this.cacheColumns.allColumns || this.state.columns;
      columns.forEach((c) => {
        this._cellError(row, c.dataIndex, errors);
      });
      return errors;
    };
    const errors = dataSource.reduce((p, r) => ({ ...p, ...validRow(r) }), {});
    const errorKey = Object.keys(errors).find((key) => errors[key].info.length > 0);
    if (errorKey) {
      const { rowIndex, dataIndex } = errors[errorKey];
      const { selected } = this.state;
      this.scrollToItem({ rowIndex, dataIndex, align: 'smart' });
      this.refreshView({
        callback,
        state:
          selected.editing && selected.rowIndex > -1 && selected.dataIndex
            ? { selected: { ...selected, editing: false }, errors }
            : { errors }
      });
    } else if (Object.keys(this.state.errors || {}).length) {
      this.refreshView({
        callback,
        state: { errors }
      });
    } else {
      callback?.();
    }
    return !errorKey;
  }

  getActiveEditor() {
    return this._activeEditor?.getApi();
  }

  isDisabled({ row, dataIndex, column }: { row: any; dataIndex?: string; column?: any }) {
    if (!column && dataIndex) {
      column = this.getDataIndexMap()[dataIndex];
    }
    if (!dataIndex && column) {
      dataIndex = column.dataIndex;
    }

    if (this.props.readOnly) {
      if (util.isFunction(this.props.readOnly)) {
        return this.props.readOnly({ row, dataIndex });
      }
      return true;
    }

    if (column?.editor?.disabled !== undefined) {
      return util.isFunction(column.editor.disabled)
        ? column.editor.disabled({
            row,
            dataIndex
          })
        : column.editor.disabled;
    }
    if (this.props.disabled) {
      if (util.isFunction(this.props.disabled)) {
        return this.props.disabled({ row, dataIndex });
      }
      return true;
    }

    if (column?.levelSummary && this.props.isTree) {
      return row[TREE_LEAF_NODE] === false;
    }

    return false;
  }

  /**
   * 设置单元格编辑状态
   * @param rowIndex 行号
   * @param dataIndex 列字段
   */
  startEditing({ rowIndex, dataIndex = undefined }, payload: IObject = {}) {
    if (this.isDisabled({ row: this.getRow(rowIndex), dataIndex })) {
      return;
    }
    const { selected } = this.state;
    const { allColumns, editableColumnIndex } = this.generateColumns();
    if (editableColumnIndex.length === 0) return;
    dataIndex = dataIndex || allColumns[editableColumnIndex[0]].dataIndex;
    if (!selected.editing || selected.rowIndex !== rowIndex || selected.dataIndex !== dataIndex) {
      this.scrollToItem({ rowIndex, dataIndex, align: 'smart' });
      this.setState(
        {
          selected: {
            rowIndex,
            dataIndex,
            editing: true
          },
          errors: this._cellError(this.getRow(selected.rowIndex), selected.dataIndex)
        },
        () => {
          if (selected.editing) {
            this.notify({ ...selected, payload }, 'endEditing');
          }
          this.notify({ ...this.state.selected, payload }, 'startEditing');
        }
      );
      return true;
    }
    return false;
  }

  focus() {
    const { selected } = this.state;
    if (
      !this.startEditing({
        rowIndex: Math.max(selected.rowIndex, 0),
        dataIndex: selected.dataIndex
      })
    ) {
      this.getActiveEditor()?.focus?.();
    }
  }

  /**
   * 取消单元格编辑状态
   */
  endEditing(sync = false, focused = true) {
    const { selected } = this.state;
    const execFn = sync ? (handler) => handler() : setTimeout;
    focused && this.bodyRef.current?.focus?.();
    if (selected.editing && selected.rowIndex > -1 && selected.dataIndex) {
      execFn(() => {
        this.setState(
          {
            selected: {
              ...selected,
              rowIndex: -1,
              editing: false
            },
            errors: this._cellError(this.getRow(selected.rowIndex), selected.dataIndex)
          },
          () => {
            this.notify(selected, 'endEditing');
            this._activeEditor = null;
            this.setEditLock(false);
          }
        );
      }, 5);
      return true;
    }
    return false;
  }

  /**
   * 按列排序数据
   * @param orderBy 数组，排序方式，例如：[{field1: 'asc'}, {field2:'desc'}]
   */
  setOrderBy(orderBy: object[], callback?: Function) {
    const orderData = this.generateDataSource(dataSortOrder(this.store.data, orderBy, this.getDataIndexMap()));
    this.refreshView({
      state: { orderBy, dataSource: orderData },
      rowColumnIndex: { rowIndex: 0 },
      callback
    });
  }

  /**
   * 获取当前索引对应的数据
   * @param rowIndex 行索引
   */
  getRow(rowIndex) {
    if (rowIndex < 0) {
      return null;
    }
    const keyField = this.getKeyField();
    const rowData = this._renderDataSource ? this._renderDataSource[rowIndex] : this.getRows()[rowIndex];
    if (rowData && rowData[keyField] === undefined) {
      rowData[keyField] = util.uniqueId(rowIndex);
      this._setKeyMap(rowData);
    }
    return rowData;
  }

  /**
   * 获取主键对应的数据
   * @param keyValue 主键value值
   */
  getRowByKey(keyValue) {
    if (util.isNullOrEmpty(keyValue)) {
      return null;
    }
    let find = this._keyMap.get(keyValue);
    if (!find) {
      const keyField = this.getKeyField();
      const loop = (rows) => {
        if (!rows) {
          return false;
        }
        for (let i = 0, len = rows.length; i < len; i++) {
          if (rows[i][keyField] === keyValue) {
            find = rows[i];
            this._setKeyMap(find);
            return true;
          }
          if (loop(rows[i].children)) {
            return true;
          }
        }
        return false;
      };
      loop(this.getStore().data);
    }
    return find;
  }

  /**
   * 获取所有行数据（按照真实显示返回）
   */
  getRows() {
    return this.state.dataSource || [];
  }

  getRenderRows() {
    return this._renderDataSource || this.getRows();
  }

  /**
   * 复制行数据
   * @param row 行索引或者行数据
   * @param except 需要排除的字段
   */
  copyRow(row: number | object, except = ['checked']) {
    this._copyRow = util.deepCopy(util.isNumber(row) ? this.getRow(row) : row, true);
    except.forEach((field) => {
      delete this._copyRow[field];
    });
    delete this._copyRow[this.getKeyField()];
    return this._copyRow;
  }

  /**
   * 粘贴行数据
   */
  pasteRow(rowIndex?) {
    if (!this._copyRow) {
      return false;
    }
    if (rowIndex === undefined) {
      rowIndex = this.getSelectedIndex();
    }
    if (rowIndex > -1) {
      this.updateRowDataByIndex(rowIndex, this._copyRow, false);
      return true;
    }
    return false;
  }

  /**
   * 剪切行数据
   */
  cutRow(rowIndex?) {
    if (rowIndex === undefined) {
      rowIndex = this.getSelectedIndex();
    }
    if (rowIndex > -1) {
      this.copyRow(rowIndex);
      this.clearData(rowIndex);
      return true;
    }
    return false;
  }

  /**
   * 获取行索引
   * @param row 数据行
   */
  getRowIndex(row) {
    if (util.isFunction(row)) {
      return this.getRows().findIndex(row);
    }
    return this.getRows().indexOf(row);
  }

  /**
   * 获取所有数据
   */
  getStore() {
    return {
      raw: this.rawData,
      data: this.store.data
    };
  }

  getData() {
    return this.store.data;
  }

  watchPromise() {
    return this.store.raw;
  }

  getAggregateData() {
    return this.store.aggregateData;
  }

  // size变化时是否重置grid的缓存样式
  shouldResetStyleCacheOnItemSizeChange() {
    return this.props.expandRow || this.props.isTree || this.groupByColumn;
  }

  /**
   * 设置行的展开状态
   * @param rowIndexes
   * @param expandInfo
   */
  setExpand(
    rowIndexes: undefined | number | number[] = undefined,
    expandInfo: boolean | { level?: number; callback?: Function } = true
  ) {
    if (!this.shouldResetStyleCacheOnItemSizeChange()) {
      this.refreshView({ endEditing: true });
      (expandInfo as any)?.callback();
      return;
    }
    const ds = this.getRows();
    const isLevelExpand = expandInfo.hasOwnProperty('level');
    const maxLevel = isLevelExpand ? (expandInfo as any).level : expandInfo ? 99 : -1;
    this.expandLevel = 0;
    this.endEditing(true);
    let rowIndexArr: number[] = Array.isArray(rowIndexes) ? rowIndexes : util.isNumber(rowIndexes) ? [rowIndexes] : [];

    let currentMinRowIndex;
    if (rowIndexes === -1) {
      currentMinRowIndex = 0;
      rowIndexArr = [];
    } else if (rowIndexArr.length === 0) {
      rowIndexArr = ds.map((d, idx) => idx);
    } else {
      currentMinRowIndex = Math.min(...rowIndexArr);
    }
    const expandField = this.getExpandField();
    rowIndexArr.forEach((index) => {
      const row = ds[index];
      const rowLevel = row[TREE_LEVEL] ?? 1;
      row[expandField] = rowLevel <= maxLevel;
      this._setExpandedKeys(row, index);
      row.__update__ = { rowIndex: index, dataIndex: expandField };
      if (isLevelExpand && row[expandField] && rowLevel < maxLevel) {
        util.loopChildren(
          row,
          (r, i, level) => {
            if (level < maxLevel) {
              r[expandField] = true;
              this._setExpandedKeys(row, i + '' + level);
            } else {
              return false;
            }
          },
          rowLevel
        );
      }
    });
    const newState: any = {};
    if (this.props.isTree) {
      newState.dataSource = [];
      const createDs = (dataRows, parentRow, level) => {
        this.expandLevel = Math.max(this.expandLevel, level);
        const len = dataRows.length - 1;
        dataRows.forEach((r, index) => {
          const children = r.children;
          const lastChild = index === len;
          updateTreeSymbol({ parentNode: parentRow, node: r, index, level, isLeaf: !children?.length });
          if (r[TREE_LAST_CHILD] !== lastChild) {
            r[TREE_LAST_CHILD] = lastChild; // 更新树形线条折线
            r.__update__ = {};
          }
          newState.dataSource.push(r);
          if (r[expandField] && children) {
            createDs(children, r, level + 1);
          }
        });
      };
      createDs(this.store.data, undefined, 1);
    } else if (this.groupByColumn) {
      newState.dataSource = [];
      this.groupDs.forEach((g, index) => {
        this._generateGroupDs(newState.dataSource, g, index);
      });
    } else if (this.props.expandRow) {
      newState.dataSource = [];
      this.groupDs.forEach((r, index) => {
        newState.dataSource.push(r);
        if (r[expandField]) {
          newState.dataSource.push({ groupIndex: index, parent: r, cellType: CellTypeEnum.ExpandRowCell });
        }
      });
    }
    // 重新设置计算过的行高位置，保证树展开的高度计算准确
    this._resetRowHeight({ immediate: false, rowIndex: currentMinRowIndex });
    if (
      newState.dataSource &&
      this.props.aggregatePosition === 'start' &&
      this.generateColumns().aggregates.length > 0
    ) {
      newState.dataSource.unshift({
        cellType: CellTypeEnum.AggregateCell,
        parent: null,
        groupIndex: -1
      });
    }
    this.setState(
      {
        ...newState,
        currentExpandRow: {
          rowIndex: rowIndexArr,
          expanded: expandInfo
        }
      },
      (expandInfo as any)?.callback
    );
  }

  /**
   * 移动树节点
   * @param fromIndex
   * @param toIndex
   */
  moveTreeNode(fromIndex, toIndex) {
    const { dataSource } = this.state;
    const oldParent = dataSource[fromIndex][TREE_PARENT];
    if (oldParent === dataSource[toIndex][TREE_PARENT]) {
      const children = oldParent ? oldParent.children : this.store.data;
      const fromIdx = children.indexOf(dataSource[fromIndex]);
      const toIdx = children.indexOf(dataSource[toIndex]);
      const item = children.splice(fromIdx, 1)[0];
      children.splice(toIdx, 0, item);
      this.setExpand(-1);
    } else {
      message.warning('只能交换同级节点').then();
    }
  }

  /**
   * 移动行数据
   * @param fromIndex
   * @param toIndex
   */
  moveRow(fromIndex, toIndex) {
    const newDataSource = this.state.dataSource.slice();
    const item = newDataSource.splice(fromIndex, 1)[0];
    newDataSource.splice(toIndex, 0, item);
    this.updateFlag = UpdateFlagEnum.RowUpdate;
    this.setDataSource(newDataSource, false);
  }

  /**
   * 动态设置所有列信息
   * @param columns 列信息
   */
  setColumns(columns) {
    const items = util.isFunction(columns) ? columns(this.state.columns) : columns;
    this.setState({
      columns: this._loadColumnState(items)
    });
  }

  getState() {
    return this.state;
  }

  resetSelected() {
    this.lastHighlightKey =
      this._lastHighlightRow > -1 ? this.getRow(this._lastHighlightRow)?.[this.getKeyField()] : undefined;
    this._lastHighlightRow = -1;
    this._keyMap.clear();
    this._selectedKeys.clear();
  }

  /**
   * 动态设置数据源
   * @param dataSource
   * @param updateRaw 是否更新原始数据
   * @param callback 回调
   */
  setDataSource(dataSource, updateRaw = true, callback?: (...args) => void) {
    const newDataSource = util.isFunction(dataSource) ? dataSource(this.store.data) : dataSource;
    if (this.state.dataSource !== newDataSource) {
      if (updateRaw) {
        this.store.raw = this.deepCopyRaw(newDataSource);
        this.resetSelected();
      }

      this.store.data = [];
      if (this.props.isTree) {
        newDataSource.forEach((r) => {
          if (r[TREE_LEVEL] === 1 || r[TREE_LEVEL] === undefined) {
            this.store.data.push(r);
          }
        });
      } else if (this.props.groupBy) {
        newDataSource.forEach((r) => {
          if (r[IS_GROUP]) {
            Array.prototype.push.apply(this.store.data, r.children);
          }
        });
      }
      if (!this.store.data.length) {
        this.store.data = newDataSource;
      }
      this.store.aggregateData = this.store.data;
      const newState: any = {
        dataSource: updateRaw
          ? this.generateDataSource(dataSortOrder(newDataSource, this.state.orderBy, this.getDataIndexMap()), {})
          : this.props.isTree
          ? this.generateDataSource(this.store.data, { level: 0 })
          : newDataSource
      };
      this.updateFlag = this.updateFlag || UpdateFlagEnum.ForceUpdate;
      if (![UpdateFlagEnum.ColumnChecked, UpdateFlagEnum.RowUpdate].includes(this.updateFlag)) {
        newState.errors = {};
      }
      this._updateParentInfo(this.store.data);
      this.setState(newState, () => {
        this.dsUpdateCallback = callback;
        if (this.updateFlag === UpdateFlagEnum.ForceUpdate) {
          this.props.onDataLoad?.(this);
          this._observer.prevNotify({ table: this }, 'onDataLoad').then();
        }
      });
    }
  }

  setSubDataSource(dataSource, parentRow: { data: any; key: string }) {
    if (this.parentInfo?.data !== parentRow.data) {
      this.parentInfo = parentRow;
      this.setDataSource(dataSource, true);
    }
  }

  /**
   * 清空数据源的值
   * @param rowIndex 行索引，默认-1 清空所有行
   * @param nullValue 空值，默认为null
   */
  clearData(rowIndex = -1, nullValue = null) {
    const keyField = this.getKeyField();
    if (rowIndex > -1) {
      const newData = util.deepCopy(this.getRow(rowIndex), true);
      Object.keys(newData).forEach((key) => {
        keyField !== key && (newData[key] = nullValue);
      });
      this.updateRowDataByIndex(rowIndex, newData, false);
    } else {
      this.setDataSource((ds) => {
        return ds.map((d) => {
          Object.keys(d).forEach((key) => {
            keyField !== key && (d[key] = nullValue);
          });
          return d;
        });
      }, false);
    }
  }

  /**
   * 更新原数据行
   * @param row 原数据
   * @param flag
   */
  updateRow(row: object[] | object, flag = UpdateFlagEnum.UserUpdate) {
    if (!row) return;
    const rows: any = util.isArray(row) ? row : [row];
    if (rows.length === 0) return;
    const update: any = [];
    rows.forEach((r) => {
      if (!r.__update__ && flag !== UpdateFlagEnum.ColumnChecked) {
        let rIdx = this.getRowIndex(r);
        if (rIdx < 0) {
          rIdx = this.state.selected?.rowIndex ?? -1;
          const oldR = r;
          r = this.getRow(rIdx);
          r && Object.assign(r, oldR); // 更新引用数据行的数据
        }
        if (rIdx === -1 || !r) {
          return;
        }
        r.__update__ = {
          rowIndex: rIdx
        };
      }
      update.push(r.__update__);
    });
    if (!update.length) {
      return;
    }
    this.updateFlag = flag;
    const single = update.length === 1;
    this.setDataSource([...this.state.dataSource], false, () => {
      if (flag !== UpdateFlagEnum.RowUpdate) {
        return;
      }
      this.notify(
        {
          updateRow: single ? rows[0] : rows,
          update: single ? update[0] : update,
          table: this,
          updateFlag: flag
        },
        'onUpdateRow'
      );
    });
  }

  /**
   * 批量更新数据源
   * @param updateData 键值对
   */
  patchUpdate(updateData: object) {
    const keys = Object.keys(updateData);
    return new Promise((resolve) => {
      const update: any = [];
      this.updateFlag = UpdateFlagEnum.RowUpdate;
      this.setDataSource(
        (ds) => {
          return ds.map((r, rowIndex) => {
            keys.forEach((key) => {
              r[key] = updateData[key];
            });
            r.__update__ = { rowIndex };
            update.push(r.__update__);
            return r;
          });
        },
        false,
        (...args) => {
          this.notify(
            {
              updateRow: this.getRows(),
              update,
              table: this,
              updateFlag: UpdateFlagEnum.RowUpdate
            },
            'onUpdateRow'
          );
          resolve(args[0]);
        }
      );
    });
  }

  /**
   * 按照行索引更新行数据
   * @param rowIndex
   * @param rowData
   * @param merge 是否合并原数据
   */
  updateRowDataByIndex(rowIndex, rowData, merge = true) {
    const newRow = this.getRow(rowIndex);
    const { dataIndexExpr } = this.generateColumns();
    if (newRow !== rowData) {
      if (!merge) {
        util.clearObject(newRow);
      }
      Object.assign(newRow, rowData); // 更新引用数据行的数据
    }
    if (newRow[GROUP_PARENT]) {
      newRow[GROUP_PARENT].children = [...newRow[GROUP_PARENT].children];
    }
    const update = newRow.__update__ || { rowIndex };
    newRow.__update__ = update;
    const { dataIndex } = update;
    if (merge && dataIndex) {
      // 计算表达式
      // 获取当前列所在表达式中的位置，从当前列开始向后计算(跳过当前列，当前列已经更新，不需要重复计算)
      const startIndex = Math.max(
        0,
        dataIndexExpr.findIndex((d) => d.dIdx === dataIndex)
      );
      const dataIndexExprLen = dataIndexExpr.length;
      for (let i = startIndex + 1; i < startIndex + dataIndexExpr.length; i++) {
        const { fn, exprType, expr, dIdx } = dataIndexExpr[i % dataIndexExprLen];
        // 只执行包含dataIndex的表达式
        if (fn && (exprType === 'function' || expr.indexOf(`$R.${dataIndex}`) > -1)) {
          if (dIdx !== dataIndex)
            try {
              newRow[dIdx] = fn(newRow, this.state.dataSource, newRow[dIdx], dIdx);
            } catch {}
        }
      }
    }
    this.currentUpdateRow = newRow;
    this.updateFlag = UpdateFlagEnum.RowUpdate;
    this.setDataSource([...this.state.dataSource], false, () => {
      const value = {
        dataIndex,
        update,
        updateRow: newRow,
        table: this,
        updateFlag: UpdateFlagEnum.RowUpdate
      };
      this.notify(value, 'onUpdateRow');
    });
  }

  /**
   * 增加数据行
   * @param rows 需要增加的行数据
   * @param callback 增行回调
   * @param insertIndex 插入位置，默认行尾
   */
  addRows(rows: any = {}, insertIndex?: number, callback?: (...args) => void) {
    return new Promise((resolve) => {
      const addRowArray: any = util.isArray(rows) ? rows : [rows];
      if (this.parentInfo?.data === null) {
        message.warning('请先选择主表行!').then();
        resolve(false);
        return;
      }
      if (addRowArray.length === 0) {
        resolve(false);
        return;
      }
      const dataSource = [...this.getRows()];
      if (util.isNumber(callback)) {
        insertIndex = Number(callback);
        callback = undefined;
      }
      if (util.isNullOrEmpty(insertIndex)) {
        insertIndex = dataSource.length;
      }
      insertIndex = Math.min(Math.max(0, insertIndex || 0), dataSource.length);
      dataSource.splice(insertIndex, 0, ...addRowArray);
      this.updateFlag = UpdateFlagEnum.RowUpdate;
      this.setDataSource(dataSource, false, () => {
        callback
          ? callback({
              table: this,
              rowIndex: insertIndex
            })
          : this.scrollToItem({ rowIndex: insertIndex, align: 'smart' });
        resolve(true);
      });
    });
  }

  /**
   * 增加子节点
   * @param parentRow
   * @param rows
   * @param insertIndex
   */
  addChildrenRow(parentRow, rows: any = {}, insertIndex?: number) {
    const addRowArray: any = util.isArray(rows) ? rows : [rows];
    if (parentRow) {
      if (parentRow.children) {
        insertIndex = Math.min(parentRow.children.length, insertIndex ?? Number.MAX_VALUE);
        parentRow.children.splice(insertIndex, 0, ...addRowArray);
      } else {
        parentRow.children = addRowArray;
      }
      this.setExpand(this.getRowIndex(parentRow));
    } else {
      this.addRows(rows, insertIndex).then();
    }
  }

  /**
   * 通过行索引删除数据行
   * @param rowIndexes 行索引
   */
  deleteRows(rowIndexes: number[] | number | IObject | IObject[]) {
    return new Promise((resolve) => {
      const deleteIndexArray: any = util.isArray(rowIndexes) ? rowIndexes : [rowIndexes];
      if (util.isNullOrEmpty(rowIndexes) || deleteIndexArray.length === 0) {
        return resolve(void 0);
      }
      const renderRows = this._renderDataSource || this.getRows();
      const deleteRows = deleteIndexArray.map((idx) => {
        return util.isNumber(idx) ? renderRows[idx] : idx;
      });
      const allRows = this.getRows();
      const dataSource: any = [];
      let existDeleteIndex = false;
      allRows.forEach((data) => {
        if (
          deleteRows.indexOf(data) < 0 &&
          (!data[TableSymbol.TREE_PARENT] || data[TableSymbol.TREE_PARENT].children)
        ) {
          dataSource.push(data);
        } else {
          delete data.children;
          const pChildren = data[TableSymbol.TREE_PARENT]?.children;
          if (pChildren) {
            pChildren.splice(pChildren.indexOf(data), 1);
          }
          existDeleteIndex = true;
        }
      });
      if (existDeleteIndex) {
        this.resetSelected();
        this.updateFlag = UpdateFlagEnum.ForceUpdate;
        this.setDataSource(dataSource, false, resolve);
      } else {
        resolve(void 0);
      }
    });
  }

  deleteRow(row: IObject | null) {
    return new Promise((resolve) => {
      if (!row) return resolve(void 0);
      const parentRow = row[TREE_PARENT];
      delete row.children;
      const children = parentRow ? parentRow.children : this.store.data;
      const deleteIndex = children.indexOf(row);
      if (deleteIndex > -1) {
        const expandIndex = parentRow ? this.getRowIndex(parentRow) : -1;
        children.splice(deleteIndex, 1);
        if (this.shouldResetStyleCacheOnItemSizeChange()) {
          this.setExpand(expandIndex, { callback: resolve });
        } else {
          this.updateFlag = UpdateFlagEnum.RowUpdate;
          this.setDataSource([...this.store.data], false, resolve);
        }
      } else {
        resolve(void 0);
      }
    });
  }

  /**
   * 删除所有数据行
   */
  clearRows() {
    return new Promise((resolve) => {
      this.setDataSource([], false, resolve);
    });
  }

  /**
   * 删除多选选中行
   */
  deleteCheckedRows() {
    return this.deleteRows(this.getCheckedIndexes());
  }

  deleteSelectedRows() {
    return this.deleteRows(this.getSelectedIndexes());
  }

  /**
   * 删除单选选中行
   */
  deleteSelectedRow() {
    return this.deleteRow(this.getSelectedRow());
  }

  /**
   * 滚动到单元格位置
   * @param rowIndex 行索引
   * @param columnIndex 列索引
   * @param dataIndex
   * @param align
   */
  scrollToItem({
    rowIndex,
    columnIndex,
    dataIndex,
    align
  }: {
    rowIndex?: number;
    columnIndex?: number;
    dataIndex?: string;
    align?: 'auto' | 'smart' | 'center' | 'start' | 'end';
  }) {
    if (dataIndex) {
      columnIndex = this.getDataIndexMap()[dataIndex]?.columnIndex ?? columnIndex;
    }
    this.outRef.current?.scrollToItem({
      rowIndex,
      columnIndex,
      align: align || 'start'
    });
  }

  /**
   * 设置是否选中行
   * @param rowIndexes 行索引
   * @param selected true选中 false不选中
   */
  setSelected(rowIndexes: number[] | number, selected = true) {
    const dataIndex = this.getCheckBoxDataIndex();
    if (this.props.checkbox) {
      const selectedIndexArray: any = util.isArray(rowIndexes) ? rowIndexes : [rowIndexes];
      const allRows = this.getRows();
      const rows: any = [];
      selectedIndexArray.forEach((idx) => {
        const row = allRows[idx];
        if (loopChildren(this, row, dataIndex, selected, idx)) {
          rows.push(row);
        }
      });
      const checkedData = allRows.filter((r) => r[dataIndex] === true);
      this.onCheckedChange(checkedData, rows.length === 1 ? rows[0] : rows, selected);
    } else {
      if (!selected && rowIndexes !== this._lastHighlightRow) {
        return;
      }
      setTimeout(() => {
        this.setHighlight(selected ? rowIndexes[0] ?? rowIndexes : -1);
      });
    }
  }

  /**
   * 切换行的选中状态
   * @param rowIndex 行索引
   * @private
   */
  switchSelected(rowIndex) {
    const dataIndex = this.getCheckBoxDataIndex();
    const row = this.getRow(rowIndex);
    this.setSelected(rowIndex, !row[dataIndex]);
  }

  /**
   * 判断行是否可以选中
   * @param row
   */
  isRowSelectionDisabled(row) {
    return this.props.rowSelection?.disabled?.(row);
  }

  getKeyField(keyFieldName?: string) {
    if (keyFieldName) {
      return this.props[keyFieldName];
    }
    return this.props.keyField || ROW_KEY_FIELD;
  }

  getExpandField() {
    return this.props.expandField || IS_EXPANDED;
  }

  _clearChecked() {
    if (this.props.checkbox) {
      const dataIndex = this.getCheckBoxDataIndex();
      const allRows = this.getRows();
      const updateRows = [];
      allRows.forEach((row, index) => {
        loopChildren(this, row, dataIndex, false, index, true, updateRows);
      });
      return updateRows;
    }
  }

  _setCheckedByRowSelection(rowIndex, checked, incompatible = false) {
    if (this.isMultipleInterval() && this.props.checkbox) {
      if (checked && incompatible) {
        this._clearChecked();
      }
      this.setSelected(rowIndex, checked);
      return true;
    }
    return false;
  }

  clearSelected() {
    this.resetSelected();
    const updateRows = this._clearChecked();
    // 清空分页选择记录，在alert.tsx组件中订阅消息
    this._observer.notify({}, 'clearCacheCheckState');
    this.onCheckedChange([], updateRows, false);
  }

  /**
   * 是否多选一个或连续范围模式
   */
  isMultipleInterval() {
    const type = this.props.rowSelection?.type;
    if (util.isArray(type)) {
      return type.includes(TableSelectionModel.MULTIPLE_INTERVAL);
    }
    return type === TableSelectionModel.MULTIPLE_INTERVAL;
  }

  /**
   * 设置高亮行索引
   * @param rowIndex
   * @param ctrlKey
   * @param shiftKey
   */
  setHighlight(rowIndex, { ctrlKey = false, shiftKey = false } = {}) {
    if (rowIndex === -1) {
      rowIndex = this._lastHighlightRow;
      this._lastHighlightRow = -1;
      this._selectedKeys.clear();
      if (rowIndex > -1) {
        this.notify({ rowIndex, table: this }, 'clickHighlight');
      }
      return;
    }
    if (!this.isMultipleInterval()) {
      shiftKey = false;
      ctrlKey = false;
    }
    const [currentRow, keyField] = [this.getRow(rowIndex), this.getKeyField()];
    if (!currentRow) {
      return;
    }
    const keyValue = currentRow[keyField];
    if (ctrlKey) {
      if (this.isRowSelectionDisabled(currentRow)) {
        return;
      }
      if (this._selectedKeys.has(keyValue)) {
        this._lastHighlightRow = -1;
        this._selectedKeys.delete(keyValue);
        this._setCheckedByRowSelection(rowIndex, false);
      } else {
        this._lastHighlightRow = rowIndex;
        this._selectedKeys.add(keyValue);
        this._setCheckedByRowSelection(rowIndex, true);
      }
      this.notify({ rowIndex, table: this }, 'clickHighlight');
    } else if (shiftKey) {
      const selectedRowIndex: number[] = [];
      for (
        let i = Math.min(this._lastHighlightRow, rowIndex), max = Math.max(this._lastHighlightRow, rowIndex);
        i <= max;
        i++
      ) {
        const r = this.getRow(i);
        if (r && !this._selectedKeys.has(r[keyField]) && !this.isRowSelectionDisabled(r)) {
          this._selectedKeys.add(r[keyField]);
          selectedRowIndex.push(i);
        }
        this._lastHighlightRow = rowIndex;
      }
      this._setCheckedByRowSelection(selectedRowIndex, true);
      this.notify({ rowIndex: selectedRowIndex, table: this }, 'clickHighlight');
    } else {
      if (this.isRowSelectionDisabled(currentRow)) {
        return;
      }
      this._lastHighlightRow = rowIndex;
      this._selectedKeys.clear();
      this._selectedKeys.add(keyValue);
      this._setCheckedByRowSelection(rowIndex, true, true);
      this.notify({ rowIndex, table: this }, 'clickHighlight');
    }
  }

  onCheckedChange(checkedData, row, checked) {
    this.props.onCheckedChange?.(checkedData, row, checked);
    this.updateRow(row, UpdateFlagEnum.ColumnChecked);
    this.notify({ checkedData, row, checked, table: this }, 'onCheckedChange');
  }

  /**
   * 获取当前高亮的数据行（单选数据行）
   */
  getSelectedRow(): IObject | null {
    if (this._selectedKeys.size > 0) {
      return this.getRowByKey(this._selectedKeys.values().next().value);
    }
    return this._lastHighlightRow > -1 ? this.getRow(this._lastHighlightRow) : null;
  }

  /**
   * 获取所有选中的行数据(优先返回checkbox选中的行数据, 如果没有多选则返回当前高亮选中的数据)
   */
  getSelectedData() {
    if (this.props.checkbox) {
      return this.getCheckedData();
    }
    const sd: IObject[] = [];
    this.getSelectedKeys().forEach((key) => {
      const row = this.getRowByKey(key);
      row && sd.push(row);
    });
    return sd;
  }

  /**
   * 多选模式的选中行
   */
  getSelectedIndexes() {
    if (this.props.checkbox) {
      return this.getCheckedIndexes();
    }
    if (this._selectedKeys.size > 0) {
      const checkedIndexes: number[] = [];
      const [keyField, allRows] = [this.getKeyField(), this.getRows()];
      allRows.forEach((row, index) => {
        if (this._selectedKeys.has(row[keyField])) {
          checkedIndexes.push(index);
        }
      });
      return checkedIndexes;
    }
    return [];
  }

  /**
   * 获取所有选中checkbox的行数据
   */
  getCheckedData(): IObject[] {
    if (this.alertObj.state?.selectedRows?.length) {
      return this.alertObj.state.selectedRows;
    }
    const allRows = this.getRows();
    const dataIndex = this.getCheckBoxDataIndex();
    return dataIndex ? allRows.filter((r) => r[dataIndex] === true) : [];
  }

  /**
   * 获取当前高亮的行索引，小于0未选中（单选数据行索引）
   */
  getSelectedIndex() {
    return this._lastHighlightRow < this.getRows().length ? this._lastHighlightRow : -1;
  }

  /**
   * 获取当前高亮的行keys, onlyCurrentPage 只取当前页的选中状态
   */
  getSelectedKeys(onlyCurrentPage = false): Set<any> {
    const row = this.getRow(this._lastHighlightRow);
    if (row) {
      const keyValue = row[this.getKeyField()];
      if (this._selectedKeys.size === 0) {
        // 初始化默认选中行
        keyValue !== undefined && this._selectedKeys.add(keyValue);
        this._updateSubTable(row).then();
      } else {
        const selectedRow = this.getRowByKey(this._selectedKeys.values().next().value) || row;
        this._lastHighlightRow = this.getRowIndex(selectedRow); // 更新当前选中的行标记，解决排序以后行标记未更新
        this._updateSubTable(selectedRow).then();
      }
    } else {
      this._lastHighlightRow = -1;
      this._updateSubTable(null).then();
    }

    return !onlyCurrentPage && this.alertObj.state?.selectedRowKeys?.length
      ? new Set(this.alertObj.state.selectedRowKeys)
      : this._selectedKeys;
  }

  /**
   * 获取所有选中checkbox的行索引
   */
  getCheckedIndexes() {
    const checkedIndexes: number[] = [];
    const allRows = this.getRows();
    const dataIndex = this.getCheckBoxDataIndex();
    if (dataIndex) {
      allRows.forEach((data, index) => {
        if (data[dataIndex]) {
          checkedIndexes.push(index);
        }
      });
    }
    return checkedIndexes;
  }

  getCheckBoxDataIndex() {
    const { checkbox } = this.props;
    const dataIndex = checkbox === true ? 'checked' : checkbox;
    return dataIndex || DEFAULT_CHECKED;
  }

  /**
   * 返回编辑器对象暴露的api或属性
   * @param dataIndex
   */
  getEditor(dataIndex) {
    const {
      selected: { editing }
    } = this.state;
    const column: any = this.getDataIndexMap()[dataIndex];
    if (!column) return null;
    const editor = column.editor;
    return {
      getProps: () => ({ ...editor }),
      setProps: (options) => {
        if (util.isFunction(options)) {
          const n = options(editor);
          for (let key in editor) {
            if (editor.hasOwnProperty(key)) {
              delete editor[key];
            }
          }
          util.assign(editor, n);
        } else {
          if (options.antProps) {
            // 合并上一个状态的antProps属性
            options.antProps = { ...editor.antProps, ...options.antProps };
          }
          util.assign(editor, options);
        }
        if (editing) {
          this.endEditing();
        }
      },
      addListener: (eventName, listener) => {
        const oldListeners = editor.listeners || {};
        const en = `on${util.toFirstUpperCase(eventName)}`;
        editor.listeners = {
          ...oldListeners,
          [en]: (...args) => {
            oldListeners[en]?.(...args);
            listener(...args);
          }
        };
        if (editing) {
          this.endEditing();
        }
      }
    };
  }

  deepCopyRaw(obj: any) {
    if (this.props.cacheRaw) {
      this.rawData = obj;
      return new Promise<any>((resolve) => {
        const cb = window.requestIdleCallback || window.requestAnimationFrame;
        cb(() => {
          this.rawData = util.deepCopy(obj, true);
          resolve(this.rawData);
        });
      });
    } else {
      this.rawData = [];
      return new Promise<any>((resolve) => {
        this.rawData = [];
        resolve(this.rawData);
      });
    }
  }

  /**
   * 查询接口（服务端）
   * @param params 参数
   * @param onsuccess 回调
   */
  query(params?: IObject | Function, onsuccess?, onfinally?) {
    if (this.props.fullyControlled) {
      onfinally?.();
      return;
    }
    let newParams: any = this.state.params;
    if (params) {
      newParams = util.isFunction(params) ? params(newParams) : { ...this.state.params, queryFilter: params };
    }
    const { queryFilter = {}, ...others } = newParams;
    this._queryPromise({ ...others, ...queryFilter })
      .then((res) => {
        if (this.unmount) {
          return;
        }
        onsuccess?.(res);
        const ds = res ? res.record ?? res.list ?? (util.isArray(res) ? res : []) : [];
        const dsChanged = ds !== this.store.data;
        this.store.aggregateData = ds;
        this.store.data = ds;
        this.store.raw = this.deepCopyRaw(ds);
        this.updateFlag = UpdateFlagEnum.ForceUpdate;
        const dataSource = this.generateDataSource(dataSortOrder(ds, this.state.orderBy, this.getDataIndexMap()), {});
        if (dsChanged) {
          this.resetSelected();
          this._initDefaultSelected(dataSource);
          this.outRef.current?.resetAfterRowIndex(0, false);
        }
        this.setState(
          {
            loading: this.props.loading ?? false,
            total: Number(res?.total ?? ds.length),
            aggregates: res.aggregates || {},
            summaryData: res.summaryData || {},
            dataSource,
            params: newParams,
            errors: {}
          },
          () => {
            this.props.onDataLoad?.(this);
            this._observer.prevNotify({ table: this }, 'onDataLoad').then();
          }
        );
      })
      .finally(onfinally);
  }

  /**
   * 扩展参数查询列表
   * @param extraParam 扩展参数
   * @param autoLoad 是否自动加载
   */
  setExtraParam(extraParam, autoLoad = true) {
    // 分页及数据源受控，不支持内部刷新
    if (this.props.fullyControlled) {
      return;
    }
    this._isPagination = Boolean(extraParam.__isPagination__);
    delete extraParam.__isPagination__;
    this.state.params = { ...this.state.params, ...extraParam };
    if (autoLoad) {
      this.query();
    }
  }

  /**
   * 按关键词过滤（前端）
   * @param keyword 关键词
   * @param dataIndexArr 过滤字段
   */
  filter(keyword?: ((row, index) => boolean) | string, dataIndexArr = []) {
    let filterData = this.store.data;
    if (keyword) {
      if (util.isFunction(keyword)) {
        filterData = filterData.filter(keyword);
      } else {
        if (!dataIndexArr || dataIndexArr.length === 0) {
          dataIndexArr = this.state.columns.map((c) => c.dataIndex);
        }
        filterData = filterData.filter(
          clientColumnFilter(
            dataIndexArr.reduce((p, key) => {
              return { ...p, [key]: keyword };
            }, {}),
            this.getDataIndexMap(),
            false
          )
        );
      }
    }
    this.store.aggregateData = filterData;
    this.refreshView({
      state: {
        dataSource: this.generateDataSource(dataSortOrder(filterData, this.state.orderBy, this.getDataIndexMap()))
      },
      rowColumnIndex: { rowIndex: 0 }
    });
  }

  /**
   * 查找关键词并定位
   * @param param
   */
  async findKeyword(param: { keyword: string | string[]; dataIndex: string[] | string; currentIndex?: number }) {
    const rows = this.getRows();
    const len = rows.length;
    if (util.isNullOrEmpty(param.keyword) || !param.dataIndex) {
      return [-1, len];
    }
    const { currentIndex = -1 } = param;
    const isTree = this.props.isTree;
    const keyword = util.isString(param.keyword) ? param.keyword.toLowerCase() : param.keyword;
    const dataIndexArray = util.isArray(param.dataIndex) ? param.dataIndex : [param.dataIndex];
    let rowIndex = -1;

    const dataIndexMap = this.getDataIndexMap();

    const isFind = (row) => {
      return dataIndexArray.some((dataIndex) => {
        const { filter } = dataIndexMap[dataIndex] || {};
        if (util.isFunction(filter?.clientFilter)) {
          return filter.clientFilter({ dataIndex, row, value: row[dataIndex], filterValue: param.keyword });
        }
        if (util.isString(keyword)) {
          const str = row[dataIndex] ? (row[dataIndex] + '').toLowerCase() : '';
          return str.includes(keyword);
        }
        if (util.isArray(keyword)) {
          return keyword.includes(row[dataIndex]);
        }
        return row[dataIndex] === keyword;
      });
    };

    let startIndex = currentIndex + 1;

    if (
      isTree &&
      currentIndex > -1 &&
      !rows[currentIndex][this.getExpandField()] &&
      rows[currentIndex].children?.length
    ) {
      startIndex = currentIndex;
    }

    for (let i = startIndex; i < len; i++) {
      const row = rows[i];
      if (i > currentIndex && isFind(row)) {
        rowIndex = i;
        break;
      } else if (isTree && !row[this.getExpandField()] && row.children?.length) {
        let findLevel = 0;
        util.loopChildren(
          row,
          (rr, _, level, count) => {
            if (isFind(rr)) {
              findLevel = level;
              rowIndex = count + i;
              return false;
            }
          },
          row[TREE_LEVEL]
        );
        if (rowIndex > -1) {
          await new Promise((resover) => {
            this.setExpand(i, { level: findLevel, callback: resover });
          });
          break;
        }
      }
    }
    if (rowIndex > -1) {
      this.scrollToItem({ rowIndex, align: 'smart' });
      this.setHighlight(rowIndex);
    } else if (currentIndex > -1) {
      // 如果上一次已经找到，本次未找到，则从头开始
      return this.findKeyword({ ...param, currentIndex: -1 });
    }
    return [rowIndex, this.getRows().length];
  }

  /**
   * 刷新接口
   */
  refreshData() {
    return new Promise((resolve) => {
      this.query(undefined, undefined, resolve);
    });
  }

  refreshRowHeight(immediate = false) {
    this._resetRowHeight({ immediate });
  }

  /**
   * 刷新视图
   */
  refreshView(params: IRefreshParams = {}) {
    const { state, rowColumnIndex, cacheState = false, endEditing = false, callback } = params;
    const newState = util.isFunction(state) ? state(this.state) : state;
    Promise.resolve().then(() => {
      let { rowIndex, columnIndex } = rowColumnIndex || {};
      if (columnIndex !== undefined || rowIndex !== undefined) {
        if (rowIndex === undefined) {
          this.outRef.current?.resetAfterColumnIndex(columnIndex, false);
        } else if (columnIndex === undefined) {
          this.outRef.current?.resetAfterRowIndex(rowIndex, false);
        } else {
          this.outRef.current?.resetAfterIndices({
            rowIndex,
            columnIndex,
            shouldForceUpdate: false
          });
        }
      }
      this.setState(
        {
          ...newState,
          selected: endEditing ? { ...this.state.selected, rowIndex: -1, editing: false } : this.state.selected,
          updateTime: new Date().valueOf()
        },
        () => {
          columnIndex !== undefined && cacheState && this._saveColumnState();
          callback?.();
        }
      );
    });
  }

  /**
   * 通过dataIndex设置列属性
   * @param dataIndex
   * @param props
   */
  setColumnProps(dataIndex, props) {
    this.refreshView({
      state: () => {
        const { columns } = this.state;
        const findColumn = columns.find((c) => c.dataIndex === dataIndex);
        if (findColumn) {
          util.assign(findColumn, util.isFunction(props) ? props(findColumn) : props);
          return { columns: [...columns] };
        }
        return { columns };
      },
      rowColumnIndex: {
        columnIndex: 0
      }
    });
  }

  getRenderRange(): { rowIndex: [number, number]; columnIndex: [number, number] } {
    return this.outRef.current?._rangeToRender || { rowIndex: [0, 0], columnIndex: [0, 0] };
  }

  render() {
    this.updateStateByProps();
    const { className = '', bordered, compact, tabIndex, style = {}, resizeDelay = 16, tableAlertRender } = this.props;
    const gc = this.generateColumns();
    return (
      <div
        id={this.getId(false)}
        ref={this.containerRef}
        style={{ ...style, padding: 0, margin: 0 }}
        tabIndex={tabIndex}
        className={util.classNames(
          'virtual-table',
          className,
          bordered ? ' table-bordered' : '',
          compact ? 'table-compact' : ''
        )}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          {tableAlertRender && gc.aggregates.length > 0 && (
            <div
              key="alert"
              ref={(container) => {
                this.alertObj.container = container;
              }}
              style={{ zIndex: 3 }}
            />
          )}
          <div key="table" className="table-ctx" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <AutoResize onResize={this._onResize} delay={resizeDelay} beforeResize={this._onBeforeResize}>
              <TableGrid columns={gc} state={this.state} props={this.props} table={this} />
              <Spin spinning={this.state.loading} className="mask-loading" />
            </AutoResize>
          </div>
        </div>
      </div>
    );
  }
}

function InnerTable({ outRef, ...cmpProps }) {
  const newProps = syncDefaultProps({ ...cmpProps });
  const {
    dataSource,
    request,
    pagination,
    rowSelection,
    onContextMenu,
    cache = ['column'],
    autoLoad = true,
    rowFilter
  } = newProps;
  const dataRequest = React.useCallback(
    ({ columnFilters = {} }, ins) => {
      const filterKey = Object.keys(columnFilters);
      const dataIndexMap = ins.getDataIndexMap() || {};
      return filterKey.length > 0 ? dataSource.filter(clientColumnFilter(columnFilters, dataIndexMap)) : dataSource;
    },
    [dataSource]
  );

  if (!request && dataSource && pagination) {
    newProps.request = dataRequest;
    newProps.loading = newProps.loading;
    delete newProps.dataSource;
  }

  if (newProps.style?.minHeight) {
    newProps.virtualScrolling = false;
  }

  if (onContextMenu) {
    newProps.rowContextMenu = onContextMenu;
    delete newProps.onContextMenu;
  }

  useAsyncEffect(async () => {
    if (autoLoad && newProps.request) {
      await outRef.current.refreshData();
    }
  }, [newProps.request, autoLoad]);

  useLayoutEffect(() => {
    if (newProps.borderColor) {
      outRef.current?.containerRef.current.style.setProperty('--border-color-split', newProps.borderColor);
    }
  }, [newProps.borderColor]);

  if (newProps.rowFilter && util.isString(newProps.rowFilter)) {
    if (outRef.current && !outRef.current._rowFilter) {
      outRef.current._rowFilter = () => false;
    } else {
      newProps.rowFilter = () => false;
    }
  }

  useEffect(() => {
    if (rowFilter && util.isString(rowFilter)) {
      const arr = rowFilter.split('.');
      if (arr.length > 1) {
        return util.getCmpApi(arr[0])?.subscribe(({ rowIndex, table }) => {
          const mainRow = table.getRow(rowIndex);
          outRef.current._rowFilter = (row) => {
            return mainRow[arr[1]] === row[arr[2] || arr[1]];
          };
          outRef.current.refreshData();
        }, 'clickHighlight');
      }
    }
  }, [rowFilter]);

  if (rowSelection) {
    let { type, checkedField } = rowSelection;
    type = util.isArray(type) ? type : [type];
    if (type.includes(TableSelectionModel.CHECKBOX)) {
      newProps.checkbox = checkedField || true;
      if (type.includes(TableSelectionModel.ROW)) {
        newProps.rowChecked = true;
      }
    }
    if (type.includes(TableSelectionModel.ROW) || type.includes(TableSelectionModel.MULTIPLE_INTERVAL)) {
      newProps.rowSelected = true;
    }
    if (type.includes(TableSelectionModel.MULTIPLE_INTERVAL)) {
      newProps.rowChecked = false;
    }
    if (rowSelection.keyField) {
      newProps.keyField = rowSelection.keyField;
    }
    newProps.rowSelection = { ...rowSelection, type };
  }

  if (cache === true) {
    newProps.cache = ['selected', 'column', 'page'];
  } else if (cache === false) {
    newProps.cache = [];
  } else {
    newProps.cache = cache;
  }
  newProps.remember = newProps.cache.includes('column');

  return <TableClass {...newProps} ref={outRef} />;
}

export const Table = compHoc<TableProps, TableInstance>(InnerTable, '');
