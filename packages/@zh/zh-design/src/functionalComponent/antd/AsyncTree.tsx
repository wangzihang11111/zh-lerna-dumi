import { SearchOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import React, { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { Input } from '../../baseComponent';
import {
  compHoc,
  cssVar,
  HighlightText,
  IObject,
  Layout,
  TypeExtends,
  zh,
  useAsyncEffect,
  useAsyncSuspense,
  useDebounce,
  useRefCallback,
  useRefState,
  useZhEffect
} from '../../util';
import { Tree, TreeLoading, TreeProps } from './tree';

/**
 * 树节点过滤函数
 * @param value 关键词
 * @param node 树节点
 */
const filterTreeNode = (value, node, nodeKey = 'key') => {
  const lowerCaseValue = value?.toLowerCase() || '';
  const keyId = node[nodeKey];
  return node.title?.toLowerCase().indexOf(lowerCaseValue) > -1 || keyId === value;
};

/**
 * 更新树子节点
 * @param nodes
 * @param key
 * @param children
 */
function updateTreeData(nodes: any[], key: React.Key, children: any[], nodeKey: string = 'key'): any[] {
  let find = false;
  return nodes.map((node) => {
    if (node[nodeKey] === key) {
      find = true;
      return {
        ...node,
        ...(children.length
          ? { children }
          : {
              isLeaf: true
            })
      };
    }
    if (!find && node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children, nodeKey)
      };
    }
    return node;
  });
}

/**
 * 树控件， 默认不懒加载 包括部门 无权限 过滤休眠
 * @param treeLoad 树加载完成
 * @param reader 数据加载器
 * @param onSelectedChange 选择节点变化
 * @param onCheck 点击复选框触发
 * @param onSelect 点击树节点触发
 * @param lazyLoad 懒加载子节点
 * @param onSearch 查询完成回调
 * @param props 树属性
 * @constructor
 */
