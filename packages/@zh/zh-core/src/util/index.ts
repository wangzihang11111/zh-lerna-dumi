import { CSSProperties } from 'react';
import { updateItemsKey, updateItemStatusKey } from '../baseModel';
import { getGlobalConfig } from '../globalConfig';
import type { IObject, IUpdateConfig, PromiseType, TypeOrFn } from '../interface';
import { getDvaApp, getHistory } from '../umiExports';
import { AllReady, depUtil, PageReady, registerExternal } from './base';
import { getCurrentWindow, setGlobalVar } from './core';
import { initCustomThemeColor, util } from './tool';

export * from './observer';
export * from './request';
export {
  core,
  history,
  emptyFn,
  borderStyle,
  flexStyle,
  AllReady,
  getCurrentWindow,
  setGlobalVar,
  PageReady,
  initCustomThemeColor
};

const scheduleTasks: any = { wait: Promise.resolve(), tasks: [] };

export function startScheduleTask(currentTask) {
  if (scheduleTasks.tasks.length === 0) {
    scheduleTasks.wait.then(() => {
      const tasks = scheduleTasks.tasks;
      if (tasks.length > 0) {
        scheduleTasks.tasks = [];
        depUtil.batchedUpdates(() => tasks.forEach((task) => task()));
      }
    });
  }
  scheduleTasks.tasks.push(currentTask);
}

function implementDispatchAction(dispatchActionMethod, config: IUpdateConfig) {
  const currentTask = () => {
    if (config.immediate) {
      dispatchActionMethod();
    } else {
      AllReady(dispatchActionMethod, false, '');
    }
  };
  if (config.batchedUpdate) {
    startScheduleTask(currentTask);
  } else {
    currentTask();
  }
}

/**
 * 更新layout ui状态 0 | 1 | 2 | 3
 * @param uiInfo 更新字段，格式：{p_form0000000025_m#asr_flg: 0}， 0只读 1可编辑 2不可见 3必输项 或者函数
 * @param config
 */
const updateUI = (uiInfo: IObject<number>[] | Function, config?: IUpdateConfig) => {
  implementDispatchAction(
    () => {
      if (core.isFunction(core.getPageInstance()?.updateUI)) {
        core.getPageInstance().updateUI(uiInfo);
        return;
      }
      getDvaApp()?._store.dispatch({
        type: 'model_global/updateLayout',
        uiInfo
      });
    },
    { immediate: true, batchedUpdate: true, ...config }
  );
};

type FO = IObject | Function;

const updateDevUI = (devUi: { toolbar?: FO; form?: FO; table?: FO; query?: FO }, config?: IUpdateConfig) => {
  implementDispatchAction(
    () => {
      getDvaApp()?._store.dispatch({
        type: 'model_global/updateDevUI',
        ...devUi
      });
    },
    { immediate: true, batchedUpdate: true, ...config }
  );
};

const updateToolbar = (toolbar: FO, config?: IUpdateConfig) => {
  updateDevUI({ toolbar }, config);
};
const updateQuery = (query: FO, config?: IUpdateConfig) => {
  updateDevUI({ query }, config);
};
const updateForm = (form: FO, config?: IUpdateConfig) => {
  updateDevUI({ form }, config);
};
const updateTable = (table: FO, config?: IUpdateConfig) => {
  updateDevUI({ table }, config);
};

const updateDevItems = (
  {
    updateFn,
    id,
    update,
    insertIndex,
    type,
    itemKey
  }: {
    updateFn: any;
    id: string;
    update: IObject[] | IObject;
    insertIndex?: number;
    type: 'add' | 'update' | 'delete' | 'replace';
    itemKey: string;
  },
  config?: IUpdateConfig
) => {
  updateFn((updater) => {
    const updateArr = util.isArray(update) || util.isFunction(update) ? update : [update];
    updater[id].setProps((props: any) => {
      const prevItems = props?.[updateItemsKey] || [];
      const newItems: IObject[] = [];
      if (type === 'replace') {
        newItems.push({
          items: util.isFunction(updateArr) ? updateArr : updateArr.map((itm) => ({ ...itm })),
          [updateItemStatusKey]: { type }
        });
      } else if (util.isArray(updateArr)) {
        updateArr.forEach((itm) => {
          if (itm[itemKey]) {
            newItems.push({
              ...itm,
              [updateItemStatusKey]: insertIndex !== undefined ? { type, index: insertIndex } : { type }
            });
          }
        });
      }
      return { ...props, [updateItemsKey]: [...prevItems, ...newItems] };
    });
  }, config);
};

