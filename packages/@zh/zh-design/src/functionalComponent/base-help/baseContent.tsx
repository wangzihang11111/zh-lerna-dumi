import { DoubleLeftOutlined, DoubleRightOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import React, { createContext, useContext, useMemo, useRef } from 'react';
import { Search } from '../../baseComponent';
import { Layout, Observer, zh, useExtendRef, useRefCallback } from '../../util';
import { Button } from '../antd/Button';
import { message } from '../antd/message';
import { ModalHeader, useModal } from '../modal';
import { ColumnProps, Table } from '../table';
import { IBaseHelpQuery } from './interface';
import { helpLocale } from './locale';

export const HelpContext = createContext<{
  observer: Observer;
  ok: (result?) => void;
  close: () => void;
  request: (query: IBaseHelpQuery) => Promise<any> | any;
  contentParams: {
    helpTitle?: string;
    FilterTree?: ({ onSelectedChange, tableRef }) => React.ReactNode;
    columns: Array<ColumnProps> | { left: Array<ColumnProps>; right: Array<ColumnProps> };
    getFieldValue: (row, type?) => any;
    [key: string]: any;
  };
  locale: typeof helpLocale;
  randomKey: string;
}>({
  observer: new Observer(),
  ok: () => {},
  close: () => {},
  request: (query: IBaseHelpQuery) => Promise.resolve(query),
  contentParams: {} as any,
  locale: helpLocale,
  randomKey: ''
}); //创建context

const buttonProps: any = {
  size: 'small',
  style: { display: 'block', width: 50, margin: '16px 10px' }
};

const tableProps: any = {
  rowSelected: false,
  rowChecked: true,
  cache: false,
  headerMenu: false,
  style: { border: '1px solid var(--border-color-split, #f0f0f0)' }
};

/**
 * 帮助头部区域
 * @param props
 * @constructor
 */
export function Header(props) {
  const helpCtx = useContext(HelpContext);
  const [ins] = useModal();

  return (
    <ModalHeader
      closable
      close={helpCtx.close}
      fullscreenable={!!ins?.getApi()?.setFullscreen}
      children={props.children}
      title={props.title || helpCtx.contentParams.helpTitle || helpCtx.locale.baseTitle}
    />
  );
}

/**
 * 帮助底部区域
 * @constructor
 * @param props
 */
export function Footer(props) {
  const helpCtx = useContext(HelpContext);
  const { okText = helpCtx.locale.OK, cancelText = helpCtx.locale.Cancel, onOk, onCancel, getResult, children } = props;
  const okClick = async () => {
    const result = await getResult();
    const valid = await onOk?.(result);
    if (valid === false) {
      return;
    }
    if (zh.isObject(result) || zh.isArray(result)) {
      await helpCtx.ok(result);
    } else {
      // 返回false表示自定义提示方式，这里不需要额外处理
      if (result !== false) {
        message.warning({
          content: result || helpCtx.locale.noSelected,
          key: 'help_message_key'
        });
      }
    }
  };
  const cancelClick = async () => {
    const valid = await onCancel?.();
    if (valid === false) {
      return;
    }
    return helpCtx.close?.();
  };

  return (
    <div style={{ alignItems: 'center', display: 'flex', padding: 16 }}>
      <div style={{ flex: 1, width: 0, display: 'flex', alignItems: 'center' }}>{children}</div>
      {cancelText && (
        <Button onClick={cancelClick} style={{ margin: '0 5px', minWidth: 68 }}>
          {cancelText}
        </Button>
      )}
      {okText && (
        <Button onClick={okClick} type="primary" style={{ margin: '0 5px', minWidth: 68 }}>
          {okText}
        </Button>
      )}
    </div>
  );
}

/**
 * 多选按钮
 * @param props
 * @constructor
 */
export function MultipleButtons(props) {
  const {
    getRowKey,
    addResult: defaultAddResult,
    removeResult: defaultRemoveResult,
    getActiveTable,
    getResultTable,
    outRef,
    style
  } = props;

  const addResult =
    defaultAddResult ||
    ((values: any) => {
      const selected: any = [];
      const existValues = getResultTable()
        .getRows()
        .map((r) => getRowKey(r));
      values.forEach((value) => {
        if (existValues.indexOf(getRowKey(value)) === -1) {
          const newVal = JSON.parse(JSON.stringify(value));
          delete newVal.checked;
          selected.push(newVal);
        }
      });
      getResultTable().addRows(selected);
    });
  const removeResult =
    defaultRemoveResult ||
    ((indexes?: number[] | number) => {
      if (indexes === undefined) {
        getResultTable().setDataSource([]);
      } else {
        getResultTable().deleteRows(indexes);
      }
    });

  useExtendRef(outRef, {
    toLeft: removeResult,
    toRight: addResult
  });

  return (
    <div
      style={{
        width: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <div>
        <Button
          {...buttonProps}
          icon={<RightOutlined />}
          onClick={() => addResult(getActiveTable().getSelectedData())}
        />
        <Button {...buttonProps} icon={<DoubleRightOutlined />} onClick={() => addResult(getActiveTable().getRows())} />
        <Button
          {...buttonProps}
          icon={<LeftOutlined />}
          onClick={() => removeResult(getResultTable().getSelectedIndexes())}
        />
        <Button {...buttonProps} icon={<DoubleLeftOutlined />} onClick={() => removeResult()} />
      </div>
    </div>
  );
}

/**
 * 基础帮助content区域
 * @constructor
 */
export function BaseContent() {
  const {
    request,
    ok,
    contentParams: {
      remote = true,
      autoLoad = true,
      FilterTree,
      columns,
      helpTitle,
      onOk,
      onCancel,
      multiple,
      selectedArray = [],
      pagination = {
        align: 'left'
      },
      getFieldValue
    },
    locale
  } = useContext<any>(HelpContext);
  const id = useMemo(() => Math.random().toString(32).slice(2), []);
  const leftTable = useRef<any>();
  const rightTable = useRef<any>();
  const btnRef = useRef<any>();
  const tableRef = useMemo(() => [leftTable, rightTable], []);
  const getRightTable = () => rightTable.current.getApi();
  const getLeftTable = () => leftTable.current.getApi();
  const getResult: any = () => {
    if (multiple) {
      const result = getRightTable()
        .getRows()
        .map((r) => ({
          value: getFieldValue(r, 'value'),
          label: getFieldValue(r, 'label'),
          origin: { ...r }
        }));
      return result.length > 0 ? result : undefined;
    } else {
      const value = getLeftTable().getSelectedData()[0];
      if (value) {
        return {
          value: getFieldValue(value, 'value'),
          label: getFieldValue(value, 'label'),
          origin: { ...value }
        };
      }
    }
  };
  const toRight = async (values: any) => {
    if (multiple) {
      btnRef.current.toRight(values);
    } else {
      const value = getResult();
      const valid = await onOk?.(value);
      valid !== false && ok(value);
    }
  };

  const onSearch = useRefCallback((value: string) => {
    if (remote) {
      getLeftTable().query({ keyword: value });
    } else {
      getLeftTable().filter(value);
    }
  });
  const onSelectCallback = useRefCallback((keys, nodes) => {
    getLeftTable().setExtraParam({ treeNodes: nodes });
  });

  if (pagination) {
    pagination.targetContainer = id;
  }

  tableProps.checkbox = multiple ? 'checked' : false;
  tableProps.rowSelected = !multiple;
  tableProps.rowChecked = multiple;

  return (
    <Layout>
      <Header title={helpTitle || (multiple ? locale.multipleTitle : locale.singleTitle)} />
      <Layout.Flex direction="row" style={{ padding: '5px 5px 0 5px' }}>
        {FilterTree && (
          <Layout.Slider
            size={multiple ? 180 : 200}
            style={{ marginRight: 5, border: '1px solid var(--border-color-split, #f0f0f0)' }}
          >
            <FilterTree onSelectedChange={onSelectCallback} tableRef={tableRef} />
          </Layout.Slider>
        )}
        <Layout.Flex direction="column">
          <Search allowClear placeholder={locale.searchPlaceholder} onSearch={onSearch} />
          <Layout.Flex>
            <Table
              {...tableProps}
              style={{ ...tableProps.style, borderTop: 0 }}
              ref={leftTable}
              checkbox={!!multiple}
              columns={columns?.left || columns}
              pagination={pagination}
              onRow={(rowIndex, table) => ({
                onDoubleClick: () => toRight([table.getRow(rowIndex)])
              })}
              autoLoad={autoLoad}
              request={request as any}
            />
          </Layout.Flex>
        </Layout.Flex>
        {multiple && (
          <MultipleButtons
            outRef={btnRef}
            getRowKey={getFieldValue}
            getActiveTable={getLeftTable}
            getResultTable={getRightTable}
          />
        )}
        {multiple && (
          <Layout.Flex>
            <Table
              {...tableProps}
              checkbox
              dataSource={selectedArray}
              columns={columns.right || columns}
              ref={rightTable}
              onRow={(rowIndex) => ({
                onDoubleClick: () => btnRef.current.toLeft(rowIndex)
              })}
            />
          </Layout.Flex>
        )}
      </Layout.Flex>
      <Footer getResult={getResult} onOk={onOk} onCancel={onCancel}>
        <div id={id} style={{ padding: '0 5px', width: '100%' }} />
      </Footer>
    </Layout>
  );
}
