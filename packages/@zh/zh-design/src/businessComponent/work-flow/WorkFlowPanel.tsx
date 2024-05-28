import { DownOutlined, LoadingOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Badge, Skeleton } from 'antd';
import React, { memo, RefObject, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Input, TextArea } from '../../baseComponent';
import { openAttachment } from '../../businessComponent';
import { ColumnProps, Table, usingProgress } from '../../functionalComponent';
import { emptyFn, IObject, Layout, zh, useAllReady, useAsyncEffect, useRefCallback, useRefState } from '../../util';
import { WfSignatureImage } from './NGSignatureImage';
import {
  addSubTaskAsync,
  carbonCopy,
  checkPreCompleteTask,
  checkPreRollback,
  compeleteTask,
  getWorkFlowHis,
  getWorkFlowInfo,
  RollBack,
  updateNotificationReadFlg
} from './service';
import {
  commonStyle,
  filterUserNodes,
  getAutoNextFlag,
  getNextTask,
  getToolbar,
  getUseDynamicType,
  NGLang,
  openNextAppFlowTask,
  reloadPage,
  setWorkFlowUIState,
  showFlowInfo,
  showFlowInfoByPiId,
  showTaskAttachment,
  stringFormat,
  wfAlert,
  wfConfirm,
  wfMessage,
  wfModal
} from './util';
import { WFDynamicBranchWin } from './WFDynamicBranchWin';
import { WFDynamicNodeUserWin, WFDynamicNodeUserWinFooter } from './WFDynamicNodeUserWin';
import { WFNodeUserSettingWin } from './WFNodeUserSettingWin';
import { WFNoticeUserSelect } from './WFNoticeUserSelect';
import { WFocusPointWin } from './WFocusPointWin';
import { WFRollBackNodeWin, WFRollBackNodeWinFooter, WFRollBackReason } from './WFRollBackNodeWin';

interface IWorkFlowInfo {
  taskId?: string;
  procInstId?: string;
  wfotype?: string;
  defaultSignature?: string;
  signatureUrl?: string;
  // canAttach?: boolean;
  // canFeedBack?: boolean;
  // canTermination?: boolean;
  // canAddTis?: boolean;
  // canTransmit?: boolean;
  // canUndo?: boolean;
  focusPoint?: any[];
  remarkPanelWidth?: number;
  uiConstraint?: any;
  signatureFlag?: boolean;
  needsignature?: boolean;

  [key: string]: any;
}

export interface INGWorkFlowPanelProps {
  /**
   * @description       不配置，则取url地址里面的wfpiid参数
   */
  wfPiId?: string;
  /**
   * @description       不配置，则取url地址里面的wftaskid参数
   */
  wfTaskId?: string;
  /**
   * @description       不配置，则取url地址里面的wfotype参数
   */
  wfOType?: string;
  /**
   * @description       不配置，则取url地址里面的eformCode参数加EFORM前缀
   */
  bizType: string;
  /**
   * @description       不配置，则取url地址里面的otype参数
   * @default           edit
   */
  oType?: 'add' | 'edit' | 'view';
  /**
   * @description       不配置，则取url地址里面的id参数
   */
  bizPhId?: string;
  /**
   * @description       不配置，则取url地址里面的isFromPortal参数
   * @default           false
   */
  isFromPortal?: boolean;
  /**
   * @description       不配置，则取url地址里面的iswftasklist参数
   * @default           false
   */
  refreshTaskList?: boolean;
  /**
   * @description       toolbar的id，用于注入审批按钮
   */
  toolbar: string | RefObject<any>;
  /**
   * @description       高度
   * @default           180
   */
  height: number;
  /**
   * @description       任务办理时，可见的toolbar itemId
   */
  showToolBarItems?: Array<string>;
  /**
   * @description       显示所有toolbar按钮
   * @default           false
   */
  showAllToolBar?: boolean;
  /**
   * @description       调用业务单据保存，如果返回false则终止操作
   */
  bizSaveFn?: () => Promise<boolean>;
  /**
   * @description       自定义组件任务处理函数，并把工作流参数传到服务端，并在服务端调用工作流api
   */
  onTaskComplete?: (compId, taskDealInfo) => Promise<void>;
  /**
   * @description       设置业务组件附加数据
   */
  getAttachData?: Function;
  taskDealInfo?: IObject;
}

const WorkFlowPanelContext = React.createContext<Partial<INGWorkFlowPanelProps> & { workFlowInfo: IWorkFlowInfo }>({
  workFlowInfo: {}
});

const checkBoxProps = {
  className: 'nowrap',
  style: { fontSize: 12 }
};

const columnProps = {
  sortable: false,
  resizable: false,
  columnSort: false,
  tooltip: true
};

const hisColumns: Array<ColumnProps> = [
  {
    ...columnProps,
    header: NGLang.taskHisActor,
    dataIndex: 'userName',
    flex: 2,
    width: 70,
    tooltip: ({ value, row }) => {
      return row.userId === 'nextNodeInfo' ? '' : value;
    },
    render({ value, row, table }) {
      return row.userId === 'nextNodeInfo' ? <NextNodeInfo table={table} /> : value;
    }
  },
  {
    ...columnProps,
    header: NGLang.taskHisMsg,
    dataIndex: 'message',
    flex: 4,
    width: 150
  },
  // {
  //   ...columnProps,
  //   header: NGLang.taskHisActorDept,
  //   dataIndex: 'deptname',
  //   flex: 2,
  //   width: 120
  // },
  {
    ...columnProps,
    header: NGLang.taskHisTime,
    dataIndex: 'time',
    flex: 2,
    width: 120
  },
  {
    ...columnProps,
    header: NGLang.attach,
    dataIndex: 'fileCount',
    flex: 2,
    width: 60,
    render: function ({ value, row }) {
      if (value) {
        return AttachIcon(row, value);
      }
    }
  },
  {
    ...columnProps,
    header: NGLang.taskHisNode,
    dataIndex: 'nodeName',
    flex: 2,
    width: 70
  },
  {
    ...columnProps,
    header: NGLang.taskHisTaskDes,
    flex: 2,
    dataIndex: 'actionName',
    width: 70
  },
  {
    ...columnProps,
    header: NGLang.taskHisDuration,
    dataIndex: 'duration',
    flex: 1,
    width: 70
  },
  {
    ...columnProps,
    header: NGLang.taskHisSignature,
    dataIndex: 'signatureId',
    flex: 1,
    width: 60,
    tooltip: false,
    align: 'center',
    render: function ({ value }) {
      return value && <img src={zh.getHttpUrl(value)} width={12} height={12} alt="" />;
    }
  }
];

