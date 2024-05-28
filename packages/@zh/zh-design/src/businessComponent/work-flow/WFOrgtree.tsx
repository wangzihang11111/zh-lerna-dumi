import { useMemo } from 'react';
import { AsyncTree, IAsyncTreeProps } from '../../functionalComponent';
import { compHoc, zh, useRefCallback } from '../../util';

/**
 * 加载组织树数据
 * @param params
 */
async function getOrgTree(params: any) {
  const { clientSqlFilter = '' } = params;

  let sqlFilter = zh.isFunction(clientSqlFilter) ? clientSqlFilter() : clientSqlFilter;
  if (sqlFilter && zh.isString(sqlFilter)) {
    sqlFilter = zh.CryptoJS.encode(sqlFilter);
  } else {
    sqlFilter = '';
  }

  return await zh.request.get({
    url: '/basedata/orgTree/getOrgDeptTree'
  });
}

const defaultProps = {
  orgattr: 'lg', // 14是财务组织树
  isLazyLoad: false,
  isIncludeDept: true,
  isRight: true,
  isActive: true,
  isDeptRight: true,
  sqlName: '',
  selectedorgid: '',
  orglabel: '',
  isFromWM: '',
  isZhinengDept: false
};

export type OrgTreeParamType = Partial<typeof defaultProps> & {
  clientSqlFilter?: string | Function;
};

export type OrgTreeType = Omit<IAsyncTreeProps, 'request'> & {
  titleField?: string;
  defaultSelectedFirstNode?: boolean;
  params?: OrgTreeParamType;
  beforeRequest?: (...args) => Promise<boolean | void>;
};

/**
 * 导出组织树控件， 默认不懒加载 包括部门 无权限 过滤休眠
 */
export const WFOrgtree = compHoc<OrgTreeType>((props) => {
  const {
    defaultSelectedFirstNode,
    titleField,
    defaultChange = true,
    params,
    outRef,
    beforeRequest,
    convertNode: originConvertNode,
    ...others
  } = props;
  const convertNode = useRefCallback((node, levelIndex) => {
    const newNode: any = {
      title:
        node.UserParam === 'Y'
          ? `(${node.OCode})${node.OName}`
          : node.UserParam === 'N' && node.CodeValue
          ? `(${node.OCode})${node.CodeValue}`
          : node[titleField || 'text'],
      key: node.id,
      ...node,
      PhId: node.id,
      phid: node.PhId
    };
    if (defaultSelectedFirstNode && levelIndex.level === 0 && levelIndex.index === 0) {
      newNode.isSelected = true;
    }
    return originConvertNode ? originConvertNode(newNode, levelIndex) : newNode;
  });
  const requestParams = useMemo(() => {
    return { ...defaultProps, ...params };
  }, [params]);

  const request = useRefCallback(async (param) => {
    if ((await beforeRequest?.(param)) !== false) {
      const res = await getOrgTree(param);
      console.log(res, 'getOrgTree');
      if (res.code === 0) {
        return res.data;
      } else {
        return [];
      }
    }
    return [];
  });
  return (
    <AsyncTree
      ref={outRef}
      request={request}
      params={requestParams}
      convertNode={convertNode}
      {...others}
      defaultChange={defaultChange}
    />
  );
}, 'WFOrgtree');
