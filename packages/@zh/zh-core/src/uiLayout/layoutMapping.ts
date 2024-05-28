import { getAntApp } from '../appEntry';
import { OType } from '../enum';
import { getGlobalConfig } from '../globalConfig';
import { IObject } from '../interface';
import { getDvaApp } from '../umiExports';
import { core } from '../util';

/**
 * 将object对象转换成tree数据--name为唯一KEY
 */
function confToTree(conf: any) {
  if (conf instanceof Array) return conf; //处理过了
  if (conf.isApp || conf.publicProperty) {
    // 自定义表单UI元数据
    return {
      layout: _handleLayout(conf, conf.isApp ?? conf.publicProperty?.isApp, [
        'isApp',
        'isImp',
        'methodUrl',
        'scriptUrl',
        'userDefScriptUrl',
        'publicProperty',
        'uiLayout'
      ]),
      layoutConfig: conf
    };
  } else {
    return {
      layout: Object.keys(conf).map((key) => {
        return { value: key, name: key, ..._handleLayoutType(key, conf) };
      }),
      layoutConfig: conf
    };
  }
}

/**
 * 处理自定义表单的UI元数据
 */
function _handleLayout(conf: IObject, isApp: boolean, others: string[]) {
  const arr: any = [];
  Object.keys(conf).forEach((category) => {
    if (!others.includes(category)) {
      const categoryValue = conf[category];
      if (core.isObject(categoryValue)) {
        Object.keys(categoryValue).forEach((key) => {
          arr.push({ value: key, category, fromApp: isApp, name: key, ..._handleLayoutType(key, categoryValue) });
        });
      }
    }
  });
  return arr;
}

function _handleLayoutType(key: string, conf: any) {
  switch (key) {
    case 'form':
      return {
        label: '表单',
        ctype: 'form',
        children: Object.keys(<object>conf[<any>key]).map((ikey) => {
          return _handleForm((<any>conf[<any>key])[ikey]);
        })
      };
    case 'fieldSetForm':
      return {
        label: '表单集',
        ctype: 'form',
        children: Object.keys(<object>conf['fieldSetForm']).map((ikey) => {
          return _handleFormSet((<any>conf['fieldSetForm'])[ikey]);
        })
      };
    case 'grid':
    case 'listGrid':
    case 'editGrid':
      return {
        label: '表格',
        ctype: 'grid',
        children: Object.keys(<object>conf[<any>key]).map((ikey) => {
          return _handleGrid((<any>conf[<any>key])[ikey]);
        })
      };
    case 'tabPanel':
      return {
        label: '标签页',
        ctype: 'tab',
        children: Object.keys(<object>conf['tabPanel']).map((ikey) => {
          return _handleTabPanel((<any>conf['tabPanel'])[ikey]);
        })
      };
    case 'uiLayout': {
      const containerIds = {};
      Object.keys(conf).forEach((key) => {
        if (core.isObject(conf[key])) {
          Object.keys(conf[key]).forEach((containerId) => {
            const { bindtable: bindTable, buskey: busKey, desTitle } = conf[key][containerId];
            containerIds[containerId] = { confKey: [key, containerId], bindTable, busKey, desTitle };
          });
        }
      });
      return {
        label: 'UI布局',
        containerIds,
        ctype: 'layout',
        children: conf[key].map((item) => {
          return _handleUILayout(item, containerIds);
        })
      };
    }
    case 'cardPanel':
      return {
        label: '表格项卡片',
        ctype: 'panel',
        children: Object.keys(<object>conf[key]).map((ikey) => {
          return _handleCardPanel((<any>conf[key])[ikey]);
        })
      };
    case 'toolbar':
      return {
        label: '工具条',
        ctype: 'toolbar',
        children: Object.keys(<object>conf[<any>key]).map((ikey) => {
          return _handleToolbar((<any>conf[<any>key])[ikey], ikey);
        })
      };
    default:
      return {
        ...conf
      };
  }
}

