import { useMemo, useRef } from "react";
import { saveDataByPost } from './service';
import model from "./store";
import { useRouteProps } from "umi";
import { definePage, BaseComponent, zh, OType, ToolBar, Layout, GridView, TabPanel, WorkFlowPanel, openAttachment, useUIConfig, FormSet, Panel, flexStyle, FullPage, useAllReady, TableSelectionModel, type ColumnProps } from "@zh/zh-design";
import React from "react";
const { Flex } = Layout;


    function getGridProps({ page, disabled, id, columns }: { page: PageComponent; disabled: boolean; id: string; columns: ColumnProps[] }) {
        return {
            id,
            columns,
            ref: page.getRef(id),
            busKey: "id",
            disabled,
            bordered: !disabled,
            headerMenu: false,
            showRowNumber: true,
            rowSelection: {
                type: disabled ? [TableSelectionModel.ROW] : [TableSelectionModel.CHECKBOX, TableSelectionModel.MULTIPLE_INTERVAL],
                keyField: 'id'
            }
        };
    }

    function Container(props: { children: React.ReactElement; 'data-tabid': string; page: PageComponent; disabled: boolean; id: string; }) {
        const { page, "data-tabid": buttonKey, children, disabled, id } = props;
        const { toolbarCfg } = page.getDvaState();
        const compId = id;
        const { children: buttons } = useUIConfig({ confKey: ['toolbar', 'editbar', buttonKey] });
        const fullRef = useRef<HTMLElement>(null);
        const disabledKeys = useMemo(() => {
            return disabled ? ['addrow', 'deleterow'] : [];
        }, [disabled]);
        const topButtons = useMemo(() => {
            const tmp = [...buttons];
            !tmp.some((b: any) => (b.type === 'flex' || b === '->')) && tmp.push('->');
            tmp.push(<span ref={fullRef} />);
            return tmp;
        }, [buttons]);

        const { children: opButtons } = useUIConfig({ confKey: ['toolbar', 'editbar', id] });
        const { children: columns } = useUIConfig({ confKey: ['grid', id] });
        const gridColumns = useMemo(() => {
            if (opButtons?.length) {
                return [...columns, {
                    dataIndex: '_op_', title: '操作',
                    fixed: 'right', width: 120,
                    render(params: any) {
                        return <ToolBar rightName={toolbarCfg.rightName} getData={() => params} containerId={`toolbar_${id}`} buttons={opButtons} showIcon={false} type="link" size="small" style={{ padding: 0 }} />;
                    }
                }];
            }
            return columns;
        }, [columns, opButtons]);

        useAllReady((_, options) => {
            // 增行
            options.useClick(async () => {
                await page.getRef(compId).current?.getApi().addRows({});
            }, `toolbar_${buttonKey}.addrow`);
            // 删行
            options.useClick(async () => {
                await page.getRef(compId).current?.getApi().deleteCheckedRows();
            }, `toolbar_${buttonKey}.deleterow`);
        });

        return (
            <FullPage style={{ height: '100%' }} getIconContainer={() => fullRef.current}>
                <Layout>
                    <ToolBar id={`toolbar_${buttonKey}`} type="text" size="small"
                        style={{ minHeight: 40, padding: 0 }}
                        rightName={toolbarCfg.rightName}
                        disabledKeys={disabledKeys} buttons={topButtons} />
                    <Flex>{React.cloneElement(children, getGridProps({ page, disabled, id, columns: gridColumns }))}</Flex>
                </Layout>
            </FullPage >
        )
    }


    /**
    * UI层
    * @param page 页面实例
    * @constructor
    */
    function PageLayout({ page }: { page: PageComponent }) {
        const { toolbarCfg, data = {} } = page.getDvaState();
        const { loading } = page.props;
        const oType = zh.getQueryValue('oType');

        const { title } = useRouteProps();

        const disabled = ![OType.Add, OType.Edit].includes(oType);

        const disabledKeys = useMemo(() => {
            return disabled ? ['save', 'check'] : [];
        }, [disabled]);

        const { children: buttons } = useUIConfig({ confKey: ['toolbar', 'editbar', 'top'] });

        return (
            <Layout loading={loading?.global} style={{ padding: 'var(--outer-margin, 16px)' }}>
                <Panel title={zh.getQueryValue('appTitle') || title}
                    headerStyle={{ paddingRight: 12 }}
                    extra={<ToolBar disabledKeys={disabledKeys} id='toolbar_top' {...toolbarCfg} buttons={buttons} onClick={page.onToolbarClick} />} />
                <WorkFlowPanel toolbar="toolbar_top" />
                <FormSet
                    confKey={['fieldSetForm', 'zcsbdqmmform']}
                    key={'zcsbdqmmform'}
                    ref={page.getRef('zcsbdqmmform')}
                    disabled={disabled}
                    value={data['zcsbdqmMainVo']}
                />
                <Flex style={flexStyle({})}>
                    <TabPanel confKey={['tabPanel', 'tab1']}>
                        <Container page={page} key={'TabPage1'} data-tabid="TabPage1" disabled={disabled} id={'zcsbdqmd1grid'}>
                            <GridView dataSource={data['zcsbdqmDetailVoList']} />
                        </Container>
                    </TabPanel>
                </Flex>
            </Layout>
        );
    }

    /**
    * model数据层自动和page组件绑定
    * this.umiDispatch 执行effects方法更新数据状态
    */
    class PageComponent extends BaseComponent {
        asrSessionGuid: string | undefined;

        getForm(id: string) {
            return this.getRef(id).current.getApi();
        }

        getGrid(id: string) {
            return this.getRef(id).current?.getApi() || {
                // tab页中的表格可能没有渲染，会导致获取不到组件实例
                validData() { return true; },
                getChange() {
                    return {
                        isChanged: false,
                        table: {}
                    };
                }
            };
        }

        async validData() {
            if (!await this.getForm('zcsbdqmmform').validData()) {

                return false;
            }
            if (!this.getGrid('zcsbdqmd1grid').validData()) {
                return false;
            }
            return true;
        }

    /**
    * 初始化(请求)页面数据，此钩子函数能够保证二开脚本拿到初始数据源
    */
    async componentAsyncMount() {
        if (zh.getQueryValue('oType') === OType.Add) {
            // to do
        } else {
            await this.umiDispatch({
                type: 'getAllData'
            });
        }
    }

    /**
    * 保存数据
    */
    saveData = async () => {
        const success = await this.validData();

        if (success) {
            const result = await saveDataByPost({
                zcsbdqmMainRequest: this.getForm('zcsbdqmmform').getValues(),
                detailZcsbdqmDetailRequest: this.getGrid('zcsbdqmd1grid').getChange(),
                busguid: zh.getQueryValue('id') ?? '',
                asrSessionGuid: this.asrSessionGuid
            });

            if (result[0]) {
                zh.refreshList(this.busType);
                await zh.close();
            } else {
                await zh.alert(result[1] || '服务器错误');
            }
        }
    };

    /**
    * toolbar点击事件
    */
    onToolbarClick = async ({ id }: { id: string; }) => {
        switch (id) {
            case 'save': {
                await this.saveData();
                break;
            }
            case 'back': {
                zh.close();
                break;
            }
            case 'attachment': {
                const result: any = await openAttachment({
                    asrSessionGuid: this.asrSessionGuid,
                    control: true,
                    asrCode: zh.getQueryValue('id'),
                    asrTable: 'zcsbdqm_main',
                    status: zh.getQueryValue('oType') || OType.Add,
                    busTypeCode: this.busType
                });
                this.asrSessionGuid = result.asrSessionGuid;
                break;
            }
            default:
                break;
        }
    };

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