/**
 * 工作流占位组件
 * @param height
 * @constructor
 */
function WfSkeleton({ height = 180 }) {
  return (
    <div
      style={{
        ...commonStyle.borderStyle,
        ...commonStyle.backgroundStyle,
        padding: 8,
        margin: '0 5px 5px 5px',
        height: height - 5
      }}
    >
      <Skeleton active />
    </div>
  );
}

/**
 * 展开当前及后续节点
 * @param table
 * @constructor
 */
function NextNodeInfo({ table }) {
  const { workFlowInfo, bizType, bizPhId } = useContext(WorkFlowPanelContext);
  const [loading, setLoading] = useState(false);
  const hisAddNextNodeInfo = useRefCallback(async (e) => {
    e.stopPropagation();
    setLoading(true);
    const resp = await zh.request.body({
      url: 'WorkFlow3/WorkFlow/GetNextTaskNodes',
      data: {
        data: {
          taskid: workFlowInfo.taskId,
          piid: workFlowInfo.procInstId,
          biztype: bizType || zh.getPageInstance()?.busType,
          bizphid: bizPhId
        }
      }
    });
    if (resp.code === 0) {
      const rows: any = [...table.getRows()];
      rows.pop();
      resp.data.forEach((d, index) => {
        if (index === 0) {
          rows.push({
            task_des: d.activityName + '[当前]',
            username: d.username || '空',
            actionname: d.actionname
          });
        } else {
          rows.push({
            task_des: d.activityName + '[后续]',
            username: d.username || '空'
          });
        }
      });
      table.setDataSource(rows);
    } else {
      await wfAlert(NGLang.alertTitle, resp.message);
      setLoading(false);
    }
  });

  return (
    <a
      onClick={hisAddNextNodeInfo}
      style={{
        whiteSpace: 'nowrap',
        fontSize: 12,
        zIndex: 1,
        top: 0,
        bottom: 0,
        left: 0,
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 6,
        width: table.state.width
      }}
    >
      {loading ? <LoadingOutlined style={{ marginRight: 2 }} /> : <DownOutlined style={{ marginRight: 2 }} />}
      {NGLang.showNextNodeInfo}
    </a>
  );
}

/**
 * 流程历史列表附件
 * @param record
 * @constructor
 */
function AttachIcon(record, value) {
  return (
    <Badge size="small" count={record.att_count} offset={[8, 6]}>
      <a onClick={() => showTaskAttachment(record, 0)}>
        <PaperClipOutlined />
        {value}
      </a>
    </Badge>
  );
}

/**
 * 流程历史列表
 * @constructor
 */
function HistoryTable({ dataSource }: { dataSource?: Array<any> }) {
  const { workFlowInfo = {}, bizType, bizPhId } = useContext(WorkFlowPanelContext);
  const requestHisList = useMemo(() => {
    return async () => {
      if (dataSource) {
        return dataSource;
      }
      const hisData = await getWorkFlowHis({ procInstId: workFlowInfo.procInstId || '' });
      if (workFlowInfo.taskId) {
        hisData.push({ username: NGLang.showNextNodeInfo, user_id_: 'nextNodeInfo' });
      }
      return hisData;
    };
  }, [dataSource, workFlowInfo.procInstId, bizType, bizPhId]);
  const onDataLoad = useRefCallback((table) => {
    table.setSelected(0);
  });

  return (
    <Table
      rowHeight={30}
      onDataLoad={onDataLoad}
      rowSelected
      headerHeight={32}
      style={commonStyle.borderStyle}
      columns={hisColumns}
      request={requestHisList}
    />
  );
}

/**
 * 审批办理组件
 * @param props
 * @constructor
 */
const InnerWorkFlowPanel = memo<INGWorkFlowPanelProps & { workFlowInfo: IWorkFlowInfo }>((props) => {
  return (
    <WorkFlowPanelContext.Provider value={props}>
      {props.workFlowInfo?.taskId ? <WfLayout /> : <HisLayout />}
    </WorkFlowPanelContext.Provider>
  );
});

/**
 * 非工作流界面进入，仅显示历史(历史记录为空时不显示)
 * @constructor
 */
