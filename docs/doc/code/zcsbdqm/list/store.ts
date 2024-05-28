import { getList } from "./service";
import { TableSelectionModel } from "@zh/zh-design";

export default {
    namespace: 'zcsbdqmList',
    state: {
        busType: 'zcsbdqm', // 业务类型，用于获取layout UI元数据，配置生效
        toolbarCfg: { // toolbar基础配置
            rightName: 'zcsbdqm',
            showIcon: false,
            style: { padding: '0 0 var(--inner-padding, 8px) 0', minHeight: 40 }
        },
        queryCfg: { // 内嵌查询
            pageId: "zcsbdqm"
        },
        tableCfg: { // 列表基础配置
            showRowNumber: true,
            checkbox: true,
            autoLoad: false,
            rowSelection: {
                type: TableSelectionModel.MULTIPLE_INTERVAL,
                keyField: 'id'
            },
            pagination: true,
            request: getList
        }
    },
    reducers: {
        updateState(state: any, { payload }: any) {
            return { ...state, ...payload };
        }
    },
    effects: {
    }
};