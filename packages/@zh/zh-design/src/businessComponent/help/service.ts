import { message } from '../../functionalComponent';
import { zh } from '../../util';

/**
 * 保存上一次激活的tab页
 * @param helpId
 * @param activeTabKey
 */
export async function saveActiveTabKey({ helpId, activeTabKey }) {
  return;
  // try {
  //   await zh.request.post({
  //     url: `SUP/RichHelp/SetHelpTabFlg`,
  //     skipError: true,
  //     data: { helpId: helpId, flag: activeTabKey }
  //   });
  // } catch (e) {
  //   console.log(e);
  // }
}

/**
 * 获取上一次激活的tab页
 */
export async function getActiveTabKey({ helpId }) {
  return undefined;
  //try {
  // const activeTabKey = await zh.request.get({
  //   url: `SUP/RichHelp/GetHelpTabFlg?helpId=${helpId}`,
  //   skipError: true
  // });
  // return activeTabKey === -1 ? undefined : activeTabKey.toString();
  // } catch {
  //   return undefined;
  // }
}

/**
 * 获取通用帮助基本信息
 * @param helpId 帮助标识
 */
export async function getHelpInfo({ helpId }) {
  if (!helpId) {
    return {};
  }
  try {
    if (zh.isFunction(helpId)) {
      helpId = await helpId();
    }
    const { code, data } = await zh.request.get({
      url: `baseservice/comhelp/getComHelpInfo?helpId=${helpId}`
    });
    if (code === 0) {
      // setHelpLocale(zh.parseJson(data.helpLang));
      return {
        valueField: data.codeField,
        labelField: data.nameField,
        userCodeField: data.userCodeField,
        helpTitle: data.title,
        columns: data.columns.map((c) => ({ ...c, flex: 1, tooltip: true })),
        showTree: data.showTree === 1,
        showList: true,
        helpId
      };
    } else {
      return { helpId };
    }
  } catch {
    return {};
  }
}

/**
 * 获取通用帮助列表数据
 * @param helpId 通用帮助标识
 * @param keyword 查询关键字
 * @param pageIndex 分页索引
 * @param pageSize 每页最大显示数
 * @param clientSqlFilter 过滤条件
 * @param infoRightUIContainerID 容器ID
 */
export async function getHelpList({
  helpId,
  keyword = '',
  // querysearch,
  pageIndex,
  pageSize,
  clientSqlFilter,
  infoRightUIContainerID
}) {
  const data: any = {
    pageIndex,
    inputKey: keyword,
    pageSize
  };
  if (!helpId) {
    return {
      record: [],
      total: 0
    };
  }
  if (clientSqlFilter) {
    zh.debug({ msg: clientSqlFilter });
    if (zh.isObject(clientSqlFilter)) {
      data.clientJsonFilter = clientSqlFilter;
    } else {
      data.clientSqlFilter = zh.CryptoJS.encode(clientSqlFilter);
    }
  }
  if (infoRightUIContainerID) {
    data.UIContainerID = infoRightUIContainerID;
  }
  try {
    if (zh.isFunction(helpId)) {
      helpId = await helpId();
    }
    const {
      code,
      data: { list, total },
      message: msg
    } = await zh.request.body({
      url: `baseservice/comhelp/getComHelpList`,
      data: {
        ...data,
        helpId
      }
    });
    if (code !== 0) {
      msg && console.error(msg);
      return {
        record: [],
        total: 0
      };
    }
    return {
      record: list,
      total
    };
  } catch (e) {
    console.error(e);
    return {
      record: [],
      total: 0
    };
  }
}

/**
 * 获取通用帮助树数据
 * @param param
 * @returns
 */
export async function getTreeList({ helpId, clientSqlFilter }) {
  const params: any = {
    node: 'root'
  };
  if (clientSqlFilter) {
    if (zh.isObject(clientSqlFilter)) {
      params.clientJsonFilter = clientSqlFilter;
    } else {
      params.clientSqlFilter = zh.CryptoJS.encode(clientSqlFilter);
    }
  }
  if (zh.isFunction(helpId)) {
    helpId = await helpId();
  }
  const {
    code,
    data,
    message: msg
  } = await zh.request.body({
    url: `baseservice/comhelp/getComHelpTreeList`,
    data: {
      ...params,
      helpId
    }
  });
  if (code === 0) {
    return data;
  }
  msg && message.error(msg);
  return [];
}

/**
 * 获取已选择的数据
 * @returns
 */