function HisLayout() {
  const { workFlowInfo, height, bizPhId, bizType, toolbar } = useContext(WorkFlowPanelContext);
  const [hisData, setHisData] = useRefState([]);
  const [loading, setLoading] = useRefState(true);

  useEffect(() => {
    if (workFlowInfo.wfotype === 'processNotify') {
      updateNotificationReadFlg({ piId: workFlowInfo.procInstId });
    }
  }, [workFlowInfo.wfotype, workFlowInfo.procInstId]);

  useEffect(() => {
    getWorkFlowHis({ procInstId: workFlowInfo.procInstId || '' }).then((data) => {
      setLoading(false);
      setHisData(data);
      if (data.length > 0 && toolbar) {
        const tb: any = getToolbar(toolbar);
        tb?.insert({
          id: 'wfbtn_flowinfo',
          text: NGLang.flowInfo,
          icon: 'HistoryOutlined',
          onClick: async () => {
            await showFlowInfo(bizType || zh.getPageInstance()?.busType, bizPhId);
          }
        });
      }
    });
  }, [workFlowInfo.procInstId, bizPhId, bizType]);

  // 没有历史直接隐藏历史列表
  if (!hisData.length) {
    return loading ? <WfSkeleton height={height} /> : null;
  }

  return (
    <Layout
      direction="row"
      style={{
        height,
        padding: 5,
        backgroundColor: 'var(--component-background)',
        marginBottom: 'var(--inner-margin, 16px)'
      }}
    >
      <Layout.Flex>
        <HistoryTable dataSource={hisData} />
      </Layout.Flex>
    </Layout>
  );
}

/**
 * 表单项组件
 * @param children
 * @param style
 * @param label
 * @param flex
 * @constructor
 */
function FormItem({ children, style = {}, label = '', flex = 1 }) {
  return (
    <label style={{ flex, display: 'flex', alignItems: 'center', ...style }}>
      {label && <span style={{ marginRight: 4 }}>{label}:</span>}
      <span style={{ flex: 1 }}>{children}</span>
    </label>
  );
}

/**
 * 显示工作流办理完整布局
 * @constructor
 */
