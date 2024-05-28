import { zh, type IObject } from '../../util';

/**
 * 定义业务数据接口类型
 */
interface IBussData extends IObject {
  /**
   * @description      业务类型
   */
  busType?: string;

  /**
   * @description      单据(列表页面为当前选中数据行)数据状态
   */
  data?: IObject;
  /**
   * @description      物理主键字段
   * @default          'phid'
   */
  keyField?: string | string[];

  /**
   * @description       单据编码字段
   * @default           'bill_no'
   */
  billNoField?: string;

  /**
   * @description       单据名称字段
   * @default           'bill_name'
   */
  billNameField?: string;

  /**
   * @description       单据日期字段
   * @default           'bill_dt'
   */
  billDtField?: string;

  /**
   * @description      所属项目字段
   * @default          'phid_pc'
   */
  projectField?: string;

  /**
   * @description      所属组织字段
   * @default          'phid_org'
   */
  orgField?: string;

  /**
   * @description      所属部门字段
   * @default          'phid_dept'
   */
  deptField?: string;

  /**
   * @description      附件标志字段
   * @default          'asr_flag'
   */
  asrField?: string;

  /**
   * @description      工作流状态字段
   * @default          'wf_flag'
   */
  wfField?: string;

  /**
   * @description      审核状态字段
   * @default          'app_status'
   */
  appField?: string;

  /**
   * @description      审核人字段
   * @default          'phid_app'
   */
  approverField?: string;

  /**
   * @description      审核时间字段
   * @default          'app_dt'
   */
  appDtField?: string;

  /**
   * @description      归档状态字段
   * @default          'arc_flag'
   */
  arcField?: string;

  /**
   * @description      记账状态字段
   * @default          'tr_flag'
   */
  trField?: string;

  /**
   * @description      IMP方案id字段
   * @default          'phid_schemeid'
   */
  schemeIdField?: string;
}

export type BussDataType = (params: { id: string }) => Promise<IBussData> | IBussData;

/**
 * 处理toolbar按钮的前置事件
 */
async function handleBeforeClick(payload: { id: string; button: IObject; data: IBussData }) {
  const { data, button: handleEvent, ...params } = payload;
  if (zh.isFunction(handleEvent.before)) {
    process.env.NODE_ENV === 'development' && console.log(`before ${params.id}`, [params, data]);
    return await handleEvent.before({ ...params, data });
  }
  return;
}

/**
 * 处理toolbar按钮的后置事件
 */
async function handleAfterClick(payload: { id: string; value: any; button: IObject; data: IBussData }) {
  const { data, button: handleEvent, ...params } = payload;
  if (zh.isFunction(handleEvent.after)) {
    process.env.NODE_ENV === 'development' && console.log(`after ${params.id}`, [params, data]);
    return await handleEvent.after({ ...params, data });
  }
}

/**
 * 处理toolbar按钮的当前事件
 */
async function handleCurrentClick(payload: { params: any; onClick: Function; data: IBussData }) {
  const { params, onClick, data } = payload;
  let result;
  result = await onClick?.({ ...params, data });
  return result;
}

/**
 * 处理toolbar按钮事件
 * @param payload
 */
export async function handleClick(payload: any) {
  const { onClick, getData, button, ...params } = payload;
  const data = getData ? await getData({ id: params.id }) : {};
  if ((await handleBeforeClick({ ...params, data, button })) === false) {
    // 前置事件返回false时，事件执行被中止
    return;
  }
  const currentValue = await handleCurrentClick({ params, onClick, data });
  await handleAfterClick({ ...params, value: currentValue, data, button });
  return currentValue;
}
