import { zh } from '../../util';
/**
 * 获取查询控件信息
 * @param pageId 业务标识
 */
export async function getQueryPanelInfo({ pageId }) {
  const { code, data } = await zh.request.get({
    url: `engine/metadata/queryPanel/getQueryPanelUIControl`,
    data: { pageId }
  });
  if (code === 0) {
    const fields = data.list || [];
    const values = data.rememberStr || {};
    fields.reduce((p, c) => {
      if (c.helpId && values[c.name]) {
        if (values[`[${c.name}]`]) {
          // 保存了键值对，则不需要代码转名称
          values[c.name] = values[`[${c.name}]`];
          return p;
        }
      }
      return p;
    }, []);
    return {
      fields,
      values,
      isChecked: data.isCheck === '1'
    };
  }
  return { fields: [], values: {}, isChecked: false };
}

/**
 * 保存查询记忆
 * @param pageId 业务标识
 * @param values 查询控件记忆条件
 * @param checked 为false时，自动清空记忆条件
 */
export async function setQueryPanelData({ pageId, values, checked }) {
  if (!values) {
    return true;
  }
  const rememberStr = checked ? values : {};
  const { code } = await zh.request.post({
    url: `engine/metadata/queryPanel/setQueryPanelData`,
    data: {
      pageId,
      rememberString: zh.jsonString(
        Object.keys(rememberStr).reduce((p, key) => {
          const keyValue = values[key];
          if (zh.isNullOrEmpty(keyValue) || keyValue.length === 0) {
            return p;
          } else {
            if (keyValue.hasOwnProperty('value')) {
              return {
                ...p,
                [`[${key}]`]: { value: keyValue.value, label: keyValue.label },
                [key]: keyValue.value
              };
            }
            if (zh.isArray(keyValue) && keyValue[0].hasOwnProperty('value')) {
              return {
                ...p,
                [`[${key}]`]: keyValue.map((v) => ({ value: v.value, label: v.label })),
                [key]: keyValue.map((v) => v.value).join()
              };
            }
            return {
              ...p,
              [key]: keyValue
            };
          }
        }, {})
      ),
      isCheck: checked ? 1 : 0
    }
  });
  return code === 0;
}

/**
 * 获取查询控件设置信息
 * @param pageId 业务标识
 */
export async function getQuerySettingInfo({ pageId }) {
  const { code, data } = await zh.request.get({
    url: `engine/metadata/queryPanel/getQueryPanelInfo?pageId=${pageId}`
  });
  return code === 0 ? data : [];
}

/**
 * 保存设置信息
 * @param pageId 业务标识
 * @param data
 */
export async function saveQuerySettingInfo({ pageId, data }) {
  const { code, message: msg } = await zh.request.post({
    url: `engine/metadata/queryPanel/saveQueryInfo?pageId=${pageId}`,
    data: {
      queryPanelRequests: zh.CryptoJS.encode(data)
    }
  });
  if (code === 0) {
    return true;
  }
  msg && zh.message(msg, 'error');
  return false;
}

/**
 * 重置查询设置
 * @param pageId 业务标识
 */
export function resetQuerySettingInfo({ pageId }) {
  return zh.request.post({
    url: `engine/metadata/queryPanel/restoreDefault?pageId=${pageId}`
  });
}

/**
 * 获取查询方案
 * @param pageId 业务标识
 */
export async function getQueryScheme({ pageId }) {
  return [];
  // try {
  //   const { items } = await zh.request.get({
  //     url: `MDP/BusObj/QuerySetting/GetSchemeListByPageId`,
  //     skipError: true,
  //     data: {
  //       pageid: pageId,
  //       page: 0,
  //       start: 0,
  //       limit: 50
  //     }
  //   });
  //   return items;
  // } catch (e) {
  //   return [];
  // }
}

/**
 * 获取查询方案的详细信息
 * @param schemeId 方案id
 */
export async function getQuerySchemeDetail({ schemeId }) {
  return await zh.request.get({
    url: `MDP/BusObj/QuerySetting/DealSchemeFields`,
    data: {
      schemeid: schemeId
    }
  });
}

/**
 * 获取方案树
 * @param pageId 业务标识
 */
export async function getQuerySchemeTree({ pageId }) {
  const { data = [] } = await zh.request.get({
    url: `MDP/BusObj/QuerySetting/GetSchemeTreeByPageId`,
    data: {
      pageid: pageId,
      node: 'root'
    }
  });
  return data.map((r, index) => ({ key: r.id, title: r.text, isLeaf: true, isSelected: index === 0 }));
}

/**
 * 获取方案对应的查询条件
 * @param schemeId 方案id
 */
export async function getQuerySchemeData({ schemeId }) {
  if (!schemeId) {
    return [];
  }
  const result = await zh.request.get({
    url: `MDP/BusObj/QuerySetting/GetSchemeFieldList`,
    data: {
      schemeid: schemeId,
      page: 0,
      start: 0,
      limit: 50
    }
  });
  return result.data || [];
}

/**
 * 新增查询方案
 * @param schemeName 方案名称
 * @param pageId 业务标识
 */
export async function addQueryScheme({ schemeName, pageId }) {
  const { code } = await zh.request.post({
    url: `MDP/BusObj/QuerySetting/SaveScheme`,
    data: { cname: schemeName, pageid: pageId, isperson: 1 }
  });
  return code === 0;
}

/**
 * 删除查询方案
 * @param schemeId 方案id
 */
export async function deleteQueryScheme({ schemeId }) {
  const { code } = await zh.request.get({
    url: `MDP/BusObj/QuerySetting/DeleteScheme`,
    data: {
      schemeid: schemeId
    }
  });
  return code === 0;
}

/**
 * 更新查询方案状态
 * @param schemeId 方案id
 * @param status 状态： 0 停用 1 启用
 */
export async function updateQuerySchemeStatus({ schemeId, status }) {
  const { code } = await zh.request.get({
    url: `MDP/BusObj/QuerySetting/OpenOrCloseScheme`,
    data: {
      schemeid: schemeId,
      status
    }
  });
  return code === 0;
}

/**
 * 保存方案详情
 * @param schemeId 方案id
 * @param data 详情信息
 */
export async function saveQuerySchemeData({ schemeId, data }) {
  const { code, message: msg } = await zh.request.post({
    url: `MDP/BusObj/QuerySetting/SaveSchemeDetail`,
    data: {
      schemeid: schemeId,
      data: zh.CryptoJS.encode(data)
    }
  });
  return code === 0;
}
