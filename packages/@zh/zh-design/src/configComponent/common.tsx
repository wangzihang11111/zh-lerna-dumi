import { getRegisterComponentWithProps, LayConfWrap, zh } from '../util';
import { Comp_Info } from './config/baseConfig';
import { Comp_Props } from './config/interface';

export { LayConfWrap };

export type OptType = 'modifiedRow' | 'newRow' | 'deletedRow';

const emptyArray = [];

/**
 * 根据配置数据获取对应配置的组件
 * @param {object} item 组件配置项
 * @returns {object} 组件
 */
export function getComp(item: any) {
  if (!item.xtype) return { instance: Comp_Info['Input'].instance };
  if (typeof item.xtype === 'function') return { instance: item.xtype };
  if (item.xtype && typeof item.xtype === 'object' && item.xtype.render && item.xtype.$$typeof)
    return { instance: item.xtype };
  return (function (xtype, type) {
    if (Comp_Info[xtype]) {
      if (
        xtype === 'Input' &&
        ['prc', 'amt', 'amount', 'qty', 'rate', 'percent'].includes(type) &&
        Comp_Info['InputNumber']
      ) {
        return { instance: Comp_Info['InputNumber'].instance, props: Comp_Info['InputNumber'].defaultProps };
      }
      return { instance: Comp_Info[xtype].instance, props: Comp_Info[xtype].defaultProps };
    }
    const [ins, props] = getRegisterComponentWithProps(xtype);
    if (ins) {
      return {
        instance: ins,
        props
      };
    }
    return { instance: Comp_Info['Input'].instance };
  })(item.xtype, item.type);
}

/**
 * 获取组件对应的配置
 * @returns {object} 组件的配置props
 * @param item
 * @param config
 */
export function getCompPorps(item: any, config: Comp_Props) {
  const p = config;
  let t = Object.keys(p).reduce((acc: any, curr: any) => {
    acc[curr] = item[curr] ? item[curr] : p[curr]['defaultValue'];
    return acc;
  }, item.antProps || {});
  p['data'] && (t['data'] = item?.data || emptyArray);
  (item.xtype === 'Checkbox' || item.xtype === 'Checkbox') && delete t.value;
  return t;
}

/**
 * 格式化数据
 * @param name
 * @param type
 * @param opt
 * @param key
 * @param initVals
 */
export function fomatValues(name: string, type: 'form' | 'table', opt: OptType, key: string, initVals?: any) {
  let vals = initVals;
  return merge;

  function merge(values?: any): (() => {}) | any {
    if (typeof vals !== typeof values) {
      vals = values || vals;
    } else if (Array.isArray(vals)) {
      vals = vals.concat(values);
    } else if (typeof vals === 'object') {
      vals = { ...vals, ...values };
    } else {
      vals = values;
    }
    if (!values)
      return {
        [name]: {
          [type]: vals
            ? {
                key,
                [opt]: vals
              }
            : { key }
        }
      };
    return merge;
  }
}

export function formFomatValues(key: string, initVals?: Array<any>) {
  let vals: any = {};
  let optType = 'newRow';
  if (Object.prototype.toString.call(initVals) === '[object Object]') {
    initVals = [initVals];
  }
  if (Array.isArray(initVals)) {
    vals = initVals.reduce((p, n) => ({ ...p, ...n }), {});
    return {
      ['form']: {
        key,
        [vals[key] ? 'modifiedRow' : 'newRow']: vals
      }
    };
  }
  return merge;

  function merge(values?: any): (() => {}) | any {
    if (typeof vals !== typeof values) {
      vals = values || vals;
    } else if (Array.isArray(vals)) {
      vals = vals.concat(values);
    } else if (typeof vals === 'object') {
      vals = { ...vals, ...values };
    } else {
      vals = values;
    }
    if (!values) {
      return {
        ['form']: vals
          ? {
              key,
              [optType]: vals
            }
          : { key }
      };
    }
    if (values[key]) optType = 'modifiedRow';
    return merge;
  }
}

export function listToObj(c: Array<any>) {
  if (!c) return {};
  return c.reduce((acc: any, item) => {
    acc[item.name] = item;
    return acc;
  }, {});
}

export function getProperty(o: any, keys: string | number | Array<string | number>) {
  if (typeof keys === 'string' || typeof keys === 'number') {
    return o && o[keys];
  }
  for (let i = 0; i < keys.length; i++) {
    if (!o) return;
    o = o[keys[i]];
  }
  return o;
}

export function parseFunction(str) {
  if (str && typeof str === 'string') {
    return (...args) => {
      try {
        const fn = new Function('return ' + str)();
        return fn(...args);
      } catch (error) {
        console.log('erro:======', error, str);
      }
    };
  }
  return str;
}

export function getObjValue(obj, pathKeys) {
  return zh.getObjValue(obj, pathKeys);
}

export function setObjValue(obj, pathKeys, value) {
  zh.setObjValue(obj, pathKeys, value);
}

export function getSubscribeFn(outRef) {
  return (fn: Function, type, name?: string | string[]) => {
    if (!outRef.current._compIns) {
      return () => {};
    }
    if (name && name.length > 0) {
      const arr = zh.isArray(name) ? name : [name];

      const loop = (obj, prevKey = '') =>
        Object.keys(obj).some((k) => {
          if (zh.isObject(obj[k]) && loop(obj[k], k)) {
            return true;
          }
          return arr.includes(prevKey ? `${prevKey}.${k}` : k);
        });

      return outRef.current.innerSubscribe?.(
        (p) => {
          fn({ ...p, name });
        },
        type,
        ({ args }) => loop(args[0])
      );
    } else {
      return outRef.current.innerSubscribe?.(fn, type);
    }
  };
}

export function isHelpField(type) {
  return zh.isString(type) && getRegisterComponentWithProps(type)[2]?.isHelp;
}