function _handleToolbar(obj: any, name, childKey: string = 'buttons') {
  return {
    children: Object.keys(obj).map((k) => {
      const r = {
        name: k,
        label: k,
        ...obj[k],
        children: (obj[k][childKey] || []).map((f) => {
          const tmp = core.isString(f)
            ? { name: f, id: f, ...core.external.getRegisterButton?.(f) }
            : { name: f.id, ...core.external.getRegisterButton?.(f.id), ...f };
          tmp.label = tmp.text;
          return tmp;
        })
      };
      addMapKey(r, '', childKey);
      return r;
    }),
    label: obj.label || name,
    name
  };
}

function _handleCardPanel(obj: any, childKey: string = 'fields') {
  const r = {
    label: obj.desTitle,
    name: obj.id || obj.itemId,
    ...obj,
    children: (obj.children || obj[childKey] || []).map(_handleChildren)
  };

  addMapKey(r, '', childKey);

  return r;

  function _handleChildren(field) {
    return {
      label: field.placeHolder || field.bindField,
      name: field.bindField,
      ...field
    };
  }
}

function _handleUILayout(item: any, containerIds) {
  const _handleChildren = (items) => {
    if (!items) {
      return [];
    }
    return items?.map((itm) => {
      const container = containerIds[itm.containerId] || {};
      return {
        ...itm,
        confKey: container.confKey,
        bindTable: container.bindTable,
        busKey: container.busKey,
        children: _handleChildren(itm.items)
      };
    });
  };

  const container = containerIds[item.containerId] || {};
  return {
    ...item,
    confKey: container.confKey,
    bindTable: container.bindTable,
    busKey: container.busKey,
    children: _handleChildren(item.items)
  };
}

function needSync(field, name1, name2) {
  return field.hasOwnProperty(name1) && !field.hasOwnProperty(name2);
}

/**
 * 1.每一个属性，必须有name属性
 * 2.非隐藏的fieldLabel也是必须的属性
 */
function _handleForm(obj: any, childKey: string = 'fields') {
  const name = obj.id || obj.itemId;
  let fc = {
    label: obj.desTitle,
    name: name,
    children: (obj[childKey] || []).map(_handleField),
    textAlign: obj.region,
    ...obj,
    minWidth: obj.minWidth || 450
  };
  obj.id && (fc['name_key'] = 'id');
  obj.itemId && (fc['name_key'] = 'itemId');
  addMapKey(fc, 'desTitle', childKey);
  return fc;

  function _handleField(field: any) {
    let t = {
      label: field.fieldLabel || field.name,
      ...field
    };
    needSync(field, 'readOnly', 'disabled') && (t['disabled'] = !!field['readOnly']);
    needSync(field, 'decimalPrecision', 'precision') && (t['precision'] = field['decimalPrecision']);
    needSync(field, 'inputValue', 'checkedValue') && (t['checkedValue'] = field['inputValue']);
    needSync(field, 'uncheckedValue', 'unCheckedValue') && (t['unCheckedValue'] = field['uncheckedValue']);
    needSync(field, 'nameField', 'displayField') && (t['displayField'] = field['nameField']);
    field.helpid && (t['helpId'] = field.helpid);
    (field.xtype === 'ngComboBox' || Array.isArray(field.data)) &&
      (t['data'] = (field.data || []).map((item: any) => ({
        ...item,
        value: item.code ?? item.value,
        label: item.name ?? item.label
      })));
    if (field.xtype === 'ngFormPanel' || field.xtype === 'container') {
      t.children = (t.items || t.children || []).map(_handleField);
    }
    return t;
  }
}

/**
 * 1.每一个属性，必须有name属性
 * @param obj
 */
