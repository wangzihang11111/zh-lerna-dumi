import { generate } from '@ant-design/colors';
import { TinyColor } from '@ctrl/tinycolor';
import CryptoJS from 'crypto-js';
import { ValueTypeEnum } from '../enum';
import { CryptoParamsType, getGlobalConfig } from '../globalConfig';
import { type IObject } from '../interface';
import type { DefaultThemeType } from '../theme';
import { baseCore } from './core';

const temporaryUrlKey = 'temporary_url_params';
const temporaryUrlLen = 1024;
function clearTemporaryCache(href = '') {
  if (util.getCache('temporary_url_set') !== (href || location.href)) {
    util.removeCache('temporary_url_set');
    util.removeCache(temporaryUrlKey);
  }
}

function handleParams(params: IObject | undefined, isHttp = false) {
  if (!params) return '';
  const result = Object.keys(params).reduce(function (acc, ckey) {
    if (params[ckey] !== undefined) {
      let value = typeof params[ckey] === 'object' ? JSON.stringify(params[ckey]) : params[ckey];
      if (isHttp && baseCore.isString(value)) {
        value = encodeURIComponent(value);
      }
      return `${acc}&${ckey}=${value}`;
    } else {
      return acc;
    }
  }, '');
  if (!isHttp && result.length > temporaryUrlLen) {
    // url参数太长，本地临时保存方案
    util.setCache('temporary_url_set', location.href);
    util.setCache(temporaryUrlKey, params);
    return `&${temporaryUrlKey}=1`;
  }
  return result;
}

function handleURL(url: string, params: IObject | undefined = undefined, isHttp = false) {
  const paramStr = handleParams(params, isHttp);
  if (!params || !paramStr) return url;
  if (url.indexOf('?') < 0) {
    return `${url}?${paramStr.substring(1)}`;
  } else {
    Object.keys(params).forEach((key) => {
      const value = params[key] ?? '';
      const re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i');
      if (url.match(re)) {
        url = url.replace(re, `$1${key}=${value}$2`);
      } else {
        url = `${url}&${key}=${value}`;
      }
    });
    return url;
  }
}

function handleData(data) {
  return baseCore.isObject(data)
    ? Object.keys(data).reduce(
        (prev, curr) => ({
          ...prev,
          [curr]: baseCore.jsonString(data[curr], null)
        }),
        {}
      )
    : data;
}

// 缓存计算对象
const CacheObj: any = {
  UI_READY_EVENTS: Symbol('__ui_ready__events__'),
  PAGE_READY_EVENTS: Symbol('__page__ready__events__'),
  ALL_READY_EVENTS: Symbol('__all__ready__events__'),
  USER_INFO: Symbol('__user__info__'),
  SCROLL_INFO: Symbol('__scroll__info__'),
  QUERY_INFO: Symbol('__query__info__')
};

/**
 * 可以单独使用的基础函数
 */
