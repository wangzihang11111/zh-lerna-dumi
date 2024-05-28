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
        autoLoad={treeProps.defaultSelectedFirstNode === false}
        request={request}
        response={(res) => ({ total: res.total ?? 0, record: res.list || [] })}
      />
    );
  };

  const borderStyle = activeKey === '0' ? '1px solid var(--border-color-split, #f0f0f0)' : '1px solid transparent';

  return (
    <Layout>
      <Header title={helpTitle || '项目帮助'} />
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

interface ProjectParamType {
  containLowOrg?: boolean; // 跨单元是否开启，默认不开启
  dataAccessAuth?: boolean; // 数据权限控制是否开启，默认不开启
  enableManagerContrl?: boolean; // 管理员控制是否开启，默认不开启
  pageNum: number;
  pageSize: number;
  orgId?: string; // 所属组织
  orgIdList?: string[]; // 组织idList
  query?: string; // 项目编号、名称
}
interface BaseProjectHelp extends BaseHelpProps {
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
   * @description       项目列表参数
   */
  projectParams?: ProjectParamType;
  /**
   * @description       自定义项目请求
   */
  projectRequest?: (params: ProjectParamType) => Promise<{ list: any[]; total: number | string }>;
  /**
   * @description       组织树的属性
   */
  treeProps?: OrgTreeType;
  // 下面三个属性兼容历史数据
  params?: OrgTreeType['params'];
  treeRequest?: OrgTreeType['treeRequest'];
  beforeRequest?: OrgTreeType['beforeRequest'];
}

export type IProjectHelp = BaseProjectHelp;

/**
 * 项目帮助
 */
export const ProjectHelp = compHoc<IProjectHelp>((props) => {
  const cacheHelpInfo = useRef({ data: null, p: null });
  const {
    valueField = 'id',
    labelField = 'projectName',
    displayField,
    userCodeField,
    title,
    multiple = false,
    modalProps,
    footer,
    params: treeParams,
    treeRequest,
    beforeRequest: beforeTreeRequest,
    projectRequest,
    projectParams = {},
    columns,
    onBeforeOpen,
    treeProps,
    ...others
  } = props;
  const helpId = 'project';
  const otherProps: any = others;
  otherProps.onBeforeOpen = useRefCallback(async () => {
    const [status, helpInfo] = await getHelpBeforeOpen({ onBeforeOpen, cacheHelpInfo });
    if (zh.isObject(helpInfo)) {
      return helpInfo;
    }
    return status;
  });
  otherProps.request = useRefCallback(async ({ pageIndex, pageSize, keyword = '', treeNodes }) => {
    const data: IProjectHelp['projectParams'] = {
      ...projectParams,
      pageNum: pageIndex,
      pageSize,
      query: keyword.trim(),
      orgId: treeNodes?.[0]?.id || treeProps?.params?.orgId
    };
    if (projectRequest) {
      return await projectRequest(data);
    }
    const res = await zh.request.body({
      url: '/basedata/project/getProjectPages',
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
      treeRequest,
      ...treeProps
    },
    columns: columns ?? [
      { dataIndex: 'projectNo', title: '项目编码', width: multiple ? 90 : 120 },
      { dataIndex: 'projectName', title: '项目名称', tooltip: true },
      { dataIndex: 'belongOrgName', title: '所属组织', tooltip: true }
    ]
  };
  if (title) {
    otherProps.contentParams.helpTitle = title;
  }
  if (onBeforeOpen) {
    otherProps.cache = false;
  }
  // 回填数据的接口
  otherProps.selectedRequest = useRefCallback(async ({ codes }) => {
    try {
      const { code, data } = await zh.request.body({
        url: '/basedata/project/getProjectListByIds',
        skipError: true,
        data: codes.split(',')
      });
      return code === 0 ? data : [];
    } catch (e) {}
    return [];
  });
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
}, 'ProjectHelp');
