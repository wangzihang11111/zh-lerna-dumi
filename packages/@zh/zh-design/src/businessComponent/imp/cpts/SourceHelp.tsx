import { useEffect } from 'react';
import { Table, Tree, useModal, type ColumnProps } from '../../../functionalComponent';
import { cssVar, Layout, zh, useRefCallback, useRefs, useRefState } from '../../../util';
import { QueryPanel } from '../../query-panel';
import { converSourceData, loadSourceConfig, loadSourceData } from '../service';

/**
 * 来源帮助
 */
export function SourceHelp({ sourceTree, defaultSelectedKeys, sourceCount, bizCode, tableName }) {
  const [ins] = useModal();
  const [getRef] = useRefs();
  const [state, setState] = useRefState<{
    sourceId?: string;
    queryItems: any[];
    columns: ColumnProps[];
    loading: boolean;
  }>({
    sourceId: defaultSelectedKeys[0].split('_')[1],
    columns: [],
    queryItems: [],
    loading: true
  });

  const refreshConfig = useRefCallback(async ({ sourceId }) => {
    setState({ loading: true });
    const { columns = [], queryItems = [] } = await loadSourceConfig({ sourceId });
    setState({
      loading: false,
      queryItems: queryItems || [],
      sourceId,
      columns
    });
    getRef('table').current.getApi().setExtraParam({ sourceId: state.sourceId, bizCode, tableName });
  });

  useEffect(() => {
    refreshConfig({ sourceId: state.sourceId });
  }, [state.sourceId]);

  const onSearch = (queryContion) => {
    getRef('table').current.getApi().setExtraParam({ queryContion });
  };

  const onSelect = (keys) => {
    setState({
      sourceId: keys[0].split('_')[1]
    });
  };

  ins.setApi({
    async getResult() {
      const ds = getRef('table').current.getApi().getSelectedData() || [];
      if (ds?.length) {
        const [success, data] = await converSourceData({ sourceId: state.sourceId, sourceDatas: ds });
        if (success) {
          return data;
        }
        zh.alert(data);
      } else {
        zh.alert('请先选择数据行！');
      }
      return null;
    }
  });

  return (
    <Layout direction="row" autoFit loading={state.loading} style={{ padding: 5 }}>
      <div hidden={sourceCount < 2} style={{ border: cssVar.border, borderRadius: 4, marginRight: 5, width: 200 }}>
        <Tree treeData={sourceTree} defaultExpandAll defaultSelectedKeys={defaultSelectedKeys} onSelect={onSelect} />
      </div>
      <Layout.Flex direction="column">
        {state.queryItems.length > 0 && <QueryPanel items={state.queryItems} onSearch={onSearch} />}
        <Layout.Flex style={{ border: cssVar.border, borderRadius: 4 }}>
          <Table
            showRowNumber
            columns={state.columns}
            ref={getRef('table')}
            autoLoad={false}
            request={loadSourceData}
            pagination={{ hideOnSinglePage: true }}
            checkbox
            rowChecked
            rowSelected={false}
            checkboxSelected
          />
        </Layout.Flex>
      </Layout.Flex>
    </Layout>
  );
}
