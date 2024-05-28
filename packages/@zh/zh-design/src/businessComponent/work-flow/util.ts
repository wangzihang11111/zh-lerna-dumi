import { ReactNode } from 'react';
import { openAttachment } from '../../businessComponent';
import { message, Modal, showModal } from '../../functionalComponent';
import { zh } from '../../util';

export const NGLang = {
  alertTitle: '提示',
  paramError: '参数不正确！',
  noCallBack: '未传入callback函数，无法执行回调！',
  bizHasRuningProcInst: '单据有正在运行中的流程，不允许送审！',
  bizHasNoFlowInfo: '未找到该单据对应的流程信息',
  getPdListError: '获取流程定义出错',
  ProcessTraceViewTitle: '流程追踪',
  terminateSuccess: '流程终止成功',
  terminateFailure: '流程终止失败',
  diagramViewerTitle: '流程查看',
  taskHisActor: '办理者',
  taskHisMsg: '意见',
  taskHisActorDept: '部门',
  taskHisTime: '办理时间',
  taskHisNode: '节点',
  taskHisTaskDes: '任务',
  taskHisDuration: '停留时间',
  taskHisSignature: '签章',
  attach: '附件',
  focusPoint: '确认事项',
  submitTaskComplete: '正在获取下个任务数据...',
  openNotWebError: '不支持打开非web单据！',
  noDeptData: '未对应部门',
  signatureWinTitle: '签章选择',
  choseSignature: '请选择签章！',
  getSignature: '获取签章数据...',
  hasNoSignature: '未设置签章！',
  getSignatureError: '获取签章数据出错',
  mustSignature: '必需签章！',
  pwd: '密码',
  noPwd: '请输入密码！',
  pwdError: '密码错误',
  perview: '预览',
  btnOk: '确定',
  btnCancel: '取消',
  btnNextTask: '跳过',
  getFlowHisError: '取数流程历史失败',
  btnFeedBack: '流程反馈',
  hasNoNextTask: '当前已是最后一个任务',
  btnFlowDiagram: '流程图',
  btnFlowInfo: '流程信息',
  btnAttach: '流程附件',
  attachCtlInitError: '附件初始化失败',
  btnAbort: '终止',
  btnAddsubtis: '加签',
  btntransmit: '转签',
  btnrollback: '驳回',
  confirmmatter: '确认事项',
  btnSubmit: '提交',
  btnDisagree: '不同意',
  btnAgree: '同意',
  flowInfo: '流程信息',
  showNextNodeInfo: '点击展示后续节点信息',
  myopincommonuse: '我的意见常用语',
  emptyRemarkInfo: '请输入办理意见',
  msgTypeSys: '消息自由呼通知',
  msgTypeSMS: '移动消息通知',
  msgContent: '消息',
  msgReceiver: '消息接收人',
  hasNoremark: '请输入办理意见',
  reamrkHasMore: '请至少输入{0}字的意见！',
  hasNoMsgContent: '请输入消息内容',
  hasNoMsgReceiver: '请输入消息接收者',
  taskReassignTo: '任务已转签给:{0}',
  taskReassSuccess: '转签成功',
  taskReassignError: '转签操作失败',
  whetherTerminate: '是否终止流程',
  addSubTasksSuccess: '加签操作成功',
  addSubTasksFailure: '加签操作失败',
  parentAutoComplete: '加签任务办理后不返回加签人',
  sequential: '按顺序办理',
  getTaskDataInfo: '获取任务办理相关数据...',
  checkApproveFailure: '审批检测失败:',
  getTaskDynamicError: '获取节点动态指派数据出错',
  TaskCompleteSuccess: '任务办理成功',
  TaskCompleteError: '任务办理失败',
  checkCancelApprove: '检测单据是否允许取消审批...',
  canNotCancelApprove: '单据不允许取消审批',
  checkCancelApproveError: '检测是否允许取消审批出错！',
  submitRollBack: '提交驳回操作...',
  rollBackSuccess: '驳回操作成功',
  rollBackError: '驳回操作失败',
  openNextTask: '准备打开下个任务！',
  rollBackNodeWinTitle: '节点选择',
  nodeName: '节点名称',
  nodeId: '节点编码',
  reSetUser: '重新指派人员',
  hasNoRollBakNode: '请选择回退节点',
  rollBackType: '回退方式',
  rollBackPartNodeWinTitle: '请选择需重新办理的节点',
  dynamicBranchWinTitle: '指派下级分支',
  curNodeName: '当前节点',
  nodeMustHasChild: '节点【{0}】必需选择下级分支！',
  nodeMustOnlyOneChild: '节点【{0}】不能选择多个分支！',
  nodeDynamicUsers: '节点人员指派',
  user: '人员',
  notAllNodeSetUser: '不是所有节点都已指派人员',
  userSelectWinTitle: '人员选择',
  userSeachEmptyText: '输入编号/姓名，回车查询',
  flowStartUser: '发起人',
  nextAppName: '下级节点办理人',
  allFlowUser: '所有已办人员',
  treeSeachEmptyText: '输入关键字，定位树节点',
  seachEmptyText: '输入关键字，回车查询',
  userNo: '编号',
  userName: '姓名',
  allUsers: '用户-组织',
  flowUser: '流程人员',
  hasNoSelectData: '未选择数据',
  notFindTreeNode: '没有匹配的树节点',
  createFlowWinTitile: '流程发起',
  flowKeyWord: '流程描述',
  taskRemark: '办理意见',
  procDefin: '流程定义',
  pdId: '编号',
  pdName: '流程名称',
  description: '描述',
  btnView: '查看',
  btnTest: '测试',
  operation: '操作',
  createFlowErrorByNoChildNode: '不存在符合条件的下级分支，不能创建流程实例！',
  createFlow: '创建流程实例',
  createFlowSuccess: '流程发起成功',
  createFlowError: '创建流程出错',
  selectOnePd: '请选择流程定义',
  createFlowMinUserCount: '最少指派人数为【{0}】',
  batchStartFlowWinTitile: '批量发起流程',
  selectpsn: '选择人员',
  select: '请选择数据',
  dynamicUsers: '人员指派',
  userId: '主键',
  userDept: '部门',
  userOrg: '组织',
  AddCommonUse: '添加常用',
  DelCommonUse: '删除常用',
  addCommonSuccess: '成功添加常用',
  removeCommonSuccess: '成功删除常用',
  batchStartFlowSuccess: '批量发起流程结果',
  FeedBackTitle: '反馈标题',
  FeedBackReceive: '接收人',
  FeedBackMsg: '反馈信息',
  operatorHelp: '操作员帮助',
  feedbackSubmit: '提交',
  sendSuccess: '发送成功！',
  sendError: '发送失败！',
  selectAddPerson: '加签人员选择',
  selectReassignPerson: '转签人员选择',
  rollBackReason: '驳回原因',
  choseRollBackReason: '请选择驳回原因',
  carbonCopy: '抄送',
  carbonCopyUsersSelect: '选择人员抄送',
  carbonCopyError: '抄送失败',
  carbonCopySuccess: '抄送成功',
  carbonCopySuccessContent: '已抄送给：'
};

