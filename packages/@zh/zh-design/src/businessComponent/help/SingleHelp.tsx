import {
  compHoc,
  getGlobalConfig,
  Layout,
  useRefCallback
} from '../../util';
import {
  Button, Table, Tabs, HelpContext, BaseHelp,
  BaseHelpProps,
} from '../../functionalComponent';
import { useContext } from 'react';
import { IHelpExtraProps, useCtx, useHelp, useTabItems } from './common';

function HelpContent() {
  const {
    ok,
    contentParams: { helpId, footer, columns, helpTitle },
    locale,
    randomKey
  } = useContext<any>(HelpContext);

  const { activeKey, setActiveKey, tabBarExtraContent, advancedSearch, renderTreeList, getResult, changeCommonData } =
    useCtx(false);

  const renderTable = useRefCallback((index, listRequest) => {
    if (index === 'treeStyle') {
      return renderTreeList();
    }
    return (
      <Table
        id={`${helpId}_${randomKey}_${index}`}
        style={{
          borderStyle: 'solid',
          borderColor: 'var(--border-color-split, #f0f0f0)',
          borderWidth: '0 1px 1px 1px'
        }}
        columns={columns}
        pagination={{ height: 32, align: 'left' }}
        onRow={() => ({
          onDoubleClick() {
            ok(getResult());
          }
        })}
        rowSelected
        headerMenu={false}
        request={listRequest}
      />
    );
  });

  const items = useTabItems({ renderTable });

  return (
    <Layout>
      <BaseHelp.Header title={helpTitle || locale.singleTitle}>{tabBarExtraContent}</BaseHelp.Header>
      {advancedSearch}
      <Layout.Flex direction="column" style={{ padding: '0 5px' }}>
        <Tabs className="fit-height" size="small" activeKey={activeKey} onChange={setActiveKey} items={items} />
      </Layout.Flex>
      <BaseHelp.Footer getResult={getResult}>
        <Button style={{ marginLeft: 5 }} onClick={changeCommonData}>
          {activeKey === 'commonData' ? locale.DelCommonUse : locale.AddCommonUse}
        </Button>
        {footer && <span children={footer} />}
      </BaseHelp.Footer>
    </Layout>
  );
}

export const SingleHelp = compHoc<BaseHelpProps & IHelpExtraProps>((props) => {
  const [helpProps, modalProps] = useHelp(props);
  const { width, height } = getGlobalConfig().default.helpConfig;
  return (
    <BaseHelp {...helpProps} multiple={false} helpContent={HelpContent} modalProps={{ width, height, ...modalProps }} />
  );
}, 'SingleHelp');