function WfLayout() {
  const {
    workFlowInfo,
    height = 180,
    isFromPortal,
    refreshTaskList,
    bizType,
    bizPhId,
    bizSaveFn,
    getAttachData,
    onTaskComplete,
    toolbar,
    showAllToolBar,
    showToolBarItems,
    taskDealInfo: initState
  } = useContext(WorkFlowPanelContext);
  const signatureRef = useRef<any>();
  const taskDealInfo = useMemo<any>(() => {
    return {
      ...initState,
      taskId: workFlowInfo.taskId,
      piid: workFlowInfo.procInstId,
      biztype: bizType,
      bizphid: bizPhId,
      attguid: ''
    };
  }, [initState]);
  const [msg, setMsg] = useState<any>({
    system_message: false, // 消息自由呼通知
    mobile_message: false // 移动消息通知
  });
  const signature = useMemo(() => {
    return {
      code: workFlowInfo.defaultSignature || '',
      url: workFlowInfo.defaultSignature && workFlowInfo.signatureUrl ? zh.getHttpUrl(workFlowInfo.signatureUrl) : ''
    };
  }, [workFlowInfo]);
  const onSuggestChange = useRefCallback((sv) => {
    zh
      .getCmp('SuggestValue')
      .getApi()
      .setValue(sv?.label || '');
  });
  const onSignatureChange = useRefCallback((value) => {
    signatureRef.current = value;
  });

  const options = {
    taskDynamicInfo: {} as any,
    // 判断是否输入办理意见、消息通知等
    isValid: async () => {
      workFlowInfo.compType !== 4 && (taskDealInfo.ignoreCurUserProtalRefresh = true);
      workFlowInfo.compId && (taskDealInfo.compId = workFlowInfo.compId);
      workFlowInfo.compType && (taskDealInfo.compType = workFlowInfo.compType);
      const remark = zh.getCmp('SuggestValue').getApi().getValue();
      const minRemarkLen = Number(workFlowInfo.minCommentLen) || Number(workFlowInfo.mincommentlen) || 0;
      if (!remark && minRemarkLen !== 0) {
        await wfMessage(NGLang.hasNoremark);
        return false;
      } else if (remark && remark.length < minRemarkLen) {
        await wfMessage(stringFormat(NGLang.reamrkHasMore, minRemarkLen));
        return false;
      }
      taskDealInfo.comment = {};
      taskDealInfo.comment.content = remark;
      // 判断是否选择签章
      taskDealInfo.comment.signatureId = signatureRef.current?.code || '';
      if (workFlowInfo.needsignature && !taskDealInfo.comment.signatureId) {
        await wfMessage(stringFormat(NGLang.mustSignature, minRemarkLen));
        return false;
      }
      //判断是否发送消息通知
      if (msg.system_message || msg.mobile_message) {
        const msgText = zh.getCmpApi('messageContent').getValue();
        if (!msgText) {
          await wfMessage(NGLang.hasNoMsgContent);
          return false;
        }
        const msgUser = zh.getCmpApi('messageUsers').getValue();
        if (!msgUser?.length) {
          await wfMessage(NGLang.hasNoMsgReceiver);
          return false;
        }

        taskDealInfo.noticeInfo = {
          systemMsg: msg.system_message,
          mobileMsg: msg.mobile_message,
          msgText,
          users: msgUser.map((u) => u.userId)
        };
      }
      return true;
    },
    // 判断是否输入办理意见、消息通知及调用业务单据保存
    validAndSaveBiz: async (opType, valid = true) => {
      const validResult = valid ? await options.isValid() : true;
      if (validResult) {
        // 如果单据已审批则不再调用保存
        if (workFlowInfo.bizApproved) {
          return true;
        }
        //调用js方法进行单据保存，如果失败则终止操作
        if (bizSaveFn && bizSaveFn !== emptyFn) {
          const bizSaveReturn: any = await bizSaveFn();
          if (bizSaveReturn === false) {
            return false;
          }
          await options.setBizAttachData(opType);
        }
        return true;
      }
      return false;
    },
    // 刷新首页portal
    refreshPortalEx: () => {
      // if (refreshTaskList) {
      zh.refreshList('MyWorkFlowTask', { type: 'save' });
      //}
      // zh.refreshPortal('WorkFlowTask');
      // zh.refreshPortal('MyParticipantRunningFlow');
    },
    alertAndClose: async (msgContent) => {
      await wfAlert(NGLang.alertTitle, msgContent);
      await zh.close();
    },
    // 设置业务组件附加数据
    setBizAttachData: async (opType) => {
      if (getAttachData && getAttachData !== emptyFn) {
        const tempData = await getAttachData(opType);
        if (zh.isObject(tempData)) {
          taskDealInfo.bizAttachData = tempData;
        }
      }
    },
    // 成功执行某个任务后关闭当前页面
    successAlertAndClose: async (msgContent) => {
      console.log('触发成功执行某个任务后关闭当前页面');
      options.refreshPortalEx();
      if (isFromPortal && getAutoNextFlag()) {
        const nextTaskData: any = await getNextTask({ taskid: workFlowInfo.taskId, catalogGroup: isFromPortal });
        if (nextTaskData?.id) {
          await usingProgress(() => zh.delay(1500), { title: `${msgContent},${NGLang.openNextTask}` });
          await openNextAppFlowTask({ nextTaskData, isFromPortal, isTaskList: false });
        } else {
          await options.alertAndClose(msgContent);
        }
      } else {
        await options.alertAndClose(msgContent);
      }
    },
    // 流程终止
    flowTerminate: async (step: 1 | 2) => {
      if (step === 1) {
        if (await options.isValid()) {
          await options.flowTerminate(2);
        }
      } else if (step === 2) {
        if (await wfConfirm(NGLang.alertTitle, NGLang.whetherTerminate)) {
          taskDealInfo.biztype = taskDealInfo.biztype || zh.getPageInstance()?.busType;
          const resp = await zh.request.body({
            url: 'workflow/task/terminateProcessByTask',
            data: { ...taskDealInfo }
          });
          if (resp.code === 0) {
            await options.successAlertAndClose(NGLang.terminateSuccess);
          } else {
            await wfAlert(NGLang.terminateFailure, resp.message);
          }
        }
      }
    },
    // 加签
    addSubTasks: async (step: 1 | 2) => {
      if (step === 1) {
        if (await options.validAndSaveBiz('addSubTasks')) {
          await options.addSubTasks(2);
        }
      } else if (step === 2) {
        taskDealInfo.parentAutoComplete = false; //默认加签任务办理后返回加签人
        taskDealInfo.sequential = false; //默认不按顺序办理
        const data = await zh.external.openHelp({
          type: 'UserHelp',
          helpId: 'user',
          title: NGLang.selectAddPerson,
          multiple: true,
          // hasRight: false,
          footer: (
            <>
              <Checkbox
                style={{ float: 'right', marginRight: 5 }}
                onChange={(v) => {
                  taskDealInfo.parentAutoComplete = !!v;
                }}
              >
                {NGLang.parentAutoComplete}
              </Checkbox>
              <Checkbox style={{ float: 'right', marginRight: 5 }} onChange={(v) => (taskDealInfo.sequential = !!v)}>
                {NGLang.sequential}
              </Checkbox>
            </>
          )
        });
        if (data) {
          taskDealInfo.users = data.map(({ origin }) => origin.PhId || origin.id);
          console.log(taskDealInfo, '加签信息');
          const resp = await addSubTaskAsync(taskDealInfo);
          if (resp.code === 0) {
            await options.successAlertAndClose(NGLang.addSubTasksSuccess);
          } else {
            await wfAlert(NGLang.addSubTasksFailure, resp.message);
          }
        } else {
          reloadPage();
        }
      }
    },
    // 转签
    taskReassign: async (step: 1 | 2) => {
      if (step === 1) {
        if (await options.validAndSaveBiz('taskReassign')) {
          await options.taskReassign(2);
        }
      } else if (step === 2) {
        const data = await zh.external.openHelp({
          type: 'UserHelp',
          title: NGLang.selectReassignPerson,
          helpId: 'user',
          multiple: false
          // hasRight: false
        });
        if (data) {
          taskDealInfo.assignee = data.origin.PhId || data.origin.id;
          taskDealInfo.biztype = taskDealInfo.biztype || zh.getPageInstance()?.busType;
          const resp = await zh.request.body({
            url: 'workflow/task/taskReassign',
            data: { ...taskDealInfo }
          });
          if (resp.code === 0) {
            await options.successAlertAndClose(stringFormat(NGLang.taskReassSuccess, data.origin.UserName));
          } else {
            await wfAlert(NGLang.taskReassignError, resp.message);
          }
        } else {
          reloadPage();
        }
      }
    },
    // 驳回
    rollBack: async (step: 0 | 1 | 2 | 3 | 4 | 5) => {
      switch (step) {
        case 0: {
          if (await options.isValid()) {
            await options.rollBack(1);
          }
          break;
        }
        case 1: {
          if (workFlowInfo.preRollbackBizCheck) {
            const resp = await usingProgress(() => checkPreRollback(workFlowInfo.taskId), {
              title: NGLang.checkCancelApprove
            });
            if (resp.code === 0) {
              if (resp.data.state === 2) {
                await wfAlert(NGLang.canNotCancelApprove, resp.data.message);
              } else if (resp.data.state === 1) {
                if (await wfConfirm(NGLang.alertTitle, resp.data.message)) {
                  await options.rollBack(2);
                }
              } else {
                await options.rollBack(2);
              }
            } else {
              await wfAlert(NGLang.checkCancelApproveError, resp.message);
            }
          } else {
            await options.rollBack(2);
          }
          break;
        }
        case 2: {
          if (workFlowInfo.bizApproved) {
            // 审批节点驳回时, 设置单据附加数据
            await options.setBizAttachData('rollBack');
          }
          await wfModal({
            title: NGLang.rollBackNodeWinTitle,
            width: 600,
            footerLeft: <WFRollBackNodeWinFooter />,
            content: (
              <WFRollBackNodeWin
                taskId={workFlowInfo.taskId}
                callback={(data, dyUser) => {
                  taskDealInfo.rollbackTargetNodeId = data.toNodeId;
                  taskDealInfo.rollbackType = data.type;
                  options.rollBack(dyUser ? 3 : 4);
                }}
              />
            )
          });
          break;
        }
        case 3: {
          const resp: any = await zh.request.get({
            url: 'WorkFlow3/WorkFlow/GetNodeDynamicUser',
            data: {
              taskid: workFlowInfo.taskId,
              nodeid: taskDealInfo.nodeid // 这个字段从哪里来的？？？ Ext WorkFlowHelp.js 也是这么写的
            }
          });
          const dynamicType: number[] = [];
          if (resp.exists_user) {
            dynamicType.push(1);
            if (resp.dynamicAny) {
              dynamicType.push(2);
            }
          } else {
            dynamicType.push(2);
          }
          await wfModal({
            title: `${resp.name || ''}${NGLang.taskHisNode}--${NGLang.dynamicUsers}`,
            width: 900,
            content: (
              <WFDynamicNodeUserWin
                radioItems={dynamicType}
                todoData={resp.users}
                callBack={(data) => {
                  taskDealInfo.dynamicNodeUsers = data;
                  options.rollBack(4);
                }}
              />
            )
          });
          break;
        }
        case 4: {
          // 选择驳回原因
          if (workFlowInfo.sc_rejectReason?.length) {
            await wfModal({
              title: NGLang.rollBackReason,
              width: 600,
              content: (
                <WFRollBackReason
                  reasonData={workFlowInfo.sc_rejectReason}
                  callback={(id) => {
                    taskDealInfo.sc3RejectReason = id;
                    options.rollBack(5);
                  }}
                />
              )
            });
          } else {
            await options.rollBack(5);
          }
          break;
        }
        case 5: {
          // 调用后端方法处理回退
          const resp = await usingProgress(() => RollBack(taskDealInfo), { title: NGLang.submitRollBack });
          if (resp.code === 0) {
            await options.successAlertAndClose(NGLang.rollBackSuccess);
          } else {
            await wfAlert(NGLang.rollBackError, resp.message);
          }
          if (taskDealInfo.rollbackTargetNodeId) {
            delete taskDealInfo.rollbackTargetNodeId;
            delete taskDealInfo.rollbackType;
          }
          break;
        }
        default:
          break;
      }
    },
    // 确认事项
    handlerFocusPoint: async (callback?) => {
      const controls: any = [];
      const tdiFocusPoint = taskDealInfo.focusPoint?.split(';') || [];
      workFlowInfo.focusPoint?.forEach(function (d, i) {
        const helpData = d.options.map((o) => ({ value: o.name, label: o.name }));
        d.tempId = 'fc_ctl_' + i;
        const ctrl: any = {
          label: d.name,
          xtype: 'NGSelect',
          name: d.tempId,
          required: true,
          data: helpData,
          colspan: 4
        };
        if (tdiFocusPoint) {
          ctrl.defaultValue = tdiFocusPoint.find((v) => v.indexOf(d.name + ':') === 0)?.split(':')[1];
        }
        controls.push(ctrl);
      });
      if (controls.length > 0) {
        await wfModal({
          title: NGLang.focusPoint,
          width: 600,
          content: (
            <WFocusPointWin
              callback={(fd) => {
                taskDealInfo.focusPoint = workFlowInfo.focusPoint
                  ?.map(({ name, tempId }) => `${name}:${fd[tempId] || ''}`)
                  .join(';');
                callback?.();
              }}
              fields={controls}
            />
          )
        });
      }
    },
    // 提交任务办理
    taskComplete: async (step: 0 | 5 | 10 | 20 | 30 | 40) => {
      switch (step) {
        case 0: {
          if (workFlowInfo.toDoOpinion === '1' && workFlowInfo.parentTaskId) {
            //节点意见不允许为空
            if (!(await options.isValid())) {
              return;
            }
          }
          if (!(await options.isValid())) {
            return;
          }
          if (workFlowInfo.focusPoint && !taskDealInfo.focusPoint) {
            await options.handlerFocusPoint(function () {
              options.taskComplete(5);
            });
            return;
          }
          await options.taskComplete(5);
          break;
        }
        case 5: {
          //非自定义类型组件调用单据保存
          if (workFlowInfo.bizApproved === false && workFlowInfo.compType < 4 && bizSaveFn && bizSaveFn !== emptyFn) {
            if (!(await options.validAndSaveBiz('taskComplete', false))) {
              return;
            }
          }
          await options.taskComplete(10);
          break;
        }
        case 10: {
          const resp = await usingProgress(() => checkPreCompleteTask(workFlowInfo.taskId));
          if (resp.code === 0) {
            options.taskDynamicInfo = resp.data;
            if (resp.data.bizOperationCheckResult.state === 2) {
              await wfAlert(
                NGLang.alertTitle,
                NGLang.checkApproveFailure + resp.bizOperationCheckResult.message ||
                  '审批检测失败:' + resp.bizOperationCheckResult.message
              );
              reloadPage();
            } else if (resp.data.bizOperationCheckResult.state === 1) {
              if (await wfConfirm(NGLang.alertTitle, resp.bizOperationCheckResult.message)) {
                await options.taskComplete(20);
              } else {
                reloadPage();
              }
            } else {
              await options.taskComplete(20);
            }
          } else {
            await wfAlert(NGLang.getTaskDynamicError, resp.message);
          }
          break;
        }
        case 20: {
          //判断是否需要动态选择分支
          if (
            options.taskDynamicInfo.dynamicFlowNodes &&
            Object.keys(options.taskDynamicInfo.dynamicFlowNodes).length > 0
          ) {
            const branchData: any = [];
            branchData.push(options.taskDynamicInfo.dynamicFlowNodes);
            await wfModal({
              title: NGLang.dynamicBranchWinTitle,
              width: 400,
              content: (
                <WFDynamicBranchWin
                  branchData={branchData}
                  cancelBack={reloadPage}
                  callBack={(data) => {
                    taskDealInfo.dynamicBranches = data;
                    options.taskComplete(30);
                  }}
                />
              )
            });
          } else {
            await options.taskComplete(30);
          }
          break;
        }
        case 30: {
          //分支选择完成、判断是否需要动态选择人员
          let nodeData: any = [];
          if (options.taskDynamicInfo.dynamicUserNodes && options.taskDynamicInfo.dynamicUserNodes.length > 0) {
            //根据动态分支计算哪些节点是需要动态设置人员的
            const targetIdList = taskDealInfo.dynamicBranches
              ? taskDealInfo.dynamicBranches.map((i) => i.targetNodeId)
              : [];
            const userNodes = options.taskDynamicInfo.dynamicUserNodes;
            const result = filterUserNodes(targetIdList, userNodes, 'dependAssignedNodes');
            nodeData = result;
          }
          if (nodeData.length === 1) {
            // 单节点直接打开选人界面
            const _nodeData = nodeData[0];
            const radioItems = getUseDynamicType(_nodeData.users.length > 0, _nodeData.assignAnyUsers);
            const callBack = (data) => {
              taskDealInfo.dynamicNodeUsers = [
                {
                  nodeId: _nodeData.id,
                  userIds: data.map((_d) => _d.id)
                }
              ];
              options.taskComplete(40);
            };
            await wfModal({
              title: `${_nodeData.name}${NGLang.taskHisNode}--${NGLang.dynamicUsers}`,
              width: 900,
              footerLeft: <WFDynamicNodeUserWinFooter radioItems={radioItems} />,
              content: (
                <WFDynamicNodeUserWin
                  radioItems={radioItems}
                  loginInfo={workFlowInfo.loginOrgInfo}
                  todoData={_nodeData.users}
                  callBack={callBack}
                  cancelBack={reloadPage}
                />
              )
            });
          } else if (nodeData.length > 1) {
            // 多节点先打开节点列表再选人
            await wfModal({
              title: NGLang.nodeDynamicUsers,
              width: 650,
              content: (
                <WFNodeUserSettingWin
                  nodeData={nodeData}
                  loginOrgInfo={workFlowInfo.loginOrgInfo}
                  callBack={(data) => {
                    taskDealInfo.dynamicNodeUsers = data;
                    options.taskComplete(40);
                  }}
                />
              )
            });
          } else {
            //不需要选择动态人员
            await options.taskComplete(40);
          }
          break;
        }
        case 40: {
          console.log(taskDealInfo, 'taskDealInfo');
          if (workFlowInfo.compType === 4) {
            // 自定义组件任务处理，并把工作流参数传到服务端，并在服务端调用工作流api
            await onTaskComplete?.(workFlowInfo.compId, taskDealInfo);
          } else {
            const resp = await usingProgress(() => compeleteTask({ ...taskDealInfo }), {
              title: NGLang.submitTaskComplete
            });
            if (resp.code === 0) {
              if (!resp.flowErrorMsg) {
                await options.successAlertAndClose(NGLang.TaskCompleteSuccess);
              } else {
                await options.successAlertAndClose('任务办理成功,但' + resp.flowErrorMsg);
              }
            } else {
              await wfAlert(NGLang.TaskCompleteError, resp.message);
            }
          }
          break;
        }
        default:
          break;
      }
    },
    // 抄送
    carbonCopy: async () => {
      const data: { value: string; label: string }[] = await zh.external.openHelp({
        type: 'UserHelp',
        helpId: 'user',
        title: NGLang.carbonCopyUsersSelect,
        multiple: true
        // modalProps: {
        //   okText: '抄送'
        // },
      });
      if (!data || data.length === 0) {
        return;
      }
      const userIds = data.map(({ value }) => value);
      const res = await carbonCopy(taskDealInfo.taskId, userIds);
      if (res.code === 0) {
        await wfAlert(
          NGLang.carbonCopySuccess,
          `${NGLang.carbonCopySuccessContent}${data.map(({ label }) => label).join(',')}`
        );
      } else {
        await wfAlert(NGLang.carbonCopyError, res.message);
      }
    }
  };

  // 在toolbar上增加工作流相关按钮
  const addWFToolBar = useRefCallback(() => {
    const tbIns: any = getToolbar(toolbar);

    tbIns?.setButtons((newButtons: any) => {
      if (showAllToolBar) {
        newButtons = [...newButtons];
      } else {
        const showIds = ['close', 'back'];
        newButtons = newButtons.filter((btn) => {
          const bId = btn.id || btn;
          return showIds.includes(bId) || showToolBarItems?.includes(bId);
        });
      }
      // 流程反馈
      // if (workFlowInfo.canFeedBack) {
      //   newButtons.unshift({
      //     id: 'wfbtn_feedback',
      //     text: NGLang.btnFeedBack,
      //     icon: 'MessageOutlined',
      //     onClick: async () => {
      //       await wfModal({
      //         title: NGLang.btnFeedBack,
      //         width: 600,
      //         okText: NGLang.feedbackSubmit,
      //         content: <WFlowFeedBackWin workFlowInfo={workFlowInfo} />
      //       });
      //     }
      //   });
      // }

      // 抄送权限最低放到最后
      if (workFlowInfo.allowCarbonCopy) {
        newButtons.unshift({
          id: 'wfbtn_carboncopy',
          text: NGLang.carbonCopy,
          icon: 'SendOutlined',
          onClick: () => options.carbonCopy()
        });
      }
      // 流程图 和 跳过
      newButtons.unshift(
        {
          id: 'wfbtn_flowDiagram',
          text: NGLang.btnFlowInfo,
          icon: 'HistoryOutlined',
          onClick: function () {
            showFlowInfoByPiId(workFlowInfo.procInstId);
          }
        }
        // {
        //   id: 'wfbtn_nextTask',
        //   text: NGLang.btnNextTask,
        //   icon: 'ArrowRightOutlined',
        //   onClick: async () => {
        //     const nextTaskData = await getNextTask({ taskid: workFlowInfo.taskId, catalogGroup: isFromPortal });
        //     if (nextTaskData?.id) {
        //       await openNextAppFlowTask({ nextTaskData, isFromPortal, isTaskList: refreshTaskList });
        //     } else {
        //       await wfAlert(NGLang.alertTitle, NGLang.hasNoNextTask);
        //     }
        //   }
        // }
      );
      // 工作流附件
      if (workFlowInfo.mustUploadApprovalAttachment) {
        taskDealInfo.guId = Math.random().toString(36).slice(2);
        newButtons.unshift({
          id: 'wfbtn_attachment',
          text: NGLang.btnAttach,
          icon: 'PaperClipOutlined',
          onClick: async () => {
            // taskDealInfo.attguid
            const data = await openAttachment({
              asrSessionGuid: taskDealInfo.guId,
              asrTable: 'flowAttachment',
              asrCode: workFlowInfo.taskId ? workFlowInfo.taskId : ''
              // control: false
            });
            console.log(data, 'datadata');
          }
        });
      }
      // 终止
      if (workFlowInfo.processOperateOptions.terminate != undefined) {
        newButtons.unshift({
          id: 'wfbtn_terminate',
          text: NGLang.btnAbort,
          icon: 'MinusCircleFilled',
          onClick: async () => {
            workFlowInfo.minCommentLen = workFlowInfo.processOperateOptions.terminate.minCommentLength;
            workFlowInfo.needsignature = workFlowInfo.processOperateOptions.terminate.requiredSignature;
            await options.flowTerminate(1);
          }
        });
      }
      // 加签
      if (workFlowInfo.processOperateOptions.addSubTask != undefined) {
        newButtons.unshift({
          id: 'wfbtn_addsubtis',
          text: NGLang.btnAddsubtis,
          icon: 'SisternodeOutlined',
          onClick: async () => {
            workFlowInfo.minCommentLen = workFlowInfo.processOperateOptions.addSubTask.minCommentLength;
            workFlowInfo.needsignature = workFlowInfo.processOperateOptions.addSubTask.requiredSignature;
            await options.addSubTasks(1);
          }
        });
      }
      // 转签
      if (workFlowInfo.processOperateOptions.reassign != undefined) {
        newButtons.unshift({
          id: 'wfbtn_transmit',
          text: NGLang.btntransmit,
          icon: 'NodeExpandOutlined',
          onClick: async () => {
            workFlowInfo.minCommentLen = workFlowInfo.processOperateOptions.reassign.minCommentLength;
            workFlowInfo.needsignature = workFlowInfo.processOperateOptions.reassign.requiredSignature;
            await options.taskReassign(1);
          }
        });
      }
      // 驳回
      if (workFlowInfo.processOperateOptions.rollback != undefined) {
        newButtons.unshift({
          id: 'wfbtn_rollback',
          text: NGLang.btnrollback,
          icon: 'RollbackOutlined',
          onClick: async () => {
            workFlowInfo.minCommentLen = workFlowInfo.processOperateOptions.rollback.minCommentLength;
            workFlowInfo.needsignature = workFlowInfo.processOperateOptions.rollback.requiredSignature;
            await options.rollBack(0);
          }
        });
      }
      // 确认事项
      // if (workFlowInfo.focusPoint) {
      //   newButtons.unshift({
      //     id: 'confirm_matter',
      //     text: NGLang.confirmmatter,
      //     icon: 'CheckSquareOutlined',
      //     onClick: async () => {
      //       await options.handlerFocusPoint();
      //     }
      //   });
      // }

      // 不同意
      if (workFlowInfo.processOperateOptions.disagree != undefined) {
        newButtons.unshift({
          id: 'wfbtn_disagree',
          text: NGLang.btnDisagree,
          icon: 'CloseSquareFilled',
          onClick: async () => {
            taskDealInfo.action = workFlowInfo.processOperateOptions.disagree.operation;
            workFlowInfo.minCommentLen = workFlowInfo.processOperateOptions.disagree.minCommentLength;
            workFlowInfo.needsignature = workFlowInfo.processOperateOptions.disagree.requiredSignature;
            await options.taskComplete(40);
          }
        });
      }
      //同意
      if (workFlowInfo.processOperateOptions.agree != undefined) {
        newButtons.unshift({
          id: 'wfbtn_agree',
          text: NGLang.btnAgree,
          icon: 'CheckCircleFilled',
          onClick: async () => {
            taskDealInfo.action = workFlowInfo.processOperateOptions.agree.operation;
            workFlowInfo.minCommentLen = workFlowInfo.processOperateOptions.agree.minCommentLength;
            workFlowInfo.needsignature = workFlowInfo.processOperateOptions.agree.requiredSignature;
            await options.taskComplete(0);
          }
        });
      }
      // 提交
      if (workFlowInfo.processOperateOptions.submit != undefined) {
        newButtons.unshift({
          id: 'wfbtn_taskcomplete',
          text: NGLang.btnSubmit,
          icon: 'CheckSquareFilled',
          onClick: async () => {
            taskDealInfo.action = workFlowInfo.processOperateOptions.submit.operation;
            workFlowInfo.minCommentLen = workFlowInfo.processOperateOptions.submit.minCommentLength;
            workFlowInfo.needsignature = workFlowInfo.processOperateOptions.submit.requiredSignature;

            await options.taskComplete(0);
          }
        });
      }
      return newButtons;
    });
  });

  useAllReady(() => {
    addWFToolBar();
    setWorkFlowUIState(workFlowInfo.formDataPermissions);
  });

  const msgHeight = msg.system_message || msg.mobile_message ? 38 : 0;
  return (
    <Layout
      style={{
        height: height + msgHeight,
        padding: 5,
        backgroundColor: 'var(--component-background)',
        marginBottom: 'var(--inner-margin, 16px)'
      }}
    >
      <Layout.Flex direction="row">
        <Layout.Slider
          size={workFlowInfo.remarkPanelWidth || 250}
          style={{ marginRight: 5 }}
          // resize={saveRemarkPanelWidth}
        >
          <Layout>
            {/* <Layout direction="row" style={{ alignItems: 'center' }}>
              <BaseHelp
                style={{ flex: 1, width: 0 }}
                size="small"
                placeholder="--常用语--"
                onChange={onSuggestChange}
                input={false}
                popupMatchSelectWidth={245}
                valueField="PhId"
                labelField="Cname"
                loadByFocus
                userCodeField="Cname"
                request={getCommonWordHelp}
              />
              <FormOutlined onClick={openCommonWordList} style={{ margin: '0 6px' }} />
            </Layout> */}
            <Layout.Flex direction="row" style={{ margin: '2px 0' }}>
              <TextArea id="SuggestValue" placeholder={NGLang.emptyRemarkInfo} style={{ flex: 1, resize: 'none' }} />
              {workFlowInfo.signatureFlag && (
                <WfSignatureImage
                  onChange={onSignatureChange}
                  signature={signature}
                  style={{ width: 100, marginLeft: 2 }}
                />
              )}
            </Layout.Flex>
            {/* <Layout direction="row" style={{ ...commonStyle.borderStyle, padding: '2px 5px' }}>
              <Checkbox
                {...checkBoxProps}
                checked={msg.system_message}
                onChange={(system_message) => setMsg((p) => ({ ...p, system_message }))}
              >
                {NGLang.msgTypeSys}
              </Checkbox>
              <Checkbox
                {...checkBoxProps}
                checked={msg.mobile_message}
                onChange={(mobile_message) => setMsg((p) => ({ ...p, mobile_message }))}
              >
                {NGLang.msgTypeSMS}
              </Checkbox>
            </Layout> */}
          </Layout>
        </Layout.Slider>
        <Layout.Flex>
          <HistoryTable />
        </Layout.Flex>
      </Layout.Flex>
      {msgHeight > 0 && (
        <Layout direction="row" style={{ ...commonStyle.borderStyle, padding: 5, marginTop: -1, borderTop: 0 }}>
          <FormItem flex={3}>
            <Input id="messageContent" placeholder={NGLang.msgContent} />
          </FormItem>
          <FormItem flex={2} label={NGLang.msgReceiver} style={{ marginLeft: 10 }}>
            <WFNoticeUserSelect id="messageUsers" />
          </FormItem>
        </Layout>
      )}
    </Layout>
  );
}

