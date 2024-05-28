import type { PromiseType } from '../../util';
import { candidateButtons } from './candidate';

interface IBase {
  /**
   * @description       按钮唯一id
   */
  id: string;
  /**
   * @description       按钮文本
   */
  text: string;
}

interface IButton extends IBase {
  /**
   * @description       按钮图标
   */
  icon?: string | React.ReactNode;
  /**
   * @description       id 按钮id，text 按钮显示文本 toolbar 工具条实例 data 注入的业务数据，由getData返回
   */
  onClick: (params: { id: string; text: string; toolbar: any; data: any }) => PromiseType<void>;
  /**
   * @description       点击事件的前置事件，返回false取消向下执行
   */
  before?: (params: { id: string; text: string; toolbar: any; data: any }) => PromiseType<boolean>;
  /**
   * @description       点击事件的后置事件，value属性为click事件的返回值，其他属性同click
   */
  after?: (params: { id: string; text: string; toolbar: any; data: any; value: any }) => PromiseType<boolean>;
}

interface IGroup extends IBase {
  /**
   * @description       子菜单
   */
  children: Array<IButton | IGroup>;
}

type RegButtonType = IButton | IGroup;

const toolbarButtons: Record<string, RegButtonType> = {};

/**
 * 注册业务按钮(重写内置按钮)
 * @param buttons 需要注入的按钮对象
 */
function registerToolBarButton(buttons: RegButtonType[]) {
  const injectButtons = buttons.reduce((p, btn) => ({ ...p, [btn.id]: btn }), {});
  Object.assign(toolbarButtons, injectButtons);
}

/**
 *
 * @param buttonId 返回注入的业务button
 * @returns
 */
function getToolBarButton(buttonId: string): RegButtonType | undefined {
  return toolbarButtons[buttonId] || candidateButtons[buttonId];
}

export { registerToolBarButton, getToolBarButton };
