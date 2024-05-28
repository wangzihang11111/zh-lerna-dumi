import { Modal } from 'antd';
import modelExtend from 'dva-model-extend';
import { useMemo } from 'react';
import { useCompute } from '../hook';
import type { IModelType, IObject } from '../interface';
import { getDvaApp, useSelector } from '../umiExports';
import { baseCore, getCurrentWindow } from '../util/core';

/**
 * 创建state更新器
 * @param state
 * @param lastUpdater
 */
function createStateUpdater(state, lastUpdater?) {
  const updater = lastUpdater || {};
  const createObj = (currentTarget, currentKey, currentState) =>
    new Proxy(
      {
        getProps() {
          return currentState[currentKey];
        },
        setProps(props: any) {
          if (baseCore.isFunction(props)) {
            props = props(currentState[currentKey]);
          }
          currentState[currentKey] = { ...props };
          currentTarget.setProps?.({ ...currentState });
        }
      },
      {
        get(nextTarget, nextKey) {
          if (!nextTarget.hasOwnProperty(nextKey)) {
            nextTarget[nextKey] = createObj(nextTarget, nextKey, {});
          }
          return nextTarget[nextKey];
        }
      }
    );
  Object.keys(state).forEach((p) => {
    const item = state[p];
    updater[p] = new Proxy(
      {
        getProps() {
          return item;
        },
        setProps(props: any) {
          let needObjMerge = true;
          if (baseCore.isFunction(props)) {
            needObjMerge = false;
            props = props(item);
          }
          if (baseCore.isObject(props) && baseCore.isObject(item)) {
            const keys = [...Object.keys(props), ...Object.getOwnPropertySymbols(props)];
            if (keys.some((key) => props[key] !== item[key as any])) {
              state[p] = needObjMerge ? { ...item, ...props } : props;
              // 变更当前对象及所有父节点，其他节点不变以减少多余的更新
              updater.setProps?.({ ...state });
            }
          } else {
            state[p] = props;
          }
        }
      },
      {
        get(target, key: string) {
          if (!target.hasOwnProperty(key)) {
            target[key] = createObj(target, key, {});
          }
          return target[key];
        }
      }
    );
    if (baseCore.isObject(item)) {
      createStateUpdater(item, updater[p]);
    }
  });
  return (
    lastUpdater ||
    new Proxy(updater, {
      get(target, key: string) {
        if (!target.hasOwnProperty(key)) {
          if (['setProps', 'getProps'].includes(key)) {
            target[key] = () => state;
          } else {
            target[key] = createObj(target, key, state);
          }
        }
        return target[key];
      }
    })
  );
}

/**
 * 基础model
 */
const baseModel: IModelType = {
  effects: {},
  namespace: 'base',
  state: {},
  reducers: {
    __initState__(state, { payload }) {
      return payload ? payload : state;
    },
    __update__(state, { payload }) {
      if (typeof payload === 'function') {
        try {
          const newState = { ...state };
          const updater = createStateUpdater(newState);
          payload = payload(updater, newState);
          if (payload === updater || payload === undefined) {
            payload = newState;
          }
        } catch (e) {
          payload = undefined;
          console.log(e);
        }
      }
      return payload ? { ...state, ...payload } : state;
    }
  }
};

function getNameUpdater(item, layout, index, currentUpdater) {
  return {
    getProps() {
      return item;
    },
    setProps(props: IObject | Function) {
      let needObjMerge = true;
      if (baseCore.isFunction(props)) {
        needObjMerge = false;
        props = props(item) || item;
        if (baseCore.isArray(props)) {
          props = { children: [...props] };
        }
      }
      const keys = Object.keys(props);
      if (keys.some((key: string) => props[key] !== item[key])) {
        layout[index] = needObjMerge ? { ...item, ...props } : props;
        // 变更当前对象及所有父节点，其他节点不变以减少多余的更新
        currentUpdater.setProps?.({ children: [...layout], __update__: Date.now() });
      }
    },
    getApi() {
      const me = this;
      if (item.children) {
        const children = [...item.children];
        return {
          push(...args) {
            children.push(...args);
            me.setProps({ children });
          },
          splice(start, deleteCount, ...args) {
            children.splice(start, deleteCount, ...args);
            me.setProps({ children });
          },
          unshift(...args) {
            children.unshift(...args);
            me.setProps({ children });
          }
        };
      }
    }
  };
}

/**
 * 创建UI元数据更新器
 * @param layout
 * @param updater
 */

