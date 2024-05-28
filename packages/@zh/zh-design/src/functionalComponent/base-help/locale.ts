import { zh } from "../../util";

export const helpLocale = {
  code: '编码',
  name: '名称',
  baseTitle: '通用帮助',
  singleTitle: '单选帮助',
  multipleTitle: '多选帮助',
  OK: '确定',
  Cancel: '取消',
  noSelected: '请先选择数据行',
  searchPlaceholder: '输入关键字检索',
  List: '所有数据',
  CommonUse: '常用数据',
  RecentlyUsed: '最近使用',
  Tree: '树形数据',
  AddCommonUse: '添加常用',
  DelCommonUse: '删除常用',
  addCommonSuccess: '成功添加常用',
  removeCommonSuccess: '成功删除常用'
};

export const setHelpLocale = (helpLang) => zh.assign(helpLocale, helpLang || {});