function TreeRender({
  treeLoad,
  reader,
  onSelectedChange = undefined,
  onCheck,
  onSelect,
  lazyLoad,
  onSearch,
  defaultChange = false,
  ...props
}: any) {
  const data = reader().data;
  const treeRef = useRef<any>();
  const searchType = useRef<any>({});
  const treeId = useId();
  const [{ data: state, key: treeKey }, setState] = useRefState({ data, key: treeId });
  const nodeKey = props.fieldNames?.key || 'key';

  useEffect(() => {
    setState({ data });
  }, [data]);

  const [treeSelectCallback, onCheckCallback, onSelectCallback, onSearchCallback] = [
    useRefCallback((keys, { nodes, node }, type, dispatchChange = true) => {
      if (!treeRef.current) {
        return;
      }
      const lastSelectedKeys = treeRef.current.selectedKeys || '';
      treeRef.current.selectedKeys = keys.join(',');
      type === 'selected' && (treeRef.current.activeNode = node);
      treeRef.current.selectNodes = nodes;
      treeRef.current.selectType = type;
      if (dispatchChange && treeRef.current.selectedKeys !== lastSelectedKeys) {
        onSelectedChange && onSelectedChange(keys, nodes, type);
      }
    }),
    useRefCallback<any>((...args) => {
      treeSelectCallback(
        args[0].checked ? args[0].checked : args[0],
        {
          nodes: args[1].checkedNodes,
          node: args[1].node
        },
        'checked'
      );
      onCheck && onCheck(...args);
    }),
    useRefCallback((...args) => {
      treeSelectCallback(args[0], { nodes: args[1].selectedNodes, node: args[1].node }, 'selected');
      onSelect && onSelect(...args);
    }),
    useDebounce(
      (value, includeChildren = false) => {
        searchType.current = { type: 'search', value };
        const filterData = value
          ? zh.filterTree(data.nodes, (node) => filterTreeNode(value, node, nodeKey), { includeChildren })
          : data.nodes;

        setState((p) => {
          return {
            key: `${treeId}_${value}`,
            data: {
              ...p.data,
              nodes: filterData
            }
          };
        });
      },
      { wait: 300 }
    )
  ];

  const onPropsSearch = useRefCallback((...args) => {
    onSearch?.(...args);
    searchType.current.type = null;
  });

  useEffect(() => {
    if (searchType.current.type === 'search' && state.nodes !== undefined) {
      onPropsSearch(searchType.current.value, state.nodes);
    }
  }, [state.nodes]);

  const getState = useRefCallback(() => state);

  useAsyncEffect(async () => {
    if (state.nodes !== undefined) {
      await treeLoad(treeRef, getState, onSearchCallback, searchType);
    }
  }, [state.nodes]);

  const treeProps: any = props;
  if (props.checkable) {
    treeProps.selectable = props.selectable ?? false;
    treeProps.onCheck = onCheckCallback;
    treeProps.onSelect = (...args) => {
      treeRef.current.activeNode = args[1].node;
      onSelect && onSelect(...args);
    };
    treeProps.defaultCheckedKeys = props.defaultCheckedKeys || state.defaultCheckedKeys;
    if (treeProps.selectable) {
      treeProps.defaultSelectedKeys = props.defaultSelectedKeys || state.defaultSelectedKeys;
    }
  } else {
    treeProps.onSelect = onSelectCallback;
    treeProps.defaultSelectedKeys = props.defaultSelectedKeys || state.defaultSelectedKeys;
  }

  if (props.virtual === undefined) {
    treeProps.virtual = state._nodeCount_ > 60;
  }

  useAsyncEffect(async () => {
    const checkedKeys = state.defaultSelectedKeys;
    if (checkedKeys?.length) {
      treeSelectCallback(
        checkedKeys,
        { nodes: state.defaultSelectedNodes, node: state.firstNode },
        'selected',
        defaultChange
      );
    }
  }, [state.defaultSelectedKeys]);

  useAsyncEffect(async () => {
    const checkedKeys = state.defaultCheckedKeys;
    if (checkedKeys?.length) {
      treeSelectCallback(
        checkedKeys,
        {
          nodes: state.defaultCheckedNodes,
          node: state.defaultCheckedNodes[0]
        },
        'checked',
        defaultChange
      );
    }
  }, [state.defaultCheckedKeys]);

  const titleRender = useRefCallback((node) => {
    const oldRender = () => {
      const title = node[treeProps.fieldNames?.title || 'title'];
      return zh.isString(title) && searchType.current.value ? (
        <HighlightText keyword={searchType.current.value} content={title} />
      ) : (
        title
      );
    };
    if (treeProps.titleRender) {
      return treeProps.titleRender(node, oldRender);
    }
    return oldRender();
  });

  if (lazyLoad) {
    treeProps.loadData = async (parentNode) => {
      if (parentNode.children) {
        return;
      }
      const children = await lazyLoad(parentNode, getState().keyRef);
      setState((p) => {
        return {
          ...p,
          data: {
            ...p.data,
            nodes: updateTreeData(p.data.nodes, parentNode[nodeKey], children, nodeKey)
          }
        };
      });
    };
  }

  if (state.nodes?.length) {
    const defaultExpandAll = searchType.current.type === 'search' && searchType.current.value && !lazyLoad;
    if (treeProps.autoExpandParent && defaultExpandAll) {
      delete treeProps.autoExpandParent;
    }
    return (
      <Tree
        key={treeKey}
        directoryTree
        defaultExpandedKeys={state.defaultExpandedKeys}
        defaultExpandAll={defaultExpandAll}
        showIcon
        ref={treeRef}
        {...treeProps}
        titleRender={titleRender}
        treeData={state.nodes}
      />
    );
  }
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
}

interface AsyncTreeProps extends TreeProps {
  /**
   * @description       是否显示树节点过滤
   * @default           true
   */
  showFilter?: boolean | ((defaultNode: ReactNode) => ReactNode);
  /**
   * @description       过滤属性，{includeChildren: true} 表示包含下级节点
   */
  filterOptions?: { includeChildren?: boolean };
  /**
   * @description       是否启用懒加载
   * @default           false
   */
  lazyLoad?: boolean;
  /**
   * @description       选中树节点时触发
   */
  onSelectedChange?: (keys: Array<any>, nodes: Array<any>, type: 'checked' | 'selected') => void;
  /**
   * @description       树节点渲染完成触发
   */
  onLoad?: (...args) => void;
  /**
   * @description       发起节点数据的请求
   */
  request: (...args) => Promise<any>;
  /**
   * @description       树节点数据加载完成后触发
   */
  dataLoad?: (nodes: Array<object>, extraParams?: object) => Array<object>;
  /**
   * @description       重写节点的属性
   */
  convertNode?: (
    data: object,
    levelIndex: { level: number; index: number }
  ) => IObject & { isSelected?: boolean; isChecked?: boolean; key: string; title: ReactNode; expanded?: boolean };
  /**
   * @description       request 注入的参数
   */
  params?: IObject | Function;

  /**
   * @description       默认选中状态是否触发状态更新事件
   * @default           false
   */
  defaultChange?: boolean;

