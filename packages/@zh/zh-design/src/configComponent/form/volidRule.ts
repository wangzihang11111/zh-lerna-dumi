import { zh } from '../../util';

/**
 * 表单校验
 */
const typeSet = new Set([
  'string',
  'number',
  'boolean',
  'method',
  'regexp',
  'integer',
  'float',
  'array',
  'object',
  'enum',
  'date',
  'hex',
  'email',
  'url',
  'any'
]);

type volidRule = Array<{ [propskey: string]: any; message?: string }>;

//初始化校验规则
export function initRules(formConf) {
  const fields = formConf.children;
  if (!fields || !Array.isArray(fields)) {
    return {};
  }
  let defaultRules: any = {};
  fields.forEach((item) => {
    const { name, onlyRequiredStyle = false } = item;
    const nameKey = zh.isArray(name) ? name.join('.') : name;
    const comType = item.xtype?.toLowerCase?.() || '';
    const skipRules =
      ['select', 'singlehelp', 'multiplehelp', 'checkbox', 'checkboxgroup', 'radio', 'radiogroup', 'switch'].includes(
        comType
      ) || comType.endsWith('help');
    let rule: volidRule = [];
    //类型
    const type = item.valueType;
    if (typeSet.has(type)) {
      rule.push({ type, message: `必须是${type}类型` });
    }
    //必填项
    if (item.required && !onlyRequiredStyle) {
      rule.push({
        required: item.required && item.required !== 'false',
        message: `请输入${item.label || ''}`
      });
    }
    //长度
    if (item.maxLength && !skipRules) {
      rule.push({
        validator: (_, value) => {
          if (zh.strLen(value) <= item.maxLength) {
            return Promise.resolve();
          } else {
            return Promise.reject(`${item.label || ''}最长为${item.maxLength}个字符`);
          }
        }
      });
    }
    //最小值
    if (item.min && !skipRules) {
      rule.push({
        validator: (_, value) => {
          const v = +value;
          if (isNaN(v) || v >= item.min) {
            return Promise.resolve();
          } else {
            return Promise.reject(`${item.label || ''}最小为${item.min}`);
          }
        }
      });
    }
    //最大值
    if (item.max && !skipRules) {
      rule.push({
        validator: (_, value) => {
          const v = +value;
          if (isNaN(v) || v <= item.max) {
            return Promise.resolve();
          } else {
            return Promise.reject(`${item.label || ''}最大为${item.max}`);
          }
        }
      });
    }
    //自定义
    if (item.customRule) {
      const { test, message } = item.customRule;
      rule.push({ validator: test, message });
    }
    if (item.rules) {
      Array.isArray(item.rules) ? rule.push([...item.rules]) : rule.push(item.rules);
    }
    defaultRules[nameKey] = rule;
    if (item.xtype === 'container' && Array.isArray(item.items || item.children)) {
      defaultRules = {
        ...defaultRules,
        ...initRules({ children: item.items || item.children })
      };
    }
  });
  return defaultRules;
}

//mergeRule 合并校验规则
export function mergeRules(oldRules: any, newRules: any) {
  if (!newRules) return oldRules;
  return { ...oldRules, ...newRules };
}
