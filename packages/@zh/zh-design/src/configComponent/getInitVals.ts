import { getObjValue, setObjValue } from './common';

export function getInitVals(layConf: any, type: string, defaultValue?: any) {
  let iv;
  if (layConf && layConf.children) {
    switch (type) {
      case 'form': {
        iv = defaultValue || {};
        const loop = (items) => {
          items.forEach(item => {
            if (item.xtype === 'container') {
              loop(item.items || item.children || []);
            }
            else if (item.name && item.hasOwnProperty('defaultValue') && getObjValue(iv, item.name) === void 0) {
              setObjValue(iv, item.name, item.defaultValue);
            }
          });
        };
        loop(layConf?.children || []);
        break;
      }
      case 'grid':
        iv = defaultValue || [];
        break;
      default:
        iv = {};
    }
  }

  return iv;
}
