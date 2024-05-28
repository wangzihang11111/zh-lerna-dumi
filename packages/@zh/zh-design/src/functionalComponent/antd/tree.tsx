import { Skeleton, Tree as AntTree, TreeSelect as AntTreeSelect } from 'antd';
import { DirectoryTreeProps } from 'antd/es/tree';
import { TreeSelectProps } from 'antd/es/tree-select';
import { CSSProperties, useState } from 'react';
import { compHoc, cssVar, zh, useRefCallback } from '../../util';
import { AutoResize } from '../../widgets';

const { DirectoryTree } = AntTree;

/**
 * 加载树组件时的骨架
 * @param row 显示骨架行数，默认4
 * @param style
 * @constructor
 */
function TreeLoading({ row = 4, style }: { row?: number; style?: CSSProperties }) {
  return (
    <div style={{ padding: 5, ...style }}>
      <Skeleton active paragraph={{ rows: 1 }} title={false} />
      <div style={{ paddingLeft: 20 }}>
        <Skeleton active paragraph={{ rows: row }} title={false} />
      </div>
    </div>
  );
}

export interface TreeProps extends DirectoryTreeProps {
  /**
   * @description       节点不允许换行，超出自动隐藏
   * @default           true
   */
  nowrap?: boolean;
  /**
   * @description       是否开启虚拟滚动
   * @default           true
   */
  virtual?: boolean;
  /**
   * @description       是否显示目录树
   * @default           true
   */
  directoryTree?: boolean;
  /**
   * @description       是否行选中复选框（多选模式下有效）
   * @default           false
   */
  rowChecked?: boolean;
}

const Tree = compHoc<TreeProps>(
  ({
    outRef,
    height,
    nowrap = true,
    virtual = true,
    className,
    directoryTree = true,
    rowChecked = false,
    ...props
  }) => {
    const [treeHeight, setTreeHeight] = useState(height);
    const onResize = useRefCallback(({ height }) => {
      setTreeHeight(height);
    });

    const extraProps: any = {};

    if (rowChecked) {
      extraProps.onSelect = (keys, info) => {
        const eventNode = info.node;
        if (
          props.checkable &&
          eventNode &&
          !eventNode.disabled &&
          eventNode.checkable !== false &&
          !eventNode.disableCheckbox
        ) {
          outRef.current.onNodeCheck({}, info.node, true);
        }
        props.onSelect?.(keys, info);
      };
    }

    const RenderTree = directoryTree ? DirectoryTree : AntTree;

    if (virtual) {
      return (
        <div
          className={zh.classNames('virtual-tree', { 'zh-tree-nowrap': nowrap }, className)}
          style={{
            height: height || '100%',
            overflow: `hidden`,
            width: '100%',
            minHeight: 60,
            position: 'relative',
            backgroundColor: cssVar.componentColor
          }}
        >
          {height ? (
            <RenderTree ref={outRef} expandAction="doubleClick" blockNode {...props} {...extraProps} height={height} />
          ) : (
            <AutoResize onResize={onResize}>
              {!!treeHeight && (
                <RenderTree
                  ref={outRef}
                  expandAction="doubleClick"
                  blockNode
                  {...props}
                  {...extraProps}
                  height={treeHeight}
                />
              )}
            </AutoResize>
          )}
        </div>
      );
    }

    return (
      <div
        className={zh.classNames({ 'zh-tree-nowrap': nowrap }, className)}
        style={{ height: height || '100%', width: '100%', position: 'relative', overflow: 'auto' }}
      >
        <RenderTree ref={outRef} expandAction="doubleClick" blockNode virtual={false} {...props} {...extraProps} />
      </div>
    );
  }
);

const TreeSelect = compHoc<TreeSelectProps<any>>(({ outRef, ...props }) => {
  return <AntTreeSelect ref={outRef} {...props} />;
});

export { TreeLoading, TreeSelect, Tree };
