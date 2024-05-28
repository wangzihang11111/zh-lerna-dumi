import React, { CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { TableContext } from '../base/common';
import { TableInstance } from '../interface';
import { stopPropagation } from '../util';

/**
 * 展开折叠按钮
 * @param row
 * @param rowIndex
 * @param icon
 * @param style
 * @constructor
 */
export const ExpandIcon = React.memo<{
  table: TableInstance;
  row: any;
  rowIndex: number;
  icon: any;
  style?: CSSProperties;
}>(({ row, rowIndex, icon, style = {} }) => {
  const { table } = useContext(TableContext);
  const expandField = table.getExpandField();
  const spanRef = useRef<HTMLSpanElement>(null);
  const [expand, setExpand] = useState(row[expandField]);
  const switchExpand = (e) => {
    stopPropagation(e);
    setExpand(!expand);
    table.setExpand(rowIndex, !expand);
  };

  useEffect(() => {
    setExpand(row[expandField]);
  }, [row[expandField]]);

  if (icon) {
    return (
      <span ref={spanRef} className="row-expand-icon" style={style} onClick={switchExpand}>
        {icon(expand)}
      </span>
    );
  }
  return (
    <span ref={spanRef} className="default-icon row-expand-icon" style={style} onClick={switchExpand}>
      <span className={`${expand ? ' row-expand-icon-expanded' : ''}`} />
    </span>
  );
});
