import React from 'react';
import { ZhIcon } from '../../icon';
import {
  emptyFn,
  getGlobalConfig,
  Observer,
  zh,
  ValueTypeEnum,
  type ICurrentObject,
  type IObject,
  type PromiseType
} from '../../util';
import { TableSelectionModel } from './base/common';

export {
  compHoc,
  cssVar,
  getRegisterComponentWithProps,
  Layout,
  ZhComponent,
  useApi,
  useAsyncEffect,
  useDebounce,
  useDevState,
  useDraggableSort,
  useRefCallback,
  useRefState,
  useResize,
  useReturnCallback,
  useThrottle,
  useZhEffect,
  useUpdateEffect
} from '../../util';
export { emptyFn, zh as util, getGlobalConfig, Observer, ValueTypeEnum };
export type { ICurrentObject, IObject, PromiseType };

export function getScrollBarInfo() {
  return { width: 8, height: 8 };
}

export function getColumnHeader(column) {
  const pageLang = zh.getPageLang?.();
  const header = column.header || column.title;
  if (pageLang && column.langKey) {
    return pageLang[column.langKey] || header;
  }
  return header;
}

export function convertStyle(style: any = {}) {
  const flexStyle = { left: 'flex-start', right: 'flex-end', center: 'center' };
  if (style && style.textAlign) {
    style.justifyContent = flexStyle[style.textAlign];
  }
  return style;
}

export function displayText(text) {
  return zh.isArray(text) ? text.join(',') : text ?? '';
}

export function domContains(parentClass, target) {
  while (target) {
    if (target.classList.contains(parentClass)) {
      return true;
    }
    target = target.parentElement;
  }
  return false;
}

function compareFn(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}

function getObjectKey(obj) {
  return Object.keys(obj)[0];
}

export function dataSortOrder(data, orders: any[], dataIndexMap) {
  const orderBy = orders.filter((o) => o.local);
  const len = orderBy.length;
  if (len === 0) return data;

  return data.slice().sort((a, b) => {
    for (let i = 0; i < len; i++) {
      const current = orderBy[i];
      const dataIndex = getObjectKey(current);
      const di = dataIndexMap[dataIndex].dataIndexField || dataIndex;
      const [valueA, valueB] = [zh.getObjValue(a, di), zh.getObjValue(b, di)];
      const compare = current[dataIndex]
        ? current[dataIndex] === 'asc'
          ? compareFn(valueA, valueB)
          : compareFn(valueB, valueA)
        : 0;
      if (compare !== 0) {
        return compare;
      }
    }
    return 0;
  });
}

export function filterSymbol(obj) {
  const newObj: any = {};
  Object.keys(obj).forEach((p) => {
    newObj[p] = obj[p];
  });
  return newObj;
}

export function stopPropagation(e) {
  e?.stopPropagation?.();
  e?.nativeEvent?.stopImmediatePropagation?.();
}

function wrapHtml(children, tag = 'div') {
  return children ? React.createElement(tag, { className: 'nowrap', children }) : children;
}

/**
 * 获取format生成的render函数
 * @param format 数据格式化描述信息
 * @param render 单元格的渲染函数（兼容服务端返回的是函数字符串）
 * @param editor 编辑器
 * @param encrypted 是否加密
 */