/**
 * 更新page页面的model
 * @param payload 参数
 * @param config
 */
const updateState = (payload: FO, config?: IUpdateConfig) => {
  implementDispatchAction(
    (page) => {
      page = page || depUtil.getPageInstance();
      page?.umiDispatch?.({
        type: '__update__',
        payload
      });
    },
    { immediate: false, batchedUpdate: true, ...config }
  );
};

export function getSubscribeCondition(listenerKey) {
  return (param) => {
    if (param.hasOwnProperty('key')) {
      const keys = Array.isArray(param.key) ? param.key : [param.key];
      const listenerKeys = Array.isArray(listenerKey) ? listenerKey : [listenerKey];
      return listenerKeys.find((key) => {
        if (key.indexOf('.') > -1) {
          if (keys.includes(key)) {
            return true;
          }
          const [cid, ...others] = key.split('.');
          const tmp = others.join('.');
          return param.containerId === cid && (tmp === '*' || keys.includes(tmp));
        }
        return key === '*' || keys.includes(key);
      });
    }
    return true;
  };
}

const getAction = () => {
  const page = getCurrentWindow('currentPageInstance') || {};
  if (!page.__useAction__) {
    page.__useAction__ = (type) => {
      page.__cacheAction__ = page.__cacheAction__ || {};
      const cacheAction = page.__cacheAction__;
      cacheAction[type] = cacheAction[type] || {
        un: {},
        prevFn: {},
        effect: (effect, keys = '*', options = {}) => {
          if (util.isFunction(keys)) {
            [keys, effect] = [effect, keys];
          }
          const keyArr = util.isArray(keys) ? keys : [keys];
          keyArr.forEach((key: string) => {
            const { onlyEvent = true, loading = false } = options as any;
            let cacheUn = cacheAction[type].un[key] || [];
            const prevFn = onlyEvent ? cacheAction[type].prevFn[key] : undefined;
            const un = depUtil.getPageObserver().subscribe(
              async (value) => {
                loading && depUtil.showLoading(loading);
                try {
                  return await effect(value, prevFn ? () => prevFn(value) : undefined);
                } finally {
                  loading && depUtil.showLoading(false);
                }
              },
              type,
              getSubscribeCondition(key)
            );
            if (onlyEvent && cacheUn.length > 0) {
              cacheUn.forEach((u) => u());
              cacheUn = [];
            }
            cacheUn.push(un);
            cacheAction[type].un[key] = cacheUn;
            cacheAction[type].prevFn[key] = effect;
          });
        }
      };
      return cacheAction[type].effect;
    };
  }
  return page.__useAction__;
};

const baseUtil = {
  ...util,
  ...depUtil,
  //系统表单二次开发调用服务端封装
  async execServer(funcName: string, paramObj: IObject, successCallback?: Function) {
    if (!funcName || !paramObj) {
      depUtil.alert('功能名和参数不能为空');
      return;
    }

    const res = await depUtil.request.get({
      data: { encodeParams: util.CryptoJS.encode(paramObj) },
      url: `Addin/ExtendFunc/Action?funcName=${funcName}`
    });
    const result = res ?? '';

    successCallback?.(result);
    return result;
  }
};

/**
 * 监听click的前置事件
 * @param effect 处理事件，返回false取消事件向下执行
 * @param key 监听控件key，相同key情况建议用 containerId.key 的方式区分，containerId为button的容器id
 * @param options {onlyEvent: boolean, loading:boolean|string} 唯一事件或者加载中的状态，loading为string时表示自定义加载文案
 */
