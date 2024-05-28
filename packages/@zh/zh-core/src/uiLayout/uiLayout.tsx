import { useMemo } from 'react';
import { IObject } from '../interface';
import { getDvaApp, useSelector } from '../umiExports';
import { core } from '../util';

let _x = {};
let lastLayout = null;

function getConfUtilApi(_conf: any): [Function, object, object] {
  const { layout = [], layoutConfig } = _conf;
  if (lastLayout !== layoutConfig) {
    lastLayout = layoutConfig;
    _x = listToObj(layout);
  }
  return [
    function (ids?: Array<string>): any {
      if (!_conf?.layout || JSON.stringify(_x) === '{}') {
        return;
      }
      const treeInfo: Array<any> = _conf.layout;
      if (!ids) return treeInfo;
      let t: any = _x;
      let p: Array<number> = [];
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        p[i] = core.isNumber(id) ? id : (t?.[id] || {}).index;
        t = t?.[id] || {};
      }
      let res = treeInfo;
      p.join('-children-')
        .split('-')
        .forEach((key: any) => {
          res = res?.[key];
        });
      return core.deepCopy(res, false);
    },
    _x,
    layoutConfig
  ];
}

function listToObj(conf: any) {
  return (conf || []).reduce((acc: any, curr: any, index: number) => {
    const tl = curr.children || curr.items;
    acc[curr.name] = {
      index: index,
      ...(tl ? listToObj(tl) : {})
    };
    return acc;
  }, {});
}

function handleConfDataType(conf: any) {
  if (!conf) return {};
  if (Array.isArray(conf)) {
    return { children: conf };
  }
  return conf;
}

export function useGetConf() {
  const _conf = useSelector((state: any) => state.model_global) || {};
  return getConfUtilApi(_conf);
}

export function useUIConfig({
  confKey,
  config,
  childrenToObject
}: {
  confKey?: Array<string | number> | string;
  config?: IObject;
  childrenToObject?: boolean;
}) {
  const keys: any = confKey ? (Array.isArray(confKey) ? confKey : [confKey]) : confKey;
  const layout = useSelector((state: any) => state.model_global?.layout);
  const [getConf] = useGetConf();

  return useMemo(() => {
    let cfg: any;
    if (config) {
      cfg = handleConfDataType(config);
    } else if (keys) {
      cfg = getConf(keys);
    }
    const obj = cfg || { children: [], error: '获取ui元数据错误' };
    if (!core.isArray(obj.children)) {
      obj.children = [];
    }
    if (childrenToObject) {
      obj.children = obj.children.reduce((p, c) => {
        return c.name ? { ...p, [c.name]: c } : p;
      }, {});
    }
    return obj;
  }, [config, keys?.join(','), layout, childrenToObject]);
}

export function LayConfWrap(Comp) {
  function Inner(props) {
    const { confKey, config, setConfig, ...others } = props;
    const formConf = useUIConfig({ confKey, config });
    return <Comp {...others} formConf={setConfig ? setConfig(formConf) : formConf} />;
  }

  return (props) => {
    const { confKey, config, setConfig, ...others } = props;
    if (config) {
      const newCfg = useMemo(() => handleConfDataType(config), [config]);
      return <Comp {...others} formConf={setConfig ? setConfig(newCfg) : newCfg} />;
    }
    return <Inner {...props} />;
  };
}

export function getConfUtil() {
  const app = getDvaApp();
  const _conf = app._store.getState().model_global;
  return getConfUtilApi(_conf);
}