  /**
   * @description       查询完成回调
   */
  onSearch?: (searchValue: string, nodes: any[]) => void;
}

export type IAsyncTreeProps = TypeExtends<
  AsyncTreeProps,
  {
    titleRender?: (node: any, oldRender: Function) => ReactNode;
  }
>;

/**
 * 格式化树节点
 * @param parentNode 父节点
 * @param nodes 原始数据节点
 * @param convertNode 转换node节点
 * @param extraParams 扩展参数
 * @param level 树层级
 */
function formatTreeNodes(parentNode, nodes, convertNode, extraParams, level = 0) {
  if (!nodes) return [];
  if (!convertNode) {
    convertNode = (n) => n;
  }
  const nodeKey = extraParams.fieldNames?.key || 'key';
  return nodes.map((data, index) => {
    const depth = { level, index };
    const node: any = {
      depth,
      parentNode,
      ...convertNode(data, depth)
    };

    if (extraParams.initTreeData) {
      if (node[nodeKey] && node.isSelected) {
        extraParams.defaultSelectedKeys.push(node[nodeKey]);
        extraParams.defaultSelectedNodes.push(node);
        extraParams.firstNode = extraParams.firstNode || node;

        // 当前节点默认选中时，需要默认展开父节点
        if (parentNode?.[nodeKey] && !extraParams.defaultExpandedKeys.includes(parentNode[nodeKey])) {
          extraParams.defaultExpandedKeys.push(parentNode[nodeKey]);
        }
      }
      if (node[nodeKey] && node.isChecked) {
        extraParams.defaultCheckedKeys.push(node[nodeKey]);
        extraParams.defaultCheckedNodes.push(node);
      }
      extraParams._nodeCount_ += 1;
    }

    if (extraParams.lazyLoad) {
      if (data.children) {
        node.isLeaf = false;
        node.children = formatTreeNodes(node, data.children, convertNode, extraParams, depth.level + 1);
      }
    } else {
      node.isLeaf = !(data.children && data.children.length);
      if (!node.isLeaf) {
        node.children = formatTreeNodes(node, data.children, convertNode, extraParams, depth.level + 1);
      }
    }

    if (node.children?.length) {
      if (depth.level === 0 || node.expanded || extraParams.keyword) {
        // 默认展开第一级节点
        // 默认展开expanded=true的节点
        // 查询时，默认全部展开
        extraParams.defaultExpandedKeys.push(node[nodeKey]);
      }
    }

    node[nodeKey] && (extraParams.keyRef[node[nodeKey]] = node);

    return node;
  });
}

/**
 * 加载树数据
 * @param props
 */
async function getTreeInfo(props) {
  const { dataLoad, request, convertNode, lazyLoad, params, _isRefresh_ = false, fieldNames } = props;
  const transformData = dataLoad || ((n) => n);
  const extraParams: any = {
    lazyLoad,
    fieldNames,
    initTreeData: true,
    defaultExpandedKeys: [],
    defaultCheckedKeys: [],
    defaultCheckedNodes: [],
    defaultSelectedKeys: [],
    defaultSelectedNodes: [],
    firstNode: null,
    _nodeCount_: 0,
    keyRef: {}
  };
  try {
    let requestParams = params;
    if (zh.isFunction(params)) {
      requestParams = await params();
    }
    const nodes = await request({ ...requestParams }, _isRefresh_);
    return {
      nodes: transformData(formatTreeNodes(null, nodes, convertNode, extraParams), extraParams),
      ...extraParams
    };
  } catch {
    return {
      nodes: transformData([]),
      ...extraParams
    };
  }
}

/**
 * 导出异步树控件
 */