/**
 * 审批办理中间组件（验证参数、请求审批信息数据）
 * @param props
 * @constructor
 */
export default function WorkFlowPanel(props: INGWorkFlowPanelProps) {
  const wfOType = props.wfOType || zh.getQueryValue('wfotype');
  const wfTaskId = props.wfTaskId || zh.getQueryValue('wftaskid');
  const wfPiId = props.wfPiId || zh.getQueryValue('wfpiid');
  const bizType = props.bizType || zh.getQueryValue('bizCode') || zh.getQueryValue('bizType');
  const oType = props.oType || (zh.getQueryValue('otype') as INGWorkFlowPanelProps['oType']);
  const bizPhId = props.bizPhId || zh.getQueryValue('id');
  // 历史数据 isFromPortal 单词纠正
  const isFromPortal =
    props.isFromPortal || zh.getQueryValue('isFromProtal') === 'true' || zh.getQueryValue('isFromPortal') === 'true';
  const refreshTaskList = props.refreshTaskList || zh.getQueryValue('iswftasklist') === 'true';
  const [workFlowInfo, setWorkFlowInfo] = useState<any>(null);

  useAsyncEffect(
    async (ctx) => {
      if (oType !== 'add' && !!wfPiId) {
        const info = await getWorkFlowInfo({ wfPiId, wfOType, wfTaskId });
        if (ctx.isMounted) {
          info && setWorkFlowInfo(info);
        }
      }
    },
    [oType, wfPiId, wfOType, wfTaskId]
  );

  if (oType === 'add' || !wfPiId) {
    return null;
  }

  if (!workFlowInfo) {
    return <WfSkeleton height={props.height + 8} />;
  }

  return (
    <InnerWorkFlowPanel
      {...props}
      workFlowInfo={workFlowInfo}
      isFromPortal={isFromPortal}
      refreshTaskList={refreshTaskList}
      oType={oType}
      bizType={bizType}
      bizPhId={bizPhId}
    />
  );
}

WorkFlowPanel.defaultProps = {
  oType: 'edit',
  height: 180,
  showToolBarItems: [],
  bizType: '',
  bizPhId: '',
  isFromPortal: false,
  refreshTaskList: false,
  bizSaveFn: emptyFn,
  getAttachData: emptyFn,
  showAllToolBar: false,
  taskDealInfo: {}
};
