import React, { ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from '../../baseComponent';
import { AsyncTree, HelpContext, message } from '../../functionalComponent';
import { DownOutlined, zh, useRefCallback, type IObject } from '../../util';
import { QueryPanel } from '../query-panel';
import {
  addCommonData,
  addRecentlyData,
  deleteCommonData,
  getActiveTabKey,
  getCommonList,
  getHelpInfo,
  getHelpList,
  getRecentlyList,
  getSelectedData,
  getTreeList,
  saveActiveTabKey
} from './service';

function flatTreeRow(tree) {
  return tree.reduce((arr, { children, ...c }) => [...arr, zh.parseJson(c.row), ...flatTreeRow(children || [])], []);
}

export interface IHelpExtraProps {
  /**
   * @description       通用帮助标记id
   */
  helpId: string | Function;
  /**
   * @description       数据列表的过滤条件
   */
  clientSqlFilter?: string | IObject | Function;
  /**
   * @description       业务需要，暂时不知道什么意思
   */
  infoRightUIContainerID?: string;
  /**
   * @description       底部扩展组件
   */
  footer?: React.ReactNode;
}

export function useHelp(props) {
  const {
    valueField,
    userCodeField,
    clientSqlFilter,
    infoRightUIContainerID,
    helpId,
    labelField,
    modalProps,
    footer,
    onBeforeOpen,
    ...helpProps
  } = props;

  const sqlFilter = useRefCallback(async () => {
    if (zh.isFunction(clientSqlFilter)) {
      let _helpId = helpId;
      if (zh.isFunction(_helpId)) {
        _helpId = await _helpId();
      }
      return await clientSqlFilter({ helpId: _helpId });
    }
    return clientSqlFilter;
  });

  const cacheHelpInfo = useRef({ data: null, p: null });

  helpProps.onBeforeOpen = useRefCallback(async () => {
    const [status, helpInfo] = await getHelpBeforeOpen({ helpId, onBeforeOpen, cacheHelpInfo }, props);
    if (zh.isObject(helpInfo)) {
      return { ...helpInfo, activeTabKey: await getActiveTabKey({ helpId }) };
    }
    return status;
  });
  helpProps.request = useMemo(() => {
    return async (params) => {
      const filterValue = await sqlFilter();
      return getHelpList({
        ...params,
        helpId,
        clientSqlFilter: filterValue,
        infoRightUIContainerID
      });
    };
  }, [helpId, infoRightUIContainerID, sqlFilter]);

  helpProps.selectedRequest = useRefCallback(({ codes }) => {
    return getSelectedData({ helpId, codes });
  });

  if (helpId) {
    helpProps.valueField = valueField;
    helpProps.userCodeField = userCodeField;
    helpProps.labelField = labelField;
    helpProps.getHelpInfo = () => cacheHelpInfo.current.data || {};
    // 自定义modal弹出窗需要使用的参数
    helpProps.contentParams = {
      footer,
      helpId,
      valueField,
      labelField: helpProps.labelField,
      treeListRequest: () => getTreeList({ helpId, clientSqlFilter }),
      commonRequest: async (params) => {
        const filterValue = await sqlFilter();
        return getCommonList({
          ...params,
          helpId,
          clientSqlFilter: filterValue,
          infoRightUIContainerID
        });
      },
      recentlyRequest: async (params) => {
        const filterValue = await sqlFilter();
        return getRecentlyList({
          ...params,
          helpId,
          clientSqlFilter: filterValue,
          infoRightUIContainerID
        });
      }
    };
    if (helpProps.modal === false) {
      helpProps.loadByFocus = true;
    } else {
      helpProps.modal = true;
    }
  } else {
    console.warn(`${props._id || ''} helpId is undefined`);
  }

  return [helpProps, modalProps];
}

export function useTabKey(initTabs?: () => string[]) {
  const {
    observer,
    contentParams: { helpId, activeTabKey }
  } = useContext(HelpContext);
  const [activeKey, setActiveKey] = useState(() => {
    if (zh.isFunction(initTabs)) {
      const tabs = initTabs();
      return activeTabKey && tabs.includes(activeTabKey) ? activeTabKey : tabs[0];
    }
    return activeTabKey ?? '0';
  });

  const saveTabKey = useRefCallback(() => {
    saveActiveTabKey({ helpId, activeTabKey: activeKey }).then();
  });

  useEffect(() => {
    return observer.subscribe(saveTabKey, 'beforeDestroy');
  }, []);

  return [activeKey, setActiveKey];
}

export function useCtx(multiple: boolean) {
  const {
    ok,
    contentParams: { helpId, treeListRequest, getFieldValue, showList, showTree, showRecently, querySearchList },
    locale,
    randomKey
  } = useContext(HelpContext);

  const [searchOpen, setSearchOpen] = useState(false);

  const rightTable = useRef<any>();

  const [activeKey, setActiveKey] = useTabKey(() => {
    const tabs: string[] = [];
    showList && tabs.push('listStyle');
    showTree && tabs.push('treeStyle');
    tabs.push('commonData');
    showRecently && tabs.push('recentlyUsed');
    return tabs;
  });

  const getTable = useRefCallback(() => {
    const api = zh.getCmpApi(`${helpId}_${randomKey}_${activeKey}`);
    if (activeKey === 'treeStyle') {
      api.getSelectedData = () => api.getSelectedNodes().map(({ row }) => zh.parseJson(row));
      api.getRows = () => flatTreeRow(api.getNodes());
    }
    return api;
  });

  const getResult: any = useRefCallback(() => {
    if (multiple) {
      const codeValue: any[] = [];
      const result = rightTable.current
        .getApi()
        .getRows()
        .map((r) => {
          codeValue.push(getFieldValue(r));
          return {
            value: getFieldValue(r),
            label: getFieldValue(r, 'label'),
            origin: { ...r }
          };
        });
      addRecentlyData({ helpId, codeValue: codeValue.join() });
      return result.length > 0 ? result : undefined;
    } else {
      const row = getTable().getSelectedData()[0];
      if (row) {
        addRecentlyData({ helpId, codeValue: getFieldValue(row) });
        return { value: getFieldValue(row), label: getFieldValue(row, 'label'), origin: { ...row } };
      }
      return undefined;
    }
  });

  const onSearch = useRefCallback((searchObj) => {
    if (activeKey === 'listStyle') {
      getTable()?.query(searchObj);
    } else if (activeKey === 'treeStyle') {
      getTable()?.filterTreeNode(searchObj.keyword || '');
    } else {
      getTable()?.filter(searchObj.keyword || '');
    }
  });

  const showAdvancedSearch = activeKey === 'listStyle' && querySearchList;

  const tabBarExtraContent = (
    <div style={{ float: 'right', marginRight: 20, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
      {showAdvancedSearch && (
        <a style={{ marginRight: 8 }} onClick={() => setSearchOpen(!searchOpen)}>
          {searchOpen ? '收起' : '高级'}
          <DownOutlined
            style={{
              marginLeft: '0.3em',
              transition: 'all 0.3s ease 0s',
              transform: `rotate(${searchOpen ? '180deg' : 0})`
            }}
          />
        </a>
      )}
      <Search
        style={{ width: 250 }}
        size="small"
        allowClear
        placeholder={locale.searchPlaceholder}
        onSearch={(keyword) => onSearch({ keyword })}
      />
    </div>
  );

  const getAdvancedSearch = () => {
    if (showAdvancedSearch && searchOpen) {
      return (
        <QueryPanel
          pageId={helpId}
          items={querySearchList}
          columns={3}
          showAll
          onSearch={(_, querysearch) => onSearch({ querysearch })}
        />
      );
    } else {
      return null;
    }
  };

  const convertNode = useRefCallback((node) => {
    return {
      title: node.text,
      key: node.id,
      ...node
    };
  });

  const renderTreeList = useRefCallback(() => {
    return (
      <div
        style={{
          height: '100%',
          border: '1px solid var(--border-color-split, #f0f0f0)',
          borderTop: 0,
          padding: '5px 0'
        }}
      >
        <AsyncTree
          id={`${helpId}_${randomKey}_treeStyle`}
          checkable={multiple}
          onDoubleClick={() => {
            !multiple && ok(getResult());
          }}
          showFilter={false}
          request={treeListRequest}
          convertNode={convertNode}
        />
      </div>
    );
  });

  const changeCommonData = useRefCallback(async () => {
    const selectedData = getTable().getSelectedData();
    if (!selectedData.length) {
      message.warning(locale.noSelected);
      return;
    }
    const action = activeKey === 'commonData' ? deleteCommonData : addCommonData;
    const success: boolean = await action({
      helpId,
      codeValue: selectedData.map((d) => getFieldValue(d)).join()
    });
    if (success) {
      zh.getCmpApi(`${helpId}_${randomKey}_commonData`)?.refreshData();
      message.success(activeKey === 'commonData' ? locale.removeCommonSuccess : locale.addCommonSuccess);
    }
  });

  return {
    activeKey,
    setActiveKey,
    tabBarExtraContent,
    advancedSearch: getAdvancedSearch(),
    rightTable,
    getTable,
    renderTreeList,
    changeCommonData,
    getResult
  };
}

export function useTabItems({ renderTable }) {
  const {
    request,
    contentParams: { helpId, commonRequest, recentlyRequest, showTree, showList, showRecently },
    locale
  } = useContext<any>(HelpContext);

  return useMemo(() => {
    const tabTitle = (title) => <span style={{ padding: '0 8px' }}>{title}</span>;
    const innerItems: Array<{ key: string; label: ReactNode; children: ReactNode }> = [];
    showList &&
      innerItems.push({
        key: 'listStyle',
        label: tabTitle(locale.List),
        children: renderTable('listStyle', request)
      });
    showTree &&
      innerItems.push({
        key: 'treeStyle',
        label: tabTitle(locale.Tree),
        children: renderTable('treeStyle')
      });
    innerItems.push({
      key: 'commonData',
      label: tabTitle(locale.CommonUse),
      children: renderTable('commonData', commonRequest)
    });
    showRecently &&
      innerItems.push({
        key: 'recentlyUsed',
        label: tabTitle(locale.RecentlyUsed),
        children: renderTable('recentlyUsed', recentlyRequest)
      });
    return innerItems;
  }, [helpId]);
}

export async function getHelpBeforeOpen({ helpId = '', onBeforeOpen, cacheHelpInfo }, props: any = {}) {
  if (onBeforeOpen) {
    const canOpen = await onBeforeOpen();
    if (canOpen === false) {
      return [false];
    }
  }
  if (cacheHelpInfo.current.data) {
    return [true, cacheHelpInfo.current.data];
  }
  if (!cacheHelpInfo.current.p) {
    cacheHelpInfo.current.p = getHelpInfo({ helpId });
  }
  const helpInfo = await cacheHelpInfo.current.p;
  if (helpInfo === false) {
    return [false];
  }

  if (props.valueField) {
    helpInfo.valueField = props.valueField;
  }
  if (props.labelField) {
    helpInfo.labelField = props.labelField;
  }
  if (props.userCodeField) {
    helpInfo.userCodeField = props.userCodeField;
  }

  cacheHelpInfo.current.data = helpInfo;
  cacheHelpInfo.current.p = null;
  return [true, helpInfo];
}
