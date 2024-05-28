import type { PaginationProps } from 'antd';
import type { CSSProperties, ReactElement, ReactNode, RefObject } from 'react';
import type { TableSelectionModel, UpdateFlagEnum } from '../base/common';
import type { IObject, Observer, PromiseType, ValueTypeEnum } from '../util';
import type {
  ICheckBoxEditor,
  ICustomizedEditor,
  IDatePickerEditor,
  IExpr,
  IFormat,
  IHelpEditor,
  ISelectEditor,
  ITextEditor
} from './editor';

type ColumnRenderType = (params: {
  table: TableInstance;
  row: IObject;
  value: any;
  dataIndex: string;
  rowIndex: number;
  pageIndex: number;
  pageSize: number;
  onChange?: (val: any) => void;
  inGroup?: boolean;
}) => ReactNode;

type editorType =
  | ITextEditor
  | IDatePickerEditor
  | ICheckBoxEditor
  | ISelectEditor
  | ICustomizedEditor
  | IHelpEditor
  | Boolean;

type aggregateType = 'min' | 'max' | 'avg' | 'sum' | 'count' | 'totalSummary';

export interface ColumnProps {
  /**
   * @description       列标题
   */
  title?: string;
  /**
   * @description       列标题，支持自定义表头单元格
   */
  header?:
    | ((params: { title: string; dataIndex: string; column: any; table: any; inGroup?: boolean }) => ReactNode)
    | String;
  headerTooltip?: boolean;
  /**
   * @description       筛选过滤
   */
  filter?:
    | boolean
    | {
        // 默认 ['filter', 'find']
        type?: ['filter', 'find'] | 'filter' | 'find';
        // 是否启用服务端过滤函数，table的request属性配置时有效
        remoteFilter?: boolean;
        // 过滤字段名称，服务端过滤可能需要
        name?: string;
        // 自定义前端过滤函数
        clientFilter?: (props: { dataIndex: string; row: IObject; value: any; filterValue: any }) => boolean;
        // 图标icon
        icon?: (props: { filtered: boolean; color: 'string' | undefined }) => ReactNode;
        // 自定义下拉菜单
        dropdown?: (props: {
          closeDropdown: () => void;
          table: TableInstance;
          column: ColumnProps;
          onFilter: (params: { type: 'filter' | 'find' }) => Promise<void>;
          onReset: () => void;
          filterValue: any;
          setFilterValue: (value: any) => void;
          filtered: boolean;
        }) => ReactNode;
        // 过滤框组件属性,dropdown未定义时有效
        inputProps?: {
          type: 'text' | 'number' | 'select' | 'checkbox';
          options?:
            | Array<{
                value: any;
                label: ReactNode;
              }>
            | Function;
        };
      };
  /**
   * @description       数据源的字段(必须且唯一，dataIndexField存在时仅作为key使用)
   */
  dataIndex?: string;
  /**
   * @description       数据源的字段（可重复，优先级比dataIndex高）
   */
  dataIndexField?: string | string[];
  /**
   * @description       多语言的key
   */
  langKey?: string;
  /**
   * @description       数据类型
   */
  valueType?: ValueTypeEnum;
  /**
   * @description       表头分组
   */
  groupIn?: string | string[] | Array<({ column }: { column: ColumnProps }) => ReactNode>;
  /**
   * @description       表头分组(嵌套列配置)
   */
  columns?: Array<ColumnProps>;
  /**
   * @description       是否自动合并同列相邻的单元格
   */
  mergeCell?: boolean;
  /**
   * @description       是否支持列宽调整
   */
  resizable?: boolean;
  /**
   * @description       是否支持列顺序调整
   */
  columnSort?: boolean;
  /**
   * @description       是否支持列数据排序(默认前端排序)
   * @default           true
   */
  sortable?: boolean | { local?: boolean; callback?: Function };
  /**
   * @description       是否显示提示
   */
  tooltip?: boolean | ColumnRenderType | 'render' | { overflow: boolean; type: ColumnRenderType | 'render' };
  /**
   * @description       是否显示复制按钮
   */
  copyable?: boolean;
  /**
   * @description       单元格数据水平方向位置
   */
  align?: 'left' | 'center' | 'right';
  /**
   * @description       列头部样式
   */
  headerStyle?: CSSProperties;
  /**
   * @description       单元格样式
   */
  cellStyle?: CSSProperties;
  /**
   * @description       是否隐藏列
   */
  hidden?: boolean;
  /**
   * @description       列固定属性
   */
  fixed?: 'right' | 'left';
  /**
   * @description       绝对列宽，不受flex影响
   */
  offsetWidth?: number;
  /**
   * @description       列宽（配合flex使用时，为最小宽度）
   */
  width?: number;
  /**
   * @description       列宽（占剩余宽度的比例）
   */
  flex?: number;
  /**
   * @description       合计属性配置
   */
  aggregates?: Array<
    | aggregateType
    | {
        title?: ((inGroup) => ReactNode) | String;
        calc?: (columnData, dataSource, dataIndex, inGroup) => PromiseType<ReactNode>;
        type?: aggregateType | 'custom';
        style?: CSSProperties;
        formatter?: (value: any, options: { type: string; data: any[]; dataIndex: string }) => any;
      }
  >;
  /**
   * @description       编辑列属性配置
   */
  editor?:
    | ITextEditor
    | IDatePickerEditor
    | ICheckBoxEditor
    | ISelectEditor
    | ICustomizedEditor
    | IHelpEditor
    | Boolean;
  /**
   * @description       单元格渲染函数
   */
  render?: ColumnRenderType;
  /**
   * @description       格式化显示内容，不改变数据源值($D:所有行、$R:当前行、$V:当前单元格、$DI:dataIndex)
   */
  format?: IFormat;
  /**
   * @description       通过表达式或函数返回计算值，改变数据源的值($D:所有行、$R:当前行、$V:当前单元格、$DI:dataIndex)
   */
  expr?: IExpr;
  /**
   * @description       树形表格单元格编辑时按照级次汇总到父节点
   * @default           false
   */
  levelSummary?: boolean;
}

