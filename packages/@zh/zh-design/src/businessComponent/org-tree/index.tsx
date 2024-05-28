import { useMemo } from 'react';
import { AsyncTree, IAsyncTreeProps } from '../../functionalComponent';
import { compHoc, zh, useRefCallback } from '../../util';

/**
 * 加载组织树数据
 * @param params
 */
async function getOrgTree(data: OrgTreeParamType) {
  const res = await zh.request.get({
    url: '/basedata/org/getCompleteOrgTree',
    data
  });
  if (res?.code === 0) {
    return res?.data ?? [];
  } else {
    return [];
  }
}

const defaultProps = {
  /**
   * @description       权限
   * @default           false
   */
  dataAccessAuth: false, // 权限
  containLowCu: true, // 包含单元
  containDept: false, // 包含部门
  containProject: false, // 包含项目
  enableManagerContrl: false, // 启用管理员数据权限
  orgId: '', // 只显示此组织
  userId: '' // 按此用户过滤组织
};

export type OrgTreeParamType = Partial<typeof defaultProps> & Record<string, any>;

export type OrgTreeType = Omit<IAsyncTreeProps, 'request'> & {
  /**
   * @description       默认选中第一个节点
   * @default           false
   */
  defaultSelectedFirstNode?: boolean;
  /**
   * @description       树的参数
   * @default           {dataAccessAuth: false, containLowCu: true,  containDept: false,  containProject: false, enableManagerContrl: false}
}
   */
  params?: OrgTreeParamType;
  beforeRequest?: (...args) => Promise<boolean | void>;
  treeRequest?: (params: OrgTreeParamType) => Promise<any[]>;
};

/**
 * 导出组织树控件
 */
export const OrgTree = compHoc<OrgTreeType>((props) => {
  const {
    defaultSelectedFirstNode,
    defaultChange = true,
    params,
    outRef,
    treeRequest,
    beforeRequest,
    convertNode: originConvertNode,
    ...others
  } = props;
  const convertNode = useRefCallback((node, levelIndex) => {
    if (defaultSelectedFirstNode && levelIndex.level === 0 && levelIndex.index === 0) {
      node.isSelected = true;
    }
    return originConvertNode ? originConvertNode(node, levelIndex) : node;
  });
  const requestParams = useMemo(() => {
    return { ...defaultProps, ...params };
  }, [params]);

  const request = useRefCallback(async (param) => {
    if ((await beforeRequest?.(param)) !== false) {
      if (treeRequest) {
        return await treeRequest(param);
      }
      return await getOrgTree(param);
    }
    return [];
  });

  return (
    <AsyncTree
      ref={outRef}
      request={request}
      params={requestParams}
      convertNode={convertNode}
      defaultChange={defaultChange}
      {...others}
    />
  );
}, 'OrgTree');
