// import { eventHandler } from '../interface';
const listenerReg = /^on[A-Z]+/;
const propsReg = /^props([A-Z]+)/;

//合并事件
export function mergeEventHandler(mergeBack: () => void) {
  let s = {};
  return function handleMerge(n?: any, isReplace?: boolean): any {
    if (isReplace) {
      s = merge({}, n);
      mergeBack();
      return handleMerge;
    }
    if (!n) return converArraytoFunc(s);
    else {
      s = merge(s, n);
      mergeBack();
      return handleMerge;
    }
  };

  function merge(s: any = {}, n: any) {
    if (!n) return s;
    Object.keys(n).forEach((key: string) => {
      if (key === 'children' && n.children) {
        s.children = merge(s.children || {}, n.children);
      } else if (listenerReg.test(key) && typeof n[key] === 'function') {
        if (s[key]) {
          if (Array.isArray(s[key])) s[key].push(n[key]);
          else s[key] = [s[key], n[key]];
        } else s[key] = n[key];
      } else if (typeof n[key] === 'object') {
        s[key] = merge(s[key], n[key] as any);
      } else {
        s[key] = n[key];
      }
    });
    return s;
  }

  function converArraytoFunc(s: any) {
    let x: any = {};
    Object.keys(s).forEach((key) => {
      if (listenerReg.test(key)) {
        if (Array.isArray(s[key])) {
          x[key] = function () {
            (s[key] as Array<Function>).forEach((item) => item(...arguments));
          };
        } else {
          x[key] = s[key];
        }
      } else if (propsReg.test(key)) {
        const pkey = key.replace(propsReg, (match, $1) => {
          return $1.toLowerCase();
        });
        x[pkey] = s[key];
      } else {
        x[key] = converArraytoFunc(s[key] as any);
      }
    });
    return x;
  }
}