type AlertObjState = {
  selectedRows: IObject[];
  selectedRowKeys: Array<string | number>;
  aggregateColumns: Array<{
    dataIndex: string;
    aggregates: Array<{ label: string; type: string; formatter: Function }>;
  }>;
};

export interface TableInstance {
  props: TablePropsType<{
    /**
     * @description       点击数据行高亮选中行
     * @default           true
     */
    rowSelected: boolean;
    /**
     * @description       点击checkbox列高亮选中行
     * @default           false
     */
    checkboxSelected: boolean;
  }>;
  settingContainer?: HTMLDivElement;
  alertObj: { container: HTMLDivElement | null; state?: AlertObjState };
  state: IObject;
  _observer: Observer;
  containerRef: RefObject<any>;
  notify: (value: IObject, type: string) => any;
  /**
   * @description       订阅消息事件（暂时支持: 编辑前、编辑后、编辑状态的键盘事件）
   */
  subscribe: (
    fn: Function,
    type:
      | 'startEditing'
      | 'endEditing'
      | 'keyboardEvent'
      | 'onUpdateRow'
      | 'onDataLoad'
      | 'clickHighlight'
      | 'onCellClick'
      | 'onCheckedChange'
      | 'onDataSort' // 点击列数据排序时
      | String
  ) => void;
  /**
   * @description       设置第一个可编辑单元格或上次编辑过的单元格焦点
   */
  focus: () => void;
  /**
   * @description       设置列表加载中状态，一般在需要自己控制数据源状态时使用
   */
  startLoading: () => void;
  /**
   * @description       取消列表加载中状态，配合 startLoading 使用
   */
  endLoading: () => void;
  /**
   * @description       获取当前正在编辑中的单元格编辑器组件
   */
  getActiveEditor: () => any;
  /**
   * @description       设置可编辑单元格为编辑状态
   */
  startEditing: (props: { rowIndex: number; dataIndex: string }) => boolean;
  /**
   * @description       结束编辑状态
   */
  endEditing: () => void;
  /**
   * @description       获取行索引，参数为函数时类似于数组的findIndex
   */
  getRowIndex: (row: IObject | Function) => number;
  /**
   * @description       获取指定行的行数据
   */
  getRow: (rowIndex: number) => object;
  /**
   * @description       根据主键value值获取行数据
   */
  getRowByKey: (keyValue: any) => object;
  /**
   * @description       返回所有行数据
   */
  getRows: () => Array<object>;
  /**
   * @description       设置列属性，参数为函数时当前列状态会作为参数传递，返回新的列属性
   */
  setColumns: (columns: Array<ColumnProps> | Function) => void;
  /**
   * @description       通过dataIndex设置列属性
   */
  setColumnProps: (dataIndex: string, props: Partial<ColumnProps>) => void;
  /**
   * @description       设置数据源， 参数dataSource为函数时当前数据源状态会作为参数传递，参数updateRaw表示是否更新原始数据（默认为true，影响行状态）
   */
  setDataSource: (dataSource: Array<IObject> | Function, updateRaw?: boolean, callback?: (...args) => void) => void;
  /**
   * @description       清空数据源的值，默认设置为null，rowIndex默认为-1，小于0时清空所有行的值
   */
  clearData: (rowIndex?: number, nullValue?: any) => void;
  /**
   * @description       更新行数据，merge默认为true，合并原行数据
   */
  updateRowDataByIndex: (rowIndex: number, rowData: object, merge?: boolean) => void;
  /**
   * @description        更新原数据行
   */
  updateRow: (row: object[] | object, flag?: UpdateFlagEnum) => void;
  /**
   * @description       复制行数据，except可以设置需要排除的字段
   */
  copyRow: (row: number | IObject, except?: string[]) => any;
  /**
   * @description       剪切行数据
   */
  cutRow: (rowIndex?: number) => boolean;
  /**
   * @description       粘贴行数据，配合 copyRow、cutRow 使用
   */
  pasteRow: (rowIndex?: number) => boolean;
  /**
   * @description       增加行，默认从末尾新增，数组表示增加多行
   */
  addRows: (rows?: Array<IObject> | IObject, insertIndex?: number, callback?: (...args) => void) => void;
  /**
   * @description       增加子行，默认从末尾新增，数组表示增加多行
   */
  addChildrenRow: (parentRow: any, rows?: Array<IObject> | IObject, insertIndex?: number) => void;
  updateParent: (row, todo) => void;
  updateChildren: (row, todo) => void;
  /**
   * @description       删除指定索引行
   */
  deleteRows: (rowIndexes: number[] | number | IObject | IObject[]) => void;
  /**
   * @description       删除指定行，如果是树形，会同步删除子节点
   */
  deleteRow: (row: IObject) => void;
  /**
   * @description       删除所有数据行
   */
  clearRows: () => Promise<void>;
  /**
   * @description       删除多选选中的行（需要设置checkbox属性）
   */
  deleteCheckedRows: () => void;
  /**
   * @description       删除单选选中的行
   */
  deleteSelectedRow: () => void;
  /**
   * @description       获取选中的行索引（最近单击选中的行）
   */
  getSelectedIndex: () => number;
  /**
   * @description       获取选中的行数据（最近单击选中的行）
   */
  getSelectedRow: () => IObject | null;
  /**
   * @description       获取checkbox选中的行索引
   */
  getCheckedIndexes: () => Array<number>;
  /**
   * @description       获取checkbox选中的行数据
   */
  getCheckedData: () => Array<IObject>;
  /**
   * @description       若设置了checkbox属性，返回 getCheckedData，否则返回 [getSelectedRow()]
   */
  getSelectedData: () => Array<IObject>;
  /**
   * @description       若设置了checkbox属性，设置行多选，否则选中单行
   */
  setSelected: (rowIndexes: number[] | number, selected?: boolean) => void;
  /**
   * @description       获取列的编辑器api
   */
  getEditor: (dataIndex: string) => {
    getOptions: () => editorType;
    setOptions: (options: editorType | ((editor: editorType) => editorType)) => void;
    addListener: (eventName, listener) => void;
  };
  /**
   * @description       重新发起request请求，覆盖之前的查询参数
   */
  query: (params?: IObject | Function, callback?) => void;
  filter: (keyword: ((row, index) => boolean) | string, dataIndexArr?: Array<string>) => void;
  /**
   * @description       刷新数据源（重新发起请求）
   */
  refreshData: () => Promise<void>;
  refreshView: (params: IRefreshParams) => void;
  getStore: () => any;
  /**
   * @description       覆盖或更新请求的扩展参数，
   */
  setExtraParam: (extraParam, autoLoad?: boolean) => void;
  /**
   * @description       展开数据行，数据行支持展开时有效
   */
  setExpand: (rowIndexes: number | number[], expanded?: boolean | number) => void;
  /**
   * @description       获取错误信息，调用前请先调用validData验证数据
   */
  getErrors: () => Promise<
    IObject<{ dataIndex: string; title: string; rowIndex: number; info: Array<[string, string]> }>
  >;
  /**
   * @description       编辑列表，验证数据源
   */
  validData: (callback?: Function) => boolean;
  /**
   * @description       按列排序数据，参数格式：[{field1: 'asc'}, {field2:'desc'}]
   */
  setOrderBy: (orderBy: object[]) => void;
  /**
   * @description       展开整个树层级
   */
  expandTree: (level: number, strictly?: boolean) => void;
  updateFlag: UpdateFlagEnum;
  isMultipleInterval(): boolean;
  getCheckBoxDataIndex(): string;
  getAggregateData(): IObject[];
  generateColumns(): IObject;
  getKeyField(): string;
  onCheckedChange(checkedData, currentRow, checked): void;
  isRowSelectionDisabled(row): boolean;
  getDataIndexMap(): IObject;
  findKeyword: Function;
  setHighlight(rowIndex: number, options?: { ctrlKey?: boolean; shiftKey?: boolean }): void;
  clearSelected: Function;
}

