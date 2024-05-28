import { EnvironmentOutlined, FilterFilled, SearchOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { CheckboxGroup, Input, Select } from '../../../baseComponent';
import { Button } from '../../antd/Button';
import { ColumnProps, TableInstance } from '../interface';
import { clientColumnFilter, cssVar, stopPropagation, useApi, useRefCallback, useUpdateEffect, util } from '../util';

function isEmpty(keyword) {
  return util.isNullOrEmpty(keyword) || (util.isArray(keyword) && keyword.length === 0);
}

/**
 * 筛选按钮
 * @param column
 * @constructor
 */
export const FilterIcon = React.memo<{ table: TableInstance; column: ColumnProps }>(({ table, column }) => {
  const {
    state: {
      params: { pageIndex, pageSize }
    }
  } = table;

  const dataIndexMap = table.getDataIndexMap();
  const { dataIndex, dataIndexField, filter, title, render } = column as any;
  const [visible, setVisible] = useState(false);
  const [filterValue, setFilterValue] = useState('');
  const [filtered, setFiltered] = useState(false);
  const [{ index: findIndex }, setFind] = useState({ index: -1 });
  const innerRef = useRef({ lastValue: '', oType: '' });
  const searchInput = useApi();
  const selectOptions = useRef<any>();
  const di = dataIndexField || dataIndex;
  const filterType = filter.type ? (util.isArray(filter.type) ? filter.type : [filter.type]) : ['filter', 'find'];

  useUpdateEffect(() => {
    innerRef.current.oType = '';
    setFind((prev) => (prev.index !== -1 ? { index: -1 } : prev));
  }, [filterValue]);

  useEffect(() => {
    if (!filtered && selectOptions.current) {
      selectOptions.current = null;
    }
  }, [filtered]);

  useEffect(() => {
    return table.subscribe(() => {
      setFiltered(false);
    }, 'onDataLoad');
  }, []);

  const handleVisibleChange = (flag) => {
    setVisible(flag);
    // 显示时恢复前一次的筛选值,并选中
    if (flag) {
      setFilterValue(innerRef.current.lastValue);
      setTimeout(() => searchInput.current?.getApi().select?.(), 100);
    }
  };

  const closeDropdown = useRefCallback(() => {
    setVisible(false);
  });

  const generateParams = ({ columnFilters = {}, ...others }, keyword) => {
    const fieldName = filter.name || dataIndex;
    if (isEmpty(keyword)) {
      delete columnFilters[fieldName];
    } else {
      columnFilters[fieldName] = keyword;
    }
    return {
      ...others,
      columnFilters: { ...columnFilters }
    };
  };

  const asyncFilter = (keyword) => {
    return new Promise((resolve) => {
      table.query(
        (params) => generateParams(params, keyword),
        (r) => {
          resolve(r);
        }
      );
    });
  };

  // 过滤
  const onFilter = useRefCallback(async ({ type = 'filter' }) => {
    if (!filterType.includes(type)) {
      return;
    }
    innerRef.current.lastValue = filterValue;
    innerRef.current.oType = type;
    if (type === 'find') {
      if (!util.isNullOrEmpty(filterValue)) {
        const [find] = await table.findKeyword({
          keyword: filterValue,
          dataIndex: di,
          currentIndex: findIndex
        });
        setFind({ index: find });
      }
    } else {
      if (filter.remoteFilter && table.props.request) {
        await asyncFilter(filterValue);
      } else {
        const { columnFilters } = generateParams(table.state.params, filterValue);
        table.filter(clientColumnFilter(columnFilters, dataIndexMap));
      }
      setFiltered(!isEmpty(filterValue));
    }
  });

  // 重置
  const onReset = useRefCallback(() => {
    setFilterValue('');
  });

  const getDataOptions = useRefCallback(() => {
    if (!selectOptions.current) {
      const ws = new Set();
      const result: Array<any> = [];
      const loop = (rows) => {
        rows.forEach(({ children, ...row }: any) => {
          const value = util.getObjValue(row, di);
          if (!ws.has(value)) {
            ws.add(value);
            result.push({
              value,
              label: render
                ? render({
                    table,
                    row,
                    value,
                    dataIndex,
                    rowIndex: table.getRowIndex(row),
                    pageIndex,
                    pageSize
                  })
                : value
            });
          }

          children?.length && loop(children);
        });
      };
      loop(table.getStore().data);
      selectOptions.current = result;
    }
    return selectOptions.current;
  });

  // 获取默认的过滤输入框
  const getDefaultInput = useRefCallback(() => {
    const { type = 'text', options } = filter.inputProps || {};
    if (type === 'select') {
      const selectProps: any = {
        value: filterValue,
        style: { width: '100%' },
        placeholder: `请选择${title || dataIndex}`,
        onChange: (value) => {
          setFilterValue(value?.value);
        }
      };
      if (options) {
        if (util.isFunction(options)) {
          selectProps.request = () => options({ dataIndex });
        } else {
          selectProps.data = options;
        }
      } else {
        selectProps.request = getDataOptions;
      }
      return <Select ref={searchInput} {...selectProps} />;
    }
    if (type === 'checkbox') {
      const checkboxProps: any = {
        value: filterValue,
        onChange: (value) => {
          setFilterValue(value);
        }
      };
      if (options) {
        checkboxProps.data = util.isFunction(options) ? options({ dataIndex }) : options;
      } else {
        checkboxProps.data = getDataOptions();
      }
      return <CheckboxGroup ref={searchInput} {...checkboxProps} />;
    }
    return (
      <Input
        ref={searchInput}
        value={filterValue}
        type={type}
        onChange={(v) => {
          setFilterValue(v);
        }}
        onPressEnter={() => onFilter({ type: filterType.includes('find') ? 'find' : 'filter' })}
        placeholder={`请输入${title || dataIndex}`}
      />
    );
  });

  const dropdownRender = useRefCallback(() => (
    <div
      style={{
        backgroundColor: 'var(--component-background)',
        boxShadow: '0 3px 6px -4px rgba(0,0,0,.12), 0 6px 16px 0 rgba(0,0,0,.08), 0 9px 28px 8px rgba(0,0,0,.05)',
        borderRadius: 'var(--border-radius)'
      }}
    >
      <div style={{ padding: 8 }}>
        {filter.dropdown ? (
          filter.dropdown({
            closeDropdown,
            table,
            column,
            onFilter,
            onReset,
            filterValue,
            setFilterValue,
            filtered
          })
        ) : (
          <div style={{ minWidth: 200 }}>
            {getDefaultInput()}
            <div style={{ lineHeight: '18px', fontSize: 12, height: `${filterType.includes('find') ? 18 : 0}px` }}>
              {filterType.includes('find') && !util.isNullOrEmpty(filterValue) && innerRef.current.oType === 'find'
                ? findIndex === -1
                  ? `未找到${filterValue}`
                  : `第${findIndex + 1}行`
                : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <a onClick={onReset} style={{ flex: 1 }}>
                重置
              </a>
              {filterType.includes('find') && (
                <Button
                  className="btn-compact"
                  style={{ marginLeft: 8 }}
                  size="small"
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  onClick={() => onFilter({ type: 'find' })}
                >
                  定位
                </Button>
              )}
              {filterType.includes('filter') && (
                <Button
                  className="btn-compact"
                  style={{ marginLeft: 8 }}
                  size="small"
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => onFilter({ type: 'filter' })}
                >
                  筛选
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  ));

  return (
    <div
      className={util.classNames('header-icon', filtered ? 'active' : '')}
      style={{ fontSize: 12, fontWeight: 500, padding: 0, margin: '0 0 0 2px' }}
      onClick={stopPropagation}
    >
      <Dropdown
        dropdownRender={dropdownRender}
        placement="bottomRight"
        trigger={['click']}
        open={visible}
        onOpenChange={handleVisibleChange}
      >
        <span style={{ lineHeight: '20px', padding: '0 4px' }}>
          {filter.icon ? (
            filter.icon({ filtered, color: filtered ? cssVar.primaryColor : undefined })
          ) : (
            <FilterFilled />
          )}
        </span>
      </Dropdown>
    </div>
  );
});
