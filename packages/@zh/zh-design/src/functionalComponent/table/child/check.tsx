import { Checkbox } from 'antd';
import React, { ReactNode, useContext, useLayoutEffect, useState } from 'react';
import { areEqual, CellTypeEnum, DsContext, TableSelectionModel, UpdateFlagEnum } from '../base/common';
import { TableInstance } from '../interface';
import { IObject, stopPropagation, useRefCallback, useZhEffect, util } from '../util';

const updateState = [UpdateFlagEnum.ForceUpdate, UpdateFlagEnum.ColumnChecked];

function isDisabled({ checkDisabled, row, dataIndex, table }) {
  if ([CellTypeEnum.AggregateCell, CellTypeEnum.ExpandRowCell].includes(row.cellType)) {
    return true;
  }
  return util.isFunction(checkDisabled) ? checkDisabled({ row, dataIndex }) : !!table.isRowSelectionDisabled(row);
}

export function loopChildren(
  table,
  row,
  dataIndex,
  checked,
  rowIndex,
  loop = false,
  updateRows: IObject[] = [],
  checkDisabled: Function | undefined = undefined
) {
  if (!row) {
    return false;
  }
  const children = row.children;
  const defaultChecked = !!row[dataIndex];
  if (defaultChecked !== checked) {
    if (!isDisabled({ checkDisabled, row, dataIndex, table })) {
      row[dataIndex] = checked;
      row.__update__ = { rowIndex, dataIndex };
      updateRows.push(row);
    }
  }
  const needLoop = loop || table.props.rowSelection?.autoCheckedChildren !== false;
  if (needLoop && children) {
    for (let i = 0, len = children.length; i < len; i++) {
      loopChildren(table, children[i], dataIndex, checked, rowIndex, needLoop, updateRows, checkDisabled);
    }
  }
  return !!row.__update__;
}

/**
 * 表头复选框
 */
export const AllCheckBox = React.memo<{
  table: TableInstance;
  dataIndex?: string;
  checkDisabled?: Function;
  children?: ReactNode;
}>(
  ({ table, dataIndex: checkedDataIndex, checkDisabled, children }) => {
    const dataSource = useContext(DsContext);
    const dataIndex = checkedDataIndex || table.getCheckBoxDataIndex();

    const [state, setState] = useState({ checked: false, indeterminate: false });
    const onCheckedHandler = useRefCallback((e) => {
      const checked = e.target.checked;
      const checkedData: any = [];
      const updateRows: any = [];
      setState({ checked, indeterminate: false });
      for (let i = 0, len = dataSource.length; i < len; i++) {
        const row = dataSource[i];
        if (loopChildren(table, row, dataIndex, checked, i, false, [], checkDisabled)) {
          updateRows.push(row);
        }
        if (row[dataIndex]) {
          checkedData.push(row);
        }
      }
      table.onCheckedChange(checkedData, updateRows, checked);
    });

    useZhEffect(() => {
      setState(() => {
        let [checkedSize, disabledSize] = [0, 0];
        const dataSize = dataSource.length;
        dataSource.forEach((r) => {
          if (r[dataIndex]) {
            checkedSize++;
          } else if (isDisabled({ checkDisabled, row: r, dataIndex, table })) {
            disabledSize++;
          }
        });
        const calcSize = checkedSize + disabledSize;
        return {
          checked: dataSize === calcSize && dataSize > 0,
          indeterminate: checkedSize > 0 && calcSize < dataSize
        };
      });
    }, [dataSource]);

    return (
      <Checkbox
        {...state}
        onClick={stopPropagation}
        style={{ margin: 'auto' }}
        onChange={onCheckedHandler}
        children={children}
      />
    );
  },
  (p, n) => {
    if (updateState.includes(n.table.updateFlag)) {
      return false;
    }
    return areEqual(p, n);
  }
);

/**
 * 表体复选框
 * @param row
 * @param dataIndex
 * @param rowIndex
 * @param checkDisabled 自定义disabled权限
 * @constructor
 */
export const RowCheckBox = React.memo<{
  table: TableInstance;
  row: IObject;
  dataIndex: string;
  rowIndex: number;
  checkDisabled?: Function;
}>(
  ({ table, row, dataIndex, rowIndex, checkDisabled }) => {
    const [checked, setChecked] = useState(row[dataIndex]);

    const checkedHandler = useRefCallback((checked) => {
      if (checked === row[dataIndex]) {
        return;
      }
      const { dataSource } = table.state;
      loopChildren(table, row, dataIndex, checked, rowIndex, false, [], checkDisabled);
      const checkedData = dataSource.filter((r) => r[dataIndex] === true);
      table.onCheckedChange(checkedData, row, checked);
    });

    useZhEffect(() => {
      if (checked !== row[dataIndex]) {
        setChecked(row[dataIndex]);
      }
    }, [row, row[dataIndex]]);

    useLayoutEffect(() => {
      checkedHandler(checked);
    }, [checked]);

    const disabled = isDisabled({ checkDisabled, row, dataIndex, table });
    const rowSelectionType = table.props.rowSelection?.type;

    if (disabled) {
      return checkDisabled ? (
        <div className="cover-cell">
          <Checkbox disabled className="cover-cell" checked={checked} />
        </div>
      ) : null;
    }

    const clickHandler = (e) => {
      stopPropagation(e);
      if (
        table.props.rowSelected &&
        table.props.checkboxSelected &&
        rowSelectionType !== TableSelectionModel.MULTIPLE_INTERVAL
      ) {
        table.setHighlight(rowIndex, { ctrlKey: false, shiftKey: false });
      }
    };

    const onCheckClick = (e) => {
      setChecked(e.target.checked);
    };

    return (
      <div className="cover-cell" onClick={clickHandler}>
        <Checkbox className="cover-cell" onChange={onCheckClick} checked={checked} />
      </div>
    );
  },
  (p, n) => {
    if (n.row.__update__ || updateState.includes(n.table.updateFlag)) {
      return false;
    }
    return areEqual(p, n);
  }
);