export function getRender({
  format,
  editor,
  render,
  encrypted
}: {
  format: any;
  editor?: any;
  render?: string;
  encrypted?: boolean;
}) {
  if (encrypted) {
    return ({ value }) => '*****';
  } else if (format) {
    const { type, formatter, strictly = false, precision, prefix, suffix, nullValue = '' } = format;
    switch (type) {
      case 'date':
        return ({ value }) => wrapHtml(zh.formatDate(value, formatter) || nullValue);
      case 'option': {
        let options = formatter;
        let [valueField, labelField] = ['value', 'label'];
        // 下拉选择已经配置数据源，直接复用
        if (!options && (editor?.data || editor?.options) && ['select', 'Select'].includes(editor.xtype)) {
          options = editor.data || editor.options;
          if (editor.valueField) {
            valueField = editor.valueField;
          }
          if (editor.labelField) {
            labelField = editor.labelField;
          }
        }
        return ({ value }) => {
          const arr = zh.isString(value) ? value.split(',') : zh.isArray(value) ? value : [value];
          const labels: any = [];

          (options || []).forEach((d) => {
            if (
              arr.includes(d[valueField]) ||
              (strictly === false && (arr.includes(+d[valueField]) || arr.includes(d[valueField] + '')))
            ) {
              labels.push(d[labelField]);
            }
          });
          return wrapHtml(labels.length > 0 ? labels.join(',') : nullValue || value);
        };
      }
      case 'icon': {
        return ({ value }) => {
          const options = formatter || [];
          const { label, icon, style } = options.find((o) => o.value == value) || {};
          if (label || icon) {
            const tmp: any[] = [];
            if (React.isValidElement(icon)) {
              tmp.push(icon);
            } else if (ZhIcon[icon]) {
              tmp.push(
                React.createElement(ZhIcon[icon], {
                  key: tmp.length + 1,
                  style: {
                    color: 'var(--primary-color)',
                    marginRight: `${label ? 4 : 0}px`,
                    ...style
                  }
                })
              );
            }
            label && tmp.push(label);
            return tmp;
          }
          return nullValue;
        };
      }
      case 'attachment':
        return ({ value }) => {
          const { icon = 'PaperClipOutlined', showValue = true, style } = formatter || {};
          if (value) {
            const tmp: any[] = [];
            if (React.isValidElement(icon)) {
              tmp.push(icon);
            } else if (ZhIcon[icon]) {
              tmp.push(
                React.createElement(ZhIcon[icon], {
                  key: tmp.length + 1,
                  style: {
                    color: 'var(--primary-color)',
                    marginRight: 4,
                    ...style
                  }
                })
              );
            }
            showValue && tmp.push(value);
            return tmp;
          }
          return nullValue;
        };
      case 'number':
        return ({ value }) => {
          let tmpStr = '';
          if (zh.isNullOrEmpty(value)) {
            return nullValue;
          }
          if (zh.isFunction(formatter)) {
            tmpStr = formatter({ value, precision }) + '';
          } else {
            tmpStr = zh.isNullOrEmpty(precision)
              ? zh.numberPrecision(value) + ''
              : zh.numberPrecision(value).toFixed(precision);
            if (formatter !== false) {
              tmpStr = zh.thousandNumber(tmpStr, { separator: formatter ?? ',' });
            }
          }
          return wrapHtml(zh.isNullOrEmpty(tmpStr) ? nullValue : `${prefix || ''}${tmpStr}${suffix || ''}`);
        };
      case 'expr':
        return ({ table, row, value, dataIndex }) => {
          try {
            const fn = new Function('$D', '$R', '$V', '$DI', `return ${formatter}`);
            return wrapHtml(fn(table.getRows(), row, value, dataIndex) ?? nullValue);
          } catch (e) {
            console.warn(`expression error:${formatter}`, e);
          }
          return wrapHtml(value);
        };
      default:
        break;
    }
  } else if (render) {
    const renderFn = zh.parseJson(render);
    return zh.isFunction(renderFn) ? renderFn : undefined;
  }
  return undefined;
}

/**
 * 前端列筛选函数
 * @param columnFilters
 * @param dataIndexMap
 * @param allMatch 是否所有列全匹配
 */
export function clientColumnFilter(columnFilters, dataIndexMap, allMatch = true) {
  const filterKeys = Object.keys(columnFilters);
  const matchFn = allMatch ? 'every' : 'some';
  return (row) =>
    filterKeys[matchFn]((k) => {
      const { dataIndexField, filter } = dataIndexMap[k];
      const value = zh.getObjValue(row, dataIndexField || k);
      if (zh.isFunction(filter?.clientFilter)) {
        return filter.clientFilter({ dataIndex: k, row, value, filterValue: columnFilters[k] });
      }
      if (zh.isArray(columnFilters[k])) {
        return columnFilters[k].includes(value);
      }
      const str = !zh.isNullOrEmpty(value) ? (value + '').toLowerCase() : '';
      const kw = (columnFilters[k] + '').toLowerCase();
      return str.includes(kw);
    });
}

export function syncDefaultProps(props) {
  const tableConfig = getGlobalConfig().default.tableConfig;
  Object.keys(tableConfig).forEach((key) => {
    if (!props.hasOwnProperty(key)) {
      props[key] = tableConfig[key];
    }
  });
  let { type } = props.rowSelection || {};
  type = zh.isArray(type) ? type : [type];
  if (!props.checkbox && !type.includes(TableSelectionModel.CHECKBOX)) {
    props.rowChecked = false;
    delete props.tableAlertRender; // 仅在checkbox模式下有效
  }
  return props;
}

export function getCellInfoByEvent() {
  const targetEl = window.event?.target;
  const obj: { dataIndex?: string; rowIndex: number } = { rowIndex: -1 };
  if (targetEl) {
    const rowEl = zh.closest(targetEl, (el) => {
      if (el.dataset.hasOwnProperty('key')) {
        obj.dataIndex = el.dataset.key;
      }
      return el.classList.contains('table-row');
    });
    if (rowEl) {
      for (let cls of rowEl.classList) {
        if (cls.indexOf('index-') === 0) {
          obj.rowIndex = parseInt(cls.replace('index-', ''));
          break;
        }
      }
    }
  }
  return obj;
}
