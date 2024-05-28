import { getDetail } from '../service';

export default {
  namespace: 'namespace_01',
  state: {
    busType: 'demoBusType', // 业务类型，用于获取layout UI元数据，配置生效
    title: 'definePage 参数：',
    detail: { content: '' }
  },
  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload };
    }
  },
  effects: {
    *getDetail({ payload }, { call, put }) {
      const detail = yield call(getDetail, payload);
      yield put({ type: 'updateState', payload: { detail } });
    }
  }
};
