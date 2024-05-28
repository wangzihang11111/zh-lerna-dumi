import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Search } from '../../baseComponent';
import { BaseHelp, Button, message, ModalContext, Table, Tabs } from '../../functionalComponent';
import { IObject, Layout, zh, useRefCallback, useRefState, useZhEffect } from '../../util';
import { NGLang, wfAlert } from './util';
import { WFOrgtree } from './WFOrgtree';

const TabKeys = ['', 'first', 'second', 'third', 'four', 'five'];
const tableProps = {
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
const defaultPagination: any = { pageSize: 15, height: 32, showQuickJumper: false, align: 'left' };

interface IProps {
  radioItems: Array<Number>; // 1、待办人员、2、常用人员、3、本单元、4、本板块、5、其它人员
  loginInfo?: IObject; //当前登入信息
  otherInfo?: IObject; //指派维度中包含其它人员则需传递该数据
  todoData?: Array<IObject>; //指派维度包含待办人员则还需传入可选待办人员数据
  selectedData?: Array<IObject>; // 默认已选数据
  isMulti?: boolean; //true表示允许多选
  callBack?: (data: Array<IObject>) => void; // 成功回调
  cancelBack?: Function; // 失败回调
}

const tabTitle = (title) => <span style={{ padding: '0 6px' }}>{title}</span>;

/**
 * 单个节点人员指派
 * @param props
 * @constructor
 */
export function WFDynamicNodeUserWin(props: IProps) {
  const {
    radioItems = [1, 3, 4, 5], //暂时隐藏常用人员
    loginInfo = {},
    selectedData = [],
    otherInfo = { type: 'all', orgList: [] },
    isMulti = true,
    cancelBack,
    callBack
  } = props;

  const [searchValue, setSearchValue] = useState('');
  const mCtx = useContext(ModalContext);
  const resultColumns = useMemo(() => {
    return [
      {
        ...columnProps,
        header: NGLang.userNo,
        flex: 1,
        dataIndex: 'userNo'
      },
      {
        ...columnProps,
        header: NGLang.userName,
        flex: 1,
        dataIndex: 'userName'
      }
    ];
  }, []);
  const tabs: any = useMemo(() => {
    const tabItems: any = [];
    radioItems.includes(1) && tabItems.push({ key: TabKeys[1], title: '待选人员' });
    // radioItems.includes(2) && tabItems.push({ key: TabKeys[2], title: '常用人员' });
    radioItems.includes(3) &&
      tabItems.push({
        key: TabKeys[3],
        title: '本单元',
        idList: loginInfo.cuid,
        type: 'cu'
      });
    radioItems.includes(4) &&
      loginInfo.bqid &&
      tabItems.push({
        key: TabKeys[4],
        title: '本板块',
        type: 'bu',
        idList: loginInfo.bqid
      });
    radioItems.includes(5) &&
      tabItems.push({
        key: TabKeys[5],
        title: '其他人员',
        type: otherInfo.type,
        idList: otherInfo.orgList.join()
      });
    return tabItems;
  }, []);
  const [activeTab, setActiveTab] = useState({ key: tabs[0].key, type: tabs[0].type, idList: tabs[0].idList });
  const setActiveKey = useRefCallback((activeKey) => {
    const { key, type, idList } = tabs.find((tab) => tab.key === activeKey);
    setActiveTab({ key, type, idList });
    mCtx.ins.notify(activeKey, 'activeKey');
  });
  const getActiveTable = useRefCallback(() => {
    return zh.getCmp(`${activeTab.key}WfTable`).getApi();
  });
  const getResultTable = useRefCallback(() => {
    return zh.getCmp(`resultWfTable`).getApi();
  });
  const toResult = useRefCallback((data) => {
    if (!isMulti) {
      return;
    }
    const resultTable = getResultTable();
    const selected: any = [];
    const resultKeys = resultTable.getRows().map((r) => r.id);
    data.forEach((sd) => {
      if (!resultKeys.includes(sd.id)) {
        selected.push(resultTable.copyRow(sd));
      }
    });
    resultTable.addRows(selected).then();
  });
  const toRemove = useRefCallback((indexes?) => {
    if (indexes === undefined) {
      getResultTable().setDataSource([]);
    } else {
      getResultTable().deleteRows(indexes);
    }
  });
  const invokeOkHandler = useRefCallback(async () => {
    if (!callBack) {
      await wfAlert(NGLang.alertTitle, NGLang.noCallBack);
      return;
    }
    const data = isMulti ? getResultTable().getRows() : getActiveTable().getSelectedData();
    console.log(data, '选人框返回', isMulti);

    if (data.length === 0) {
      await wfAlert(NGLang.alertTitle, NGLang.hasNoSelectData);
      return;
    }
    await callBack(isMulti ? data : data[0]);
    mCtx.ins?.destroy();
  });
  const invokeCancelHandler = useRefCallback(async () => {
    await cancelBack?.();
    mCtx.ins?.destroy();
  });
  const getTabContent = useRefCallback((tabKey) => {
    switch (tabKey) {
      case 'first':
        return (
          <FirstTable
            tabKey="first"
            activeKey={activeTab.key}
            parentProps={props}
            searchValue={searchValue}
            toResult={toResult}
          />
        );
      case 'second':
        return (
          <SecondTable
            tabKey="second"
            activeKey={activeTab.key}
            parentProps={props}
            searchValue={searchValue}
            toResult={toResult}
          />
        );
      case 'third':
        return (
          <ThirdTable
            tabKey="third"
            activeKey={activeTab.key}
            parentProps={props}
            searchValue={searchValue}
            toResult={toResult}
          />
        );
      default:
        return <div>No Content</div>;
    }
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
      invokeOkHandler,
      invokeCancelHandler,
      getActiveTable
    });
  }, [activeTab]);

  useEffect(() => {
    if (isMulti && selectedData?.length) {
      getResultTable().addRows(selectedData).then();
    }
  }, []);

  return (
    <Layout direction="row" style={{ height: 400, padding: '0 5px' }}>
      <Layout.Flex>
        <Tabs
          className="fit-height ng-compact-tab"
          size="small"
          tabBarGutter={5}
          activeKey={activeTab.key}
          onChange={setActiveKey}
          tabBarExtraContent={
            <Search allowClear placeholder={NGLang.seachEmptyText} size="small" onSearch={setSearchValue} />
          }
        >
          {tabs.map((tab) => (
            <Tabs.Option tab={tabTitle(tab.title)} key={tab.key} children={getTabContent(tab.key)} />
          ))}
        </Tabs>
      </Layout.Flex>
      {isMulti && (
        <BaseHelp.MultipleButtons
          getActiveTable={getActiveTable}
          getResultTable={getResultTable}
          addResult={toResult}
          removeResult={toRemove}
        />
      )}
      {isMulti && (
        <div style={{ width: 220, paddingTop: 7 }}>
          <Table
            {...tableProps}
            checkbox
            style={{ ...tableProps.style, marginTop: 0 }}
            columns={resultColumns}
            id="resultWfTable"
            onRow={onRow}
          />
        </div>
      )}
    </Layout>
  );
}

