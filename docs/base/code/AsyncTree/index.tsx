/**
 * title: 基本使用
 * description: 请求异步数据渲染树，属性继承 <a href="https://ant.design/components/tree-cn/">ant tree</a>
 */
import { AsyncTree, zh, Checkbox, Layout, useRefCallback } from '@zh/zh-design';
import React from 'react';
import { useState } from 'react';

export default () => {
  const [selected, setSelected] = useState('');
  const [showFilter, setShowFilter] = useState(true);

  // 模拟树节点请求
  const treeRequest = useRefCallback(async (params) => {
    console.log(params);
    await zh.delay(250);
    const { parentNode } = params;
    if (parentNode) {
      // 存在parentNode，表示异步加载子节点，服务端直接根据父节点id返回子节点的数据
      return [
        { title: `${parentNode.title}-0`, key: `${parentNode.key}-0` },
        { title: `${parentNode.title}-1`, key: `${parentNode.key}-1` }
      ];
    }
    // parentNode不存在，表示刷新或者查询操作（keyword记录查询关键词）
    return [
      {
        key: '001',
        title: '叶子节点',
        isLeaf: false
      },
      {
        key: '002',
        title: '父节点',
        children: [
          { key: '002.001', title: '叶子节点', isLeaf: false, isChecked: true, children:[ { key: '002.001.01', title: '节点1' }] },
          { key: '002.002', title: '父节点1' }
        ]
      }
    ];
  });

  const onSelectedChange = (...args) => {
    console.log(args);
    setSelected(JSON.stringify(args[0]));
  };

  return (
    <Layout direction="row" height={260}>
      <Layout.Slider size={200} style={{ border: '1px solid #ddd' }}>
        <AsyncTree
          showFilter={showFilter}
          id={'asyncTree'}
          directoryTree={true}
          selectable={true}
          checkable
         // filterOptions={{includeChildren: true}}
          onSearch={(kv, nodes) => console.log(kv, nodes)}
         lazyLoad={true}
          virtual={true}
          request={treeRequest}
          onSelectedChange={onSelectedChange}
        />
      </Layout.Slider>
      <Layout.Flex style={{ margin: 30 }}>
        <Checkbox defaultChecked={showFilter} onChange={() => setShowFilter(!showFilter)}>
          显示节点过滤
        </Checkbox>
        <div>选中节点：{selected}</div>
      </Layout.Flex>
    </Layout>
  );
};
