import { injectBusinessComponents, setUmiHooks, layoutModel } from '@zh/zh-design';
import dataJson from './dataJson';
import { getDvaApp, history, useModel } from 'umi';

const global = window as any;

const isProduction = process.env.NODE_ENV === 'production';
const isMock = isProduction || false;

injectBusinessComponents();

export function initEnv(zh, type) {
  setUmiHooks(() => ({ getDvaApp, history, useModel }));

  zh.setUser({
    dbServer: 'MTkyLjE2OC44LjE3OjE1MjEvaTZzZGI=',
    logid: 'gyx',
    ocode: '00000001',
    orgID: '250180111000001',
    ucode: '0019',
    userID: '579191010000003',
    // userName: '江涛',
    enterpriseNo: '760404',
    productAdr: 'http://218.75.42.23:8000',
    accessToken: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIiLCJjbGllbnR0eXBlIjoiMSIsIm5iZiI6MTcwNjE2NzI0NywiY2xpZW50aWQiOiJVRFAtV0VCIiwiaXNzIjoiVURQIiwiZXhwIjoxNzA2MjExMDQ3LCJ1c2VyaWQiOiIxMDIiLCJjcmVhdGVkdCI6IlRodSBKYW4gMjUgMTU6MzA6NDcgQ1NUIDIwMjQiLCJqdGkiOiI3YjJmYmUwNy1iNzU4LTRmMWEtYjI2NC04M2E3MTVmNTJmY2MifQ.IZagy2SgdSWIPdnfvdwvx_4Q8Lx2MkBy-reiXpTQofA',
    // app user 字段
    orgId: '114190218000001',
    accountNo: '0002',
    userName: '胡开发'
  });

  function parseQuery(query) {
    const reg = /([^=&\s]+)[=\s]*([^&\s]*)/g;
    const obj = {};
    while (query && reg.exec(query)) {
      obj[RegExp.$1] = RegExp.$2;
    }
    return obj;
  }

  if (!global['model_global']) {
    global['model_global'] = layoutModel({
      namespace: 'model_global',
      state: {},
      subscriptions: {}
    });
    getDvaApp()?.model?.(global['model_global']);
  }

  const { get: GET, post: POST, body: BODY } = zh.request;
  const oldMethod = { GET, POST, BODY };

  async function proxyHttp({ url, data, options, type }) {
    const [k, query] = url?.split('?') || ['', ''];
    const params = { ...parseQuery(query), ...data };
    let result: any = null;
    const key = k.indexOf('/') === 0 ? k.substring(1) : k;
    if (isProduction || dataJson.hasOwnProperty(key)) {
      if (zh.isFunction(dataJson[key])) {
        result = await dataJson[key](params);
      } else {
        result = dataJson[key];
      }
      console.log(type, url, params, result);
      return zh.deepCopy(result);
    }
    return oldMethod[type].call(zh.request, { url, data, ...options });
  }

  if (isMock) {
    zh.request.get = async ({ url, data, ...options }) => {
      await zh.delay(100);
      return proxyHttp({ url, data, options, type: 'GET' });
    };

    zh.request.post = async ({ url, data, ...options }) => {
      await zh.delay(300);
      return proxyHttp({ url, data, options, type: 'POST' });
    };

    zh.request.body = async ({ url, data, ...options }) => {
      await zh.delay(300);
      return proxyHttp({ url, data, options, type: 'BODY' });
    };
  }
}