/**
 * 设置多语言
 * @param lang 多语言
 */
export function setNGLang(lang) {
  if (lang) {
    zh.assign(NGLang, zh.parseJson(lang) || {});
  }
}

export const commonStyle = {
  borderStyle: {
    borderRadius: 'var(--border-radius-base, 2px)',
    border: '1px solid var(--border-color-base, #f0f0f0)'
  },
  backgroundStyle: {
    backgroundColor: 'var(--component-background, #ffffff)'
  }
};

interface IModal {
  title: string;
  width?: number;
  content: ReactNode;
  okText?: boolean | string;
  cancelText?: boolean | string;
  footerLeft?: ReactNode;
  onOk?: (...args: any[]) => any;
  onCancel?: (...args: any[]) => any;
}

/**
 * 弹窗
 * @param props
 */
export function wfModal(props: IModal) {
  return new Promise((resolve) => {
    const { onOk, onCancel, ...others } = props;
    const oldDestroy = showModal({
      closable: false,
      okText: NGLang.btnOk,
      cancelText: NGLang.btnCancel,
      ...others,
      onOk: async (ins) => {
        ins.destroy = () => {
          resolve(ins.getApi().getOkData ? ins.getApi().getOkData() : true);
          oldDestroy();
        };
        if (onOk) {
          await onOk(ins);
        } else if (ins.getApi().invokeOkHandler) {
          await ins.getApi().invokeOkHandler();
        } else {
          ins.destroy();
        }
      },
      onCancel: async (ins) => {
        ins.destroy = () => {
          resolve(ins.getApi().getCancelData ? ins.getApi().getCancelData() : false);
          oldDestroy();
        };
        if (onCancel) {
          await onCancel(ins);
        } else if (ins.getApi().invokeCancelHandler) {
          await ins.getApi().invokeCancelHandler();
        } else {
          ins.destroy();
        }
      }
    }).destroy;
  });
}

