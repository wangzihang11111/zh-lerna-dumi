import { Skeleton } from 'antd';
import React, { useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Checkbox, Select } from '../../baseComponent';
import { ModalContext, Table } from '../../functionalComponent';
import { Layout, zh, useApi, useAsyncSuspense, useRefCallback } from '../../util';
import { getRollBackInfo } from './service';
import { NGLang, wfAlert, wfModal } from './util';

const Ids = {
  cbDyUser: 'cbDyUser'
};

function DetailSkeleton({ height = 340 }) {
  return (
    <div style={{ padding: 8, height }}>
      <Skeleton active />
    </div>
  );
}
interface Item {
  value: string;
  label: string;
}

function findMatchingItems(arr1: Item[], arr2: string[]): Item[] {
  const result: Item[] = [];

  arr2.forEach((item) => {
    const matchedItem = arr1.find((obj) => obj.value === item);
    if (matchedItem) {
      result.push(matchedItem);
    }
  });

  return result;
}

/**
 * 选择需重新办理的节点
 * @param callback 回调函数
 * @param taskId 任务id
 * @param toNodeId 当前选择的回退节点
 * @constructor
 */
function RollBackPartNodeWin({ callback, taskId, toNodeId }) {
  const mCtx = useContext(ModalContext);
  const tableRef = useApi();

  useEffect(() => {
    mCtx.ins.setApi({
      invokeOkHandler: async () => {
        const selectedData = tableRef.current.getApi().getSelectedData();
        if (selectedData.length === 0) {
          await wfAlert(NGLang.alertTitle, NGLang.hasNoRollBakNode);
          return;
        }
        callback({ redoNodes: selectedData.map((d) => d.id), toNodeId });
        mCtx.ins?.destroy();
      }
    });
  }, []);

  const memoInfo = useMemo(() => {
    return {
      columns: [
        { title: NGLang.nodeName, dataIndex: 'name', flex: 2 },
        { title: NGLang.taskHisActor, dataIndex: 'usersName', flex: 3 }
      ],
      request: async () => {
        const resp = await zh.request.get({
          url: 'workflow3/workflow/GetRollBackRedoNodes',
          data: { taskid: taskId, toNodeId: toNodeId }
        });
        return resp.data || [];
      }
    };
  }, [taskId, toNodeId]);

  return (
    <div style={{ padding: '5px 5px 0 5px', height: 340 }}>
      <Table
        request={memoInfo.request}
        checkbox
        rowSelected
        ref={tableRef}
        headerHeight={32}
        rowHeight={30}
        style={{ border: '1px solid var(--border-color-split, #f0f0f0)' }}
        columns={memoInfo.columns}
      />
    </div>
  );
}