export async function getSelectedData({ helpId, codes }) {
  try {
    if (zh.isFunction(helpId)) {
      helpId = await helpId();
    }
    const { data } = await zh.request.get({
      url: `baseservice/comhelp/getSelectedData`,
      data: {
        helpId,
        codes
      },
      skipError: true
    });
    return data || [];
  } catch (e) {
    return [];
  }
}

/**
 * 获取通用帮助常用列表
 * @param helpId 通用帮助标识
 * @param pageIndex
 * @param pageSize
 * @param clientSqlFilter
 * @param infoRightUIContainerID
 */
export async function getCommonList({ helpId, pageIndex, pageSize, clientSqlFilter, infoRightUIContainerID }) {
  const data: any = {
    pageIndex,
    pageSize
  };
  if (clientSqlFilter) {
    zh.debug({ msg: clientSqlFilter });
    if (zh.isObject(clientSqlFilter)) {
      data.clientJsonFilter = clientSqlFilter;
    } else {
      data.clientSqlFilter = zh.CryptoJS.encode(clientSqlFilter);
    }
  }
  if (infoRightUIContainerID) {
    data.UIContainerID = infoRightUIContainerID;
  }
  if (zh.isFunction(helpId)) {
    helpId = await helpId();
  }
  const {
    code,
    data: { list = [], total = 0 } = {},
    message: msg
  } = await zh.request.body({
    url: `baseservice/comhelp/getComHelpHotDataList`,
    data: {
      ...data,
      helpId
    }
  });
  if (code === 0) {
    return {
      record: list,
      total
    };
  }
  msg && message.error(msg);
  return { record: [], total: 0 };
}

/**
 * 添加常用数据
 * @param helpId 通用帮助标识
 * @param codeValue 常用数据主键
 */
export async function addCommonData({ helpId, codeValue }) {
  if (zh.isFunction(helpId)) {
    helpId = await helpId();
  }
  const result = await zh.request.post({
    url: `baseservice/comhelp/saveComHelpHotData`,
    data: { helpId: helpId, keyValue: codeValue }
  });
  if (result.code === 0) {
    return true;
  } else if (result.message) {
    message.error(result.message);
  }
  return false;
}

/**
 * 移除常用数据
 * @param helpId 通用帮助标识
 * @param codeValue 常用数据主键
 */
export async function deleteCommonData({ helpId, codeValue }) {
  if (zh.isFunction(helpId)) {
    helpId = await helpId();
  }
  const result = await zh.request.post({
    url: `baseservice/comhelp/deleteHotData`,
    data: { helpId, keyValue: codeValue }
  });
  if (result.code === 0) {
    return true;
  } else if (result.message) {
    message.error(result.message);
  }
  return false;
}

/**
 * 获取通用帮助最近使用列表
 * @param helpId 通用帮助标识
 * @param pageIndex
 * @param pageSize
 * @param clientSqlFilter
 * @param infoRightUIContainerID
 */
export async function getRecentlyList({ helpId, pageIndex, pageSize, clientSqlFilter, infoRightUIContainerID }) {
  // const page = pageIndex - 1;
  // const data: any = {
  //   page,
  //   start: page * pageSize,
  //   limit: pageSize
  // };
  // if (clientSqlFilter) {
  //   zh.debug({ msg: clientSqlFilter });
  //   if (zh.isObject(clientSqlFilter)) {
  //     data.clientJsonFilter = clientSqlFilter;
  //   } else {
  //     data.clientSqlFilter = zh.CryptoJS.encode(clientSqlFilter);
  //   }
  // }
  // if (infoRightUIContainerID) {
  //   data.UIContainerID = infoRightUIContainerID;
  // }
  // const { code, list, message: msg, total } = await zh.request.post({
  //   url: `baseservice/comhelp/getLastUseList?helpId=${helpId}`,
  //   data
  // });
  // if (code === 0) {
  //   return {
  //     record: list,
  //     total
  //   };
  // }
  // msg && message.error(msg);
  return { record: [], total: 0 };
}

/**
 * 添加最近数据
 * @param helpId 通用帮助标识
 * @param codeValue 最近数据主键
 */
export async function addRecentlyData({ helpId, codeValue }) {
  if (!codeValue || !helpId) {
    return true;
  }
  return true;
  // const result = await zh.request.post({
  //   url: `baseservice/comhelp/saveLastUseData`,
  //   data: { helpId, codeValue }
  // });
  // if (result.code === 0) {
  //   return true;
  // } else if (result.message) {
  //   console.log(result.message);
  // }
  // return false;
}
