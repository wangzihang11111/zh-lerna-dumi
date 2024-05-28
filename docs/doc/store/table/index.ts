export default {
  namespace: 'namespace_table1',
  state: {
    busType: 'formBusType', // 业务类型，用于获取layout UI元数据，配置生效
    table: {
      confKey: ['grid', 'editList'],
      bordered: true,
      style: { height: 150 }
    }
  },
  reducers: {},
  effects: {}
};
