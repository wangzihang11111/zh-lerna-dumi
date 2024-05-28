import {
  compHoc,
  getGlobalConfig,
  Layout,
  useRefCallback,
} from '../../util';
import {
  Button, Table, Tabs, HelpContext, BaseHelp,
  BaseHelpProps,
} from '../../functionalComponent';
import { useContext, useRef } from 'react';
import { IHelpExtraProps, useCtx, useHelp, useTabItems } from './common';

const { Header, Footer, MultipleButtons } = BaseHelp;

const tableProps = {
  checkbox: 'checked',
  rowChecked: true,
  headerMenu: false,
  rowSelected: false,
  style: { borderStyle: 'solid', borderColor: 'var(--border-color-split, #f0f0f0)', borderWidth: 1 }
};

function HelpContent() {
  const {
    contentParams: { helpId, selectedArray, footer, columns, helpTitle, getFieldValue },
    locale,
    randomKey
  } = useContext<any>(HelpContext);

  const {
    activeKey,
    setActiveKey,
    rightTable,
    getResult,
    tabBarExtraContent,
    advancedSearch,
    getTable,
    renderTreeList,
    changeCommonData
  } = useCtx(true);

  const btnRef = useRef<any>();

  const renderTable = useRefCallback((index, listRequest) => {
    if (index === 'treeStyle') {
      return renderTreeList();
    }
    return (
      <Table
        {...tableProps}
        style={{ ...tableProps.style, borderTopWidth: 0 }}
        id={`${helpId}_${randomKey}_${index}`}
        columns={columns}
        pagination={{
          height: 32,
          showQuickJumper: false,
          align: 'left'
        }}
        onRow={(rowIndex, table) => ({
          onDoubleClick: () => btnRef.current.toRight([table.getRow(rowIndex)])
        })}
        request={listRequest}
      />
    );
  });

  const items = useTabItems({ renderTable });

  return (
    <Layout>
      <Header title={helpTitle || locale.multipleTitle}>{tabBarExtraContent}</Header>
      {advancedSearch}
      <Layout.Flex direction="row" style={{ padding: '0 5px' }}>
        <Layout.Flex flex={2}>
          <Tabs className="fit-height" size="small" activeKey={activeKey} onChange={setActiveKey} items={items} />
        </Layout.Flex>
        <MultipleButtons
          getRowKey={getFieldValue}
          outRef={btnRef}
          getActiveTable={getTable}
          getResultTable={() => rightTable.current.getApi()}
        />
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
      </Layout.Flex>
      <Footer getResult={getResult}>
        <Button style={{ marginLeft: 5 }} onClick={changeCommonData}>
          {activeKey === 'commonData' ? locale.DelCommonUse : locale.AddCommonUse}
        </Button>
        {footer && <span children={footer} />}
      </Footer>
    </Layout>
  );
}

export const MultipleHelp = compHoc<BaseHelpProps & IHelpExtraProps>((props) => {
  const [helpProps, modalProps] = useHelp(props);
  const { width, height } = getGlobalConfig().default.helpConfig;
  return <BaseHelp {...helpProps} multiple helpContent={HelpContent} modalProps={{ width, height, ...modalProps }} />;
}, 'MultipleHelp');
