import React, { useContext, useEffect, useMemo, useState } from 'react';
import { InputTrigger, Search } from '../../baseComponent';
import { BaseHelp, ModalContext, Table, Tabs, Tooltip } from '../../functionalComponent';
import { compHoc, Layout, zh, useRefCallback, useZhEffect, type IObject } from '../../util';
import { NGLang, wfAlert, wfModal } from './util';

const defaultPagination: any = { showQuickJumper: false, align: 'left' };
const tableProps = {
  checkbox: true,
  rowSelected: true,
  headerHeight: 32,
  rowHeight: 30,
  style: { border: '1px solid var(--border-color-split, #f0f0f0)', borderTop: 0 }
};
const columnProps = {
  sortable: false,
  resizable: false,
  columnSort: false,
  tooltip: true
};

/**
 * 通知消息人员选择
 */
export const WFNoticeUserSelect = compHoc(({ outRef }) => {
  const [data, setData] = useState<any[]>([]);

  const openUserSelectWin = useRefCallback(async () => {
    await wfModal({
      title: NGLang.userSelectWinTitle,
      width: 760,
      content: <UserSelectWin lastSelectData={data} callBack={setData} />,
      footerLeft: <div id="paginationContainer" style={{ flex: 1, width: 0, marginRight: 80 }} />
    });
  });

  useEffect(() => {
    outRef.current.getValue = () => data;
  }, [data]);

  const showText = useMemo(() => {
    return data.map((d) => d.userName).join();
  }, [data]);

  return (
    <Tooltip title={showText} mouseEnterDelay={0.5}>
      <InputTrigger ref={outRef} value={showText} editable={false} onTrigger={openUserSelectWin} />
    </Tooltip>
  );
});

const tabTitle = (title) => <span style={{ padding: '0 6px' }}>{title}</span>;

function UserSelectWin({ lastSelectData, callBack }) {
  const mCtx = useContext(ModalContext);
  const [searchValue, setSearchValue] = useState('');
  const [activeKey, setActiveKey] = useState('1');
  const columns = useMemo(() => {
    return [
      {
        ...columnProps,
        header: NGLang.userNo,
        dataIndex: 'userNo'
      },
      {
        ...columnProps,
        header: NGLang.userName,
        dataIndex: 'userName'
      }
    ];
  }, []);
  const getActiveTable = useRefCallback(() => {
    return zh.getCmp(`WfTable_${activeKey}`).getApi();
  });
  const getResultTable = useRefCallback(() => {
    return zh.getCmp(`resultWfTable`).getApi();
  });
  const toResult = useRefCallback((selectedData) => {
    const resultTable = getResultTable();
    const selected: any = [];
    const resultKeys = resultTable.getRows().map((r) => r.userId);
    selectedData.forEach((sd) => {
      if (!resultKeys.includes(sd.userId)) {
        selected.push(resultTable.copyRow(sd));
      }
    });
    resultTable.addRows(selected);
  });
  const toRemove = useRefCallback((indexes?) => {
    if (indexes === undefined) {
      getResultTable().setDataSource([]);
    } else {
      getResultTable().deleteRows(indexes);
    }
  });

  const getTabContent = useRefCallback((tabKey) => {
    if (tabKey === '1') {
      return <OrgUserTable activeKey={activeKey} columns={columns} searchValue={searchValue} toResult={toResult} />;
    }
    return <FlowUserTable activeKey={activeKey} columns={columns} searchValue={searchValue} toResult={toResult} />;
  });
  const onRow = useRefCallback((rowIndex) => {
    return {
      onDoubleClick() {
        toRemove(rowIndex);
      }
    };
  });

  useEffect(() => {
    mCtx.ins.setApi({
      invokeOkHandler: async () => {
        const selectedData = getResultTable().getRows();
        if (selectedData.length === 0) {
          await wfAlert(NGLang.alertTitle, NGLang.hasNoSelectData);
          return;
        }
        callBack?.(selectedData);
        mCtx.ins?.destroy();
      }
    });
  }, []);

  const tabs = [
    { value: '1', label: NGLang.allUsers },
    { value: '2', label: NGLang.flowUser }
  ];
  return (
    <Layout direction="row" style={{ height: 440, padding: '0 5px' }}>
      <Layout.Flex>
        <Tabs
          className="fit-height ng-compact-tab"
          size="small"
          tabBarGutter={5}
          activeKey={activeKey}
          onChange={setActiveKey}
          tabBarExtraContent={
            <Search allowClear placeholder={NGLang.seachEmptyText} size="small" onSearch={setSearchValue} />
          }
        >
          {tabs.map((tab) => (
            <Tabs.Option tab={tabTitle(tab.label)} key={tab.value} children={getTabContent(tab.value)} />
          ))}
        </Tabs>
      </Layout.Flex>
      <BaseHelp.MultipleButtons
        addResult={toResult}
        removeResult={toRemove}
        getResultTable={getResultTable}
        getActiveTable={getActiveTable}
      />
      <div style={{ width: 200, paddingTop: 7 }}>
        <Table
          {...tableProps}
          style={{ ...tableProps.style, marginTop: 0 }}
          columns={columns}
          id="resultWfTable"
          dataSource={lastSelectData}
          onRow={onRow}
        />
      </div>
    </Layout>
  );
}

