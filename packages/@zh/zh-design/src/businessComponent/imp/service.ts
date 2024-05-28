import { zh } from '../../util';

/**
 * 获取来源树
 */
export async function loadSourceTree({ bizCode, tableName }) {
  const [success, result] = await zh.request.getWithArray({
    url: '/zh-rule-engine/helpInfo/getTreeHelpInfo',
    data: { targetBizCode: bizCode, targetTable: tableName }
  });
  if (success) {
    const sourceNodes: any[] = [];
    zh.loopChildren({ children: result }, (node) => {
      if (!node.children?.length) {
        sourceNodes.push(node);
      }
    });
    return [result, sourceNodes];
  }
  return [result, []];
}

/**
 * 获取来源的配置信息
 * @param sourceId 来源id
 */
export async function loadSourceConfig({ sourceId }) {
  const [success, result] = await zh.request.getWithArray({
    url: '/zh-rule-engine/helpInfo/getHelpInfoById',
    data: { id: sourceId }
  });
  !success && zh.alert(result);
  if (success) {
    const { ruleHelpInfoList = [], ruleHelpInfoQueryList = [] } = result;
    return {
      columns: ruleHelpInfoList
        .filter((r) => r.isDisplay)
        .map((r) => {
          return {
            sortable: false,
            headerMenu: false,
            dataIndex: r.fieldName,
            title: r.fieldAlias || r.fieldName,
            width: r.fieldWidth || 100
          };
        }),
      queryItems: ruleHelpInfoQueryList.map((r) => {
        const item: any = { label: r.fieldAlias || r.fieldName, name: r.fieldName };
        r.helpId && (item.helpId = r.helpId);
        r.displayType && (item.xtype = r.displayType);
        r.enumValue &&
          (item.data = r.enumValue.split(';').map((item) => {
            const vl = item.split('|');
            return { value: vl[0], label: vl[1] };
          }));
        return item;
      })
    };
  }
  return { columns: [], queryItems: [] };
}

/**
 * 获取来源的数据信息
 */
export async function loadSourceData({ sourceId, pageIndex, pageSize, queryContion }: any) {
  if (!sourceId) {
    return {};
  }
  const [success, result] = await zh.request.getWithArray({
    url: '/zh-rule-engine/helpInfo/getHelpInfoList',
    data: { id: sourceId, pageIndex, pageSize, queryContion }
  });
  !success && zh.alert(result);
  return success ? result : { total: 0, list: [] };
}

/**
 * 转换来源数据
 */
export async function converSourceData({ sourceId, sourceDatas }) {
  const [success, result] = await zh.request.bodyWithArray({
    url: '/zh-rule-engine/helpInfo/mappingAimDatas',
    data: { id: sourceId, flowCode: '', sourceDatas }
  });
  !success && zh.alert(result);
  return [success, result];
}
