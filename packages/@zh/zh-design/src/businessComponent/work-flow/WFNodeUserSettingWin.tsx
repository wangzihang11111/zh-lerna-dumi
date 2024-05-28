import { FileSearchOutlined } from '@ant-design/icons';
import { useContext, useEffect, useMemo } from 'react';
import { ModalContext, Table } from '../../functionalComponent';
import { IObject, Layout, useApi, useRefCallback } from '../../util';
import { getUseDynamicType, NGLang, wfAlert, wfModal } from './util';
import { WFDynamicNodeUserWin, WFDynamicNodeUserWinFooter } from './WFDynamicNodeUserWin';

const columnProps = {
  sortable: false,
  resizable: false,
  columnSort: false
};

interface IProps {
  nodeData: Array<IObject>; // 节点
  loginOrgInfo: any;
  callBack?: (data: IObject) => void; // 成功回调
  cancelBack?: Function; // 失败回调
}

/**
 * 通过节点列表指派人员
 * @nodeData 节点列表
 * @constructor
 */
export function WFNodeUserSettingWin(props: IProps) {
  const { nodeData, loginOrgInfo = {}, callBack, cancelBack } = props;
  const mCtx = useContext(ModalContext);
  const tableRef = useApi();
  const openWFDynamicNodeUserWin = useRefCallback(async (_nodeData) => {
    const radioItems = getUseDynamicType(_nodeData.users.length > 0, _nodeData.assignAnyUsers);

    const WFDynamicNodeUserWin_callBack = (data) => {
      _nodeData.selectedData = data;
      _nodeData.dispVal = data.map((d) => d.userName).join();
      _nodeData.users = data;
      tableRef.current.getApi().refreshView();
    };
    await wfModal({
      title: `${_nodeData.name}${NGLang.taskHisNode}--${NGLang.dynamicUsers}`,
      width: 900,
      footerLeft: <WFDynamicNodeUserWinFooter radioItems={radioItems} />,
      content: (
        <WFDynamicNodeUserWin
          radioItems={radioItems}
          selectedData={_nodeData.selectedData}
          loginInfo={loginOrgInfo}
          todoData={_nodeData.users}
          callBack={WFDynamicNodeUserWin_callBack}
        />
      )
    });
  });
  const columns = useMemo(() => {
    const userStyle = { display: 'flex', width: '100%', height: '100%', alignItems: 'center', cursor: 'pointer' };
    return [
      {
        ...columnProps,
        flex: 1,
        header: NGLang.nodeId,
        dataIndex: 'id'
      },
      {
        ...columnProps,
        flex: 1,
        header: NGLang.nodeName,
        dataIndex: 'name'
      },
      {
        ...columnProps,
        flex: 3,
        header: NGLang.user,
        dataIndex: 'users',
        render: ({ value, rowIndex, table }) => {
          const row = table.getRow(rowIndex);
          return (
            <div onClick={() => openWFDynamicNodeUserWin(row)} style={userStyle}>
              <div className="nowrap" style={{ flex: 1 }}>
                {row.users.map((i) => i.userName).join(',')}
              </div>
              <FileSearchOutlined style={{ color: 'rgba(0, 0, 0, 0.25)' }} />
            </div>
          );
        }
      }
    ];
  }, []);

  const invokeOkHandler = useRefCallback(async () => {
    if (!callBack) {
      await wfAlert(NGLang.alertTitle, NGLang.noCallBack);
      return;
    }
    const allRows = tableRef.current.getApi().getRows();
    const result = new Array();
    let isValid = true;
    for (let i = 0, len = allRows.length; i < len; i++) {
      if (allRows[i].selectedData?.length) {
        result.push({ nodeId: allRows[i].id, userIds: allRows[i].selectedData.map((d) => d.id) });
      } else {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      callBack(result);
      mCtx.ins?.destroy();
      return;
    }
    await wfAlert(NGLang.alertTitle, NGLang.notAllNodeSetUser);
  });
  const invokeCancelHandler = useRefCallback(async () => {
    await cancelBack?.();
    mCtx.ins?.destroy();
  });

  useEffect(() => {
    mCtx.ins.setApi({
      invokeOkHandler,
      invokeCancelHandler
    });
  }, []);

  return (
    <Layout style={{ height: 300, padding: 5 }}>
      <Layout.Flex>
        <Table bordered headerHeight={32} rowHeight={30} ref={tableRef} columns={columns} dataSource={nodeData} />
      </Layout.Flex>
    </Layout>
  );
}
