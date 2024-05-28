/**
 * 客商帮助
 */
import React, { useContext, useRef } from 'react';
import { Search } from '../../baseComponent';
import { BaseHelp, BaseHelpProps, HelpContext, Table } from '../../functionalComponent';
import { compHoc, IObject } from '../../functionalComponent/table/util';
import { getGlobalConfig, Layout, zh, useRefCallback } from '../../util';

export interface ICustomerBusinessHelp extends BaseHelpProps {
  displayField?: string;
  /**
   * @description       自定义弹出帮助的title
   * @default           客商帮助
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
   * @description       自定义弹窗客商数据请求
   */
  customerBusinessRequest?: (params: IObject) => Promise<{ list: any[]; total: number | string }>;
  /**
   * @description       自定义弹窗客商数据请求参数
   */
  customerBusinessParams?: IObject;
  /**
   * @description       弹窗表格列配置
   */
  columns?: IObject[];
}

const tableProps: any = {
  cache: false,
  headerMenu: false,
  style: { borderStyle: 'solid', borderColor: 'var(--border-color-split, #f0f0f0)', borderWidth: 1 }
};

const { Header, Footer, MultipleButtons } = BaseHelp;

const defaultColumns = [
  {
    dataIndex: 'code',
    title: '客商编码',
    tooltip: true
  },
  {
    dataIndex: 'name',
    title: '客商名称',
    tooltip: true
  },
  {
    dataIndex: 'groupCodeName',
    title: '所属集团单位',
    tooltip: true
  },
  {
    dataIndex: 'unifiedSocialCode',
    title: '统一社会信用代码',
    tooltip: true
  }
];

function HelpContent() {
  const {
    request,
    ok,
    contentParams: { getFieldValue, columns, helpTitle, helpId, selectedArray, multiple, footer },
    locale,
    randomKey
  } = useContext<any>(HelpContext);

  const btnRef = useRef<any>();
  const rightTable = useRef<any>();
  const getTable = () => zh.compIns[`${helpId}_${randomKey}`].getApi();

  const onSearch = (value: string) => {
    getTable().query({ keyword: value });
  };

  const toRight = (values: any) => {
    if (multiple) {
      btnRef.current.toRight(values);
    } else {
      ok(getResult());
    }
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
      const value = getTable().getSelectedData()[0];
      if (value) {
        return { value: getFieldValue(value), label: getFieldValue(value, 'label'), origin: { ...value } };
      }
      return undefined;
    }
  };

  tableProps.checkbox = multiple ? 'checked' : false;
  tableProps.rowSelected = !multiple;
  tableProps.rowChecked = multiple;

  return (
    <Layout>
      <Header title={helpTitle} />
      <Layout.Flex direction="row" style={{ padding: '0 5px' }}>
        <Layout.Flex flex={1} direction="column" style={{ paddingTop: 7, paddingBottom: 32 }}>
          <Search
            size="small"
            onSearch={onSearch}
            allowClear
            placeholder={locale.searchPlaceholder}
            style={{ paddingBottom: 7, width: 220, alignSelf: 'flex-end' }}
          />
          <Layout.Flex>
            <Table
              id={`${helpId}_${randomKey}`}
              {...tableProps}
              columns={columns}
              request={request}
              pagination={{
                height: 32,
                showQuickJumper: false,
                align: 'left',
                targetContainer: `${helpId}_${randomKey}_pagination`
              }}
              onRow={(rowIndex, table) => ({
                onDoubleClick: () => toRight([table.getRow(rowIndex)])
              })}
            />
            <div
              id={`${helpId}_${randomKey}_pagination`}
              style={{
                position: 'absolute',
                display: 'block',
                left: 15,
                right: 15,
                paddingLeft: 10
              }}
            />
          </Layout.Flex>
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
          <Layout.Flex style={{ paddingTop: 7, paddingBottom: 32 }}>
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
                right: 15,
                paddingLeft: 10
              }}
            />
          </Layout.Flex>
        )}
      </Layout.Flex>
      <Footer getResult={getResult}>{footer && <span children={footer} />}</Footer>
    </Layout>
  );
}

export const CustomerBusinessHelp = compHoc<ICustomerBusinessHelp>((props) => {
  const {
    valueField = 'code',
    labelField = 'name',
    displayField,
    userCodeField,
    title,
    multiple = false,
    modalProps,
    onBeforeOpen,
    footer,
    customerBusinessRequest,
    customerBusinessParams = {},
    columns,
    ...others
  } = props;

  const helpId = 'customerBusiness';
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

  otherProps.request = useRefCallback(async ({ pageIndex, pageSize, keyword }) => {
    const data: any = {
      ...customerBusinessParams,
      pageNum: pageIndex,
      pageSize
    };
    keyword && (data.searchStr = keyword.trim());
    if (customerBusinessRequest) {
      return await customerBusinessRequest(data);
    }
    const res = await zh.request.body({
      url: '/basedata/cussup/search',
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
    columns: columns ?? defaultColumns
  };
  otherProps.contentParams.helpTitle = title || '客商帮助';

  otherProps.selectedRequest = useRefCallback(async ({ codes }) => {
    try {
      const { code, data } = await zh.request.body({
        url: '/basedata/cussup/listByCodes',
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
      input={false}
      modal
      helpContent={HelpContent}
      multiple={multiple}
      modalProps={{ width, height, ...modalProps }}
    />
  );
});
