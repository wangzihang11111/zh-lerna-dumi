import { zh } from '@zh/zh-design';

/**
 * 模拟获取表格请求
 */
export async function getList() {
  await zh.delay(100);
  return [{ cno: '0001', cname: '物资1' }];
}
