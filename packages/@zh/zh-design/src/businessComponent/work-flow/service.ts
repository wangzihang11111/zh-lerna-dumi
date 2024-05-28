import { IResponse, zh } from '../../util';
import { NGLang, wfAlert } from './util';

/**
 * 审批界面获取工作流信息
 * @param wfPiId
 * @param wfTaskId
 * @param wfOType
 */
export async function getWorkFlowInfo({ wfPiId, wfTaskId, wfOType }) {
  const { code, message, data } = await zh.request.get({
    url: 'workflow/task/getTaskExecutionInfo',
    data: { procInstId: wfPiId, taskId: wfTaskId, wfotype: wfOType }
  });
  if (code === 0) {
    return data || {};
  } else {
    await wfAlert(NGLang.alertTitle, message || NGLang.paramError);
  }
  // resp.isBizApproved = resp.isBizApproved ?? resp.bizApproved; // java后端有些版本返回的是bizApproved，此处做一下兼容性处理
  // return resp;
}

/**
 * 获取流程历史
 * @param piId
 * @param bizType
 * @param bizPhId
 */
export async function getWorkFlowHis({ procInstId }) {
  const { code, message, data } = await zh.request.get({
    url: 'workflow/process/getProcessComments',
    data: { procInstId }
  });
  if (code === 0) {
    return data || [];
  } else {
    await wfAlert(NGLang.getFlowHisError, message);
    return [];
  }
}

/**
 * 获取常用语关键词
 * @param keyword
 * @param pageIndex
 * @param pageSize
 */
export async function getCommonWordHelp({ keyword, pageIndex, pageSize }: any) {
  const resp = await zh.request.get({
    url: 'WM/Common/CommonWord/GetCommonWordHelp',
    data: {
      page: pageIndex - 1,
      start: (pageIndex - 1) * pageSize,
      limit: pageSize,
      filter: [{ property: 'Cname' }],
      query: keyword
    }
  });
  return resp || { totalRows: 0, Record: [] };
}

/**
 * 获取签章数据源
 */
export async function getSignatureListByCurrentUser() {
  const resp: any = await zh.request.get({
    url: 'WM/Archive/WmIoSignature/GetSignatureListByCurrentUser'
  });
  if (resp.Record && resp.Record.length) {
    return resp.Record.map((d) => {
      return {
        value: d.PhId,
        label: d.Cname,
        origin: {
          ...d,
          MarkPath: d.MarkPath ? zh.getHttpUrl(d.MarkPath) : ''
        }
      };
    });
  }
  return [];
}

/**
 * 验证签章信息
 * @param PhId
 * @param pwd
 */
export async function validSignatureInfoByPassword({ PhId, pwd }) {
  const resp: any = await zh.request.get({
    url: 'WM/Archive/WmIoSignature/GetSignatureInfogByPassword',
    data: {
      id: PhId,
      password: pwd
    }
  });
  return !!(resp.Record && resp.Record.length);
}

export function updateNotificationReadFlg({ piId }) {
  zh.request
    .get({
      url: 'WorkFlow3/ProcessNotification/UpdateNotificationReadFlg',
      data: { piid: piId }
    })
    .then();
}

/**
 * 保存审批意见区宽度
 * @param width 意见区宽度
 * @constructor
 */
export function saveRemarkPanelWidth(width) {
  if (width <= 0) {
    return;
  }
  // zh.request
  //   .get({
  //     data: { width },
  //     url: 'WorkFlow3/WorkFlow/SaveRemarkPanelWidth'
  //   })
  //   .then();
}

/**
 * 获取发起节点属性
 * @param processDefinitionId 流程Id
 * @constructor 获取是否签章和最少意见数，原来是放在流程定义列表里面的，现在单独一个接口来获取。
 */
export async function getProcessInitialActivity(processDefinitionId) {
  const resp = await zh.request.get({
    data: { processDefinitionId },
    url: 'workflow/processDefinition/getProcessInitialActivity'
  });
  if (resp.code === 0) {
    return resp.data;
  } else {
    return {};
  }
}

export async function checkPreStartProcessInstance(params) {
  let resp = await zh.request.body({
    data: { ...params },
    url: 'workflow/process/checkPreStartProcessInstance'
  });
  return resp;
}

export async function checkPreRollback(taskId) {
  let resp = await zh.request.get({
    data: { taskId },
    url: 'workflow/task/checkPreRollback'
  });
  return resp;
}

/**
 * 获取回退信息
 * @param taskId 任务id
 */
export async function getRollBackInfo(taskId) {
  const resp = await zh.request.get({
    url: 'workflow/task/getRollbackExecutionInfo',
    data: { taskId }
  });
  if (resp.code === 0) {
    return resp.data;
  }
}

export async function RollBack(params) {
  const resp = await zh.request.body({
    url: 'workflow/task/rollback',
    data: { ...params }
  });
  if (resp.code) {
    return resp;
  } else {
    return resp;
  }
}

/**
 * 加签
 * @param params 包含任务id
 */
export async function addSubTaskAsync(params) {
  const resp = await zh.request.body({
    url: 'workflow/task/addSubTasks',
    data: { ...params }
  });
  return resp;
}

//前置检查
export async function checkPreCompleteTask(taskId) {
  let resp = await zh.request.get({
    data: { taskId },
    url: `workflow/task/checkPreCompleteTask?taskId=${taskId}`
  });
  return resp;
}
//任务完成
export async function compeleteTask(params) {
  const resp = await zh.request.body({
    url: 'workflow/task/completeTask',
    data: { ...params }
  });
  return resp;
}

interface CarbonCopyResponse<T> extends IResponse {
  data: T;
}
/** @description  抄送*/
export async function carbonCopy(taskId: string, userIds: string[], appCode = '0100') {
  const resp = await zh.request.body<CarbonCopyResponse<{ data: boolean }>>({
    url: '/workflow/copy/carbonCopy',
    data: {
      userIds,
      taskId,
      appCode
    }
  });
  return resp;
}
