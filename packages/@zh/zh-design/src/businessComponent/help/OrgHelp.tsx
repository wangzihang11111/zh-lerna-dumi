import React, { useContext, useMemo, useRef } from 'react';
import { Search } from '../../baseComponent';
import { BaseHelp, HelpContext, message, Table, Tabs, type BaseHelpProps } from '../../functionalComponent';
import { compHoc, getGlobalConfig, Layout, zh, useRefCallback } from '../../util';
import { OrgTree as Tree, type OrgTreeType } from '../org-tree';
import { useTabKey } from './common';

/**
 * 展平树节点
 * @param filter 节点过滤函数
 */
function flatTreeNodes(filter) {
  const result: any = [];
  const exec = (nodes) => {
    nodes?.forEach(({ parentNode, children, ...node }) => {
      if (filter(node)) {
        result.push(node);
      }
      exec(children);
    });
    return result;
  };
  return exec;
}

/**
 * 组织树
 * @param treeRef
 * @param isOnlyDept
 * @param props
 * @constructor
 */
function OrgTree({ treeRef, isOnlyDept, ...props }) {
  const convertNode = useRefCallback((node) => {
    return { ...node, selectable: !isOnlyDept || node.leafType === 'DEPT' };
  });

  const onSearch = (value: string) => {
    treeRef.current?.getApi().filterTreeNode(value);
  };

  const filterContent = () => (
    <Layout direction="row" style={{ padding: 5, alignItems: 'center' }}>
      <Layout.Flex style={{ marginLeft: 10, textAlign: 'right' }}>
        <Search size="small" allowClear onSearch={onSearch} placeholder="输入关键字检索" style={{ width: 160 }} />
      </Layout.Flex>
    </Layout>
  );

  const onClick = async (e, node) => {
    if (isOnlyDept && node.leafType !== 'DEPT') {
      await message.warning('请选择部门');
    }
  };

  return <Tree ref={treeRef} showFilter={filterContent} convertNode={convertNode} onClick={onClick} {...props} />;
}

const { Option } = Tabs;
const { Header, Footer, MultipleButtons } = BaseHelp;

const tableProps: any = {
  cache: false,
  headerMenu: false,
  style: { borderStyle: 'solid', borderColor: 'var(--border-color-split, #f0f0f0)', borderWidth: 1 }
};

const columns = [
  {
    dataIndex: 'code',
    title: '组织编码'
  },
  {
    dataIndex: 'title',
    title: '组织名称'
  }
];

