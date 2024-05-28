import React, { useContext, useMemo, useRef, useState } from 'react';
import { Search } from '../../baseComponent';
import { BaseHelp, HelpContext, Table, Tabs, type BaseHelpProps } from '../../functionalComponent';
import { compHoc, getGlobalConfig, Layout, zh, useRefCallback, type IObject } from '../../util';
import { OrgTree as Tree, type OrgTreeType } from '../org-tree';
import { getHelpBeforeOpen } from './common';

/**
 * 组织树
 * @param props
 * @constructor
 */
function OrgTree(props) {
  const params = useMemo(() => {
    return { containDept: false, dataAccessAuth: true, ...props.params };
  }, [props.params]);
  return <Tree defaultSelectedFirstNode {...props} params={params} />;
}

const { Option } = Tabs;
const { Header, Footer, MultipleButtons } = BaseHelp;

const tableProps: any = {
  rowSelected: false,
  rowChecked: true,
  cache: false,
  headerMenu: false,
  style: { borderStyle: 'solid', borderColor: 'var(--border-color-split, #f0f0f0)', borderWidth: 1 }
};

function HelpContent() {
  const {
    request,
    ok,
    contentParams: { getFieldValue, columns, helpTitle, helpId, selectedArray, multiple, footer, treeProps },
    locale,
    randomKey
  } = useContext<any>(HelpContext);
  const btnRef = useRef<any>();
  const [activeKey, setActiveKey] = useState('0');
  const rightTable = useRef<any>();
  const getTable = () => zh.compIns[`${helpId}_${randomKey}_${activeKey}`].getApi();

  const getResult: any = () => {
    if (multiple) {
      const result = rightTable.current
        .getApi()
        .getRows()
        .map((r) => ({
          value: getFieldValue(r),
          label: getFieldValue(r, 'label'),
          origin: { ...r }
        }));
      return result.length > 0 ? result : undefined;
    } else {
      const value = getTable().getSelectedData()[0];
      if (value) {
        return { value: getFieldValue(value), label: getFieldValue(value, 'label'), origin: { ...value } };
      }
      return undefined;
    }
  };
  const toRight = (values: any) => {
    if (multiple) {
      btnRef.current.toRight(values);
    } else {
      ok(getResult());
    }
  };

  const onSearch = (value: string) => {
    if (activeKey === '0') {
      getTable().query({ keyword: value });
    } else {
      getTable().filter(value);
    }
  };

  const onSelectCallback = useRefCallback((keys, nodes) => {
    getTable().setExtraParam({ treeNodes: nodes });
  });

  const tabTitle = (t) => <span style={{ padding: '0 8px' }}>{t}</span>;
  const tabBarExtraContent = (
    <Search size="small" allowClear placeholder={locale.searchPlaceholder} onSearch={onSearch} />
  );

  tableProps.checkbox = multiple ? 'checked' : false;
  tableProps.rowSelected = !multiple;
  tableProps.rowChecked = multiple;

  const renderTable = (index) => {
    return (
      <Table
        {...tableProps}
        style={{ ...tableProps.style, borderTopWidth: 0 }}
        id={`${helpId}_${randomKey}_${index}`}
        columns={columns}
        pagination={{
          height: 32,
          showQuickJumper: false,
          align: 'left',
          targetContainer: multiple && index === 0 ? `${helpId}_${randomKey}_pagination` : ''
        }}
        onRow={(rowIndex, table) => ({
          onDoubleClick: () => toRight([table.getRow(rowIndex)])
        })}
        autoLoad={false}
        request={request}
        response={(res) => ({ total: res.total ?? 0, record: res.list || [] })}
      />
    );
  };

  const borderStyle = activeKey === '0' ? '1px solid var(--border-color-split, #f0f0f0)' : '1px solid transparent';

  return (
    <Layout>
      <Header title={helpTitle || '用户帮助'} />
      <Layout.Flex direction="row" style={{ padding: '0 5px', borderBottom: multiple ? borderStyle : 0 }}>
        <Layout.Flex flex={2}>
          <Tabs className="fit-height" size="small" onChange={setActiveKey} tabBarExtraContent={tabBarExtraContent}>
            <Option tab={tabTitle(locale.List)} key="0">
              <Layout direction="row" style={{ height: '100%' }}>
                <div style={{ width: 200, borderLeft: borderStyle, borderBottom: multiple ? 0 : borderStyle }}>
                  <OrgTree {...treeProps} onSelectedChange={onSelectCallback} />
                </div>
                <Layout.Flex style={{ paddingBottom: multiple ? 32 : 0 }}>{renderTable(0)}</Layout.Flex>
              </Layout>
            </Option>
          </Tabs>
        </Layout.Flex>
        {multiple && (
          <MultipleButtons
            getRowKey={getFieldValue}
            outRef={btnRef}
            getActiveTable={getTable}
            getResultTable={() => rightTable.current.getApi()}
          />
        )}
        {multiple && (
          <Layout.Flex style={{ paddingTop: 7, paddingBottom: activeKey === '0' ? 32 : 0 }}>
            <Table
              {...tableProps}
              columns={columns}
              dataSource={selectedArray}
              ref={rightTable}
              onRow={(rowIndex) => ({
                onDoubleClick: () => btnRef.current.toLeft(rowIndex)
              })}
            />
            <div
              id={`${helpId}_${randomKey}_pagination`}
              style={{
                position: 'absolute',
                left: activeKey === '1' ? 14 : 205,
                right: 15,
                borderLeft: borderStyle,
                paddingLeft: 10
              }}
            />
          </Layout.Flex>
        )}
      </Layout.Flex>
      <Footer getResult={getResult}>{footer && <span style={{ flex: 1, width: 0 }} children={footer} />}</Footer>
    </Layout>
  );
}

