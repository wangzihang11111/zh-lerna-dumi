import { getFormData } from './service';

export default {
  namespace: 'namespace_form1',
  state: {
    busType: 'formBusType', // 业务类型，用于获取layout UI元数据，配置生效
    form: {
      colspan: 3,
      confKey: ['form', 'mainForm'],
      value: {}
    },
    fieldSetForm: {
      confKey: ['fieldSetForm', 'PaymentBill'],
      value: {}
    }
  },
  reducers: {
    updateFormValue(state, { payload: { value } }) {
      return { ...state, form: { ...state.form, value } };
    }
  },
  effects: {
    *loadFormData({ payload }, { call, put }) {
      const value = yield call(getFormData, payload);
      yield put({ type: 'updateFormValue', payload: { value } });
    }
  }
};
