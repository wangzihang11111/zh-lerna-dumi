/**
 * title: 帮助基类组件 
 * description:  通过封装高阶组件，实现业务帮助
 */

import { AsyncTree, BaseHelp, HelpContext, zh, Layout, Table, useRefCallback } from '@zh/zh-design';
import React from 'react';
import { useContext, useRef } from 'react';

/**
 * 固定数据源
 */
const helpData = [
  { code: '01', name: 'name01' },
  { code: '02', name: 'name02' }
];

/**
 * 模拟请求
 * @param params: {pageIndex, pageSize, treeNodes}
 */
const dataRequest = async (params) => {
  console.log(params);
  await zh.delay(100);
  return helpData;
};

/**
 * 自定义弹出窗内容
 * @constructor
 */
function HelpContent() {
  const {
    request,
    ok,
    contentParams: { getFieldValue, columns }
  } = useContext<any>(HelpContext);

  const ref = useRef<any>();

  const getResult = () => {
    const value = ref.current.getApi().getSelectedRow();
    if (value) {
      return { value: getFieldValue(value), label: getFieldValue(value, 'label'), origin: { ...value } };
    }
  };

  return (
    <Layout>
      <BaseHelp.Header />
      <Layout.Flex style={{ padding: '5px 5px 0 5px' }}>
        <Table
          ref={ref}
          headerMenu={false}
          style={{ border: '1px solid var(--border-color-split, #f0f0f0)' }}
          onRow={() => ({
            onDoubleClick: () => ok(getResult())
          })}
          columns={columns}
          request={request}
        />
      </Layout.Flex>
      <BaseHelp.Footer getResult={getResult}>Hello NewGrand!</BaseHelp.Footer>
    </Layout>
  );
}

/**
 * 树节点
 * @param onSelectedChange
 * @constructor
 */
function FilterTree({ onSelectedChange }) {
  // 模拟树节点请求
  const treeRequest = useRefCallback(async () => {
    return [
      {
        key: '001',
        title: '节点1',
        isSelected: true,
        children: [{ key: '001.01', title: '节点1-01' }]
      },
      {
        key: '002',
        title: '节点2',
        children: [{ key: '002.01', title: '节点2-01' }]
      }
    ];
  });

  return <AsyncTree request={treeRequest} onSelectedChange={onSelectedChange} />;
}

export default function () {
  return (
    <div>
      <div>
        <div>基本用法</div>
        <BaseHelp id="baseHelp1" valueField="code" labelField="name" data={helpData} userCodeField="name" />
      </div>
      <div>
        <div>内置的单选弹出框</div>
        <BaseHelp modal id="baseHelp2" valueField="code" labelField="name" request={dataRequest} />
      </div>
      <div>
        <div>内置的多选弹出框</div>
        <BaseHelp
          modal
          multiple
          id="baseHelp3"
          valueField="code"
          labelField="name"
          contentParams={{
            helpTitle: '城市多选',
            FilterTree,
            columns: [
              { dataIndex: 'code', title: 'CODE' },
              { dataIndex: 'name', title: 'NAME' }
            ]
          }}
          request={dataRequest}
        />
      </div>
      <div>
        <div>自定义的单选弹出框</div>
        <BaseHelp
          modal
          id="baseHelp4"
          valueField="code"
          labelField="name"
          contentParams={{
            helpTitle: '自定义帮助'
          }}
          helpContent={HelpContent}
          request={dataRequest}
        />
      </div>
    </div>
  );
}
