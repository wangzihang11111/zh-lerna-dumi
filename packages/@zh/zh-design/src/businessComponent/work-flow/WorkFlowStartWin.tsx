import { useContext, useEffect, useMemo, useState } from 'react';
import { Search, TextArea } from '../../baseComponent';
import { ModalContext, Table, TableInstance, usingProgress } from '../../functionalComponent';
import { emptyFn, Layout, zh, useApi, useRefCallback } from '../../util';
import { checkPreStartProcessInstance, getProcessInitialActivity } from './service';
import {
  filterUserNodes,
  getUseDynamicType,
  NGLang,
  reloadPage,
  showPdDiagram,
  stringFormat,
  wfAlert,
  wfModal
} from './util';
import { WFDynamicBranchWin } from './WFDynamicBranchWin';
import { WFDynamicNodeUserWin, WFDynamicNodeUserWinFooter } from './WFDynamicNodeUserWin';
import { WFNodeUserSettingWin } from './WFNodeUserSettingWin';
// const { Flex } = Layout;

/**
 * 审批流发起相关参数
 */
const global: { workInFlow: any; close?: Function; modalIns?: any } = {
  workInFlow: null,
  close: emptyFn,
  modalIns: null
};

interface Item {
  [key: string]: string | undefined;
}
/**
 * 对数组中的对象进行模糊匹配（前端）
 * @param filterDataObj 被匹配的数组中的每一项
 * @param searchStr 关键词
 * @param keysToMatch 过滤字段
 */
function fuzzyMatchObject(filterDataObj: Item, searchStr: string, keysToMatch: string[]): boolean {
  const pattern = new RegExp(searchStr, 'i');
  for (const key of keysToMatch) {
    const value = filterDataObj[key];
    if (value && pattern.test(value)) {
      return true;
    }
  }
  return false;
}
/**
 * 开始流程
 * @param step
 */
async function startFlow(step: number) {
  const { workInFlow } = global;
  if (step === 1) {
    //获取节点动态指派数据
    const resp = await usingProgress(() =>
      checkPreStartProcessInstance({
        processDefinitionId: workInFlow.startFlowParam.processDefinitionId,
        formData: {
          appCode: workInFlow.appCode,
          bizCode: workInFlow.bizCode,
          dataId: workInFlow.dataId,
          cuId: workInFlow.cuId,
          orgId: workInFlow.orgId
        }
      })
    );
    if (resp.code === 0) {
      workInFlow.dynamicInfo = resp.data;
      if (!workInFlow.dynamicInfo.dynamicFlowNodes && !workInFlow.dynamicInfo.dynamicUserNodes) {
        startFlow(4);
      }
      startFlow(2);
    } else {
      await wfAlert(NGLang.getTaskDynamicError, resp.message);
    }
  } else if (step === 2) {
    //判断是否需要动态选择分支
    if (workInFlow.dynamicInfo.dynamicFlowNodes && Object.keys(workInFlow.dynamicInfo.dynamicFlowNodes).length > 0) {
      const callBack = (data) => {
        workInFlow.startFlowParam.dynamicBranches = data;
        startFlow(3);
      };
      const branchData: any = [];
      branchData.push(workInFlow.dynamicInfo.dynamicFlowNodes);
      await wfModal({
        title: NGLang.dynamicBranchWinTitle,
        width: 400,
        content: <WFDynamicBranchWin branchData={branchData} callBack={callBack} />
      });
    } else {
      await startFlow(3);
    }
  } else if (step === 3) {
    //分支选择完成、判断是否需要动态选择人员
    let nodeData: any = [];
    if (workInFlow.dynamicInfo.dynamicUserNodes && workInFlow.dynamicInfo.dynamicUserNodes.length > 0) {
      //根据动态分支计算哪些节点是需要动态设置人员的
      const targetIdList = workInFlow.startFlowParam?.dynamicBranches
        ? workInFlow.startFlowParam?.dynamicBranches.map((i) => i.targetNodeId)
        : [];
      const userNodes = workInFlow.dynamicInfo.dynamicUserNodes;
      const result = filterUserNodes(targetIdList, userNodes, 'dependAssignedNodes');
      nodeData = result;
    }
    if (nodeData.length === 1) {
      // 单节点直接打开选人界面
      const _nodeData = nodeData[0];
      const radioItems = getUseDynamicType(_nodeData.users.length > 0, _nodeData.assignAnyUsers);
      const callBack = (data) => {
        //找出被选择节点的人数限制数
        const minUserCount = workInFlow.dynamicInfo.dynamicUserNodes.filter((i) => i.id === _nodeData.id)[0]
          .minUserCount;
        workInFlow.startFlowParam.dynamicNodeUsers = [
          {
            nodeId: _nodeData.id,
            userIds: data.map((_d) => _d.id)
          }
        ];
        if (data.length < minUserCount) {
          wfAlert(NGLang.alertTitle, stringFormat(NGLang.createFlowMinUserCount, minUserCount));
          global.close?.();
        }
        startFlow(4);
      };
      await wfModal({
        title: `${_nodeData.name}${NGLang.taskHisNode}--${NGLang.dynamicUsers}`,
        width: 900,
        footerLeft: <WFDynamicNodeUserWinFooter radioItems={radioItems} />,
        content: (
          <WFDynamicNodeUserWin
            radioItems={radioItems}
            loginInfo={workInFlow.data.loginOrgInfo}
            todoData={_nodeData.users}
            callBack={callBack}
            cancelBack={reloadPage}
          />
        )
      });
    } else if (nodeData.length > 1) {
      // 多节点先打开节点列表再选人
      const callBack = (data) => {
        zh.assign(workInFlow.startFlowParam.dynamicNodeUsers, data);
        startFlow(4);
      };
      await wfModal({
        title: NGLang.nodeDynamicUsers,
        width: 650,
        content: (
          <WFNodeUserSettingWin nodeData={nodeData} loginOrgInfo={workInFlow.data.loginOrgInfo} callBack={callBack} />
        )
      });
    } else {
      //不需要选择动态人员
      await startFlow(4);
    }
  } else if (step === 4) {
    const resp: any = await usingProgress(
      () =>
        zh.request.body({
          url: 'workflow/process/startProcessInstance',
          data: workInFlow.startFlowParam
        }),
      { title: `${NGLang.createFlow}...` }
    );
    global.close?.();
    if (resp.code === 0) {
      await wfAlert(NGLang.alertTitle, NGLang.createFlowSuccess);
      workInFlow.callback?.(resp.data);
    } else {
      await wfAlert(NGLang.createFlowError, resp.message);
      workInFlow.cancelback?.();
    }
  }
}