/**
 * 底部扩展按钮
 * @param radioItems  1、待办人员、2、常用人员、3、本单元、4、本板块、5、其它人员
 * @constructor
 */
export function WFDynamicNodeUserWinFooter({ radioItems }) {
  const mCtx = useContext(ModalContext);
  const [loading, setLoading] = useRefState(false);
  const [tabKey, setTabKey] = useRefState(TabKeys[radioItems[0]]);

  const btnClick = async () => {
    const insApi = mCtx.ins.getApi();
    const selectedData = insApi.getActiveTable().getSelectedData();
    if (selectedData.length > 0) {
      setLoading(true);
      if (tabKey === TabKeys[2]) {
        // 删除常用
        const result = await zh.request.body({
          url: `SUP/RichHelp/DeleteCommonUseData`,
          data: { helpid: 'fg3_user_work', codeValue: selectedData.map((d) => d.userId).join() }
        });
        if (result.code === 0) {
          insApi.getActiveTable().refreshData();
          message.success(NGLang.removeCommonSuccess);
        } else if (result.message) {
          message.error(result.message);
        }
      } else {
        // 添加常用
        const result = await zh.request.body({
          url: `SUP/RichHelp/SaveCommonUseData`,
          data: { helpid: 'fg3_user_work', codeValue: selectedData.map((d) => d.userId).join() }
        });
        if (result.code === 0) {
          zh.getCmp(`${TabKeys[2]}WfTable`)?.getApi()?.refreshData?.();
          message.success(NGLang.addCommonSuccess);
        } else if (result.message) {
          message.error(result.message);
        }
      }
      setLoading(false);
    } else {
      message.info(NGLang.select);
    }
  };

  useEffect(() => {
    if (radioItems.includes(2)) {
      return mCtx.ins.subscribe((activeKey) => {
        setTabKey(activeKey);
      }, 'activeKey');
    }
  }, [radioItems]);

  if (!radioItems.includes(2)) {
    return null;
  }
  return (
    <div style={{ flex: 1 }}>
      <Button size="small" loading={loading} style={{ marginLeft: 5 }} onClick={btnClick}>
        {tabKey !== TabKeys[2] ? NGLang.AddCommonUse : NGLang.DelCommonUse}
      </Button>
    </div>
  );
}