function createUIUpdater(
  layout,
  root = true,
  updater: any = {},
  parentPath: string[] = [],
  fieldPathMap: any = {},
  bindTable = ''
) {
  layout.forEach((item, index) => {
    const iname = item.name || index;
    updater[iname] = getNameUpdater(item, layout, index, updater);
    if (!item.children && item.name) {
      fieldPathMap[item.name] = fieldPathMap[item.name] || [];
      fieldPathMap[item.name].push({ path: parentPath, bindTable });
    }
    if (item.children) {
      const parent = root ? [item.ctype, ...parentPath] : [...parentPath];
      createUIUpdater(
        item.children,
        false,
        updater[iname] || updater,
        item.name ? [...parent, item.name] : parent,
        fieldPathMap,
        item.bindtable || item.bindTable || bindTable
      );
      if (item.children_key === 'fieldSets') {
        item.children.forEach((form: any) => {
          const fn = (currentLayout, itemUpdater) => {
            currentLayout.forEach((itm, idx) => {
              if (itm.children?.length) {
                fn(itm.children, itemUpdater[itm.name || idx]);
              } else if (itm.name) {
                updater[iname][itm.name] = getNameUpdater(itm, currentLayout, idx, itemUpdater);
              }
            });
          };
          fn(form.children || [], updater[item.name][form.name]);
        });
      }
    }
  });

  if (parentPath.length === 0) {
    updater.setFieldProps = (nameProps: IObject, cType?: 'form' | 'grid' | 'toolbar') => {
      Object.keys(nameProps).forEach((item) => {
        const arr = item.split('.');
        const name = arr.length > 1 ? arr[1] : arr[0];
        const table = arr.length > 1 ? arr[0] : '';
        if (fieldPathMap.hasOwnProperty(name)) {
          fieldPathMap[name].forEach((obj) => {
            const {
              path: [rootType, ...pathArr],
              bindTable
            } = obj;
            if (cType && cType !== rootType) {
              return;
            }
            if (table && table !== bindTable) {
              return;
            }
            const _updater = pathArr.reduce((obj, k) => obj?.[k], updater);
            if (_updater?.[name]) {
              const updateProps = { ...nameProps[item] };
              const editor = _updater[name].getProps()?.editor;
              if (editor) {
                updateProps.editor = { ...editor };
                ['disabled', 'required'].forEach((k) => {
                  if (updateProps.hasOwnProperty(k)) {
                    updateProps.editor[k] = updateProps[k];
                    delete updateProps[k];
                  }
                });
              }
              _updater[name].setProps(updateProps);
            }
          });
        }
      });
    };
  }

  return updater;
}

/**
 * 通过对象数组更新UI元数据
 * @param layout 原始layout
 * @param uiInfo 更新字段，格式：[{p_form0000000025_m#asr_flg: 0}]， 0只读 1可编辑 2不可见 3必输项
 */
function updateLayoutUI(layout, uiInfo) {
  const newLayout = [...layout];
  const updater: any = createUIUpdater(newLayout);
  uiInfo.forEach((info) => {
    Object.keys(info).forEach((field) => {
      const ctlOption = Number(info[field]);
      const ids = field.split('#');
      const item = ids.reduce((p, id) => {
        return p[id] ?? p;
      }, updater);
      if (item?.setProps) {
        const editor = item.getProps()?.editor;
        switch (ctlOption) {
          case 0: // 只读
            item.setProps(editor ? { editor: { ...editor, disabled: true } } : { disabled: true });
            break;
          case 1: // 可编辑
            item.setProps(editor ? { editor: { ...editor, disabled: false } } : { disabled: false });
            break;
          case 2: // 不可见
            item.setProps({ hidden: true });
            break;
          case 3: // 必输项  潜规则： 必输默认可编辑，因为不可编辑会导致有些单据无法往下走
            item.setProps(
              editor
                ? { editor: { ...editor, required: true, disabled: false } }
                : {
                    required: true,
                    disabled: false
                  }
            );
            break;
          default:
            break;
        }
      } else {
        console.log('无法识别字段：' + field);
      }
    });
  });

  return newLayout;
}

const defaultDevUi = {
  // 二开UI元数据
  toolbar: {}, // 工具条的ui元数据，例如：{toolbar1:{buttons:[{id:'def1', text:'自定义按钮', icon:'def1', onClick(){}}]}}
  table: {}, // 表格组件的ui元数据，例如：{table1:{columns:[{dataIndex:'def1', title:'自定义列'}]}}
  form: {}, // 表单组件的ui元数据，例如：{form1: {config: [{name:'def1', label:'自定义字段'}]}}
  query: {} // 内嵌查询的ui元数据，例如：{queryForm1: {}}
};