/**
 * 组织用户
 */
const OrgUserTable = React.memo<IObject>(
  ({ activeKey, columns, searchValue, toResult }) => {
    const onRow = useRefCallback((rowIndex, table) => {
      return {
        onDoubleClick() {
          toResult?.([table.getRow(rowIndex)]);
        }
      };
    });

    const params = useMemo(() => {
      return { orgattr: '18', isRight: false };
    }, []);

    const defaultResponse = useRefCallback((res: any) => ({
      total: res.totalRows,
      record: res.Record
    }));

    const requestList = useRefCallback(async ({ pageIndex, pageSize, orgTreeSelectValue }) => {
      return await zh.request.get({
        url: 'WorkFlow3/WorkFlow/GetUserList',
        data: {
          page: pageIndex - 1,
          deptid: orgTreeSelectValue,
          seachtext: searchValue,
          start: (pageIndex - 1) * pageSize,
          limit: pageSize
        }
      });
    });

    useZhEffect(
      () => {
        zh.getCmpApi(`WfTable_${activeKey}`).query();
      },
      [searchValue],
      false
    );

    const onSelectCallback = useRefCallback((keys, nodes) => {
      zh.getCmpApi(`WfTable_${activeKey}`).setExtraParam({
        orgTreeSelectValue: nodes[0].id
      });
    });

    const onDataLoad = useRefCallback((nodes) => {
      nodes.push({
        value: 'nodeptid',
        title: NGLang.noDeptData,
        isLeaf: true,
        id: 'nodeptid',
        key: 'nodeptid',
        OCode: 'nodeptid'
      });
      return nodes;
    });

    return (
      <Layout direction="row" style={{ height: '100%' }}>
        <div
          style={{ width: 180, marginRight: 5, border: '1px solid var(--border-color-split, #f0f0f0)', borderTop: 0 }}
        >
          {/* <OrgTree
            params={params}
            defaultSelectedFirstNode
            onSelectedChange={onSelectCallback}
            dataLoad={onDataLoad}
          /> */}
        </div>
        <Layout.Flex>
          <Table
            id={`WfTable_${activeKey}`}
            {...tableProps}
            autoLoad={false}
            response={defaultResponse}
            pagination={{ ...defaultPagination, targetContainer: 'paginationContainer' }}
            onRow={onRow}
            columns={columns}
            request={requestList}
          />
        </Layout.Flex>
      </Layout>
    );
  },
  (p, n) => {
    return n.activeKey !== '1' || zh.isPropsEqual(p, n);
  }
);

/**
 * 流程人员
 */
const FlowUserTable = React.memo<IObject>(
  ({ activeKey, columns, searchValue, toResult }) => {
    const dataSource = useMemo(() => {
      const flowUsers = [
        {
          userId: 'WF$initiator',
          userNo: 'WF$initiator',
          userName: NGLang.flowStartUser
        },
        {
          userId: 'WF$nextappman',
          userNo: 'WF$nextappman',
          userName: NGLang.nextAppName
        },
        {
          userId: 'WF$allappman',
          userNo: 'WF$allappman',
          userName: NGLang.allFlowUser
        }
      ];
      return searchValue
        ? flowUsers.filter((row) => row.userName?.indexOf(searchValue) > -1 || row.userNo?.indexOf(searchValue) > -1)
        : flowUsers;
    }, [searchValue]);
    const onRow = useRefCallback((rowIndex, table) => {
      return {
        onDoubleClick() {
          toResult?.([table.getRow(rowIndex)]);
        }
      };
    });

    return (
      <Table id={`WfTable_${activeKey}`} {...tableProps} onRow={onRow} columns={columns} dataSource={dataSource} />
    );
  },
  (p, n) => {
    return n.activeKey !== '2' || zh.isPropsEqual(p, n);
  }
);