const util = {
  ...baseCore,
  /**
   * 获取当前登录用户信息
   */
  getUser<T = IObject>(): T {
    return CacheObj[CacheObj.USER_INFO] || {};
  },
  /**
   * 设置当前登录用户信息
   * @param user
   */
  setUser(user?: IObject) {
    if (user) {
      CacheObj[CacheObj.USER_INFO] = { ...CacheObj[CacheObj.USER_INFO], ...user };
    } else {
      CacheObj[CacheObj.USER_INFO] = user;
    }
  },
  getRoot() {
    const isDev = process.env.NODE_ENV === 'development';
    let root: string = util.getUser<any>()?.root || '/';
    if (isDev) {
      // 开发环境，需要根据/proxy匹配代理
      root = (global['routerBase'] || '/') + 'proxy/';
    }
    return root;
  },
  /**
   * 封装请求地址
   */
  getHttpUrl(url: string, root?) {
    root = root || util.getRoot();
    if (!url || url.indexOf('http') === 0 || url.indexOf(root) === 0) {
      return url;
    }
    if (url.indexOf('/') === 0) {
      url = url.substring(1);
    }
    if (!root.endsWith('/')) {
      root += '/';
    }
    return `${root}${url}`;
  },
  toFirstUpperCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  extend: (...args: any[]) => args.reduce((prev, current) => ({ ...prev, ...current }), {}),
  assign: (objA: any, objB: any) => baseCore.isObject(objA) && baseCore.isObject(objB) && Object.assign(objA, objB),
  clearObject: (obj: any) => {
    if (baseCore.isArray(obj)) {
      obj.length = 0;
    } else if (baseCore.isObject(obj)) {
      Object.keys(obj).forEach((key) => {
        delete obj[key];
      });
    } else {
      obj = undefined;
    }
  },
  numberPrecision(value, precision: number = 15): number {
    return value ? parseFloat(Number(value).toFixed(precision)) : value;
  },
  thousandNumber(value, options: { separator?: string; includeDecimal?: boolean } = {}) {
    if (!value) {
      return value;
    }
    const { separator = ',', includeDecimal = false } = options || {};
    const str = value + '';
    if (includeDecimal || str.indexOf('.') === -1) {
      return str.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    }
    const tmp = str.split('.');
    tmp[0] = tmp[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return tmp.join('.');
  },
  uniqueId(key = '', n = 36): string {
    const s: string[] = (key + '').split('').slice(0, Math.floor(n / 2));
    const [start, end] = [s.length, Math.max(16, n)];
    const hexDigits = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = start; i < end; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 36), 1);
    }
    return s.join('');
  },
  // 简单深拷贝
  deepCopyEx: (obj: any) => JSON.parse(JSON.stringify(obj)),
  copyText(text) {
    const copyInput = document.createElement('input');
    copyInput.value = text;
    document.body.appendChild(copyInput);
    copyInput.select();
    document.execCommand('copy');
    document.body.removeChild(copyInput);
  },
  // 深度合并对象
  deepMerge(objA, objB) {
    for (let key in objB) {
      if (objB.hasOwnProperty(key)) {
        if (baseCore.isObject(objA[key]) && baseCore.isObject(objB[key]) && !objB[key].hasOwnProperty('$$typeof')) {
          objA[key] = util.deepMerge(objA[key], objB[key]);
        } else {
          objA[key] = objB[key];
        }
      }
    }
    return objA;
  },
  getAggregate: (type: any, dataArr: any[], key = '') => {
    let value: any = '';
    if (dataArr && dataArr.length > 0) {
      switch (type) {
        case 'min':
          value = dataArr.reduce((p, c) => {
            c = key && c ? c[key] : c;
            if (isNaN(c) || c === '') {
              return p;
            } else {
              return p === '-' ? Number(c) : Math.min(p, Number(c));
            }
          }, '-');
          break;
        case 'max':
          value = dataArr.reduce((p, c) => {
            c = key && c ? c[key] : c;
            if (isNaN(c) || c === '') {
              return p;
            } else {
              return p === '-' ? Number(c) : Math.max(p, Number(c));
            }
          }, '-');
          break;
        case 'avg':
          value =
            dataArr.reduce((sum, val) => {
              val = key && val ? val[key] : val;
              return sum + Number(val || 0);
            }, 0) / dataArr.length;
          break;
        case 'sum':
          value = dataArr.reduce((sum, val) => {
            val = key && val ? val[key] : val;
            return sum + Number(val || 0);
          }, 0);
          break;
        case 'count':
          value = dataArr.length;
          break;
        default:
          break;
      }
    }
    // 处理浮点数溢出
    return isNaN(value) ? '-' : util.numberPrecision(value);
  },
  flatArray: (arr: any[], depth = 1) => {
    if (arr.flat) {
      return arr.flat(depth);
    } else {
      const dgFn: [any[]] | any = (itemArr: any[], dh: number) => {
        if (dh < 0 || !Array.isArray(itemArr)) {
          return [itemArr];
        }
        return itemArr.reduce((result, item) => {
          return [...result, ...dgFn(item, dh - 1)];
        }, []);
      };
      return dgFn(arr, depth);
    }
  },
  filterTree: (
    nodes: IObject[],
    predicate: (node) => boolean,
    {
      childrenKey = 'children',
      leafKey = 'isLeaf',
      includeChildren = false
    }: { childrenKey?: string; leafKey?: string; includeChildren?: boolean } = {}
  ) => {
    if (!(nodes && nodes.length)) {
      return [];
    }
    const newChildren: any = [];
    if (includeChildren) {
      for (let node of nodes) {
        if (predicate(node)) {
          newChildren.push(node);
        } else {
          const subs = util.filterTree(node[childrenKey], predicate);
          if (subs && subs.length) {
            newChildren.push({ ...node, [childrenKey]: subs });
          }
        }
      }
    } else {
      for (let node of nodes) {
        if (predicate(node)) {
          const newNode = { ...node };
          newChildren.push(newNode);
          if (node[childrenKey]?.length) {
            const subs = util.filterTree(node[childrenKey], predicate);
            newNode[leafKey] = !subs?.length;
            if (!newNode[leafKey]) {
              newNode[childrenKey] = subs;
            } else {
              delete newNode[childrenKey];
            }
          }
        } else {
          const subs = util.filterTree(node[childrenKey], predicate);
          if (subs?.length) {
            newChildren.push({ ...node, [childrenKey]: subs, [leafKey]: false });
          }
        }
      }
    }
    return newChildren.length ? newChildren : [];
  },
  groupBy: (dataArr: any[], f: (arg0: any) => any) => {
    const keyObj: any = {};
    const groups: any = [];
    dataArr.forEach((data) => {
      const groupKey = f(data);
      if (keyObj[groupKey]) {
        keyObj[groupKey].push(data);
      } else {
        keyObj[groupKey] = [data];
        groups.push({ groupKey, children: keyObj[groupKey] });
      }
    });
    return groups;
  },
  /**
   * 属性对象比较
   * @param props
   * @param nextProps
   * @param config
   */
  isPropsEqual(props: any, nextProps: any, config: { shallow?: boolean; exclude?: string[] } = {}): boolean {
    const { shallow = false, exclude = [] } = config;
    if (props === nextProps) {
      return true;
    }
    if (baseCore.isObject(props) && baseCore.isObject(nextProps)) {
      const { style: prevStyle, ...otherProps } = props as any;
      const { style: nextStyle, ...nextOtherProps } = nextProps as any;
      const prev = Object.keys(otherProps).filter((k) => !exclude.includes(k));
      const next = Object.keys(nextOtherProps).filter((k) => !exclude.includes(k));
      if (prev.length !== next.length) {
        return false;
      }
      return (
        !prev.some((p) => otherProps[p] !== nextOtherProps[p]) && (shallow || util.isPropsEqual(prevStyle, nextStyle))
      );
    }
    return false;
  },
  isArrayEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1 === arr2) return true;
    for (let i = 0, len = arr1.length; i < len; i++) {
      if (!Object.is(arr1[i], arr2[i])) return false;
    }
    return true;
  },
  firstCase(str) {
    if (str) {
      return str.slice(0, 1).toUpperCase() + str.slice(1);
    }
    return '';
  },
  /**
   * 返回指定路径的对象或值
   * @param obj 被查询的对象 {a:{b:[1,2]}}
   * @param path 对象地址，例如 "a.b[0]"
   */
  getValueByPath: (obj: any, path: string) => {
    return path ? new Function(`return this.${path}`).call(obj) : obj;
  },
  // 通过身份证获取生日
  getBirthDay({ idCard, format = 'YYYY-MM-DD' }) {
    const regExp = /^[1-9]\d{5}((1[89]|20)\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dx]$/i;
    if (idCard && regExp.test(idCard)) {
      const year = idCard.substring(6, 10);
      const month = idCard.substring(10, 12);
      const date = idCard.substring(12, 14);
      return util.formatDate(new Date(year, month - 1, date), format);
    }
    return '';
  },
  //通过身份证或者生日获取年龄
  getAge({ idCard = '', birth = '', format = 'xx' }) {
    const nowDate = new Date();
    const bm = nowDate.getFullYear() * 12 + nowDate.getMonth();
    const f = function (a) {
      if (!format) {
        return a;
      }
      return a ? format.replace('xx', a) : '';
    };
    let newBirthDay: any = birth || util.getBirthDay({ idCard });
    if (newBirthDay) {
      newBirthDay = util.strToDate(newBirthDay);
      const em = newBirthDay.getFullYear() * 12 + newBirthDay.getMonth();
      return f(Math.ceil((bm - em) / 12));
    } else {
      return f('');
    }
  },
  strToDate(dateStr): Date {
    if (baseCore.isDate(dateStr)) {
      return dateStr;
    }
    return dateStr ? new Date(dateStr.toString().replace(/-/g, '/')) : new Date();
  },
  // 格式化日期字符串 'YYYY-MM-DD HH:mm:ss'
  formatDate(dateStr, format = 'YYYY-MM-DD') {
    if (!dateStr) {
      return '';
    }
    let retValue = format;
    const date = util.strToDate(dateStr);
    if (baseCore.isDate(date)) {
      const o = {
        'M+': date.getMonth() + 1, //月份
        'D+': date.getDate(), //日
        'H+': date.getHours(), //小时
        'm+': date.getMinutes(), //分
        's+': date.getSeconds() //秒
      };
      if (/(Y+)/.test(format))
        retValue = retValue.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
      for (let k in o)
        if (new RegExp('(' + k + ')').test(retValue))
          retValue = retValue.replace(
            RegExp.$1,
            RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
          );
      return retValue;
    }
    return dateStr;
  },
  // 时间增加
  addDate(
    date,
    count: number,
    type: 'year' | 'month' | 'date' | 'hours' | 'minutes' | 'seconds' | 'milliseconds' = 'date',
    format?: string
  ): string | Date {
    const newDate = util.strToDate(date);
    switch (type) {
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + count);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + count);
        break;
      case 'date':
        newDate.setDate(newDate.getDate() + count);
        break;
      case 'hours':
        newDate.setHours(newDate.getHours() + count);
        break;
      case 'minutes':
        newDate.setMinutes(newDate.getMinutes() + count);
        break;
      case 'seconds':
        newDate.setSeconds(newDate.getSeconds() + count);
        break;
      case 'milliseconds':
        newDate.setMilliseconds(newDate.getMilliseconds() + count);
        break;
      default:
        break;
    }
    return format ? util.formatDate(newDate, format) : newDate;
  },
  regExpTest: (regExp: string | Function, value: any) => {
    if (regExp) {
      try {
        if (baseCore.isFunction(regExp)) {
          return regExp(value);
        }
        return value ? new RegExp(regExp).test(value) : true;
      } catch {}
    }
    return true;
  },
  convertData: (data: any, dataType: ValueTypeEnum, format = '') => {
    switch (dataType) {
      case ValueTypeEnum.Int:
        const returnInt = parseInt(data);
        return isNaN(returnInt) ? null : returnInt;
      case ValueTypeEnum.Number:
        const returnNumber = Number(data);
        return isNaN(returnNumber) ? null : returnNumber;
      case ValueTypeEnum.String:
        return data ? data.toString() : '';
      case ValueTypeEnum.Date:
        if (baseCore.isArray(data)) {
          return data.map((d) => util.formatDate(d, format || 'YYYY-MM-DD'));
        }
        return util.formatDate(data, format || 'YYYY-MM-DD');
      case ValueTypeEnum.DateTime:
        if (baseCore.isArray(data)) {
          return data.map((d) => util.formatDate(d, format || 'YYYY-MM-DD HH:mm'));
        }
        return util.formatDate(data, format || 'YYYY-MM-DD HH:mm');
      default: {
        if (format) {
          return util.formatDate(data, format);
        }
        return data;
      }
    }
  },
  // 获取滚动条的宽度或者高度
  getScrollBarInfo(container = document.body, cache = true) {
    if (!CacheObj[CacheObj.SCROLL_INFO] || !cache) {
      const div = document.createElement('div');
      div.style.cssText = 'overflow:scroll;display:inline-block;visibility: hidden;';
      container.appendChild(div);
      CacheObj[CacheObj.SCROLL_INFO] = {
        width: div.offsetWidth,
        height: div.offsetHeight
      };
      container.removeChild(div);
    }
    return CacheObj[CacheObj.SCROLL_INFO];
  },
  //获取location.search查询参数
  getQueryValue(
    queryName: string = '',
    options?: string | { search?: string; ignoreCase?: boolean; decode?: boolean; cache?: boolean }
  ) {
    const {
      search,
      ignoreCase: defaultIgnoreCase = true,
      decode = true,
      cache = arguments.length === 1
    } = baseCore.isString(options) ? { search: options } : { ...options };
    if (!cache || search || !queryName) {
      CacheObj[CacheObj.QUERY_INFO] = null;
    }
    const ignoreCase = queryName ? defaultIgnoreCase : false;
    const qn = ignoreCase ? queryName.toLowerCase() : queryName;
    let qry = CacheObj[CacheObj.QUERY_INFO];
    if (!qry) {
      qry = {};
      const getQuery = (searchStr) => {
        const query: any = {};
        searchStr.replace(new RegExp('(^|\\?|&)([\\w]+)=([^&|#]*)', 'ig'), (a, b, c, d) => {
          query[ignoreCase ? c.toLowerCase() : c] = decode ? decodeURIComponent(d) : d;
          return '';
        });
        return query;
      };
      if (search) {
        qry = getQuery(search);
      } else {
        qry = { ...getQuery(location.search), ...getQuery(location.hash) };
      }
      if (qry.hasOwnProperty(temporaryUrlKey)) {
        // 超长参数存在local缓存中
        const cacheObj = util.getCache(temporaryUrlKey, { toObject: true }) || {};
        if (ignoreCase) {
          Object.keys(cacheObj).forEach((key) => {
            qry[key.toLowerCase()] = cacheObj[key];
          });
        } else {
          qry = { ...qry, ...cacheObj };
        }
      }
      if (!search) {
        CacheObj[CacheObj.QUERY_INFO] = qry;
      }
    }
    Promise.resolve().then(() => {
      // 微任务中取消缓存，保证当前宏任务中多次调用是从缓存中取，提升性能
      CacheObj[CacheObj.QUERY_INFO] = null;
    });
    return qn ? qry[qn.toLowerCase()] ?? qry[queryName] : qry;
  },
  // 获取cookie
  getCookie(name, dv?) {
    let arr;
    const reg = new RegExp('(^| )' + name + '=([^;]*)(;|$)');

    if ((arr = document.cookie.match(reg))) return unescape(arr[2]) || dv;
    else return dv;
  },
  // 处理post请求data
  handleData,
  // 处理get请求参数，拼接url地址
  handleUrl: handleURL,
  //函数防抖, 参数：
  //func是需要进行函数防抖的函数；
  //wait则是需要等待的时间，单位为毫秒；
  //immediate参数如果为true，则debounce函数会在调用时立刻执行一次function，而不需要等到wait这个时间后，例如防止点击提交按钮时的多次点击就可以使用这个参数
  debounce: function (func: any, wait: number, immediate?: boolean) {
    let timeout: any,
      args: any,
      context: null = null,
      timestamp: number,
      result: any;
    const later = function () {
      const last = Date.now() - timestamp;
      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.call(context, ...args);
          if (!timeout) context = args = null;
        }
      }
    };
    return function (...payload) {
      args = payload;
      timestamp = Date.now();
      const callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.call(context, ...args);
        context = args = null;
      }
      return result;
    };
  },

  //函数节流,在滚动滚动条的场景常使用，参数：
  //func是需要进行函数节流的函数；
  //wait则是函数执行的时间间隔，单位是毫秒；
  //option有两个选项，throttle第一次调用时默认会立刻执行一次function，如果传入{leading: false}，则第一次调用时不执行function。{trailing: false}参数则表示禁止最后那一次延迟的调用
  throttle: function (func: any, wait: number, options?: { leading?: boolean; trailing?: boolean }) {
    let context: any = null,
      args: any,
      result: any,
      timeout: any = null;
    let previous = 0;
    if (!options) options = {};
    const later = function () {
      previous = options?.leading === false ? 0 : Date.now();
      timeout = null;
      result = func.call(context, ...args);
      if (!timeout) context = args = null;
    };

    return function (...payload) {
      const now = Date.now();
      if (!previous && options?.leading === false) previous = now;
      const remaining = wait - (now - previous);
      args = payload;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.call(context, ...args);
        if (!timeout) context = args = null;
      } else if (!timeout && options?.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  },
  /**
   * 查找满足条件的父元素（包括自己）
   * @param el 当前元素
   * @param fn 条件
   */
  closest(el: any, fn: (el: any) => boolean): any {
    while (el && el.nodeType === 1) {
      if (fn(el)) {
        return el;
      }
      el = el.parentNode;
    }
    return null;
  },
  /**
   * 获取dom节点的样式属性
   * @param dom
   * @param attr
   */
  getStyle(dom, attr) {
    return dom.currentStyle ? dom.currentStyle[attr] : getComputedStyle(dom)[attr];
  },
  /**
   * 配合await延时
   * @param timestamp 延时毫秒数
   */
  delay: (timestamp: number) => new Promise((resolve) => setTimeout(() => resolve(timestamp), timestamp)),
  /**
   * 获取当前光标位置
   */
  getCursorPosition(element?: any) {
    const el: any = element || document.activeElement || {};
    return el.selectionStart ?? -1;
  },
  getSelectionEnd() {
    const el: any = document.activeElement || {};
    return el.selectionEnd ?? -1;
  },
  /**
   * 设置光标位置
   * @param ctrl 元素
   * @param pos 位置
   */
  setCursorPosition(ctrl, pos) {
    if (!ctrl || pos < 0) {
      return;
    }
    if (ctrl.setSelectionRange) {
      ctrl.focus();
      ctrl.setSelectionRange(pos, pos);
    } else if (ctrl.createTextRange) {
      const range = ctrl.createTextRange();
      range.collapse(true);
      range.moveEnd('character', pos);
      range.moveStart('character', pos);
      range.select();
    }
  },
  /**
   * 组合classname
   * @param cls 样式集合
   */
  classNames(...cls: Array<string | undefined | IObject<boolean>>): string {
    return cls
      .reduce<string>((p, c) => {
        let str = '';
        if (baseCore.isObject(c)) {
          str = Object.keys(c)
            .filter((k) => c[k])
            .join(' ');
        } else if (baseCore.isString(c)) {
          str = c;
        }
        return str ? `${p} ${str}` : p;
      }, '')
      .trim();
  },
  CryptoJS: {
    // 加密函數
    encode(word, opt: CryptoParamsType = {}) {
      if (baseCore.isNullOrEmpty(word)) {
        return word;
      }
      if (word instanceof Object) {
        word = JSON.stringify(word);
      }
      const { cryptoDefaultParams } = getGlobalConfig();
      const keyStr = opt.keyStr || cryptoDefaultParams.keyStr;
      const keyHex = CryptoJS.enc.Utf8.parse(keyStr);
      const encryptedObj = CryptoJS.DES.encrypt(word, keyHex, {
        mode: opt.mode || cryptoDefaultParams.mode,
        padding: opt.encodePadding || cryptoDefaultParams.encodePadding
      } as any);
      return encryptedObj.ciphertext.toString();
    },
    // 解密函數
    decode(word, opt: CryptoParamsType = {}) {
      if (baseCore.isNullOrEmpty(word)) {
        return word;
      }
      const { cryptoDefaultParams } = getGlobalConfig();
      const keyStr = opt.keyStr || cryptoDefaultParams.keyStr;
      const keyHex = CryptoJS.enc.Utf8.parse(keyStr);
      const decrypt = CryptoJS.DES.decrypt(
        {
          ciphertext: CryptoJS.enc.Hex.parse(word)
        } as any,
        keyHex,
        {
          mode: opt.mode || cryptoDefaultParams.mode,
          padding: opt.decodePadding || cryptoDefaultParams.decodePadding
        } as any
      );
      return decrypt.toString(CryptoJS.enc.Utf8);
    },
    getCryptoJS() {
      return CryptoJS;
    }
  },
  /**
   * base64方法
   */
  Base64: {
    encode(data: any, useCryptoJS = true) {
      if (!data) return '';
      if (data instanceof Object) {
        data = JSON.stringify(data);
      }
      if (!useCryptoJS && window.btoa) {
        return window.btoa(encodeURI(data));
      }
      const wordArray = CryptoJS.enc.Utf8.parse(data);
      return CryptoJS.enc.Base64.stringify(wordArray);
    },
    decode(encodedData: string, useCryptoJS: 'Utf8' | 'Utf16' | 'Utf16BE' | 'Utf16LE' | boolean = true) {
      if (!encodedData) return '';
      if (!useCryptoJS && window.atob) {
        return decodeURI(window.atob(encodedData));
      }
      const parsedWordArray = CryptoJS.enc.Base64.parse(encodedData);
      return parsedWordArray.toString(CryptoJS.enc[useCryptoJS] || CryptoJS.enc.Utf8);
    }
  },
  setCache(key: string, value: any, option?: { type: 'local' | 'session' }) {
    const storage = option?.type === 'session' ? sessionStorage : localStorage;
    if (value === undefined) {
      storage.removeItem(key);
    } else if (key) {
      storage.setItem(key, baseCore.jsonString(value));
    }
  },
  getCache<T = any>(
    key: string,
    option: boolean | { type?: 'local' | 'session'; toObject?: boolean } = {
      type: 'local',
      toObject: false
    }
  ): T {
    Array.isArray;
    const storage = baseCore.isObject(option) && option.type === 'session' ? sessionStorage : localStorage;
    const toObject = baseCore.isObject(option) ? option.toObject : option;
    const str = storage.getItem(key);
    return toObject && str ? baseCore.parseJson(str) : str;
  },
  removeCache(key: string, option?: { type: 'local' | 'session' }) {
    const storage = option?.type === 'session' ? sessionStorage : localStorage;
    key && storage.removeItem(key);
  },
  /**
   * 文件下载
   * @param url 下载地址
   * @param filename 文件名
   * @param blob Blob对象，优先级高于url
   */
  downLoad({ url, filename, blob }: { url?: string; filename?: string; blob?: Blob }) {
    if (blob) {
      url = URL.createObjectURL(blob);
    }
    if (!url) return;
    let btn: any = document.createElement('a');
    btn.download = filename || '';
    btn.href = url;
    btn.click();
    if (blob) {
      URL.revokeObjectURL(url);
    }
    btn = null;
  },
  /**
   * 获取当前相对路径的绝对路径
   * @param url 相对路径
   * @returns
   */
  getAbsoluteUrl(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.href;
  },
  /**
   * 调试
   * @param param
   */
  debug(param: { msg: any; type?: 'log' | 'warn' | 'error' } | string) {
    if (baseCore.isString(param) || !param?.msg) {
      param = { msg: param };
    }
    const { msg, type = 'log' } = param;
    if (process.env.NODE_ENV === 'development' || window['development']) {
      console[type](msg);
    }
  },
  /**
   * 变量children
   * @param data
   * @param todo
   */
  loopChildren(data, todo, level = 0, count = 0) {
    const len = data.children?.length ?? 0;
    for (let i = 0; i < len; i++) {
      const row = data.children[i];
      if (todo(row, i, level, count + i + 1) === false) {
        return false;
      }
      if (util.loopChildren(row, todo, level + 1, count + i + 1) === false) {
        return false;
      }
    }
  },

  /**
   * 获取对象的值
   * @param obj 对象
   * @param pathKeys 路径
   * @param nullValue 空值
   */
  getObjValue(obj, pathKeys, nullValue?) {
    if (obj && pathKeys) {
      const keyArr = baseCore.isArray(pathKeys) ? pathKeys : pathKeys.split('.');
      if (keyArr.length > 0) {
        return (
          keyArr.reduce((p, c) => {
            return p?.[c];
          }, obj) ?? nullValue
        );
      }
    }
    return nullValue;
  },

  /**
   * 设置对象的值
   * @param obj 对象
   * @param pathKeys 路径
   * @param value 值
   */
  setObjValue(obj, pathKeys, value) {
    if (obj && pathKeys) {
      const keyArr = baseCore.isArray(pathKeys) ? pathKeys : pathKeys.split('.');
      const len = keyArr.length;
      if (len > 0) {
        keyArr.reduce((p, c, i) => {
          if (i === len - 1) {
            p[c] = value;
          } else if (!baseCore.isObject(p[c])) {
            p[c] = {};
          }
          return p[c];
        }, obj);
      }
    }
  },
  deleteObjKey(obj, pathKeys) {
    if (obj && pathKeys) {
      const keyArr = baseCore.isArray(pathKeys) ? pathKeys : pathKeys.split('.');
      const keyIndex = keyArr.length - 1;
      if (keyIndex >= 0) {
        let p = obj;
        for (let i = 0; i < keyIndex; i++) {
          if (baseCore.isObject(p)) {
            p = p[keyArr[i]];
          } else {
            return;
          }
        }
        delete p[keyArr[keyIndex]];
      }
    }
  },
  /**
   * 分隔字符串
   * @param str
   * @param _split
   */
  split(str, _split = ','): string[] {
    if (baseCore.isArray(str)) {
      return str;
    }
    if (baseCore.isNullOrEmpty(str)) {
      return [];
    }
    str = str + '';
    return str.length > 0 ? str.split(_split) : [];
  },
  /**
   * 字符长度
   */
  strLen(str: string) {
    let len = 0;
    if (!str) return 0;
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      if (charCode > 127 || charCode == 94) {
        len += 2;
      } else {
        len++;
      }
    }
    return len;
  },
  /**
   * 动画结束回调
   * @param el 监听动画的元素
   * @param callback 回调事件
   */
  addAnimationend(el, callback) {
    const events = ['transitionend', 'animationend'];
    events.forEach((eventName) => el.addEventListener(eventName, callback, false));
    return () => {
      events.forEach((eventName) => el.removeEventListener(eventName, callback, false));
    };
  },
  stopPropagation(e) {
    e?.stopPropagation?.();
    e?.nativeEvent?.stopImmediatePropagation?.();
  }
};