/**
 * 全局model
 */
const globalModel: IModelType = {
  namespace: 'model_global',
  state: {
    userId: 'Developer',
    version: '0.0.1',
    layout: undefined, // 最新数据
    layoutConfig: {}, // 原始数据
    billNoRule: [],
    busType: '',
    __dev_ui__: baseCore.deepCopy(defaultDevUi)
  },
  reducers: {
    saveLayout(state: any, { layout, busType, layoutConfig, billNoRule }: any) {
      const global = getCurrentWindow();
      global['__dev_ui__'] = defaultDevUi;
      global['ui_layout_config'] = { layout, busType };
      const newState = { ...state, __dev_ui__: baseCore.deepCopy(defaultDevUi) };
      if (busType === state.busType && JSON.stringify(layout) === JSON.stringify(state.layout)) {
        return newState;
      }
      newState.layout = layout;
      newState.billNoRule = billNoRule;
      newState.busType = busType;
      newState.layoutConfig = layoutConfig;
      return newState;
    },
    updateLayout(state: any, { uiInfo }) {
      const { layout: lastLayout } = state;
      if (!uiInfo || !lastLayout) return state;

      const global = getCurrentWindow();

      if (typeof uiInfo === 'function') {
        try {
          const newLayout = [...lastLayout];
          const updater = createUIUpdater(newLayout);
          uiInfo = uiInfo(updater, newLayout);
          if (uiInfo === updater || uiInfo === undefined) {
            uiInfo = newLayout;
          }
          global['ui_layout_config'].layout = uiInfo;
          return uiInfo ? { ...state, layout: uiInfo } : state;
        } catch (e) {
          console.log(e);
        }
        return state;
      }

      if (!Array.isArray(uiInfo) && baseCore.isObject(uiInfo)) {
        uiInfo = [uiInfo];
      }
      if (!Array.isArray(uiInfo) || uiInfo.length === 0) return state;
      const layout = updateLayoutUI(lastLayout, uiInfo);
      if (layout === lastLayout) {
        return state;
      }
      global['ui_layout_config'].layout = layout;
      return { ...state, layout };
    },
    updateDevUI(state, { toolbar, table, form, query, init = false }) {
      const global = getCurrentWindow();
      if (init) {
        global['__dev_ui__'] = defaultDevUi;
        return { ...state, __dev_ui__: baseCore.deepCopy(defaultDevUi) };
      }
      const updateDevUI = { toolbar, table, form, query };
      let devUi: any = ['toolbar', 'table', 'form', 'query'].reduce((p, c) => {
        return { ...p, [c]: { ...state.__dev_ui__[c] } };
      }, {});
      Object.keys(updateDevUI).forEach((key) => {
        let payload: any = updateDevUI[key];
        if (!payload) {
          return;
        }
        if (baseCore.isFunction(payload)) {
          try {
            const updater = createStateUpdater(devUi[key]);
            payload = payload(updater, devUi[key]);
            if (payload === updater || payload === undefined) {
              payload = { ...devUi[key] };
            }
            devUi[key] = payload;
          } catch (e) {
            console.log(e);
          }
        } else if (baseCore.isObject(payload)) {
          devUi[key] = { ...devUi[key], ...payload };
        }
      });
      global['__dev_ui__'] = devUi;
      return { ...state, __dev_ui__: devUi };
    }
  },
  effects: {},
  subscriptions: {
    // 设置前置路由信息
    __setupPrevRouteInfo__({ history }) {
      let prevRoute: any = null;
      return history.listen((route) => {
        getCurrentWindow().location['prevRoute'] = prevRoute;
        prevRoute = route;
        Modal.destroyAll();
      });
    }
  }
};

/**
 * 全局布局状态
 * @param model 业务扩展的model
 */
export function layoutModel(model) {
  if (model.namespace === 'model_global') {
    return modelExtend(globalModel, model);
  } else {
    return modelExtend(baseModel, model);
  }
}

// 二开元数据items的字段
export const updateItemsKey = Symbol('_items_');
//二开元数据items每个数据集的更新状态字段
export const updateItemStatusKey = Symbol('_update_info_');

