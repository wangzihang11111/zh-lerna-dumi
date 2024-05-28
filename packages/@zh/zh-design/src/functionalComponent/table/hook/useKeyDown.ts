import { useEffect, useMemo } from 'react';
import { emptyFn, util } from '../util';

export function useKeyDown(elRef, deps) {
  const [table, editableColumnIndex, maxRowIndex, editable] = deps;
  const { allColumns } = table.generateColumns();
  const listenerOnDocument = table.props.listenerOnDocument;

  const cb: any = useMemo(() => {
    if (!editable) {
      return emptyFn;
    }

    const startEditing = ({ rowIndex, columnIndex }, { keyCode }: any) => {
      return table.startEditing(
        {
          rowIndex,
          dataIndex: allColumns[columnIndex].dataIndex
        },
        { keyCode }
      );
    };

    const getNextEditColumnIndex = (columnIndex) => {
      return editableColumnIndex.find((c) => c > columnIndex) ?? columnIndex;
    };

    const getPrevEditColumnIndex = (columnIndex) => {
      const arr = editableColumnIndex.filter((c) => c < columnIndex);
      return arr.length > 0 ? arr[arr.length - 1] : Math.max(columnIndex, 0);
    };

    const minColumnIndex = editableColumnIndex[0] || 0;
    const maxColumnIndex = editableColumnIndex[editableColumnIndex.length - 1];

    const addRow = (rowIndex, columnIndex, { keyCode }) => {
      const autoAddRow = table.props.keyBoardToAddRow;
      if (autoAddRow && rowIndex >= maxRowIndex) {
        table.addRows().then(() => {
          startEditing(
            {
              rowIndex: rowIndex + 1,
              columnIndex
            },
            { keyCode }
          );
        });
        return true;
      }
      return false;
    };

    return (e) => {
      const {
        selected: { rowIndex, dataIndex, editing }
      } = table.state;
      const el: any = document.activeElement || {};
      const disabled = table.props.disabled;
      if (disabled === false) return;

      if (el.tagName !== 'BODY' && !util.closest(e.target, (dom) => dom === elRef.current)) {
        // 焦点在其他容器内部
        return;
      }

      const columnIndex = allColumns.findIndex((c) => c.dataIndex === dataIndex);
      const { shiftKey, ctrlKey } = e;
      if (shiftKey && e.keyCode === 16) {
        // 仅按下shift键，直接返回
        return;
      }
      if (editing && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        if ((ctrlKey || shiftKey) && el.tagName === 'TEXTAREA' && e.keyCode === 13) {
          e.nativeEvent.shiftKey = true;
          // shift + enter 直接返回，执行textarea默认行为
          return;
        }
        const start = util.getCursorPosition();
        const end = util.getSelectionEnd();
        if ([37, 39].indexOf(e.keyCode) > -1) {
          if (start !== end) {
            util.setCursorPosition(el, 37 === e.keyCode ? start : end);
            return;
          }
          if ((start > 0 && 37 === e.keyCode) || (start > -1 && start < el.value?.length && 39 === e.keyCode)) {
            return;
          }
        }
      }
      if (table.props.onBeforeEditCellKeyDown?.(e, { rowIndex, columnIndex }) === false) {
        return;
      }
      let retValue = false;
      switch (e.keyCode) {
        case 9: // tab
        case 13: // enter
          if (shiftKey && e.keyCode === 9) {
            // shift+tab
            if (rowIndex === -1 || columnIndex === -1) {
              // 没有选中，则选中末行的最后一个编辑单元格
              retValue = startEditing(
                {
                  rowIndex: maxRowIndex,
                  columnIndex: maxColumnIndex
                },
                e
              );
            } else if (columnIndex === minColumnIndex) {
              // 当前选中在第一个编辑列，跳转到上一行的最后一个编辑单元格
              retValue =
                rowIndex > 0
                  ? startEditing(
                      {
                        rowIndex: rowIndex - 1,
                        columnIndex: maxColumnIndex
                      },
                      e
                    )
                  : true;
            } else {
              // 移动到前一个编辑单元格
              retValue = startEditing(
                {
                  rowIndex,
                  columnIndex: getPrevEditColumnIndex(columnIndex)
                },
                e
              );
            }
          } else {
            if (rowIndex === -1 || columnIndex === -1) {
              // 没有选中，则选中第一行的第一个编辑单元格
              retValue = startEditing(
                {
                  rowIndex: 0,
                  columnIndex: minColumnIndex
                },
                e
              );
            } else if (columnIndex === maxColumnIndex) {
              // 当前选中已经到最后一列，跳转到下一行的第一个编辑单元格
              if (rowIndex < maxRowIndex) {
                retValue = startEditing(
                  {
                    rowIndex: rowIndex + 1,
                    columnIndex: minColumnIndex
                  },
                  e
                );
              } else {
                retValue = addRow(rowIndex, minColumnIndex, e);
              }
            } else {
              // 移动到后一个编辑单元格
              retValue = startEditing(
                {
                  rowIndex,
                  columnIndex: getNextEditColumnIndex(columnIndex)
                },
                e
              );
            }
          }
          break;
        case 35: // end
          retValue = startEditing(
            {
              rowIndex: maxRowIndex,
              columnIndex: Math.max(minColumnIndex, columnIndex)
            },
            e
          );
          break;
        case 36: // home
          retValue = startEditing(
            {
              rowIndex: 0,
              columnIndex: Math.max(minColumnIndex, columnIndex)
            },
            e
          );
          break;
        case 37: // left
          retValue = startEditing(
            {
              rowIndex: Math.max(0, rowIndex),
              columnIndex: getPrevEditColumnIndex(columnIndex)
            },
            e
          );
          break;
        case 38: // up
          retValue = startEditing(
            {
              rowIndex: Math.max(0, rowIndex - 1),
              columnIndex: Math.max(minColumnIndex, columnIndex)
            },
            e
          );
          break;
        case 39: // right
          retValue = startEditing(
            {
              rowIndex: Math.max(0, rowIndex),
              columnIndex: getNextEditColumnIndex(columnIndex)
            },
            e
          );
          break;
        case 40: // down
          if (rowIndex < maxRowIndex) {
            retValue = startEditing(
              {
                rowIndex: rowIndex + 1,
                columnIndex: Math.max(minColumnIndex, columnIndex)
              },
              e
            );
          } else {
            retValue = addRow(rowIndex, Math.max(minColumnIndex, columnIndex), e);
          }
          break;
        default:
          break;
      }

      if (retValue) {
        elRef.current?.focus();
        e.preventDefault();
        e.stopPropagation();
      } else {
        table.notify(e.keyCode, 'keyboardEvent').then();
      }
      table.props.onAfterEditCellKeyDown?.(e, { rowIndex, columnIndex });
    };
  }, deps);

  useEffect(() => {
    if (listenerOnDocument && editable) {
      document.addEventListener('keydown', cb);
      return () => {
        document.removeEventListener('keydown', cb);
      };
    }
  }, [cb, listenerOnDocument, editable]);

  return listenerOnDocument || !editable ? null : cb;
}