interface ITabContent {
  tabKey: string;
  parentProps: IObject;
  searchValue?: string;
  toResult?: Function;
  activeKey: string;
}

/**
 * 待选人员
 * @param tabKey 当前所属tab页
 * @param parentProps 父容器属性
 * @param searchValue 查询条件
 * @param toResult 多选，复制数据到已选区域
 * @param activeKey 当前激活的tab页
 * @constructor
 */
const FirstTable = React.memo<ITabContent>(
  ({ tabKey, parentProps, searchValue, toResult }) => {
    const mCtx = useContext(ModalContext);
    const { isMulti = true, todoData = [] } = parentProps;
    const columns = useMemo(() => {
      return [
        {
          ...columnProps,
          header: NGLang.userNo,
          flex: 2,
          dataIndex: 'id'
        },
        {
          ...columnProps,
          header: NGLang.userName,
          flex: 2,
          dataIndex: 'userName'
        },
        {
          ...columnProps,
          header: NGLang.userDept,
          flex: 3,
          dataIndex: 'deptName'
        },
        {
          ...columnProps,
          header: NGLang.userOrg,
          flex: 3,
          dataIndex: 'orgName'
        }
      ];
    }, []);
    const dataSource = useMemo(() => {
      return searchValue
        ? todoData.filter(
            (row) =>
              row.userName?.indexOf(searchValue) > -1 ||
              row.userNo?.indexOf(searchValue) > -1 ||
              row.orgName?.indexOf(searchValue) > -1 ||
              row.deptName?.indexOf(searchValue) > -1
          )
        : todoData;
    }, [searchValue]);
    const onRow = useRefCallback((rowIndex, table) => {
      return {
        onDoubleClick() {
          if (isMulti) {
            toResult?.([table.getRow(rowIndex)]);
          } else {
            mCtx.ins.getApi().invokeOkHandler().then();
          }
        }
      };
    });
    return (
      <Table
        id={`${tabKey}WfTable`}
        {...tableProps}
        checkbox={isMulti}
        onRow={onRow}
        columns={columns}
        dataSource={dataSource}
      />
    );
  },
  (p, n) => {
    return n.tabKey !== n.activeKey || zh.isPropsEqual(p, n);
  }
);

/**
 * 常用人员
 * @constructor
 */
