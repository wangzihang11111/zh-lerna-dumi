import { IObject, zh } from "@zh/zh-design";

/**
* 获取列表数据
* @param param 参数
* @returns
*/

export async function getList({ pageIndex, pageSize, treeNode, ...queryFilter }: IObject) {
    try {
        const { code, data: { list: record, total } } = await zh.request.body({
            url: '/fbgl/zcsbdqm/queryZcsbdqmMainList',
            data: {
                pageIndex,
                pageSize,
                queryfilter: queryFilter,
                treeNode
            }
        });
        return code === 0 ? { total, record } : { total: 0, record: [] };
    } catch (e) {
        return { total: 0, record: [] };
    }
}

/**
* 删除数据行
* @param param id当前数据行的主键
*/
export async function deleteItems({ idList }: { idList: string[] }): Promise<[boolean, string]> {
    const { code, message } = await zh.request.body({
        url: '/fbgl/zcsbdqm/deleteZcsbdqmMainList',
        data: idList,
    });
    return [code === 0, message];
}

