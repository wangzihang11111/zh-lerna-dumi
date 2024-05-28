import { getAllData } from "./service";
import { IObject } from '@zh/zh-design';

export default {
    namespace: 'zcsbdqmDetail',
    state: {
        busType: 'zcsbdqm', // 业务类型，用于获取layout UI元数据，配置生效
        toolbarCfg: {
            // toolbar基础配置
            rightName: 'zcsbdqm',
            showIcon: false,
            style: { padding: 0, width: 'auto' }
        },
        // 这里要改下
        data: {
            zcsbdqmDetailVoList: undefined,
            zcsbdqmMainVo: {}
        }
    },
    reducers: {
        updateState(state: any, { payload }: any) {
            return { ...state, ...payload };
        }
    },
    effects: {
        //获取主表数据
        *getAllData({ }, { call, put }: any) {
            const data: IObject = yield call(getAllData);
            yield put({ type: 'updateState', payload: { data } });
        }
    }
};