/**
 * 字符串format
 * @param format
 * @param args
 */
export function stringFormat(format, ...args) {
  return format.replace(/\{(\d+)\}/g, function (m, n) {
    return args[n];
  });
}
/**
 * 取出数组中的交集
 * @a 普通的数组
 * @b 在数组对象中的数组
 */
export function filterUserNodes(a, b, key) {
  return b.filter((item) => {
    const targetIds = item[key];
    if (Array.isArray(targetIds)) {
      return targetIds.every((id) => a.includes(id));
    } else {
      return true;
    }
  });
}
/**
 * 提示框
 * @param title 标题
 * @param content 提示内容
 */
export function wfAlert(title, content) {
  return new Promise((resolve) => {
    Modal.info({
      title: title || NGLang.alertTitle,
      okText: NGLang.btnOk,
      zIndex: 1001,
      content,
      afterClose: () => {
        resolve('close');
      }
    });
  });
}

/**
 * 确认对话框
 * @param title
 * @param content
 */
export function wfConfirm(title, content) {
  return new Promise((resolve) => {
    Modal.confirm({
      title: title || NGLang.alertTitle,
      okText: NGLang.btnOk,
      cancelText: NGLang.btnCancel,
      zIndex: 1001,
      content,
      onOk() {
        resolve(true);
      },
      onCancel() {
        resolve(false);
      }
    });
  });
}

/**
 * 消息反馈提示
 * @param content
 * @param duration
 */
export function wfMessage(content, duration = 2) {
  return message.error(content, duration);
}

export function reloadPage() {
  console.log('触发当前tab页面刷新');
  zh.safeRefresh();
}

/**
 * 获取人员类型
 * @param hasPsn
 * @param dynamicAny
 */
export function getUseDynamicType(hasPsn, dynamicAny) {
  const dynamicType: any = [];
  if (hasPsn === true) {
    dynamicType.push(1);
    if (dynamicAny === true) {
      dynamicType.push(...[2, 3, 4]);
    }
  } else {
    dynamicType.push(...[2, 3, 4]);
  }
  return dynamicType;
}

/**
 * 流程模拟测试/流程查看
 * @param procInstId
 * @param bizId
 * @param bizPk
 */
export function showPdDiagram(row, workInFlow?) {
  console.log(row, workInFlow, '');
  const options: any = {
    microAppName: 'workflow',
    AppTitle: NGLang.diagramViewerTitle,
    procInstId: row.id,
    type: 'test'
  };
  if (workInFlow.dataId && workInFlow.bizCode) {
    options.AppTitle = '流程测试';
    options.bizKey = workInFlow.dataId;
    options.bizCode = workInFlow.bizCode;
  }
  zh.open('/flowViewer', options);
}

/**
 * 流程追踪
 * @param bizCode
 * @param bizKey
 */
export async function showFlowInfo(bizCode, bizKey) {
  zh.open('/flowdetail', { microAppName: 'workflow', AppTitle: '流程信息', bizKey, bizCode });
}

/**
 * 通过piId查看流程信息
 * @param procInstId
 */
export async function showFlowInfoByPiId(procInstId) {
  zh.open('/flowdetail', { microAppName: 'workflow', AppTitle: '流程信息', procInstId });
}

/**
 * 打开我的意见常用语
 */
export function openCommonWordList() {
  zh.open(zh.getHttpUrl('WM/Common/CommonWord/CommonWordList?fromtype=private'), {
    AppTitle: NGLang.myopincommonuse
  });
}

/**
 * 递归遍历当前节点及其子节点
 * @param node 当前节点
 * @param callback 回调
 */
export function cascadeBy(node, callback) {
  if (callback(node) !== false) {
    node.children &&
      node.children.forEach((nd) => {
        cascadeBy(nd, callback);
      });
  }
}

/**
 * 打开工作流附件
 * @param record
 */
export async function showTaskAttachment(record, status) {
  await openAttachment({
    permission: { add: status, delete: status },
    asrTable: 'flowAttachment',
    asrCode: record.taskId ? record.taskId : ''
  });
}

