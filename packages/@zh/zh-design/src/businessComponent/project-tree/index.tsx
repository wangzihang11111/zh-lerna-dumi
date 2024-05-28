import { useMemo } from 'react';
import { compHoc } from '../../util';
import { OrgTree, type OrgTreeType } from '../org-tree';

/**
 * 导出项目组织树控件
 */
export const ProjectTree = compHoc<OrgTreeType>((props) => {
  const { params, outRef, ...others } = props;

  const requestParams = useMemo<OrgTreeType['params']>(() => {
    return { dataAccessAuth: true, ...params, containProject: true };
  }, [params]);

  return <OrgTree ref={outRef} params={requestParams} {...others} />;
}, 'ProjectTree');