function _handleGrid(obj: any) {
  const fc = {
    value: obj.id,
    label: obj.desTitle || obj.header || obj.title,
    name: obj.id,
    name_key: 'id',
    children: handleGridCols(obj.columns),
    ...obj
  };
  addMapKey(fc, 'desTitle', 'columns');
  return fc;

  function handleGridCols(columns: any[]) {
    if (Array.isArray(columns))
      return columns.map((col: any) => {
        col['columns'] && (col['children'] = handleGridCols(col['columns']));
        return addMapKey(
          {
            label: col.header || col.text || col.title,
            name: col.dataIndex,
            text: col.text || col.header,
            title: col.title || col.text || col.header,
            header: col.header || col.text || col.title,
            flex: 1,
            ...col,
            align: col.align?.toLowerCase(),
            name_key: 'dataIndex'
          },
          'header',
          col['columns'] && 'columns'
        );
      });
    return undefined;
  }
}

// 处理表单集
function _handleFormSet(obj: any, childKey: string = 'fieldSets') {
  obj.children = obj[childKey]?.map((item: any) => _handleForm(item, 'allfields'));
  obj['label'] = obj.desTitle;
  obj['name'] = obj.id || obj.itemId;
  addMapKey(obj, 'desTitle', childKey);
  return obj;
}

// 处理tabPanel
function _handleTabPanel(obj: any, childKey: string = 'items') {
  const tpc = {
    name: obj.id,
    name_key: 'id',
    label: obj.desTitle,
    ...obj,
    children:
      obj[childKey]?.map((item: any) =>
        addMapKey(
          {
            name: item.id,
            label: item.title,
            ...item,
            name_key: 'id'
          },
          'title'
        )
      ) || []
  };
  addMapKey(tpc, 'desTitle', childKey);
  return tpc;
}

function addMapKey(obj: any, labelKey: string, childKey?: string) {
  labelKey && (obj['label_key'] = labelKey);
  if (childKey && childKey !== 'children') {
    obj['children_key'] = childKey;
    delete obj[childKey];
  }
  return obj;
}

// 缓存layout
const UILayouts = new Map();

export function confSaveToStore(busType: string, data: any = [], billNoRule = []) {
  const dispatch: any = getDvaApp()?._store.dispatch;
  const params: any = confToTree(data);
  return dispatch?.({
    type: 'model_global/saveLayout',
    layoutConfig: params.layoutConfig,
    billNoRule,
    layout: params.layout,
    busType
  });
}

/**
 * 获取系统表单UI元数据
 * @param busType 业务类型
 * @param formType app or pc
 * @param uiConfig 前端固定UI元数据
 */
export async function doFetchDesignConfig(busType: string, formType = 'pc', uiConfig?: IObject | Function) {
  if (!busType) {
    return;
  }
  const menuCode = core.getQueryValue('menucode') || '';
  const query_val1 = core.getQueryValue('query_val1') || '';
  const query_val2 = core.getQueryValue('query_val2') || '';
  const configID = core.getQueryValue('configID');
  const oType = core.getQueryValue('oType');

  // 静态元数据直接返回
  if (uiConfig) {
    const ui = core.isFunction(uiConfig)
      ? core.parseJson(await uiConfig({ busType, menuCode, query_val1, query_val2, configID }))
      : core.deepCopy(uiConfig);
    await confSaveToStore(busType, ui);
    return;
  }

  try {
    const { individualUIContentByMenu, individualUIContent } = getGlobalConfig().apiUrl;
    const appFlg = formType === 'app' ? 1 : 0;
    const url = configID ? individualUIContentByMenu[1] : menuCode ? individualUIContentByMenu[0] : individualUIContent;
    const { code, data, message } = await core.request.get({
      url: core.isFunction(url) ? url({ busType, configID, menuCode }) : url,
      data: configID
        ? { configID, appFlg }
        : menuCode
        ? { bizCode: busType, menuCode, query_val1, query_val2, appFlg }
        : { bizCode: busType, appFlg }
    });
    if (code === 0) {
      await confSaveToStore(busType, core.parseJson(data.uiContent || data), data.billNoRule || []);
      (data.billNoRule?.length || data.tableColPermission?.length) &&
        core.updateUI((updater) => {
          const fieldProps = {};
          // 编码规则字段权限控制
          if (data.billNoRule?.length) {
            data.billNoRule.forEach((u) => {
              fieldProps[`${u.tableName}.${u.noField}`] = { disabled: true };
            });
          }
          // 表列字段权限控制+新增时不控制
          if (data.tableColPermission?.length && oType !== OType.Add) {
            data.tableColPermission.forEach((u) => {
              u.fieldList?.forEach((f) => {
                const rightKey = +f.rightKey;
                if (rightKey === 1) {
                  fieldProps[`${u.tableName}.${f.fieldName}`] = { disabled: true };
                } else if (rightKey === 0) {
                  fieldProps[`${u.tableName}.${f.fieldName}`] = { disabled: true, encrypted: true };
                }
              });
            });
          }
          updater.setFieldProps(fieldProps);
        });
    } else {
      message &&
        getAntApp().notification.error({
          message: `请求错误: ${url}`,
          description: message
        });
    }
  } catch (e) {
    await confSaveToStore(busType, []);
  }
}