/**
 * 初始化自定义的css3变量
 * @param colorVal
 * @param themeObj
 */
function initCustomThemeColor(
  colorVal,
  config: { env?: 'mobile' | 'pc'; themeObj?: IObject; theme: DefaultThemeType; appName?: string }
) {
  if (!colorVal) return;
  const { env = 'pc', theme, themeObj = {}, appName = 'global' } = config;
  const baseColor = new TinyColor(colorVal);
  const colorPalettes = generate(baseColor.toRgbString());
  const rootStyle = ['body{'];
  const tmpObj = { ...theme.customCssVar.global, ...theme.customCssVar[env], ...themeObj };
  Object.keys(tmpObj).forEach((k) => {
    rootStyle.push(`${k}:${tmpObj[k]};`);
  });
  colorPalettes.forEach((color, index) => {
    rootStyle.push(`--primary-${index + 1}:${new TinyColor(color).toHexString()};`);
    rootStyle.push(`--primary-${index + 1}-5:${new TinyColor(color).setAlpha(0.5).toRgbString()};`);
  });
  rootStyle.push('}');
  const styleId = `${appName}_${env}_custom_theme_css`;
  const styleEl: any = document.getElementById(styleId) || document.createElement('style');
  styleEl.id = styleId;
  styleEl.innerText = rootStyle.join('');
  document.head.appendChild(styleEl);
}

export { util, CacheObj, initCustomThemeColor, clearTemporaryCache };