/**
 *
 * @param type 元数据类型
 * @param id 组件id或者业务类型（内嵌查询）
 * @param props 当前组件合并前的属性
 * @param itemsKey 子组件集合的key
 * @param itemKey 子组件的key
 * @param items 子组件的状态集合，可选，优先级高于props[itemsKey]
 * @returns
 */
export function useDevState<P = IObject, T = IObject>({
  type,
  id,
  props,
  itemsKey = '',
  itemKey,
  items
}: {
  type: keyof typeof defaultDevUi;
  id?: string;
  props: P;
  itemsKey?: string;
  itemKey: string;
  items?: IObject[];
}): [P, T[]] {
  const cmpId = id || props['id'] || props['data-cid'];
  const state = useSelector<any, any>((state) => {
    if (state.model_global && getDvaApp()) {
      getDvaApp()._clearDevUI = () => {
        getCurrentWindow()['__dev_ui__'] = defaultDevUi;
        state.model_global.__dev_ui__ = baseCore.deepCopy(defaultDevUi);
      };
    }
    return state.model_global?.__dev_ui__[type]?.[cmpId];
  });
  const propsItems = items || props[itemsKey];
  const [updateItems, updateProps] = useMemo(() => {
    const current = state || {};
    return [
      current[updateItemsKey] || [],
      Object.keys(current).reduce<IObject>((p, key) => ({ ...p, [key]: current[key] }), {})
    ];
  }, [state]);
  const newItems = useCompute(() => {
    if (!updateItems.length) return propsItems;
    let innerItems = [...propsItems];
    updateItems.forEach((item) => {
      let { type: updateType, index = -1 } = item[updateItemStatusKey] || { type: 'add' };
      const loop = (items) => {
        if (!items?.length) {
          return null;
        }
        for (let i = 0, n = items.length; i < n; i++) {
          const itm = items[i];
          if ((itm[itemKey] ?? itm) === item[itemKey]) {
            return [items, i];
          }
          const find = loop(itm.children || itm.columns || itm.fields);
          if (find) {
            return find;
          }
        }
        return null;
      };
      const [findObj, findIndex] = updateType === 'replace' ? [null, -1] : loop(innerItems) || [null, -1];
      const copyItem = { ...item };
      delete copyItem[updateItemStatusKey];
      switch (updateType) {
        case 'add':
          if (findIndex > -1) {
            const findItem = baseCore.isObject(findObj[findIndex]) ? findObj[findIndex] : {};
            findObj[findIndex] = { ...findItem, ...copyItem };
          } else {
            if (index < 0) {
              if (type === 'toolbar') {
                index = innerItems.indexOf('->');
                index = index < 0 ? innerItems.length : index;
              } else {
                index = innerItems.length;
              }
            }
            innerItems.splice(Math.min(index, innerItems.length), 0, copyItem);
          }
          break;
        case 'update':
          if (findIndex > -1) {
            const findItem = baseCore.isObject(findObj[findIndex]) ? findObj[findIndex] : {};
            findObj[findIndex] = { ...findItem, ...copyItem };
          }
          break;
        case 'delete':
          if (findIndex > -1) {
            findObj.splice(findIndex, 1);
          }
          break;
        case 'replace':
          const newItems = item.items;
          innerItems = baseCore.isFunction(newItems) ? newItems(innerItems) : [...newItems];
          break;
        default:
          break;
      }
    });
    return innerItems;
  }, [updateItems, propsItems]);

  return [{ ...props, ...updateProps }, newItems];
}

/**
 * 获取UI更新器
 * @param currentLayout 当前UI
 * @returns
 */
export const getUIUpdater = (currentLayout: IObject[]) => (uiInfo: IObject<number>[] | Function) => {
  let layout: any = [];
  if (typeof uiInfo === 'function') {
    try {
      const newLayout = [...currentLayout];
      const updater = createUIUpdater(newLayout);
      layout = uiInfo(updater, newLayout);
      if (layout === updater || layout === undefined) {
        layout = newLayout;
      }
      return { layout };
    } catch (e) {
      console.log(e);
    }
    return { layout: currentLayout };
  }

  if (!Array.isArray(uiInfo) && baseCore.isObject(uiInfo)) {
    uiInfo = [uiInfo];
  }
  if (!Array.isArray(uiInfo) || uiInfo.length === 0) return { layout: currentLayout };
  layout = updateLayoutUI(currentLayout, uiInfo);
  if (layout === currentLayout) {
    return { layout: currentLayout };
  }
  return { layout };
};
