import { core } from '../util';
import { confSaveToStore } from './layoutMapping';
export * from './uiLayout';

export const updateUIConfigToStore = confSaveToStore;

/**
 * 从amis的布局提取toolbar\form\grid等ui元数据
 * @param amisLayout amis的布局
 * @returns
 */
export function formatAmisLayout(
  amisLayout,
  {
    newLayout = [],
    typeMap = new Map(),
    paths = []
  }: { newLayout?: any[]; typeMap?: Map<string, any[]>; paths?: Array<string | number> } = {}
) {
  if (!amisLayout) {
    return { layout: newLayout };
  }
  if (core.isArray(amisLayout)) {
    amisLayout.forEach((lay, index) => formatAmisLayout(lay, { newLayout, typeMap, paths: [...paths, index] }));
  } else if (core.isObject(amisLayout)) {
    const pushLayout = (type, label, childrenKey) => {
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
        newLayout.push({ name: type, label, children: typeMap.get(type), __paths__: paths.slice(0, -1) });
      }
      const { table, name, ...payload } = amisLayout;
      const child: any = {
        name: name || payload.id,
        ...payload,
        children: amisLayout[childrenKey] || [],
        __paths__: paths,
        children_key: childrenKey
      };
      table && (child.bindTable = table);
      if (childrenKey !== 'children') {
        delete child[childrenKey];
      }
      typeMap.get(type)!.push(child);
    };
    switch (amisLayout.type) {
      case 'form':
        pushLayout('form', '表单', 'body');
        break;
      case 'table':
        pushLayout('grid', '列表', 'columns');
        break;
      case 'tool-bar':
      case 'toolbar':
        pushLayout('toolbar', '工具条', 'buttons');
        break;
      default:
        Object.keys(amisLayout).forEach((key) =>
          formatAmisLayout(amisLayout[key], { newLayout, typeMap, paths: [...paths, key] })
        );
        break;
    }
  }
  return { layout: newLayout };
}

/**
 * 通过转换的ui元数据更新amis布局
 * @param amisLayout 当前amis的布局信息
 * @param uiConfig  ui元数据
 * @returns
 */
export function updateAmisLayout(amisLayout, uiConfig) {
  const uLayout = { ...amisLayout };
  uiConfig.forEach((layout) => {
    if (layout.__update__) {
      layout.children?.forEach(({ children_key, children, __paths__, ...child }) => {
        const objValue = core.getObjValue(uLayout, __paths__);
        console.log(child.__update__, objValue.__update__);

        if (child.__update__ !== objValue.__update__) {
          updateAmisObject(uLayout, { paths: [...__paths__], value: { ...child, [children_key]: children } });
        }
      });
    }
  });
  return uLayout;
}

function updateAmisObject(obj, { paths, value }) {
  if (!paths?.length) {
    return obj;
  }
  const key = paths.pop(-1);
  const objValue = core.getObjValue(obj, paths) || obj;
  if (core.isArray(value)) {
    objValue[key] = [...value];
  } else {
    objValue[key] = { ...objValue[key], ...value };
  }
  if (objValue === obj) {
    return obj;
  }
  return updateAmisObject(obj, { paths, value: objValue });
}
