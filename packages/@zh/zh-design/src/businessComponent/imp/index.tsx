import { showModal } from '../../functionalComponent';
import { getGlobalConfig, zh } from '../../util';
import { SourceHelp } from './cpts/SourceHelp';
import { loadSourceTree } from './service';

export const $ImpSdk = {
  /**
   * 引用来源（imp拉）
   */
  async citeSource(params: ICiteSourceParams): Promise<ArrayReturnType> {
    const errorReturn: ArrayReturnType = [false, void 0];
    const { title, width, height, bizCode, tableName } = params;
    if (!bizCode) {
      zh.alert('参数错误');
      return errorReturn;
    }
    const { helpConfig } = getGlobalConfig().default;
    const [sourceTree, sourceNodes] = await loadSourceTree({ bizCode, tableName });
    if (!sourceNodes.length) {
      zh.alert(zh.isString(sourceTree) ? sourceTree : '未配置数据来源！');
      return errorReturn;
    }
    return new Promise((resolve) => {
      showModal({
        title: title || '选择来源',
        width: width || helpConfig.width,
        height: height || helpConfig.height,
        content: (
          <SourceHelp
            sourceTree={sourceTree}
            bizCode={bizCode}
            tableName={tableName}
            defaultSelectedKeys={[sourceNodes[0].key]}
            sourceCount={sourceNodes.length}
          />
        ),
        async onOk(ins) {
          const result = await ins.getApi().getResult();
          if (result) {
            ins.destroy();
            resolve([true, result]);
          }
        },
        onCancel(ins) {
          ins.destroy();
          resolve(errorReturn);
        }
      });
    });
  },
  /**
   * 生成目的单（imp推）
   */
  async pushBill(params: IPushBillParams): Promise<boolean> {
    const [success, result] = await zh.request.bodyWithArray({
      url: 'zh-rule-engine/bizflow/rulebiz/pushBill',
      data: params
    });
    !success && zh.alert(result);
    return success;
  }
};

zh.registerExternal({
  getImpSdk() {
    return $ImpSdk;
  }
});

type ArrayReturnType = [boolean, any];

interface ICiteSourceParams {
  /**
   * @description  当前表单业务类型
   */
  bizCode: string;
  /**
   * @description  当前表单表名
   */
  tableName: string;
  /**
   * @description  引用来源帮助表体
   * @default      '选择来源'
   */
  title?: string;
  /**
   * @description  帮助宽度
   * @default      1000
   */
  width?: number;
  /**
   * @description  帮助高度
   * @default      600
   */
  height?: number;
}

interface IPushBillParams {
  /**
   * @description  流程编码
   */
  flowCode: string;
  /**
   * @description  流程实例id
   */
  instanceId: string;
  /**
   * @description  业务类型
   */
  bizCode: string;
  /**
   * @description  业务主键id
   */
  bizId: string;
}
