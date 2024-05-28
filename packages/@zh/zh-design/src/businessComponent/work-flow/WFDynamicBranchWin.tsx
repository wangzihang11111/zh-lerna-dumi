
import { useContext, useEffect, useMemo, useState } from 'react';
import { cascadeBy, NGLang, stringFormat, wfAlert } from './util';
import { ModalContext, Tree } from '../../functionalComponent';
import { Layout, useRefCallback } from '../../util';

interface IProps {
  branchData: any;
  callBack?: (data: Array<any>) => void;
  cancelBack?: Function;
}

/**
 * 指派下级分支
 * @constructor
 * @param props
 */
export function WFDynamicBranchWin(props: IProps) {
  const { branchData = [], callBack, cancelBack } = props;
  const mCtx = useContext(ModalContext);
  const [checkedKeys, setCheckedKeys] = useState<any>({ checked: [] });
  const memoTree = useMemo(() => {
    const rootNode: any = {
      title: NGLang.curNodeName,
      key: 'root',
      canAssignMultiFlows: false
    };
    const keyRefNode: any = { root: rootNode };
    const getTreeNode = (nodes, parentNode) => {
      return nodes.map((node) => {
        const nodeData: any = {
          ...node,
          key: node.id,
          title: node.name,
          // disabled: !node.needAssignFlow && node.children.length !== 0,
          parentNode
        };
        keyRefNode[nodeData.key] = nodeData;
        if (node.children && node.children.length) {
          nodeData.children = getTreeNode(node.children, nodeData);
        } else {
          nodeData.children = [];
        }
        return nodeData;
      });
    };

    rootNode.children = getTreeNode(branchData, rootNode);
    return { root: rootNode, treeData: rootNode.children, keyRefNode };
  }, [branchData]);

  const getCheckedNodes = useRefCallback((node?) => {
    if (node) {
      // 获取下级选中节点
      return node.children.filter((itemNode) => {
        return !itemNode.needAssignFlow || checkedKeys.checked.includes(itemNode.key);
      });
    }
    // 获取所有选中节点
    return checkedKeys.checked.map((key) => memoTree.keyRefNode[key]);
  });

  const isValid = useRefCallback((node) => {
    if (node.children.length < 1) {
      return true;
    }
    const checkedSubNodes = getCheckedNodes(node);
    if (checkedSubNodes.length < 1) {
      wfAlert(NGLang.alertTitle, stringFormat(NGLang.nodeMustHasChild, node.name)).then();
      return false;
    }
    if (node.canAssignMultiFlows && checkedSubNodes.length > 1) {
      wfAlert(NGLang.alertTitle, stringFormat(NGLang.nodeMustOnlyOneChild, node.name)).then();
      return false;
    }
    return !checkedSubNodes.some((itemNode) => !isValid(itemNode));
  });

  const cascadeNode = useRefCallback((node, checkedSet, checked) => {
    cascadeBy(node, (itemNode) => {
      if (!itemNode.canAssignMultiFlows) {
        checked ? checkedSet.add(itemNode.key) : checkedSet.delete(itemNode.key);
      }
    });
  });

  const checkBrother = useRefCallback((checkedSet, checkedNode, checked) => {
    checkedNode.parentNode.children.forEach((nd) => {
      if (nd.key !== checkedNode.key) {
        cascadeNode(nd, checkedSet, checked);
      }
    });
  });

  const checkParent = useRefCallback((checkedSet, currentNode, checked) => {
    if (currentNode.key === 'root') {
      return;
    }
    if (!currentNode.canAssignMultiFlows) {
      checked ? checkedSet.add(currentNode.key) : checkedSet.delete(currentNode.key);
    }
    if (checked) {
      if (currentNode.parentNode.key !== 'root') {
        if (!currentNode.parentNode.canAssignMultiFlows) {
          checkBrother(checkedSet, currentNode, false);
        }
        checkParent(checkedSet, currentNode.parentNode, true);
      }
    }
  });

  const onCheckHandler = useRefCallback((newCheckedKeys, { checked, node }) => {
    const checkedSet = new Set(newCheckedKeys.checked);
    if (checked) {
      if (node.parentNode.key !== 'root') {
        if (!node.parentNode.canAssignMultiFlows) {
          checkBrother(checkedSet, node, false);
        }
        checkParent(checkedSet, node.parentNode, true);
      }
    } else {
      cascadeNode(node, checkedSet, false);
    }
    setCheckedKeys({ checked: [...checkedSet] });
  });

  useEffect(() => {
    mCtx.ins.setApi({
      invokeOkHandler: async () => {
        if (!isValid(memoTree.root)) {
          return;
        }
        const checkedNodes = getCheckedNodes();
        await callBack?.(
          checkedNodes.map((checkedNode) => {
            return ({
              nodeId: checkedNode.parentId,
              targetNodeId: checkedNode.id
            })
          })
        );
        mCtx.ins?.destroy();
      },
      invokeCancelHandler: async () => {
        await cancelBack?.();
        mCtx.ins?.destroy();
      }
    });
  }, [memoTree]);
  return (
    <Layout style={{ height: 320, padding: '5px 12px' }}>
      <Layout.Flex>
        <Tree
          checkable
          checkStrictly
          checkedKeys={checkedKeys}
          defaultExpandAll
          onCheck={onCheckHandler}
          selectable={false}
          treeData={memoTree.treeData}
        />
      </Layout.Flex>
    </Layout>
  );
}