const SecondTable = React.memo<ITabContent>(
  ({ tabKey, parentProps, searchValue, toResult }) => {
    const mCtx = useContext(ModalContext);
    const { isMulti = true } = parentProps;
    const columns = useMemo(() => {
      return [
        {
          ...columnProps,
          header: NGLang.userNo,
          flex: 2,
          dataIndex: 'userNo'
        },
        {
          ...columnProps,
          header: NGLang.userName,
          flex: 2,
          dataIndex: 'userName'
        },
        {
          ...columnProps,
          header: NGLang.userDept,
          flex: 3,
          dataIndex: 'deptName'
        },
        {
          ...columnProps,
          header: NGLang.userOrg,
          flex: 3,
          dataIndex: 'orgName'
        }
      ];
    }, []);
    const defaultResponse = useRefCallback((res: any) => ({
      total: res.totalRows,
      record: res.Record.map((data) => {
        console.log(data, 'data');
        return {
          userId: data.value,
          userNo: data.value,
          userName: data.label,
          deptName: data.deptname,
          orgName: data.orgname
        };
      })
    }));
    const requestList = useMemo(() => {
      return async ({ pageIndex, pageSize }) => {
        return await zh.request.body({
          url: 'SUP/RichHelp/GetCommonUseList?helpid=fg3_user_work&ORMMode=false',
          data: {
            page: pageIndex - 1,
            usePY: true,
            query: searchValue,
            start: (pageIndex - 1) * pageSize,
            limit: pageSize
          }
        });
      };
    }, [searchValue]);
    const onRow = useRefCallback((rowIndex, table) => {
      return {
        onDoubleClick() {
          if (isMulti) {
            toResult?.([table.getRow(rowIndex)]);
          } else {
            mCtx.ins.getApi().invokeOkHandler().then();
          }
        }
      };
    });

    return (
      <Table
        id={`${tabKey}WfTable`}
        {...tableProps}
        checkbox={isMulti}
        onRow={onRow}
        request={requestList}
        response={defaultResponse}
        pagination={defaultPagination}
        columns={columns}
      />
    );
  },
  (p, n) => {
    return n.tabKey !== n.activeKey || zh.isPropsEqual(p, n);
  }
);

/**
 * 本单元
 * @constructor
 */
const ThirdTable = React.memo<ITabContent>(
  ({ tabKey, parentProps, searchValue, toResult }) => {
    const mCtx = useContext(ModalContext);
    const { isMulti = true } = parentProps;
    const columns = useMemo(() => {
      return [
        {
          ...columnProps,
          header: NGLang.userNo,
          flex: 1,
          dataIndex: 'userNo'
        },
        {
          ...columnProps,
          header: NGLang.userName,
          flex: 1,
          dataIndex: 'userName'
        }
      ];
    }, []);
    const defaultResponse = useRefCallback((res: any) => {
      if (res.code === 0) {
        return {
          total: res.data.total || 0,
          record:
            res.data.list?.map((data) => {
              return { ...data, userNo: data.userNo };
            }) || []
        };
      } else {
        return {
          total: 0,
          record: []
        };
      }
    });
    const requestList = useRefCallback(async ({ pageIndex, pageSize, belongOrg }) => {
      return await zh.request.body({
        url: '/basedata/user/queryUserList',
        data: { pageNum: pageIndex, pageSize, belongOrg, query: searchValue }
      });
    });
    useZhEffect(
      () => {
        zh.getCmpApi(`${tabKey}WfTable`).query();
      },
      [searchValue],
      false
    );

    const onRow = useRefCallback((rowIndex, table) => {
      return {
        onDoubleClick() {
          if (isMulti) {
            toResult?.([table.getRow(rowIndex)]);
          } else {
            mCtx.ins.getApi().invokeOkHandler().then();
          }
        }
      };
    });
    const onTreeDataLoad = useRefCallback((nodes) => {
      nodes.push({
        value: 'nodeptid',
        title: NGLang.noDeptData,
        isLeaf: true,
        id: 0,
        key: 'nodeptid',
        OCode: 'nodeptid'
      });
      return nodes;
    });
    const onTreeSelectCallback = useRefCallback((keys, nodes) => {
      zh.getCmpApi(`${tabKey}WfTable`).setExtraParam({
        belongOrg: nodes[0].id
      });
    });
    const params = useMemo(() => {
      return { orgattr: '18', isRight: false };
    }, []);

    return (
      <Layout direction="row" style={{ height: '100%' }}>
        <Layout.Slider
          style={{ width: 180, marginRight: 5, border: '1px solid var(--border-color-split, #f0f0f0)', borderTop: 0 }}
        >
          <WFOrgtree
            params={params}
            defaultSelectedFirstNode
            onSelectedChange={onTreeSelectCallback}
            dataLoad={onTreeDataLoad}
          />
        </Layout.Slider>
        <Layout.Flex>
          <Table
            id={`${tabKey}WfTable`}
            {...tableProps}
            autoLoad={false}
            checkbox={isMulti}
            onRow={onRow}
            request={requestList}
            response={defaultResponse}
            pagination={defaultPagination}
            columns={columns}
          />
        </Layout.Flex>
      </Layout>
    );
  },
  (p, n) => {
    return n.tabKey !== n.activeKey || zh.isPropsEqual(p, n);
  }
);