/**
 * 判断是否portal进入且设置了连续办理
 */
export function getAutoNextFlag() {
  const top = window.top as any;
  let autoOpenNext = false;
  // if (zh.isWebFrame()) {
  //   autoOpenNext = top.getIndividualSetting?.()?.IsMyWorkFlowSet;
  // } else {
  //   const api = top.external;
  //   autoOpenNext = api?.GetWorkFlowFlag?.() === '1';
  // }
  return autoOpenNext;
}

/**
 * 获取下一个任务
 * @param taskid 当前任务id
 * @param catalogGroup
 */
export async function getNextTask({ taskid, catalogGroup }) {
  const close = message.progress({
    title: NGLang.submitTaskComplete
  });
  const data = await zh.request.get({
    url: 'WorkFlow3/WorkFlow/GetNextPendingTaskByUser',
    data: {
      taskid: taskid,
      catalogGroup: catalogGroup
    }
  });
  close();
  return data;
}

/**
 * 打开下一个工作流任务办理页面
 * @param nextTaskData 下一个任务信息
 * @param isFromPortal 打开来源
 * @param isTaskList 是否工作流任务列表打开
 */
export async function openNextAppFlowTask({ nextTaskData, isFromPortal, isTaskList }) {
  let isWeb: boolean;
  let url = nextTaskData.url;
  if (!nextTaskData.uitype || nextTaskData.uitype !== 4) {
    isWeb = false;
  } else {
    isWeb = true;
    if (isFromPortal) {
      url += '&isFromProtal=true';
    }
    if (isTaskList) {
      url += '&iswftasklist=true';
    }
  }
  // if (zh.isWebFrame() || !zh.isNGFrame()) {
  //   if (isWeb) {
  //     window.location.href = zh.getHttpUrl(url);
  //   } else {
  //     await wfAlert(NGLang.alertTitle, NGLang.openNotWebError);
  //     await zh.close();
  //   }
  // } else {
  //   const ext = window.external as any;
  //   if (isWeb) {
  //     zh.open(zh.getHttpUrl(url));
  //   } else {
  //     let param = nextTaskData.urlparam;
  //     if (isFromPortal) {
  //       param += '@@**isFromProtal=true';
  //     }
  //     if (isTaskList) {
  //       param += '@@**IsWFTaskList=true';
  //     }
  //     ext?.ShowManagerWithParm?.(nextTaskData.url, -1, param);
  //     ext?.ActiveSelectedTabPageEx();
  //   }
  //   //关闭自己
  //   if (ext?.CloseTabPageByUrl) {
  //     setTimeout(function () {
  //       ext.CloseTabPageByUrl?.(window.location.href);
  //     }, 500);
  //   } else {
  //     setTimeout(function () {
  //       window.opener = null;
  //       window.open('about:blank', '_self');
  //       window.close();
  //     }, 500);
  //   }
  // }
}

/**
 * 获取toolbar实例
 * @param toolbar
 */
export function getToolbar(toolbar) {
  if (toolbar) {
    const toolbarIns = zh.isString(toolbar) ? zh.getCmp(toolbar) : toolbar.current;
    const api = toolbarIns?.getApi();
    if (api && api.insert) {
      return api;
    }
  }
  return null;
}

//设置工作流ui的状态
export function setWorkFlowUIState(uiInfo) {
  if (!uiInfo || uiInfo.length === 0) return;
  const getProps = (ctlOption) => {
    switch (ctlOption) {
      case 'readonly': // 只读
        return { disabled: true };
      case 'editable': // 可编辑
        return { disabled: false };
      case 'hidden': // 不可见
        return { hidden: true };
      case 'required': // 必输项  潜规则： 必输默认可编辑，因为不可编辑会导致有些单据无法往下走
        return {
          required: true,
          disabled: false
        };
      default:
        return null;
    }
  };
  zh.updateUI((updater) => {
    const fieldProps = {};
    uiInfo.forEach((u) => {
      const p = getProps(u.value);
      if (p) {
        u.fieldCode && (fieldProps[`${u.tableName}.${u.fieldCode}`] = p);
        u.propertyCode && (fieldProps[`${u.tableName}.${u.propertyCode}`] = p);
      }
    });
    updater.setFieldProps(fieldProps);
  });
}
