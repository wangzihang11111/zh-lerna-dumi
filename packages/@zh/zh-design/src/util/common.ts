import { core, getCurrentWindow, getHistory, IObject, PromiseType } from '@zh/zh-core';
import { IUser } from './interface';

function openUrl(url: string, title?: string) {
  if (title) {
    url = core.handleUrl(url, { appTitle: encodeURIComponent(title) });
  }
  url = core.getAbsoluteUrl(url); // 多版本使用时，相对路径可能会有问题
  const btn: any = document.createElement('a');
  btn.target = '_blank';
  btn.href = url;
  btn.click();
}

export const CommonUtil = {
  /**
   * 在列表页面注册回刷事件
   * @param busType 业务类型
   * @param callback 回刷事件
   */
  onRefreshList(busType: string, callback: Function) {
    const unSets: Set<Function> = getCurrentWindow('currentPageInstance')?.unSubscribeFn || new Set<Function>();
    const un = core.getObserver().subscribe(callback, `refresh${busType}`);
    unSets.add(un);
    return () => {
      un();
      unSets.has(un) && unSets.delete(un);
    };
  },
  /**
   * 在编辑页面回刷列表页面
   * @param busType 业务类型
   * @param data 回刷数据值
   */
  refreshList(busType: string, data?: any) {
    try {
      core.getObserver().notify(data, `refresh${busType}`).then();
    } catch (e) {
      console.log(e);
    }
  },
  /**
   * 获取public文件夹下的路径，微前端下会自动拼接微前端地址
   * @param url
   */
  getPublicPath(url: string) {
    const prefix = core.external.getQianKun?.()?.publicPath || './';
    if (url.indexOf('/') === 0) {
      url = url.substring(1);
    }
    return prefix + url;
  },
  /**
   *
   * @param path
   * @param queryParmas  microAppName 微应用名
   * @returns
   */
  open(
    path: string,
    queryParmas: IObject & {
      microAppName?: string;
      AppTitle?: string;
      outLink?: boolean;
      validateMenuCode?: boolean;
    } = {}
  ) {
    const { microAppName, outLink = false, validateMenuCode = true, ...query } = queryParmas || {};
    if (query.hasOwnProperty('AppTitle')) {
      query.appTitle = query.AppTitle;
      delete query.AppTitle;
    }

    if (!core.isNullOrEmpty(microAppName, '')) {
      const openMicroApp = core.external.getQianKun?.().getMasterInfo?.()?.openMicroApp;
      if (openMicroApp) {
        openMicroApp({
          microAppName,
          microAppPath: path,
          query
        });
        return true;
      } else {
        core.alert(`当前环境不支持打开其他微应用${microAppName}${path}，请集成到微前端框架中使用!`);
        return false;
      }
    }

    // 如果是完整的子应用路径，走下面的逻辑
    if (path.indexOf('/sub/') === 0) {
      const openPath = core.external.getQianKun?.().getMasterInfo?.()?.openPath;
      if (openPath) {
        openPath(path, query);
        return true;
      } else {
        core.alert(`当前环境不支持打开其他微应用，请集成到微前端框架中使用!`);
        return false;
      }
    }

    const menuCode = core.getQueryValue('menucode');
    if (
      validateMenuCode !== false &&
      menuCode &&
      !query.hasOwnProperty('menucode') &&
      !core.getQueryValue('menucode', { search: path })
    ) {
      // 当前页面存在多模式参数，自动传递到明细页面
      query.menucode = menuCode;
    }
    if (/^https?:/.test(path)) {
      openUrl(core.handleUrl(path, query), query?.appTitle);
      return true;
    }
    const hash = window.location.hash;
    const newPath = core.handleUrl(path.indexOf('/') === 0 ? path : `/${path}`, query);

    // 打开外部项目的路由
    if (newPath.indexOf('#/') > -1 || outLink) {
      if (hash && newPath.indexOf('#/') === -1) {
        openUrl(`#${newPath}`, query?.appTitle);
      } else {
        openUrl(newPath, query?.appTitle);
      }
      return true;
    }

    if (hash) {
      const currentPath = hash.substring(1);
      if (newPath === currentPath) {
        return false;
      }
    }

    // 打开当前项目路由
    getHistory().push(newPath);

    return true;
  },
  async close(check: boolean = true) {
    const closeCheck = core.getPageInstance()?.['$CloseCheck'];
    if (check && core.isFunction(closeCheck)) {
      const checkSuccess = await closeCheck();
      if (!checkSuccess) {
        return false;
      }
    }
    getHistory().goBack();
    return true;
  },
  getUser<T = IUser>() {
    return core.getUser<T>();
  },
  safeRefresh(query: IObject = {}) {
    const refreshLoad = core.external.getQianKun?.()?.history?.reload;
    if (refreshLoad) {
      refreshLoad(query);
    } else {
      const { pathname } = getHistory().location;
      const lastQuery = core.getQueryValue('');
      const newQuery = { ...lastQuery, ...query };
      const pathUrl = window.location.pathname || '/';
      window.location.href = core.handleUrl(`${pathUrl}#${pathname}`, newQuery);
      window.location.reload();
    }
  },
  openHelp(params: {
    type: string;
    multiple?: boolean;
    helpId?: string;
    [x: string]: any;
  }): PromiseType<null | IObject | IObject[]> {
    return core.external.openHelp?.(params);
  }
};
