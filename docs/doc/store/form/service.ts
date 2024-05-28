import { zh } from '@zh/zh-design';

/**
 * 模拟获取表单明细请求
 */
export async function getFormData() {
  await zh.delay(100);
  return { cno: '00001', dt: new Date() };
}