export interface IRefreshParams {
  state?: IObject | Function;
  rowColumnIndex?: { rowIndex?: number; columnIndex?: number };
  cacheState?: boolean;
  endEditing?: boolean;
  callback?: Function;
}

type IDataIndexProps =
  | {
      [key: string]: ColumnProps | ((column: ColumnProps) => ColumnProps);
    }
  | ((column: ColumnProps) => ColumnProps);

type Menu = ReactElement;

type standardResponse = {
  // 总记录数
  total: number;
  // 当前页记录
  record: Array<IObject>;
  // 返回合计行不同类型汇总数据， 格式 {[dataIndex]: {max: 30, sum: '合计：200'}}
  aggregate?: Record<string, Record<'min' | 'max' | 'avg' | 'sum' | 'count', string | number>>;
  // 仅返回合计行sum总数据， 格式 {[dataIndex]: 200}
  summaryData?: Record<string, string | number>;
};

export declare type TablePropsType<defaultProps> = {
  /**
   * @description       是否缓存原始值
   * @default           false
   */
  cacheRaw?: boolean;
  /**
   * @description       渲染数据行的过滤条件, 字符串的格式为：主表id.主表字段.子表字段
   */
  rowFilter?: string | ((row: IObject) => boolean);
  tabIndex?: number;
  /**
   * @description       是否开启自动滚动
   * @default           false
   */
  autoScroll?: boolean;
  /**
   * @description       状态id，用于标识不同业务点使用相同的列记忆功能
   */
  stateId?: string;
  /**
   * @description       是否开启分页或行选中及列缓存功能
   * @default           ['column']
   */
  cache?: Array<'page' | 'selected' | 'column'> | boolean;
  /**
   * @description       编辑列头图标
   * @default           false
   */
  editColumnIcon?: boolean | (({ table, dataIndex, editor, style }) => ReactNode);
  /**
   * @description       唯一主键字段
   */
  keyField?: string;
  /**
   * @description       展开对应的字段属性
   */
  expandField?: string;
  /**
   * @description       展开列的相关配置信息
   */
  expandCfg?: {
    icon?: (expanded: boolean) => ReactNode;
    dataIndex?: string;
    /**
     * @description    图标占位宽度，最小宽度17，
     */
    width?: number;
    fixed?: boolean;
    defaultExpand?: 'all' | number | ((param: { row; index; level? }) => boolean);
    fitContent?: boolean; // 自动适应列宽，默认true
    showLine?: boolean; // 显示连接线
    block?: boolean; // 选中或hover效果是否包含展开按钮，默认true
  };
  /**
   * @description       表格容器的类名
   */
  className?: string;
  /**
   * @description       表格容器的 style 属性
   */
  style?: CSSProperties;
  /**
   * @description       表格列的配置描述
   */
  columns?: Array<ColumnProps>;
  /**
   * @description       header的高级菜单, 列隐藏或显示功能
   */
  headerMenu?:
    | (({ table }) => ReactNode)
    | boolean
    | { icon?: ReactNode; getContainer?: string | (() => Element | null); inTableAlert?: boolean };
  /**
   * @description       默认加载状态
   */
  defaultLoading?: boolean;
  /**
   * @description       配置固定数据源
   */
  dataSource?: object[];
  /**
   * @description       默认选中行
   */
  defaultSelectedRowIndex?: number | ((ds: any[]) => number);
  /**
   * @description       是否显示行号，支持更高级配置；设为true时，标题为 "行号" ，宽度为 "43px"
   * @default           false
   */
  showRowNumber?:
    | boolean
    | (Partial<ColumnProps> & {
        editOptions?: {
          disabled?: (params: { table: TableInstance; rowIndex: number }) => boolean | Array<'add' | 'delete'>;
          add?: (params: { table: TableInstance; rowIndex: number }) => PromiseType<void>;
          delete?: (params: { table: TableInstance; rowIndex: number }) => PromiseType<void>;
        };
      });
  /**
   * @description       是否支持选择，支持配置行的选中属性，默认选中属性为 "checked"
   * @default           false
   */
  checkbox?: boolean | string;
  /**
   * @description       checkbox配置时，复选框改变时回调函数
   */
  onCheckedChange?: (...args) => void;
  onKeyDown?: (params: { keyCode: number }) => void;
  /**
   * @description       行高（包括border），默认32, 'auto'属于实验性功能（性能考虑不建议使用）
   * @default           32
   */
  rowHeight?: ((rowIndex: number) => number) | number | 'auto';
  /**
   * @description       表头高度
   * @default           39
   */
  headerHeight?: number;
  /**
   * @description       设置行的展开属性
   */
  expandRow?: {
    height: (({ row, rowIndex }) => number) | number;
    render: ({ row, rowIndex, table, style }) => ReactNode;
  };
  /**
   * @description       设置行属性(例如：onClick、onDoubleClick等react事件)
   */
  onRow?: (rowIndex: number, table: any, row: IObject) => IObject;
  /**
   * @description       设置数据行的右键菜单
   */
  rowContextMenu?: (
    row: IObject,
    extra: { table: TableInstance; rowIndex?: number; hidden: Function; dataIndex?: string }
  ) => Menu;
  /**
   * @description       设置表格body的右键菜单
   */
  bodyContextMenu?: (params: { table: TableInstance; rowIndex?: number; hidden: Function; dataIndex?: string }) => Menu;
  /**
   * @description       拖拽行排序，pressDelay(默认200ms)设置拖拽延迟，解决点击事件冲突问题
   */
  rowDrag?:
    | boolean
    | {
        pressDelay?: number; // 仅在按下一定时间后才可排序，可解决与点击事件的冲突
        handleIndex?: string; // 拖拽手柄列
        listeners?: {
          shouldCancelStart?(e, rowIndex): boolean; // 可以通过e.target 或者 rowIndex 条件取消排序
          onSortStart?({ node, index, collection, isKeySorting }, event): void;
          onSortMove?(event): void;
          onSortOver?({ index, oldIndex, newIndex, collection, isKeySorting }, e): void;
          onSortEnd?({ oldIndex, newIndex, collection, isKeySorting }, e): boolean | void;
        };
      }; // 设置拖拽钩子事件
  /**
   * @description       分页配置信息
   */
  pagination?:
    | boolean
    | (PaginationProps & {
        align?: 'left' | 'center' | 'right';
        height?: number;
        pageIndex?: number;
        pageSize?: number;
        targetContainer?: HTMLElement | string;
        leftRender?: ({ table }) => ReactNode;
        rightRender?: ({ table }) => ReactNode;
        onBeforeChange?: (page: number, pageSize?: number) => boolean | Promise<any>;
      });
  /**
   * @description       数据源请求，支持返回promise对象
   */
  request?: (...args) => Promise<Array<IObject> | standardResponse | IObject>;
  /**
   * 查询的时候是否重置索引
   */
  queryResetIndex?: boolean;
  /**
   * @description       拦截请求数据，处理以后返回
   */
  response?: (res: any) => standardResponse;
  /**
   * @description       数据行分组
   */
  groupBy?: string;
  /**
   * @description       数据行分组小计的位置信息
   * @default           'start'
   */
  groupAggregatePosition?: 'start' | 'end';
  /**
   * @description       合计位置信息
   * @default           'end'
   */
  aggregatePosition?: 'start' | 'end';
  /**
   * @description       是否默认展开所有分组，all：展开所有，first：展开第一行
   */
  defaultExpand?: 'all' | 'first';
  columnStateChange?: (...args) => void; // 列状态变化回调
  /**
   * @description       重写对应dataIndex的列属性，一般配合动态列使用
   */
  dataIndexProps?: IDataIndexProps;
  /**
   * @description       数据在单元格的显示位置
   * @default           left
   */
  align?: 'left' | 'center' | 'right';
  onDataLoad?: (...args) => void; // 请求数据返回后
  /**
   * @description       完全受控
   */
  fullyControlled?: boolean;
  /**
   * @description       合计行的单元格样式
   */
  aggregateStyle?: CSSProperties; // 合计行的单元格样式

  optimize?: {
    vertical?: boolean; // 确定视图有垂直滚动条，可以设置这个属性来减少首次的滚动条校准渲染
  };
  /**
   * @description       边框线条颜色
   */
  borderColor?: string;
  /**
   * @description       数据行的选择模式
   */
  rowSelection?: {
    type:
      | TableSelectionModel.MULTIPLE_INTERVAL
      | TableSelectionModel.CHECKBOX
      | TableSelectionModel.ROW
      | Array<TableSelectionModel.CHECKBOX | TableSelectionModel.ROW | TableSelectionModel.MULTIPLE_INTERVAL>;
    keyField?: string; // 唯一key属性字段
    checkedField?: string; // checkbox选中属性字段
    disabled?: (row: any) => boolean;
    autoCheckedChildren?: boolean; // checkbox 模式自动选择tree的子节点
  };
  /**
   * @description       自定义批量操作工具栏信息区域, false 时不显示(在checkbox选择模式下有效)
   * @default           true
   */
  tableAlertRender?:
    | ((params: { selectedRowKeys: Array<string | number>; selectedRows: IObject[]; onClear: Function }) => ReactNode)
    | boolean;
  /**
   * @description       单元格编辑模式激活方式
   * @default           click
   */
  activeCellEditor?: 'click' | 'doubleClick';
  /**
   * @description       子表数据源
   */
  subTable?: IObject<{
    dataSource: [string, ((row: any) => any[] | Promise<any[]>)?];
    busKey?: string;
    busFields?: Array<string>;
  }>;
  /**
   * @description       编辑状态，是否禁用所有编辑器，优先级最低
   * @default           false
   */
  disabled?: boolean | (({ row, dataIndex }) => boolean);
  /**
   * @description       编辑状态，是否禁用所有编辑器，优先级最高
   * @default           false
   */
  readOnly?: boolean | (({ row, dataIndex }) => boolean);
  onBeforeEditCellKeyDown?: (e, { rowIndex, columnIndex }) => boolean | undefined;
  onAfterEditCellKeyDown?: (e, { rowIndex, columnIndex }) => void;
} & Partial<defaultProps>;
