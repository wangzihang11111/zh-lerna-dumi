/**
 *
 */
import React, { useContext, useRef, useState } from 'react';
import { Search } from '../../baseComponent';
import { BaseHelp, HelpContext, Table, TableSelectionModel, Tabs, type BaseHelpProps } from '../../functionalComponent';
import { compHoc, getGlobalConfig, Layout, zh, useRefCallback, type IObject } from '../../util';
import { getHelpBeforeOpen } from './common';

const { Option } = Tabs;
const { Header, Footer, MultipleButtons } = BaseHelp;

const tableProps: any = {
  cache: false,
  headerMenu: false,
  style: { borderStyle: 'solid', borderColor: 'var(--border-color-split, #f0f0f0)', borderWidth: 1 }
};

function HelpContent() {
  const {
    request,
    ok,
    contentParams: { getFieldValue, columns, helpTitle, typeCode, selectedArray, multiple, footer },
    locale,
    randomKey
  } = useContext<any>(HelpContext);
  const btnRef = useRef<any>();
  const [activeKey, setActiveKey] = useState('0');
  const rightTable = useRef<any>();
  const getTable = () => zh.compIns[`${typeCode}_${randomKey}_${activeKey}`].getApi();

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
  const tabTitle = (t) => <span style={{ padding: '0 8px' }}>{t}</span>;
  const tabBarExtraContent = (
    <Search size="small" allowClear placeholder={locale.searchPlaceholder} onSearch={onSearch} />
  );
  if (multiple) {
    tableProps.rowSelection = {
      type: [TableSelectionModel.CHECKBOX],
      autoCheckedChildren: false
    };
    tableProps.rowChecked = true;
    tableProps.rowSelected = false;
  } else {
    tableProps.rowSelection = undefined;
    tableProps.rowChecked = false;
    tableProps.rowSelected = true;
  }

  const renderTable = (index) => {
    return (
      <Table
        {...tableProps}
        isTree
        defaultExpand="all"
        style={{ ...tableProps.style, borderTopWidth: 0 }}
        id={`${typeCode}_${randomKey}_${index}`}
        columns={columns}
        onRow={(rowIndex, table) => ({
          onDoubleClick: () => toRight([table.getRow(rowIndex)])
        })}
        request={request}
      />
    );
  };

  return (
    <Layout>
      <Header title={helpTitle || '静态数据'} />
      <Layout.Flex direction="row" style={{ padding: '0 5px 5px 5px', borderBottom: 0 }}>
        <Layout.Flex flex={2}>
          <Tabs className="fit-height" size="small" onChange={setActiveKey} tabBarExtraContent={tabBarExtraContent}>
            <Option tab={tabTitle(locale.List)} key="0">
              <div style={{ height: '100%' }}>{renderTable(0)}</div>
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
          <Layout.Flex style={{ paddingTop: 7 }}>
            <Table
              {...tableProps}
              columns={columns}
              dataSource={selectedArray}
              ref={rightTable}
              onRow={(rowIndex) => ({
                onDoubleClick: () => btnRef.current.toLeft(rowIndex)
              })}
            />
          </Layout.Flex>
        )}
      </Layout.Flex>
      <Footer getResult={getResult}>{footer && <span style={{ flex: 1, width: 0 }} children={footer} />}</Footer>
    </Layout>
  );
}

export interface IStaticDicHelp extends BaseHelpProps {
  /**
   * 静态数据字段类型
   */
  typeCode: string;
  /**
   * @description       自定义弹出帮助的title
   */
  title: string;
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
}

/**
 * 静态数据字典帮助
 */
export const StaticDicHelp = compHoc<IStaticDicHelp>((props) => {
  const cacheHelpInfo = useRef({ data: null, p: null });
  const {
    valueField = 'id',
    labelField = 'title',
    userCodeField = 'dataNo',
    title,
    multiple = false,
    modalProps,
    footer,
    columns,
    onBeforeOpen,
    typeCode,
    ...others
  } = props;
  const otherProps: any = others;
  otherProps.onBeforeOpen = useRefCallback(async () => {
    const [status, helpInfo] = await getHelpBeforeOpen({ onBeforeOpen, cacheHelpInfo });
    if (zh.isObject(helpInfo)) {
      return helpInfo;
    }
    return status;
  });
  otherProps.request = useRefCallback(async ({ keyword }) => {
    const data: any = {
      typeCode,
      filter: keyword?.trim?.() || ''
    };
    keyword && (data.filter = keyword);
    const res = await zh.request.get({
      url: 'engine/simpleData/data/treeExt',
      data
    });
    if (res?.code === 0) return res?.data;
    return [];
  });
  otherProps.valueField = valueField;
  otherProps.userCodeField = userCodeField;
  otherProps.labelField = labelField;
  // 自定义modal弹出窗需要使用的参数
  otherProps.contentParams = {
    footer,
    typeCode,
    multiple,
    valueField,
    labelField: otherProps.labelField,
    columns: columns ?? [
      { dataIndex: 'dataNo', title: '编码' },
      { dataIndex: 'title', title: '名称' }
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
}, 'StaticDicHelp');
