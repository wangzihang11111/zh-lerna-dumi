import { zh, IObject } from '@zh/zh-design';

/**
* 保存数据
* @param payload
* @returns
*/
export async function saveDataByPost(payload: IObject): Promise<[boolean, string]> {
    const { code, message } = await zh.request.body({
        url: '/fbgl/zcsbdqm/saveOrUpdateZcsbdqmMain',
        data: payload,
    });
    return [code === 0, message];
}

/**
* 获取表单数据，包含明细数据
* @returns IObjectsaveDataByPost
*/
export async function getAllData() {
    const id = zh.getQueryValue('id');
    if (!id) return {};

    const { code, data } = await zh.request.get({
        url: '/fbgl/zcsbdqm/queryZcsbdqmMainDetail',
        data: { id }
    });
    return code === 0 ? data : {};
}