export const AsyncTree = compHoc<IAsyncTreeProps>(
  ({ onLoad, showFilter = true, style, filterOptions = {}, ...props }) => {
    const { params, dataLoad, request, convertNode, outRef, lazyLoad, loadData, treeData, virtual, ...others } = props;
    const loadRef = useRef<any>({
      resolve: null,
      beforeLoad({ resolve }) {
        this.resolve = resolve;
      },
      onLoad() {
        if (this.resolve) {
          this.resolve(true);
          this.resolve = null;
        }
      }
    });
    const parameters = {
      ...props,
      dataLoad: (...args) => {
        loadRef.current.onLoad();
        return dataLoad ? (dataLoad as any)(...args) : args[0];
      }
    };
    const [dataReader, setDataReader] = useAsyncSuspense(getTreeInfo, parameters, request);
    const [search, setSearch] = useState({ type: '', value: '' });
    const lastParams = useRef<any>(params);
    const updateParams = useRefCallback((newParam = {}, isRefresh = false) => {
      lastParams.current = { ...lastParams.current, ...newParam };
      setDataReader({
        ...parameters,
        params: zh.isFunction(newParam) ? newParam : lastParams.current,
        _isRefresh_: isRefresh
      });
    });

    const treeLoadCallback = useRefCallback((treeRef, getState, filter, searchType) => {
      outRef.current = {
        ...outRef.current,
        ...treeRef.current,
        searchType,
        filterTreeNode(value) {
          return filter(value, filterOptions?.includeChildren);
        },
        refresh(newParam: any = {}, isRefresh = false) {
          return new Promise((resolve) => {
            loadRef.current.beforeLoad({ resolve });
            getState().nodes = undefined;
            updateParams(newParam, isRefresh);
          });
        },
        getSelectedNodes() {
          return treeRef.current?.selectNodes || [];
        },
        getActiveNode() {
          return treeRef.current?.activeNode;
        },
        getNodes() {
          return getState().nodes || [];
        },
        getSelectType() {
          return treeRef.current?.selectType;
        },
        getNodeByKey(key?) {
          return key ? getState().keyRef[key] : getState().keyRef;
        }
      };
      onLoad?.(outRef.current, getState());
      outRef.current._compIns?.getObserver().prevNotify({ ins: outRef.current }, 'onLoad').then();
    });

    const debounceRefresh = useDebounce(
      (newParam, isRefresh) => {
        outRef.current?.refresh?.(newParam, isRefresh);
      },
      { wait: 300, immediate: false }
    );

    const getRefresh =
      (debounce = false) =>
      (newParam: IObject = {}, isRefresh = false) => {
        if (debounce) {
          debounceRefresh(newParam, isRefresh);
        } else {
          outRef.current?.refresh?.(newParam, isRefresh);
        }
      };

    useEffect(() => {
      if (
        (zh.isFunction(params) && lastParams.current !== params) ||
        (zh.isObject(params) && !zh.isPropsEqual(lastParams.current, params, { shallow: true, exclude: ['keyword'] }))
      ) {
        getRefresh()(params);
      }
    }, [params]);

    useZhEffect(
      () => {
        getRefresh()();
      },
      [request],
      false
    );

    useEffect(() => {
      if (search.type && outRef.current?.searchType) {
        outRef.current.searchType.current = search;
        if (search.type === 'refresh' || lazyLoad) {
          getRefresh(search.type === 'search')({ keyword: search.value }, search.type === 'refresh');
        } else {
          outRef.current?.filterTreeNode?.(search.value);
        }
      }
    }, [search, lazyLoad]);

    const onLazyLoad = lazyLoad
      ? async (parentNode: any, keyRef: IObject) => {
          const { dataLoad, request, convertNode, params } = props;
          const transformData = dataLoad || ((n) => n);
          try {
            let requestParams = params;
            if (zh.isFunction(params)) {
              requestParams = await params(parentNode);
            }
            const extraParams = { lazyLoad: true, keyRef };
            const nodes = await request({ parentNode, ...requestParams });
            parentNode.children = transformData(
              formatTreeNodes(parentNode, nodes, convertNode, extraParams, parentNode.depth.level + 1),
              extraParams
            );
            return parentNode.children;
          } catch (e) {
            console.log(e);
            return [];
          }
        }
      : null;

    const defaultFilter = (
      <Layout direction="row" style={{ padding: 5, alignItems: 'center' }}>
        <Input
          value={search.value}
          onChange={(value: any) => setSearch({ type: 'search', value: value?.trim?.() || '' })}
          allowClear
          suffix={search.value ? <></> : <SearchOutlined style={{ opacity: 0.45 }} />}
        />
      </Layout>
    );

    const filterNode = zh.isFunction(showFilter) ? showFilter(defaultFilter) : showFilter ? defaultFilter : null;

    return (
      <Layout style={{ backgroundColor: cssVar.componentColor, ...style }}>
        {filterNode}
        <Layout.Flex style={{ position: 'relative', overflow: 'hidden' }}>
          <React.Suspense fallback={<TreeLoading />}>
            <TreeRender
              {...others}
              virtual={virtual ?? lazyLoad}
              reader={dataReader}
              treeLoad={treeLoadCallback}
              lazyLoad={onLazyLoad}
            />
          </React.Suspense>
        </Layout.Flex>
      </Layout>
    );
  },
  'AsyncTree'
);