type ActionEffectType<T = {}> = (
  effect: (
    params: { key: string; args: any[]; containerId: string; [others: string]: any } & T,
    preEffect: Function
  ) => PromiseType<void>,
  keys: string | string[],
  options?: { onlyEvent?: boolean; loading?: boolean | string }
) => void;

export interface IPageCallbackParams {
  from?: string;
  /**
   * 订阅事件
   */
  subscribe: (callback: Function, eventType: string) => Function;
  /**
   * 原子事件处理器，useClick、useBeforeClick等等都是基于此方法扩展
   */
  useAction: (type: string) => ActionEffectType;
  /**
   * 监听click的前置事件
   */
  useBeforeClick: ActionEffectType<{ instance: IObject }>;
  /**
   * 监听click事件
   */
  useClick: ActionEffectType<{ instance: IObject }>;
  /**
   * 监听表单字段值变化
   */
  useValuesChange: ActionEffectType;
  /**
   * 监听表格更新行数据变化
   */
  useUpdateRow: ActionEffectType;
  /**
   * 监听表格字段值变化，目前仅支持pc表格
   */
  useDataIndexChange: ActionEffectType;
  /**
   * 监听表格所有行记录变化
   */
  useUpdateRows: ActionEffectType;
  /**
   * 监听弹窗附件列表返回
   */
  useAttachmentReturn: ActionEffectType;
}

type PageCallbackType = (page: any, params: IPageCallbackParams, util: typeof baseUtil) => void;

const wrapReady = (
  pageCallback: PageCallbackType,
  listPageCallback?: PageCallbackType | null,
  options?: { delay?: boolean; from?: string; priorityTop?: boolean }
) => {
  AllReady(
    (page, from) => {
      const { subscribe }: any = depUtil.getPageObserver();
      const useAction = getAction();
      const params: IPageCallbackParams = {
        from,
        subscribe,
        useAction,
        useBeforeClick(effect, key, options = { onlyEvent: true }) {
          useAction('onBeforeClick')(effect, key, options);
        },
        useClick(effect, key, options = { onlyEvent: true }) {
          useAction('onClick')(effect, key, options);
        },
        useValuesChange(effect, key, options = { onlyEvent: true }) {
          useAction('onValuesChange')(effect, key, options);
        },
        useUpdateRow(effect, key, options = { onlyEvent: true }) {
          useAction('onUpdateRow')(effect, key, options);
        },
        useUpdateRows(effect, key, options = { onlyEvent: true }) {
          useAction('onUpdateRows')(effect, key, options);
        },
        useDataIndexChange(effect, key, options = { onlyEvent: true }) {
          useAction('onDataIndexChange')(effect, key, options);
        },
        useAttachmentReturn(effect, key = '*', options = { onlyEvent: true }) {
          useAction('onAttachmentReturn')(effect, key, options);
        }
      };
      if (page.isList && listPageCallback) {
        listPageCallback(page, params, baseUtil);
      } else {
        pageCallback(page, params, baseUtil);
      }
    },
    { delay: true, ...options }
  );
};

const emptyFn = function () {};

type ItemType<T> = Array<T & { [k: string]: any }>;

/**
 * 用于获取更新组件全局属性的函数
 * @param updateFn 内部更新函数
 * @returns
 */
const getUpdateProps =
  (updateFn) =>
  ({ id, props }: { id: string; props: IObject }, config?: IUpdateConfig) => {
    updateFn((updater) => {
      updater[id].setProps((prevProps) => ({ ...prevProps, ...props }));
    }, config);
  };

const getSetItems =
  (updateFn) =>
  ({ id, items }: { id: string; items: TypeOrFn<ItemType<any>, any[]> }, config?: IUpdateConfig) => {
    updateDevItems(
      {
        updateFn,
        id,
        update: items,
        type: 'replace',
        itemKey: ''
      },
      config
    );
  };

const getAddItems =
  <T = IObject>(updateFn, itemKey) =>
  ({ id, items, insertIndex }: { id: string; items: ItemType<T>; insertIndex?: number }, config?: IUpdateConfig) => {
    updateDevItems({ updateFn, id, update: items, insertIndex, type: 'add', itemKey }, config);
  };

