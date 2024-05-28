import { Table, type TableInstance, type TableProps } from '../../functionalComponent/table';
import { compHoc, zh, ZhComponent, type IObject } from '../../util';

interface IResult<P> {
  isChanged: boolean;
  table: P;
}

declare type NewDataType = {
  key: string;
  newRow: Array<Record<string, any>>;
};

declare type ChangeDataType = NewDataType & {
  modifiedRow: Array<Record<string, any>>;
  deletedRow: Array<Record<string, any>>;
};

export interface ITableInstance extends TableInstance {
  /**
   * @description              返回行状态全是新增的json格式数据【返回格式同ExtUx.js的GetAllGridData方法】
   */
  getAllDataForNew: () => IResult<NewDataType>;
  /**
   * @description        返回所有数据行，包含行状态
   */
  getAllData: (ignoreUnChanged?: boolean) => IResult<ChangeDataType & { unChangedRow: Array<Record<string, any>> }>;
  /**
   * @description        返回更新的行
   */
  getChange: (config: {
    initRows?: any[];
    flatSubTable?: boolean;
    ignoreUnChanged?: boolean;
  }) => IResult<ChangeDataType>;
  /**
   * @description        数据源是否变化
   * @default            false
   */
  isChanged: () => boolean;
}

export interface GridPropsType extends TableProps {
  /**
   * @description        业务主键，多个用英文逗号分隔
   */
  busKey?: string;
  /**
   * @description       业务字段，用于返回数据行时字段过滤（默认返回全部字段）
   */
  busFields?: Array<string>;
}

const defaultResponse = (res: any) => {
  if (res && res.hasOwnProperty('total')) {
    return res;
  } else if (res && res.hasOwnProperty('totalRows') && res.hasOwnProperty('Record')) {
    return { total: res.totalRows, list: res.Record };
  } else {
    return res || [];
  }
};

/**
 * 过滤数据行字段
 * @param row 原始数据行
 * @param busFields 业务字段
 * @param keyValues 主键值
 * @param dataIndexMap
 * @param exclude
 */
function filterRowByBusFields(row, busFields, keyValues, dataIndexMap, exclude: string[] = []) {
  const fields = busFields || Object.keys(row);
  const newData: any = {};
  fields.forEach((c) => {
    !exclude.includes(c) && (newData[c] = zh.convertData(row[c], dataIndexMap?.[c]?.valueType));
  });
  newData.key = keyValues;
  return newData;
}

/**
 * 展平数据行
 */
function flatRows<T = IObject>(rows): Array<T> {
  const tmpRows: Array<T> = [];
  rows?.forEach(({ children, __update__, ...row }: any) => {
    tmpRows.push(row);
    children?.length && Array.prototype.push.apply(tmpRows, flatRows(children));
  });
  return tmpRows;
}

function areEqual(oldRow, newRow, exceptFields) {
  const oldKeys = Object.keys(oldRow).filter((k) => !exceptFields.includes(k));
  const newKeys = Object.keys(newRow).filter((k) => !exceptFields.includes(k));
  if (oldKeys.length !== newKeys.length) {
    return false;
  }
  return !newKeys.some((p) => {
    return zh.jsonString(newRow[p]) !== zh.jsonString(oldRow[p]);
  });
}

/**
 * 面向业务的Grid组件
 * @param busKey 业务主键，多个用英文逗号分隔
 * @param busFields 业务字段，用于返回数据行时字段过滤（默认返回全部字段）
 */
