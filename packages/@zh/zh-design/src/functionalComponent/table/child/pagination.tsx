import { Pagination } from 'antd';
import { PaginationProps } from 'antd/lib/pagination';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { DsContext } from '../base/common';
import { TableInstance } from '../interface';
import { cssVar, useResize, util } from '../util';

const TablePagination = React.memo<{ table: TableInstance }>(({ table }) => {
  useContext(DsContext);
  const pageRef = useRef<any>();
  const pagination = table.props.pagination
    ? table.props.pagination === true
      ? {}
      : table.props.pagination
    : { height: 0 };
  const {
    align = 'right',
    height = 48,
    leftRender,
    targetContainer = null,
    rightRender,
    onBeforeChange,
    onChange,
    hideOnSinglePage = false,
    ...others
  } = pagination;
  const { pageIndex = 1, pageSize = 15 } = table.state.params;
  const flexStyle = { left: 'flex-start', right: 'flex-end', center: 'center' };
  const [state, setState] = useState({ pageIndex, pageSize });

  const [width, setWidth] = useState(0);

  const paginationProps: PaginationProps = {
    size: 'small',
    showSizeChanger: true,
    showQuickJumper: true,
    showLessItems: true,
    hideOnSinglePage,
    total: table.state.total,
    pageSizeOptions: ['15', '30', '100', '500', '1000'],
    showTotal: (total, range) => `第${range[0]}-${range[1]} 条/总共 ${total} 条`,
    onChange: async (pageIndex, pageSize) => {
      if (table.state.loading) {
        return;
      }
      if (onBeforeChange) {
        if ((await onBeforeChange(pageIndex, pageSize)) === false) {
          return;
        }
      }
      setState((prev) => ({ ...prev, pageIndex, pageSize }));
      table.setExtraParam({ pageIndex, pageSize, __isPagination__: true });
    },
    style: {
      flexWrap: 'nowrap',
      whiteSpace: 'nowrap'
    },
    ...others,
    current: state.pageIndex,
    pageSize: state.pageSize
  };

  if (width < 590) {
    paginationProps.showQuickJumper = false;
    if (width < 490) {
      paginationProps.showSizeChanger = false;
    }
    if (width < 300) {
      paginationProps.showTotal = undefined;
    }
    if (width < 200) {
      paginationProps.simple = true;
    }
  }

  const isSinglePage = hideOnSinglePage && table.state.total <= state.pageSize;
  const targetEl: any = util.isString(targetContainer)
    ? document.getElementById(targetContainer as string)
    : targetContainer;

  useEffect(() => {
    if (pageIndex !== state.pageIndex || pageSize !== state.pageSize) {
      setState({ pageIndex, pageSize });
      onChange?.(pageIndex, pageSize);
    }
  }, [pageIndex, pageSize]);

  useEffect(() => {
    if (
      !table.state.loading &&
      state.pageIndex > 1 &&
      Math.ceil(table.state.total / state.pageSize) < state.pageIndex
    ) {
      table.setExtraParam({ pageIndex: 1, __isPagination__: true });
    }
  }, [isSinglePage, table.state.total, state.pageIndex, state.pageSize]);

  useEffect(() => {
    if (hideOnSinglePage && !targetEl) {
      table._observer.notify({ height: isSinglePage ? 0 : 48 }, 'hideOnSinglePage').then();
    }
  }, [isSinglePage, hideOnSinglePage, targetEl]);

  useEffect(() => {
    if (!targetEl || !pageRef.current) {
      return;
    }
    if (window.IntersectionObserver) {
      let io: any = new IntersectionObserver(
        (entries) => {
          if (pageRef.current) {
            if (entries[0].isIntersecting) {
              pageRef.current.style.display = 'flex';
            } else {
              pageRef.current.style.display = 'none';
            }
          }
        },
        {
          root: table.containerRef.current.parentElement,
          threshold: [0, 1]
        }
      );
      io.observe(table.containerRef.current);
      return () => {
        io.disconnect();
        io = null;
      };
    }
  }, [targetEl, pageRef.current]);

  useResize(() => {
    if (height) {
      setWidth(pageRef.current?.offsetWidth || 0);
    }
  }, pageRef);

  if (!height || isSinglePage) {
    return null;
  }

  const children = (
    <div
      ref={pageRef}
      className="table-pagination"
      style={{
        display: 'flex',
        whiteSpace: 'nowrap',
        zIndex: 3,
        background: cssVar.componentColor,
        height,
        alignItems: 'center',
        justifyContent: flexStyle[align] || align
      }}
    >
      {leftRender && leftRender({ table })}
      <Pagination {...paginationProps} />
      {rightRender && rightRender({ table })}
    </div>
  );

  return targetEl ? ReactDOM.createPortal(children, targetEl) : children;
});

export { TablePagination };
