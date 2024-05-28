/**
 * title: 列表实例
 * background: '#f0f2f5'
 */
import model from "./store";
import { Layout, ToolBar, GridView, QueryPanel, zh, definePage, BaseComponent, OType, message, showConfirm, $WorkFlow, useUIConfig, ProjectTree, Panel, useRefCallback, flexStyle, FullPage, useAllReady } from "@zh/zh-design";
import { deleteItems } from "./service";
import { useMemo, useRef } from "react";
import React from "react";
const { Flex, Slider } = Layout;

/**
* 视图UI
* @param page 当前页面实例，获取公共api或业务逻辑
* @constructor
*/
function PageLayout({ page }: { page: PageComponent }) {
    const { toolbarCfg, queryCfg, tableCfg } = page.getDvaState();
    const { children: buttons } = useUIConfig({ confKey: ['toolbar', 'listbar', 'top'] });
    const { children: opButtons } = useUIConfig({ confKey: ['toolbar', 'listbar', 'listgrid'] });
    const { children: columns } = useUIConfig({ confKey: ['grid', 'listgrid'] });
    const showTree = page.isShowProjectOrgTree();
    const fullRef = useRef<HTMLElement>(null);
    const topButtons = useMemo(() => {
        const tmp = [...buttons];
        !tmp.some((b: any) => (b.type === 'flex' || b === '->')) && tmp.push('->');
        tmp.push(<span ref={fullRef} />);
        return tmp;
    }, [buttons]);
    const gridColumns = useMemo(() => {
        if (opButtons?.length) {
            return [...columns, {
                dataIndex: '_op_', title: '操作',
                fixed: 'right', width: 152,
                render(params: any) {
                    return <ToolBar rightName={toolbarCfg.rightName} getData={() => params} containerId="grid" buttons={opButtons} showIcon={false} type="link" size="small" style={{ padding: 0 }} />;
                }
            }];
        }
        return columns;
    }, [columns, opButtons]);

    const renderTree = () => {
        if (showTree) {
            return (
                <Slider size={200} style={{ margin: '0 var(--inner-margin, 16px) 0 0' }}>
                    <Panel title="项目组织树" autoFit bodyStyle={{ padding: 'var(--inner-padding, 8px)' }}>
                        <ProjectTree id="tree" ref={page.getRef('tree')} defaultSelectedFirstNode />
                    </Panel>
                </Slider>
            );
        }
        return null;
    };

    const request = useRefCallback(params => {
        const node = page.getRef('tree').current?.getApi()?.getSelectedNodes?.()?.[0];
        return tableCfg.request({ ...params, treeNode: node ? { id: node.id, leafType: node.leafType } : page.globalProject });
    });

    useAllReady((_, options) => {
        // 编辑
        options.useClick(({ args: [{ data: { row } }] }) => {
            if ([1, 2].includes(row.wfFlg)) {
                message.warn("单据已经送审，不能编辑！");
                return;
            }
            zh.open('/zcsbdqm/detail', { oType: OType.Edit, id: row.id });
        }, 'grid.edit');
        // 查看
        options.useClick(({ args: [{ data: { row } }] }) => {
            zh.open('/zcsbdqm/detail', { oType: OType.View, id: row.id });
        }, 'grid.view');
        // 送审
        options.useClick(async ({ args: [{ data: { row } }] }) => {
            if ([1, 2].includes(row.wfFlg)) {
                message.warn("单据已经送审！");
                return;
            }
            await $WorkFlow.startFlow({ appCode: '0100', bizCode: page.busType, dataId: row.id, orgId: row.orgId || row.org_id }).then(() => {
                page.getGrid('grid').refreshData();
            });
        }, 'grid.check');
        // 流程追踪
        options.useClick(async ({ args: [{ data: { row } }] }) => {
            if (row.wfFlg) {
                await $WorkFlow.showFlowInfo(page.busType, row.id);
            } else {
                message.warn("单据未送审！");
                return;
            }
        }, 'grid.history');
    });

    return (
        <Layout direction="row" autoFit style={{ padding: 'var(--outer-margin, 16px)' , height: '80vh'}}>
            {renderTree()}
            <Flex direction="column">
                {/* <QueryPanel id="query" {...queryCfg} gridRef={page.getRef('grid')} /> */}
                <FullPage className="flex-column" style={{ flex: 1, height: 0 }} getIconContainer={() => fullRef.current}>
                    <Layout style={flexStyle({ paddingBottom: 0 })}>
                        <ToolBar id="toolbar" {...toolbarCfg} buttons={topButtons} onClick={page.onToolbarClick} />
                        <Flex>
                            <GridView id="grid" ref={page.getRef('grid')} {...tableCfg} columns={gridColumns} request={request} />
                        </Flex>
                    </Layout>
                </FullPage>
            </Flex>
        </Layout>
    );
}


/**
* model数据层自动和page组件绑定
* this.umiDispatch 执行effects方法更新数据状态
*/
class PageComponent extends BaseComponent {

    /**
    * 全局选中的项目
    */
    globalProject: { id: string; leafType: string } | null = null;

    /**
    * 是否显示项目组织树
    */
    isShowProjectOrgTree() {
        const uiCfg = zh.getObjValue(this.getLayout(), ['grid', 'listgrid']);
        const showTreeCfg = !!uiCfg?.showProjectOrgTree;
        if (showTreeCfg) {
            const projectId = zh.getUser()?.projectId;
            if (projectId) {
                this.globalProject = { id: projectId, leafType: 'PROJECT' };
                return false;
            }
            return true;
        }
    }

    getGrid(id: string) {
        return this.getRef(id).current?.getApi() || {};
    }

    /**
    * 删除方法
    */
    handleDelete = async () => {
        const keys: Set<string> = this.getGrid("grid").getSelectedKeys();
        const size = keys.size;
        if (!size) {
            message.warn("请先选择数据行！");
        } else {
            const result = await showConfirm({
                title: '确认删除',
                content: <div>将要删除当前勾选的 {size} 条记录？</div>,
            });
            if (result) {
                const result = await deleteItems({ idList: [...keys] });
                if (result[0]) {
                    this.getGrid('grid').refreshData();
                } else {
                    zh.alert(result[1] || '服务器接口错误');
                }
            }
        }
    };

    /**
    * toolbar点击事件
    */
    onToolbarClick = async ({ id }: { id: string; }) => {
        switch (id) {
            case "add": {
                zh.open('/zcsbdqm/detail', { oType: OType.Add });
                break;
            }
            case "delete": {
                await this.handleDelete();
                break;
            }
            default: {
                break;
            }
        }
    };

    /**
    * 初始化(请求)页面数据
    */
    async componentAsyncMount() {
        zh.onRefreshList(this.busType, () => {
            this.getGrid('grid').refreshData();
        });
    }

    render() {
        return <PageLayout page={this} />;
    }
}

import uiConfig from '../zcsbdqm.json';

export default definePage({
    model,
    uiConfig,
    initLoad: { script: false, language: false, ui: true },
    component: PageComponent
});