const getUpdateItems =
  <T = IObject>(updateFn, itemKey) =>
  ({ id, items }: { id: string; items: ItemType<T> }, config?: IUpdateConfig) => {
    updateDevItems({ updateFn, id, update: items, type: 'update', itemKey }, config);
  };

const getDeleteItems =
  (updateFn, itemKey) =>
  ({ id, items }: { id: string; items: string[] }, config?: IUpdateConfig) => {
    const arr = util.isArray(items) ? items : [items];
    updateDevItems({ updateFn, id, update: arr.map((p) => ({ id: p })), type: 'delete', itemKey }, config);
  };

const core = {
  ...baseUtil,
  getHistory,
  AllReady: wrapReady,
  PageReady,
  registerExternal,
  updateUI,
  updateState,
  fastDp: {
    statusKey: updateItemStatusKey,
    itemsKey: updateItemsKey,
    updateDevUI,
    toolbar: {
      updateProps: getUpdateProps(updateToolbar),
      addItems: getAddItems<{ id: string }>(updateToolbar, 'id'),
      updateItems: getUpdateItems<{ id: string }>(updateToolbar, 'id'),
      deleteItems: getDeleteItems(updateToolbar, 'id'),
      setItems: getSetItems(updateToolbar)
    },
    form: {
      updateProps: getUpdateProps(updateForm),
      addItems: getAddItems<{ name: string }>(updateForm, 'name'),
      updateItems: getUpdateItems<{ name: string }>(updateForm, 'name'),
      deleteItems: getDeleteItems(updateForm, 'name'),
      setItems: getSetItems(updateForm)
    },
    table: {
      updateProps: getUpdateProps(updateTable),
      addItems: getAddItems<{ dataIndex: string }>(updateTable, 'dataIndex'),
      updateItems: getUpdateItems<{ dataIndex: string }>(updateTable, 'dataIndex'),
      deleteItems: getDeleteItems(updateTable, 'dataIndex'),
      setItems: getSetItems(updateTable)
    },
    query: {
      updateProps: getUpdateProps(updateQuery),
      updateItems: getUpdateItems(updateQuery, 'name')
    }
  },
  getDispatch() {
    return getDvaApp()?._store.dispatch;
  }
};

type positionType = 'top' | 'right' | 'bottom' | 'left';
const borderStyle = (position: positionType | Array<positionType> | '' = '', px: number = 1) => {
  const border = `${px}px solid var(--border-color-split, #f0f0f0)`;
  if (!position || position.length === 0) {
    return { border };
  }
  return (Array.isArray(position) ? position : [position]).reduce((p, c) => {
    return { ...p, [`border${util.toFirstUpperCase(c)}`]: border };
  }, {});
};

const flexStyle = ({ minHeight = 360, ...others }: CSSProperties = {}) => {
  return {
    minHeight,
    padding: 'var(--inner-padding, 8px)',
    backgroundColor: 'var(--component-background, #fff)',
    ...others
  };
};

const history = getHistory();

export type CoreType = typeof core;

/**
 * 注入全局用户信息（登录信息）
 */
export async function injectGlobalInfo(cache?: boolean) {
  try {
    const useCache = cache ?? core.getCache('useCache') ?? true;
    let globalInfo: any = useCache ? core.getCache('__ViewBagInfo__', true) : null;
    if (!globalInfo || (globalInfo?.timestamp && new Date().valueOf() - globalInfo.timestamp > 24 * 3600000)) {
      globalInfo = await core.request.get({ url: getGlobalConfig().apiUrl.appInfo });
    }
    if (core.isObject(globalInfo)) {
      globalInfo['timestamp'] = new Date().valueOf();
      core.setCache('__ViewBagInfo__', globalInfo);
      core.setUser(globalInfo);
      return globalInfo;
    } else {
      console.log(globalInfo);
    }
  } catch (e) {
    console.log(e);
  }
}