export const Grid = compHoc<GridPropsType>(
  class extends ZhComponent<GridPropsType> {
    private readonly busKey: string;
    private _initRows: any[] | undefined = undefined;

    constructor(props) {
      super(props);
      this.busKey = props.busKey;
    }

    getBusKey() {
      return this.busKey || this._compIns.getApi(false).getKeyField('keyField') || 'id';
    }

    /**
     * 获取子表的数据源属性
     */
    private _getSubTableDataKeys(subTable) {
      return subTable
        ? Object.keys(subTable).map((id) => {
            return subTable[id].dataSource[0];
          })
        : [];
    }

    private _getSubTableDataIndexMap(id) {
      return zh.getCmpApi(id)?.getDataIndexMap() || {};
    }

    private _getSubKeyFields(id) {
      const api = zh.getCmpApi(id);
      if (api) {
        return [api.getCheckBoxDataIndex(), api.getExpandField()];
      }
      return [];
    }

    private _loopSubTableByRowState(parent, subTable, rowState, oldParent?) {
      if (subTable) {
        const subIds = Object.keys(subTable);
        if (subIds.length > 0) {
          const ret = { subTable: {} };
          const subTableDataKeys = this._getSubTableDataKeys(subTable);
          Object.keys(subTable).forEach((id) => {
            const rows = flatRows(parent[subTable[id].dataSource[0]]);
            const busKey =
              subTable[id].busKey || zh.getCmpApi(id)?.getProps().busKey || zh.getCmpApi(id)?.getKeyField();
            if (rowState === 'modifiedRow') {
              const oldRows = flatRows(oldParent?.[subTable[id].dataSource[0]]);
              ret.subTable[id] = this._getResultTable({
                newRows: rows,
                oldRows,
                busKey,
                exceptFields: this._getSubKeyFields(id),
                dataIndexMap: this._getSubTableDataIndexMap(id),
                subTable: zh.getCmpApi(id)?.getProps().subTable
              });
            } else {
              ret.subTable[id] = {
                isChanged: rowState !== 'unChangedRow' && rows.length > 0,
                table: {
                  key: busKey,
                  [rowState]: rows.map((row) => {
                    return {
                      row: filterRowByBusFields(
                        row,
                        subTable[id].busFields || zh.getCmpApi(id)?.getProps().busFields,
                        null,
                        this._getSubTableDataIndexMap(id),
                        [this._getSubKeyFields(id), ...subTableDataKeys]
                      ),
                      ...this._loopSubTableByRowState(row, zh.getCmpApi(id)?.getProps().subTable, rowState)
                    };
                  })
                }
              };
            }
          });
          return ret;
        }
      }
      return {};
    }

    _getResultTable({ newRows, oldRows, busKey, exceptFields, dataIndexMap, subTable, ignoreUnChanged = false }) {
      const subTableDataKeys = this._getSubTableDataKeys(subTable);
      let busKeys = zh.split(busKey);
      const filterFields = [...exceptFields, ...subTableDataKeys];

      const result: any = {
        isChanged: false,
        table: {
          key: busKey,
          unChangedRow: [],
          modifiedRow: [],
          newRow: [],
          deletedRow: []
        }
      };

      const oldMap = new Map<string, any>();
      oldRows.forEach((r) => {
        const values = busKeys.reduce<any[]>((p, c) => {
          !zh.isNullOrEmpty(r[c]) && p.push(r[c]); // 原始数据主键为空时为无效数据
          return p;
        }, []);
        values.length === busKeys.length && oldMap.set(values.join(','), r);
      });
      newRows.forEach((dataRow) => {
        const values = busKeys
          .reduce<string[]>((p, c) => {
            p.push(dataRow[c] ?? '');
            return p;
          }, [])
          .join(',');
        if (oldMap.has(values)) {
          const oldRow = oldMap.get(values);
          if (areEqual(oldRow, dataRow, exceptFields)) {
            // 未更新的数据行
            !ignoreUnChanged &&
              result.table.unChangedRow.push({
                row: filterRowByBusFields(dataRow, this.props.busFields, values, dataIndexMap, filterFields),
                ...this._loopSubTableByRowState(dataRow, subTable, 'unChangedRow')
              });
          } else {
            // 更新的数据行
            result.table.modifiedRow.push({
              row: filterRowByBusFields(dataRow, this.props.busFields, values, dataIndexMap, filterFields),
              ...this._loopSubTableByRowState(dataRow, subTable, 'modifiedRow', oldRow)
            });
          }
          // 删除已经处理的行，剩下的为删除状态
          oldMap.delete(values);
        } else {
          // 新增的数据行
          result.table.newRow.push({
            row: filterRowByBusFields(dataRow, this.props.busFields, null, dataIndexMap, [...busKeys, ...filterFields]),
            ...this._loopSubTableByRowState(dataRow, subTable, 'newRow')
          });
        }
      });

      oldMap.forEach((row) => {
        // 删除的数据行
        result.table.deletedRow.push({
          row: filterRowByBusFields(
            row,
            this.props.busFields,
            busKeys.map((k) => row[k] || '').join(','),
            dataIndexMap,
            filterFields
          ),
          ...this._loopSubTableByRowState(row, subTable, 'deletedRow')
        });
      });

      ['newRow', 'modifiedRow', 'deletedRow', 'unChangedRow'].forEach((key) => {
        if (result.table[key].length === 0) {
          delete result.table[key];
        } else if (key !== 'unChangedRow') {
          result.isChanged = true;
        }
      });

      if (ignoreUnChanged) {
        delete result.table.unChangedRow;
      }

      return result;
    }

    /**
     * 返回行状态全是新增的json格式数据【返回格式同ExtUx.js的GetAllGridData方法】
     */
    getAllDataForNew(simple = true) {
      const { subTable } = this.props;
      const { getStore, getDataIndexMap, getKeyField } = this._compIns.getApi(false);
      const [store, dataIndexMap, keyField, subTableDataKeys] = [
        getStore(),
        getDataIndexMap(),
        getKeyField(),
        this._getSubTableDataKeys(subTable)
      ];
      const rows = flatRows(store.data);
      return {
        isChanged: rows.length > 0,
        table: {
          key: this.getBusKey(),
          newRow: rows.map((row) => {
            return {
              row: filterRowByBusFields(row, this.props.busFields, null, dataIndexMap, [keyField, ...subTableDataKeys]),
              ...this._loopSubTableByRowState(row, subTable, 'newRow')
            };
          })
        }
      };
    }

    /**
     * 返回所有数据行，包含行状态
     */
    getAllData(ignoreUnChanged = false) {
      const { subTable } = this.props;
      const { getStore, getDataIndexMap, getCheckBoxDataIndex, getExpandField } = this._compIns.getApi(false);
      const [store, dataIndexMap, checkDataIndex, expandField] = [
        getStore(),
        getDataIndexMap(),
        getCheckBoxDataIndex(),
        getExpandField()
      ];
      const [raw, data] = [flatRows(this._initRows || store.raw), flatRows(store.data)];

      return this._getResultTable({
        newRows: data,
        oldRows: raw,
        busKey: this.getBusKey(),
        exceptFields: [checkDataIndex, expandField],
        dataIndexMap,
        subTable,
        ignoreUnChanged
      });
    }

    /**
     * 返回更新的行
     */
    getChange({ initRows, flatSubTable = true, ignoreUnChanged = true, simple = true }: any = {}) {
      const { subTable } = this.props;
      this._initRows = initRows;
      if (subTable && flatSubTable) {
        return this._getChangeBySubTableMerge(ignoreUnChanged);
      }
      const result = this.getAllData(ignoreUnChanged);
      if (subTable && result.isChanged && ignoreUnChanged) {
        result.table.modifiedRow?.forEach((r) => {
          if (r.subTable) {
            Object.keys(r.subTable).forEach((subName) => {
              delete r.subTable[subName].table.unChangedRow;
            });
          }
        });
      }
      if (simple) {
        return Object.keys(result.table).reduce((prev, key) => {
          const data: Array<any> = result.table[key];
          if (zh.isArray(data)) {
            prev[key] = data.map(({ row }) => row);
          }
          return prev;
        }, {});
      }
      return result;
    }

    /**
     * 返回更新的行
     */
    private _getChangeBySubTableMerge(ignoreUnChanged = true) {
      const { subTable } = this.props;
      const result = this.getAllData(ignoreUnChanged);
      if (subTable && (result.isChanged || !ignoreUnChanged)) {
        const ret: any = {
          isChanged: true,
          table: { key: result.table.key },
          subTable: {}
        };
        const keys = ['newRow', 'modifiedRow', 'deletedRow'];
        !ignoreUnChanged && keys.push('unChangedRow');

        keys.forEach((mKey) => {
          if (result.table.hasOwnProperty(mKey)) {
            ret.table[mKey] = result.table[mKey].map((r) => {
              if (r.subTable) {
                Object.keys(r.subTable).forEach((subName) => {
                  ret.subTable[subName] = ret.subTable[subName] || {
                    isChanged: false,
                    table: { key: r.subTable[subName].table.key }
                  };
                  keys.forEach((dKey) => {
                    const subData = r.subTable[subName].table;
                    if (subData.hasOwnProperty(dKey)) {
                      const data = ret.subTable[subName].table[dKey] || [];
                      Array.prototype.push.apply(data, subData[dKey]);
                      if (data.length > 0) {
                        ret.subTable[subName].isChanged = true;
                        ret.subTable[subName].table[dKey] = data;
                      }
                    }
                  });
                });
              }

              return { row: r.row };
            });
          }
        });
        return ret;
      }
      return result;
    }

    /**
     * 数据源是否变化
     */
    isChanged() {
      return this.getAllData(true).isChanged;
    }

    render() {
      const { busKey, busFields, ...props } = this.props;
      return <Table ref={this.outRef} cacheRaw={true} response={defaultResponse} {...props} />;
    }
  },
  'Grid'
);
