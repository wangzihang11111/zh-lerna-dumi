import { FileSearchOutlined } from '@ant-design/icons';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Search, TextArea } from '../../baseComponent';
import { ModalContext, Table, usingProgress } from '../../functionalComponent';
import { emptyFn, Layout, zh, useApi, useRefCallback } from '../../util';
import { NGLang, showPdDiagram, wfAlert, wfModal } from './util';

const columnProps = {
  sortable: false,
  resizable: false,
  columnSort: false
};

/**
 * 审批流发起相关参数
 */
const global: { workInFlow: any; close?: Function; modalIns?: any } = {
  workInFlow: null,
  close: emptyFn,
  modalIns: null
};

function BatchStartFlowSuccess({ data }) {
  const mCtx = useContext(ModalContext);
  const columns = useMemo(() => {
    return [
      {
        ...columnProps,
        tooltip: true,
        header: '结果',
        dataIndex: 'resp',
        flex: 2
      },
      {
        header: '主键',
        dataIndex: 'phid',
        flex: 1
      },
      {
        ...columnProps,
        tooltip: true,
        header: '描述',
        dataIndex: 'desc',
        flex: 2
      }
    ];
  }, []);

  useEffect(() => {
    mCtx.ins.setApi({
      invokeCancelHandler: async () => {
        mCtx.ins?.destroy();
      }
    });
  }, []);

  return (
    <Layout style={{ height: 400, padding: 5 }}>
      <Layout.Flex>
        <Table bordered headerHeight={32} rowHeight={30} columns={columns} dataSource={data} />
      </Layout.Flex>
    </Layout>
  );
}

async function startFlow() {
  const { workInFlow } = global;
  const resp: any = await usingProgress(
    () =>
      zh.request.body({
        url: 'WorkFlow3/WorkFlow/BatchCreateProcInst',
        data: {
          data: workInFlow.startFlowParam
        }
      }),
    { title: `${NGLang.createFlow}...` }
  );
  global.close?.();
  if (resp.success) {
    workInFlow.callback?.(resp.data);
    await wfModal({
      title: NGLang.batchStartFlowSuccess,
      width: 600,
      okText: false,
      cancelText: '关闭',
      content: <BatchStartFlowSuccess data={resp.data} />
    });
  } else {
    await wfAlert(NGLang.createFlowError, resp.errorMsg);
    workInFlow.cancelback?.();
  }
}

function WorkFlowBatchStartWin() {
  const { workInFlow } = global;
  const tableRef = useApi();
  const mCtx = useContext(ModalContext);
  const compProps = useMemo<any>(() => {
    const iconStyle = { fontSize: 16, cursor: 'pointer' };
    return {
      labelStyle: { width: 65, lineHeight: '32px' },
      tableProps: {
        headerHeight: 32,
        rowHeight: 30,
        style: { border: '1px solid var(--border-color-split, #f0f0f0)' },
        columns: [
          {
            ...columnProps,
            flex: 1,
            header: NGLang.pdId,
            dataIndex: 'id'
          },
          {
            ...columnProps,
            flex: 2,
            header: NGLang.pdName,
            dataIndex: 'name'
          },
          {
            ...columnProps,
            header: NGLang.btnView,
            width: 50,
            align: 'center',
            dataIndex: 'view',
            render({ row }) {
              return <FileSearchOutlined style={iconStyle} onClick={() => showPdDiagram(row)} />;
            }
          }
        ],
        dataSource: workInFlow.data || []
      }
    };
  }, []);
  const [form, setForm] = useState({ txtRemark: '' });
  const onRemarkHandler = useRefCallback((txtRemark) => {
    setForm((p) => ({ ...p, txtRemark }));
  });
  const onSearchHandler = useRefCallback((value) => {
    tableRef.current.getApi().filter(value, ['id', 'name']);
  });
  const validDataAndStartFlow = useRefCallback(async () => {
    const selectData = tableRef.current.getApi().getSelectedData()[0];
    if (!selectData) {
      await wfAlert(NGLang.alertTitle, NGLang.selectOnePd);
      return;
    }
    workInFlow.startFlowParam.pdid = selectData.id;
    workInFlow.startFlowParam.remark = form.txtRemark;
    workInFlow.startFlowParam.biztype = workInFlow.bizType;
    workInFlow.startFlowParam.bizData = workInFlow.bizData;
    if (!workInFlow.orgId) {
      workInFlow.startFlowParam.orgId = workInFlow.orgId;
    }
    await startFlow();
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

  return (
    <Layout style={{ height: 400, padding: '5px 12px' }}>
      <Layout direction="row">
        <label style={compProps.labelStyle}>{NGLang.taskRemark}:</label>
        <Layout.Flex>
          <TextArea value={form.txtRemark} onChange={onRemarkHandler} rows={3} />
        </Layout.Flex>
      </Layout>
      <Layout direction="row" style={{ margin: '5px 0' }}>
        <label style={{ width: 65, lineHeight: '32px' }}>{NGLang.procDefin}:</label>
        <Layout.Flex>
          <Search placeholder={NGLang.seachEmptyText} allowClear onSearch={onSearchHandler} />
        </Layout.Flex>
      </Layout>
      <Layout.Flex>
        <Table ref={tableRef} {...compProps.tableProps} />
      </Layout.Flex>
    </Layout>
  );
}

/**
 * 批量发起工作流
 * @param props
 */
export async function openWorkFlowBatchStartWin(props: any) {
  global.workInFlow = props;
  global.workInFlow.startFlowParam = {};
  global.close = () => {
    global.close = emptyFn;
    global.modalIns?.destroy();
    global.modalIns = null;
  };
  await wfModal({
    title: NGLang.batchStartFlowWinTitile,
    content: <WorkFlowBatchStartWin />,
    width: 650
  });
}