function HelpContent() {
  const {
    contentParams: { isOnlyDept, getFieldValue, helpTitle, helpId, selectedArray, multiple, footer, treeProps },
    randomKey
  } = useContext<any>(HelpContext);
  const treeRef = useRef<any>();
  const btnRef = useRef<any>();
  const rightTable = useRef<any>();
  const [activeKey, setActiveKey] = useTabKey(() => ['0', '1', '2']);

  const getTable = () => {
    if (activeKey === '0') {
      const api = treeRef.current.getApi();
      const getSelectedData = () => (api.getSelectedNodes() || []).map(({ parentNode, children, ...r }) => r);
      return {
        getSelectedData,
        getCheckedData: getSelectedData,
        getRows() {
          return flatTreeNodes((node) => !isOnlyDept || node.leafType === 'DEPT')(api.getNodes());
        }
      };
    }
    return zh.getCmpApi(`${helpId}_${randomKey}_${activeKey}`);
  };

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
      const value =
        activeKey === '0' ? treeRef.current.getApi().getSelectedNodes()[0] : getTable().getSelectedData()[0];
      if (value) {
        const { parentNode, children, ...node } = value;
        return { value: getFieldValue(node), label: getFieldValue(node, 'label'), origin: node };
      }
      return undefined;
    }
  };
  const tabTitle = (t) => <span style={{ padding: '0 8px' }}>{t}</span>;

  tableProps.checkbox = multiple ? 'checked' : false;
  tableProps.rowSelected = !multiple;
  tableProps.rowChecked = multiple;

  const borderStyle = '1px solid var(--border-color-split, #f0f0f0)';

  return (
    <Layout>
      <Header title={helpTitle} />
      <Layout.Flex
        direction="row"
        style={{ padding: '0 5px', borderBottom: multiple && activeKey !== '0' ? borderStyle : 0 }}
      >
        <Layout.Flex flex={1}>
          <Tabs className="fit-height" size="small" activeKey={activeKey} onChange={setActiveKey}>
            <Option tab={tabTitle('所有数据')} key="0">
              <Layout direction="row" style={{ height: '100%', border: borderStyle, borderTop: 0 }}>
                <Layout.Flex>
                  <OrgTree treeRef={treeRef} isOnlyDept={isOnlyDept} multiple={multiple} {...treeProps} />
                </Layout.Flex>
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
          <Layout.Flex flex={1} direction="column" style={{ paddingTop: 7, paddingBottom: activeKey === '0' ? 0 : 32 }}>
            <Layout.Flex>
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
                  display: activeKey === '0' ? 'none' : 'block',
                  left: 15,
                  right: 15,
                  paddingLeft: 10
                }}
              />
            </Layout.Flex>
          </Layout.Flex>
        )}
      </Layout.Flex>
      <Footer getResult={getResult}>{footer && <span children={footer} />}</Footer>
    </Layout>
  );
}

interface BaseOrgHelp extends BaseHelpProps {
  displayField?: string;
  /**
   * @description       自定义弹出帮助的title
   * @default           组织帮助
   */
  title?: string;
  /**
   * @description       仅支持选择部门
   * @default           false
   */
  isOnlyDept?: boolean;
  /**
   * @description       是否开启多选模式
   * @default           true
   */
  multiple?: boolean;
  /**
   * @description       底部扩展组件
   */
  footer?: React.ReactNode;
}

export type IOrgHelp = BaseOrgHelp & OrgTreeType;

function BaseOrgHelp(props: IOrgHelp) {
  const {
    valueField = 'id',
    labelField = 'title',
    displayField,
    userCodeField,
    title,
    isOnlyDept = false,
    multiple = false,
    modalProps,
    onBeforeOpen,
    treeRequest,
    beforeRequest: beforeTreeRequest,
    footer,
    params: treeParams,
    ...others
  } = props;
  const helpId = isOnlyDept ? 'dept' : 'org';
  const otherProps: any = others;
  otherProps.onBeforeOpen = useRefCallback(async () => {
    if (onBeforeOpen) {
      const canOpen = await onBeforeOpen();
      if (canOpen === false) {
        return false;
      }
    }
    return {};
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
    treeProps: {
      params: treeParams,
      beforeRequest: beforeTreeRequest,
      treeRequest
    },
    treeRequest,
    beforeTreeRequest,
    labelField: otherProps.labelField,
    isOnlyDept
  };
  otherProps.contentParams.helpTitle = title || (isOnlyDept ? '部门帮助' : '组织帮助');
  const { width, height } = getGlobalConfig().default.helpConfig;
  return (
    <BaseHelp
      {...otherProps}
      input={false}
      modal
      helpContent={HelpContent}
      multiple={multiple}
      modalProps={{ width, height, ...modalProps }}
    />
  );
}

/**
 * 组织帮助
 */
export const OrgHelp = compHoc<IOrgHelp>((props) => {
  return <BaseOrgHelp {...props} isOnlyDept={false} />;
}, 'OrgHelp');

/**
 * 部门帮助
 */
export const DeptHelp = compHoc<IOrgHelp>((props) => {
  const params = useMemo(() => {
    return { ...props.params, containDept: true };
  }, [props.params]);
  return <BaseOrgHelp {...props} params={params} isOnlyDept={true} />;
}, 'DeptHelp');