/**
 * 获取二开脚本
 * @param busType 业务类型
 */
export async function doFetchScriptContent(busType: string) {
  if (!busType) {
    return '';
  }
  try {
    const { code, data, message } = await core.request.get({
      url: getGlobalConfig().apiUrl.userDefScript,
      data: { bizCode: busType }
    });
    if (code === 0) {
      return data;
    }
    console.log(message);
    return '';
  } catch (e) {
    console.log(e);
  }
  return '';
}

/**
 * 加载自定义表单元数据
 * @param busType 业务类型
 * @param customFormType 自定义表单类型
 */
export async function doFetchCustomForm(busType: string, customFormType: 'app' | 'pc') {
  if (!busType) {
    return {};
  }
  if (UILayouts.has(busType)) {
    const cacheLayout = core.parseJson(UILayouts.get(busType));
    confSaveToStore(busType, cacheLayout);
    return cacheLayout;
  }
  const { appCustomFormUrl, pcCustomFormUrl } = getGlobalConfig().apiUrl;
  const isApp = customFormType === 'app';
  try {
    const url = isApp ? appCustomFormUrl : pcCustomFormUrl;
    const { code, data, message } = await core.request.get({
      url,
      data: { bustype: busType }
    });
    if (code === 0) {
      const layout = core.parseJson(data);
      if (!isApp) {
        if (layout.listUI?.hasOwnProperty('grid')) {
          layout.listUI.listGrid = layout.listUI.grid;
          delete layout.listUI.grid;
        }
        if (layout.editUI?.hasOwnProperty('grid')) {
          layout.editUI.editGrid = layout.editUI.grid;
          delete layout.editUI.grid;
        }
        if (layout.hasOwnProperty('uiLayout') && !layout.editUI.hasOwnProperty('uiLayout')) {
          layout.editUI.uiLayout = layout.uiLayout;
          delete layout.uiLayout;
        }
      }
      const layoutStr = core.jsonString(layout);
      confSaveToStore(busType, layout);
      setTimeout(() => {
        UILayouts.set(busType, layoutStr);
      });
      return layout;
    } else {
      message && (await core.alert(message));
    }
  } catch (e) {
    confSaveToStore(busType, {});
  }
  return {};
}

// 缓存language
const Languages = new Map();

/**
 * 获取多语言
 * @param busType 业务类型
 */
export async function doFetchLangConfig(busType: string) {
  if (!busType) {
    return {};
  }

  if (Languages.has(busType)) {
    return Languages.get(busType);
  }

  try {
    const { code, data } = await core.request.get({
      url: getGlobalConfig().apiUrl.languageInfo,
      skipError: true,
      data: { uiIdentity: busType, busLangType: 1 }
    });
    if (code === 0) {
      Languages.set(busType, { busType, ...data });
    }
    return Languages.get(busType);
  } catch (e) {
    console.log(e);
  }
  return { busType };
}
