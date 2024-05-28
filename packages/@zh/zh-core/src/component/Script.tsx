import React, { useLayoutEffect } from 'react';

interface IScript {
  src: string;
  onload?: ((boolean) => void) | null;
  async?: boolean;
}

/**
 * 动态加载js
 * @param src 相对地址
 * @param onload 加载回调
 * @param async 是否异步加载，默认异步
 */
export const loadScript = (src: IScript['src'], onload: IScript['onload'] = null, async = true) => {
  let script: any = null;
  if (async) {
    // 异步
    script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.src = src;
    script.onload = () => onload?.(true);
    script.onerror = () => onload?.(false);
    document.head.appendChild(script);
  } else {
    script = syncLoadScript(src, onload);
  }
  return script
    ? () => {
      if (script) {
        script.onload = null;
        document.head.removeChild(script);
        script = null;
      }
    }
    : undefined;
};

export function AsyncScript(src) {
  return new Promise((resolve) => {
    const un = loadScript(src, () => {
      resolve(un);
    });
  });
}

export function loadScriptContent(content: string, onLoad: IScript['onload'] = null) {
  let script: any = document.createElement('script');
  script.type = 'text/javascript';
  script.charset = 'UTF-8';
  try {
    //IE8以及以下不支持这种方式，需要通过text属性来设置
    script.appendChild(document.createTextNode(content));
  } catch (ex) {
    script.text = content;
  }
  document.head.appendChild(script);
  onLoad && Promise.resolve().then(() => onLoad?.(true));
  return () => {
    script.onload = null;
    document.head.removeChild(script);
    script = null;
  };
}

/**
 * 同步加载js脚本
 * @param src
 * @param onload
 */
function syncLoadScript(src, onload) {
  let xmlHttp: any = null;
  if (window.ActiveXObject) {
    //IE
    try {
      //IE6以及以后版本中可以使用
      xmlHttp = new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
      //IE5.5以及以后版本可以使用
      xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
    }
  } else if (window.XMLHttpRequest) {
    xmlHttp = new XMLHttpRequest();
  }

  if (xmlHttp) {
    xmlHttp.open('GET', src, false); //采用同步加载
    xmlHttp.send(null);

    //数据发送完毕
    if (xmlHttp.readyState == 4) {
      //0为访问的本地，200到300代表访问服务器成功，304代表没做修改访问的是缓存
      if ((xmlHttp.status >= 200 && xmlHttp.status < 300) || xmlHttp.status == 0 || xmlHttp.status == 304) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'UTF-8';
        try {
          //IE8以及以下不支持这种方式，需要通过text属性来设置
          script.appendChild(document.createTextNode(xmlHttp.responseText));
        } catch (ex) {
          script.text = xmlHttp.responseText;
        }
        document.head.appendChild(script);
        onload && Promise.resolve().then(() => onload?.(true));
        return script;
      }
    }
  }
  onload && Promise.resolve().then(() => onload?.(false));
  return null;
}

/**
 * 动态注入外部脚本
 * @param src 脚本地址
 * @param onload 回调函数
 * @param async 是否异步加载
 * @constructor
 */
export const Script: React.FC<IScript> = ({ src, onload = null, async = true }) => {
  useLayoutEffect(() => {
    return loadScript(src, onload, async);
  }, []);

  return null;
};