function RollBackNodeContent({ reader, callback, taskId }) {
  const rollBackInfo = reader().data;
  const mCtx = useContext(ModalContext);
  const tableRef = useApi();
  const rollModeRef = useApi<any>();
  const memoInfo = useMemo(() => {
    return {
      rollModeDisabled: false,
      options: findMatchingItems(
        [
          { value: 'normal', label: '重新按顺序办理' },
          { value: 'fast', label: '仅回退节点重新办理' }
        ],
        rollBackInfo.strategies
      ),
      columns: [
        { title: NGLang.nodeName, dataIndex: 'name', flex: 2 },
        { title: NGLang.taskHisActor, dataIndex: 'usersName', flex: 3 }
      ]
    };
  }, [rollBackInfo]);

  useEffect(() => {
    if (rollBackInfo.nodeList?.length) {
      tableRef.current.getApi().setSelected(0);
      mCtx.ins.notify(!!rollBackInfo.nodeList[0].canDynamicUser, Ids.cbDyUser);
    }
    mCtx.ins.setApi({
      invokeOkHandler: async () => {
        const selectedData = tableRef.current.getApi().getSelectedData()[0];
        if (!selectedData) {
          await wfAlert(NGLang.alertTitle, NGLang.hasNoRollBakNode);
          return;
        }
        const rollMode = rollModeRef.current.getApi().getValue();
        if (rollMode === 2) {
          await wfModal({
            title: NGLang.rollBackPartNodeWinTitle,
            width: 600,
            content: (
              <RollBackPartNodeWin
                toNodeId={selectedData.id}
                taskId={taskId}
                callback={(data: any) => {
                  callback({ ...data, type: rollMode }, false);
                  mCtx.ins?.destroy();
                }}
              />
            )
          });
        } else {
          callback(
            {
              toNodeId: selectedData.id,
              type: rollMode,
              redoNodes: [selectedData.id]
            },
            !!zh.getCmpApi(Ids.cbDyUser)?.getValue()
          );
          mCtx.ins?.destroy();
        }
      }
    });
  }, []);

  const onRow = useRefCallback((rowIndex, table) => {
    const row = table.getRow(rowIndex);
    return {
      onClick() {
        mCtx.ins.notify(!!row.canDynamicUser, Ids.cbDyUser);
      }
    };
  });

  return (
    <Layout height={340} style={{ padding: '0 5px' }}>
      <div style={{ height: 36, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
        {`${NGLang.rollBackType}：`}
        <Select
          size="small"
          style={{ width: 180 }}
          ref={rollModeRef as any}
          disabled={memoInfo.rollModeDisabled}
          options={memoInfo.options}
          defaultValue={rollBackInfo.defaultStrategy}
        />
      </div>
      <Layout.Flex>
        <Table
          dataSource={rollBackInfo.nodeList}
          ref={tableRef}
          rowSelected
          headerHeight={32}
          rowHeight={30}
          onRow={onRow}
          style={{ border: '1px solid var(--border-color-split, #f0f0f0)' }}
          columns={memoInfo.columns}
        />
      </Layout.Flex>
    </Layout>
  );
}

/**
 * 回滚节点弹窗内容
 * @param taskId 任务id
 * @param callback 选择回调
 * @constructor
 */
export function WFRollBackNodeWin({ taskId, callback }) {
  const [dataReader] = useAsyncSuspense(getRollBackInfo, taskId, taskId);
  return (
    <React.Suspense fallback={<DetailSkeleton />}>
      <RollBackNodeContent reader={dataReader} callback={callback} taskId={taskId} />
    </React.Suspense>
  );
}

/**
 * 弹出窗底部扩展按钮
 * @constructor
 */
export function WFRollBackNodeWinFooter() {
  const mCtx = useContext(ModalContext);
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState<any>(false);

  useLayoutEffect(() => {
    return mCtx.ins.subscribe((v) => {
      setVisible(v);
      setChecked(false);
    }, Ids.cbDyUser);
  }, []);

  if (visible) {
    return (
      <>
        <Checkbox id={Ids.cbDyUser} checked={checked} onChange={setChecked}>
          {NGLang.reSetUser}
        </Checkbox>
        <span style={{ flex: 1 }} />
      </>
    );
  }

  return null;
}

/**
 * 选择驳回原因
 * @param reasonData 驳回原因数据集
 * @param callback 确认回调
 * @constructor
 */
export function WFRollBackReason({ reasonData, callback }) {
  const mCtx = useContext(ModalContext);
  const tableRef = useApi();

  useEffect(() => {
    mCtx.ins.setApi({
      invokeOkHandler: async () => {
        const selectedData = tableRef.current.getApi().getSelectedData()[0];
        if (!selectedData) {
          await wfAlert(NGLang.alertTitle, NGLang.choseRollBackReason);
          return;
        }
        callback(selectedData.phid);
        mCtx.ins?.destroy();
      }
    });
  }, []);

  const memoInfo = useMemo(() => {
    return {
      columns: [
        { title: 'ID', dataIndex: 'phid', flex: 1 },
        { title: NGLang.rollBackReason, dataIndex: 'name', flex: 1, tooltip: true }
      ]
    };
  }, []);

  return (
    <div style={{ padding: '5px 5px 0 5px', height: 340 }}>
      <Table
        dataSource={reasonData}
        rowSelected
        ref={tableRef}
        headerHeight={32}
        rowHeight={30}
        style={{ border: '1px solid var(--border-color-split, #f0f0f0)' }}
        columns={memoInfo.columns}
      />
    </div>
  );
}
