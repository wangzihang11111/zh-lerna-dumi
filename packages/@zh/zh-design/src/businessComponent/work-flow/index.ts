import { usingProgress } from '../../functionalComponent';
import { zh } from '../../util';
import { NGLang, setNGLang, showFlowInfo, showFlowInfoByPiId, wfAlert } from './util';
import { openWorkFlowBatchStartWin } from './WorkFlowBatchStartWin';
import { openWorkFlowStartWin } from './WorkFlowStartWin';

/**
 * 送审
 * @param params
 * @private
 */
async function _startFlowWithPdKey(params: any) {
  const { appCode, bizCode, dataId, pdkey, cuId, orgId, cancelback } = params;
  if (!appCode || !bizCode) {
    await wfAlert(NGLang.alertTitle, NGLang.paramError);
    return;
  }

  const data: any = { appCode, bizCode, dataId, pdkey, cuId, orgId };
  if (pdkey) {
    data.pdkey = Array.isArray(pdkey) ? pdkey.join(',') : pdkey;
  }
  if (orgId) {
    data.orgId = orgId;
  }
  const res = await usingProgress(() =>
    zh.request.body({
      url: '/workflow/processDefinition/getStartProcessExecutionInfo',
      data: { appCode, bizCode, dataId, cuId, orgId }
    })
  );
  if (res.code === 0) {
    const processDefinitions: any = res.data;
    // setNGLang({ ...res.data.processDefinitions[0] });
    if (processDefinitions.hasRuninfgFlow) {
      await wfAlert(NGLang.alertTitle, NGLang.bizHasRuningProcInst);
      cancelback?.();
      return;
    }
    await openWorkFlowStartWin({
      ...params,
      data: processDefinitions,
      autoStart: !!pdkey || processDefinitions.autostart
    });
  } else {
    await wfAlert(NGLang.getPdListError, res.errorMsg);
  }
}

/**
 * 从流程导航中获取流程定义
 * @param bizType
 * @param bizPhid
 * @param busType
 * @param callback
 * @param cancelback
 * @private
 */
async function _startFlowWithNavigation(bizType, bizPhid?, busType?, callback?, cancelback?) {
  const params: any = zh.isObject(bizType) ? bizType : { bizType, bizPhid, busType, cancelback, callback };
  const resp = await zh.request.get({
    url: 'SUP/NavigationCenter/GetProcessBillWorkflow',
    data: {
      billid: params.bizPhid,
      bustype: params.busType
    }
  });
  await _startFlowWithPdKey({
    pdkey: resp.data || null,
    ...params
  });
}

/**
 * 单个送审接口
 * @param bizType
 * @param bizPhid
 * @param callback
 * @param cancelback
 */
async function _startFlow(appCode, bizCode, dataId, cuId, orgId, callback, cancelback) {
  await _startFlowWithPdKey({ appCode, bizCode, dataId, cuId, orgId, cancelback, callback });
}

/**
 * 批量送审接口
 * @param bizType
 * @param bizData
 * @param callback
 * @private
 */
async function _batchStartFlow(bizType, bizData, callback) {
  const params: any = zh.isObject(bizType) ? bizType : { bizType, bizData, callback, orgId: '' };
  if (!bizType || !bizData) {
    await wfAlert(NGLang.alertTitle, NGLang.paramError);
    return;
  }
  const resp: any = await usingProgress(() =>
    zh.request.get({
      url: 'WorkFlow3/WorkFlow/GetBatchStartFlowExecutionInfo',
      data: {
        biztype: params.bizType,
        orgid: params.orgId
      }
    })
  );
  if (resp.success) {
    setNGLang(resp.NGLang);
    await openWorkFlowBatchStartWin({
      ...params,
      data: resp.pdlist
    });
  } else {
    await wfAlert(NGLang.getPdListError, resp.errorMsg);
  }
}

/**
 * 工作流api
 */
const $WorkFlow = {
  // 送审
  startFlow(params: {
    appCode?: string;
    bizCode: string;
    dataId: string;
    cuId?: string;
    orgId?: string;
    successCallback?: Function;
    cancelCallback?: Function;
  }) {
    return new Promise((resolve, reject) => {
      _startFlow(
        params.appCode || '0100',
        params.bizCode,
        params.dataId,
        params.cuId,
        params.orgId,
        (...args) => {
          params.successCallback?.(...args);
          resolve(args);
        },
        (...args) => {
          params.cancelCallback?.(...args);
          reject(args);
        }
      ).then();
    });
  },
  // 批量送审
  batchStartFlow(bizType, bizData?, successCallback?) {
    _batchStartFlow(bizType, bizData, successCallback).then();
  },
  startFlowWithNavigation(bizType, bizPhId?, busType?, successCallback?, cancelCallback?) {
    _startFlowWithNavigation(bizType, bizPhId, busType, successCallback, cancelCallback).then();
  },
  // 流程追踪
  showFlowInfo,
  // 通过piId查看流程信息
  showFlowInfoByPiId
};

export { default as WorkFlowPanel } from './WorkFlowPanel';
export { $WorkFlow };
export type WorkFlowApiType = typeof $WorkFlow;