interface UserParamType {
  containLowOrg?: boolean;
  dataAccessAuth?: boolean;
  pageNum: number;
  pageSize: number;
  belongOrg?: string;
  belongDept?: string;
  belongProject?: string;
  query?: string;
}
interface BaseUserHelp extends BaseHelpProps {
  displayField?: string;
  /**
   * @description       自定义弹出帮助的title
   */
  title?: string;
  /**
   * @description       是否开启多选模式
   * @default           false
   */
  multiple?: boolean;
  /**
   * @description       底部扩展组件
   */
  footer?: React.ReactNode;
  /**
   * @description       表格列配置
   */
  columns?: IObject[];
  /**
   * @description       用户列表参数
   */
  userParams?: UserParamType;
  /**
   * @description       自定义用户请求
   */
  userRequest?: (params: UserParamType) => Promise<{ list: any[]; total: number | string }>;
}

export type IUserHelp = BaseUserHelp & OrgTreeType;

/**
 * 用户帮助
 */
export const UserHelp = compHoc<IUserHelp>((props) => {
  const cacheHelpInfo = useRef({ data: null, p: null });
  const {
    valueField = 'id',
    labelField = 'userName',
    displayField,
    userCodeField,
    title,
    multiple = false,
    modalProps,
    footer,
    params: treeParams,
    treeRequest,
    beforeRequest: beforeTreeRequest,
    userRequest,
    userParams = {},
    columns,
    onBeforeOpen,
    ...others
  } = props;
  const helpId = 'user';
  const otherProps: any = others;
  otherProps.onBeforeOpen = useRefCallback(async () => {
    const [status, helpInfo] = await getHelpBeforeOpen({ onBeforeOpen, cacheHelpInfo });
    if (zh.isObject(helpInfo)) {
      return helpInfo;
    }
    return status;
  });
  otherProps.request = useRefCallback(async ({ pageIndex, pageSize, keyword, treeNodes }) => {
    const data: any = {
      ...userParams,
      pageNum: pageIndex,
      pageSize
    };
    keyword && (data.query = keyword);
    if (treeNodes && treeNodes.length > 0) {
      const { id, leafType } = treeNodes[0];
      const keys = { PROJECT: 'belongProject', DEPT: 'belongDept', ORG: 'belongOrg' };
      data[keys[leafType]] = id;
    }
    if (userRequest) {
      return await userRequest(data);
    }
    const res = await zh.request.body({
      url: '/basedata/user/getUserPages',
      data
    });
    if (res?.code === 0) return res?.data;
    return { list: [], total: 0 };
  });
  otherProps.valueField = valueField;
  otherProps.userCodeField = userCodeField;
  otherProps.labelField = labelField || displayField;
  // 自定义modal弹出窗需要使用的参数
  otherProps.contentParams = {
    footer,
    helpId,
    multiple,
    valueField,
    labelField: otherProps.labelField,
    treeProps: {
      params: treeParams,
      beforeRequest: beforeTreeRequest,
      treeRequest
    },
    columns: columns ?? [
      { dataIndex: 'userNo', title: '用户编号' },
      { dataIndex: 'userName', title: '用户名称' },
      { dataIndex: 'belongOrgName', title: '所属组织' },
      {
        dataIndex: 'userJobList',
        tooltip: 'render',
        title: '所属部门',
        render({ value }) {
          return <span className="nowrap">{value?.map((v) => v.deptName).join(',')}</span>;
        }
      }
    ]
  };
  if (title) {
    otherProps.contentParams.helpTitle = title;
  }
  if (onBeforeOpen) {
    otherProps.cache = false;
  }
  const { width, height } = getGlobalConfig().default.helpConfig;
  return (
    <BaseHelp
      {...otherProps}
      modal
      helpContent={HelpContent}
      multiple={multiple}
      modalProps={{ width, height, ...modalProps }}
    />
  );
}, 'UserHelp');