/**
 * 自动发起工作流（单流程时）
 */
async function autoStartFlowByOnlyOne() {
  global.workInFlow.startFlowParam = {
    // pdid: global.workInFlow.data.pdlist[0].id,
    // flowDesc: global.workInFlow.data.flowdesc,
    // biztype: global.workInFlow.bizType,
    // bizphid: global.workInFlow.bizPhid,
    // dynamicNodeUsers: [],
    // dynamicBranches: []
    pdid: global.workInFlow.data.pdlist[0].id,
    flowDesc: global.workInFlow.data.flowdesc,
    biztype: global.workInFlow.bizType,
    bizphid: global.workInFlow.bizPhid,
    dynamicNodeUsers: [],
    dynamicBranches: []
  };
  await startFlow(1);
}

/**
 * 发起工作流弹窗
 * @constructor
 */
function WorkFlowStartWin() {
  const { workInFlow } = global;
  const tableRef = useApi<TableInstance>();
  const mCtx = useContext(ModalContext);
  const [form, setForm] = useState({ txtRemark: '', signature: { code: '', url: '' } });

  const onSearchHandler = useRefCallback((value) => {
    tableRef.current.getApi().filter((item) => fuzzyMatchObject(item, value, ['id', 'name']));
  });

  const validData = useRefCallback(() => {
    //判断审批意见相关条件
    const txtRemark = form.txtRemark.trim();
    const minCommentLen = workInFlow.minCommentLen;
    if (minCommentLen > 0 && !txtRemark) {
      wfAlert(NGLang.alertTitle, NGLang.hasNoremark).then();
      return false;
    }
    if (minCommentLen > txtRemark.length) {
      wfAlert(NGLang.alertTitle, stringFormat(NGLang.reamrkHasMore, minCommentLen)).then();
      return false;
    }
    //判断是否选择签章 ---目前签章组件还没有，暂时不验证
    if (workInFlow.needsignature && !form.signature.code) {
      wfAlert(NGLang.alertTitle, NGLang.mustSignature).then();
      return false;
    }
    return true;
  });

  // 确认发起工作流
  const validDataAndStartFlow = useRefCallback(async () => {
    const selectData = tableRef.current.getApi().getSelectedData()[0];
    if (!selectData) {
      await wfAlert(NGLang.alertTitle, NGLang.selectOnePd);
      return;
    }
    const processActivityData = await getProcessInitialActivity(selectData.id);
    selectData.mincommentlen = processActivityData.minCommentLength;
    selectData.mustsignature = processActivityData.requiredSignature;
    workInFlow.minCommentLen = Number(selectData.mincommentlen) || 0;
    workInFlow.needsignature = selectData.mustsignature;
    if (!validData()) {
      return;
    }
    workInFlow.startFlowParam.processDefinitionId = selectData.id;
    workInFlow.startFlowParam.formData = {};
    workInFlow.startFlowParam.formData.appCode = workInFlow.appCode;
    workInFlow.startFlowParam.formData.bizCode = workInFlow.bizCode;
    workInFlow.startFlowParam.formData.dataId = workInFlow.dataId;
    workInFlow.startFlowParam.formData.cuId = workInFlow.cuId;
    workInFlow.startFlowParam.formData.orgId = workInFlow.orgId;
    workInFlow.startFlowParam.comment = {};
    workInFlow.startFlowParam.comment.content = form.txtRemark;
    workInFlow.startFlowParam.comment.signatureId = form.signature.code;
    workInFlow.startFlowParam.dynamicNodeUsers = [];
    workInFlow.startFlowParam.dynamicBranches = [];
    await startFlow(1);
  });

  useEffect(() => {
    global.modalIns = mCtx.ins;
    mCtx.ins.setApi({
      invokeOkHandler: validDataAndStartFlow,
      invokeCancelHandler: async () => {
        await global.workInFlow.cancelback?.();
        global.close?.();
      }
    });
    tableRef.current.getApi().setSelected(0);
  }, []);

  const compProps = useMemo<any>(() => {
    const iconStyle = { fontSize: 16, cursor: 'pointer' };
    const columnProps = {
      sortable: false,
      resizable: false,
      columnSort: false
    };
    return {
      labelStyle: {
        width: 65,
        marginLeft: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      },
      tableProps: {
        headerHeight: 32,
        rowHeight: 30,
        style: { border: '1px solid var(--border-color-split, #f0f0f0)' },
        columns: [
          {
            ...columnProps,
            header: NGLang.pdId,
            dataIndex: 'id'
          },
          {
            ...columnProps,
            header: NGLang.pdName,
            dataIndex: 'name'
          },
          {
            ...columnProps,
            header: NGLang.description,
            dataIndex: 'description'
          },
          // {
          //   ...columnProps,
          //   header: NGLang.btnView,
          //   width: 50,
          //   align: 'center',
          //   dataIndex: 'view',
          //   render({ row }) {
          //     return <FileSearchOutlined style={iconStyle} onClick={() => showPdDiagram(row.id)} />;
          //   }
          // },
          {
            ...columnProps,
            header: NGLang.operation,
            width: 200,
            align: 'center',
            dataIndex: 'test',
            render({ row }) {
              return (
                <a style={iconStyle} onClick={() => showPdDiagram(row, workInFlow)}>
                  {NGLang.btnTest}
                </a>
              );
            }
          }
        ],
        dataSource: workInFlow.data.processDefinitions || []
      }
    };
  }, []);

  const onRemarkHandler = (txtRemark) => {
    setForm((p) => ({ ...p, txtRemark }));
  };

  const onSignatureChange = (signature) => {
    setForm((p) => ({ ...p, signature }));
  };

  return (
    <Layout style={{ height: 400, padding: '5px 12px' }}>
      <Layout direction="row">
        <label style={compProps.labelStyle}>{NGLang.taskRemark}:</label>

        <TextArea
          value={form.txtRemark}
          onChange={onRemarkHandler}
          rows={3}
          style={{ flex: 1, resize: 'none', marginTop: '12px' }}
        />

        {/* <WfSignatureImage
          onChange={onSignatureChange}
          signature={form.signature}
          style={{ width: 100, marginLeft: 2 }}
        /> */}
      </Layout>
      <Layout direction="row" style={{ width: '90%', margin: '12px 0' }}>
        <label style={compProps.labelStyle}>{NGLang.procDefin}:</label>

        <Search placeholder={NGLang.seachEmptyText} allowClear onSearch={onSearchHandler} />
      </Layout>
      <Layout.Flex>
        <Table ref={tableRef} {...compProps.tableProps} />
      </Layout.Flex>
    </Layout>
  );
}

/**
 * 发起工作流（非批量）
 * @param autoStart 是否自动发起（单流程时）
 * @param props 属性
 */
export async function openWorkFlowStartWin({ autoStart, ...props }) {
  global.workInFlow = props;
  global.workInFlow.startFlowParam = {};
  // if (autoStart && props.data.pdlist?.length === 1) {
  //   await autoStartFlowByOnlyOne();
  //   return;
  // }
  global.close = () => {
    global.close = emptyFn;
    global.modalIns?.destroy();
    global.modalIns = null;
  };
  await wfModal({
    title: NGLang.createFlowWinTitile,
    content: <WorkFlowStartWin />,
    width: 750
  });
}
