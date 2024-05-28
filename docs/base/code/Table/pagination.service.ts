import { zh } from '@zh/zh-design';

export async function loadData(params: any) {
  console.log(params);
  const { pageIndex, pageSize, columnFilters = {} } = params;
  await zh.delay(200); // 模拟请求延时
  const total = 52;
  const currentRows = Math.min(pageSize * pageIndex, total) - (pageIndex - 1) * pageSize;
  const record = new Array(currentRows).fill(1).map((v, idx) => {
    return {
      id: pageSize * (pageIndex - 1) + idx,
      name: columnFilters.name || ['张三', '李四', '王五'][idx % 3],
      age: columnFilters.age ?? pageSize * pageIndex + idx,
      sex: columnFilters.sex ?? idx % 2,
      attachment:  idx % 2,
      ts: idx + 1,
      address: columnFilters.address
        ? columnFilters.address[idx % columnFilters.address.length]
        : ['北京', '上海市虹桥区xxx小区xx幢', '深圳'][idx % 3]
    };
  });
  return { total, record, aggregates: { name: { custom: `${total}条` } }, summaryData: { ts: 300 } };
}

export async function loadData1(params: any = {}) {
  console.log(params);
  const { columnFilters = {} } = params;
  await zh.delay(250); // 模拟请求延时
  const total = 36;
  return new Array(total).fill(1).map((v, idx) => {
    return {
      id: idx,
      name: columnFilters.name || ['张三', '王五'][idx % 2],
      age: columnFilters.age || 1 + idx,
      sex: columnFilters.sex || ['男', '女'][idx % 2],
      address: columnFilters.address || ['北京', '上海', '杭州'][idx % 3]
    };
  });
}
