import {
  extend,
  OnionMiddleware,
  OnionOptions,
  RequestInterceptor,
  RequestMethod,
  RequestOptionsInit,
  ResponseInterceptor
} from 'umi-request';
import { getAntApp } from '../../appEntry';
import type { IObject, IRequestAdapter, IRequestOptions, IResponse } from '../../interface';
import { util } from '../tool';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。'
};

/**
 * 异常处理程序
 */
const errorHandler = (httpInstance: CreateRequest) => (error) => {
  const { response, request, message, type } = error;
  if (type === 'AbortError' || message === 'CancelTokenError') {
    // 取消请求
    throw error;
  }

  if (request.options.skipError) {
    throw error;
  }

  const adapterErrorHandler = httpInstance.getRequestAdapter()?.errorHandler;
  if (adapterErrorHandler?.(error) === false) {
    return;
  }

  const { notification } = getAntApp();

  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    notification.error({
      message: errorText,
      description: `请求错误 ${status}: ${url}`
    });
  } else if (!response) {
    notification.error({
      message: message || '网络异常'
    });
  }

  throw error;
};

interface Interceptors {
  request: RequestInterceptor;
  response: ResponseInterceptor;
}

export class CreateRequest {
  public readonly http: RequestMethod;
  private readonly cancelObj: Map<string, Function>;
  private readonly interceptors: { [key in keyof Interceptors]: Array<Function> };
  private RH_SYB = Symbol('responseHeaders');
  private cancelId = Symbol('cancel_id');
  private _requestAdapter: IRequestAdapter | undefined;

  constructor(adapter?: IRequestAdapter) {
    const requestInstance = extend({
      errorHandler: errorHandler(this), // 默认错误处理
      mode: 'cors',
      timeout: 0, // 单位毫秒，0表示没有超时时间限制
      credentials: 'include', // 默认请求带上cookie
      ...adapter?.getDefaultOptions?.()
    });

    requestInstance.use(async (ctx, next) => {
      // 请求前新增或修改参数，例如注入token等
      const {
        req: { options }
      } = ctx;
      options.headers = await this.getHeaders(options.headers);
      await next();
      const responseType = ctx.req.options.responseType || 'json';
      // 处理返回值 ctx.res
      if (responseType === 'blob') {
        const filename = (options as any)[this.RH_SYB]
          ?.get('content-disposition')
          ?.split(';')[1]
          ?.replace('filename=', '');
        ctx.res = { blob: ctx.res, filename };
      } else if (!['blob', 'arrayBuffer'].includes(responseType) && options.dataToJson !== false) {
        ctx.res = util.parseJson(ctx.res);
      }
    });

    this.setRequestAdapter(adapter);
    this.http = requestInstance;
    this.cancelObj = new Map<string, Function>();
    this.interceptors = { request: [], response: [] };

    // 处理request请求拦截器
    this.http.interceptors.request.use(
      (url, options) => {
        const requests = this.interceptors.request;
        if (!requests || requests.length === 0) {
          return { url, options };
        }
        let [newUrl, newOptions] = [url, options];
        for (let i = 0, len = requests.length; i < len; i++) {
          const ret = { url, options, ...requests[i](newUrl, newOptions) };
          newUrl = ret.url || newUrl;
          newOptions = { ...newOptions, ...ret.options };
        }
        return { url: newUrl, options: newOptions };
      },
      { core: true }
    );

    // 处理response响应拦截器
    this.http.interceptors.response.use(
      async (response, requestOptions: any) => {
        const cancelId = requestOptions[this.cancelId];
        if (cancelId && this.cancelObj.has(cancelId)) {
          this.cancelObj.delete(cancelId);
        }
        const responses = this.interceptors.response;
        requestOptions[this.RH_SYB] = response.headers;
        if (!responses || responses.length === 0) {
          return response;
        }
        let newResponse = response;
        for (let i = 0, len = responses.length; i < len; i++) {
          const cloneResponse = response?.clone?.() || response;
          if (util.isFunction(cloneResponse.text)) {
            cloneResponse.json = async () => {
              const data = await cloneResponse.text();
              return util.parseJson(data);
            };
          }
          const ret = await responses[i](cloneResponse, requestOptions, newResponse);
          if (ret !== cloneResponse && ret) {
            newResponse = ret;
          }
        }
        return newResponse;
      },
      { core: true }
    );
  }

  setRequestAdapter(adapter?: IRequestAdapter | ((oldAdapter?: IRequestAdapter) => IRequestAdapter)) {
    const newAdapter = util.isFunction(adapter)
      ? adapter(this._requestAdapter)
      : { ...this._requestAdapter, ...adapter };
    this._requestAdapter = newAdapter;
    const defaultOptions = newAdapter?.getDefaultOptions?.();
    defaultOptions && this.http.extendOptions(defaultOptions);
  }

  getRequestAdapter() {
    return this._requestAdapter;
  }

  async getHeaders(reqHeader: IObject = {}) {
    const defaultHeaders: any = {
      env: util.getQueryValue('env') || 'prod'
    };

    const user = util.getUser<any>() || {};
    const tokenKey = user.tokenKey || user.authorization || util.getCache('x-auth-token');
    if (user.accessToken) {
      defaultHeaders['User-Token'] = user.accessToken;
    } else if (tokenKey) {
      defaultHeaders['Authorization'] = tokenKey;
    }
    const adapterHeader = await this.getRequestAdapter()?.getHeader?.();
    const headers = { ...defaultHeaders, ...adapterHeader, ...reqHeader };
    return Object.keys(headers).reduce((p, c) => {
      return util.isNullOrEmpty(headers[c], '') ? p : { ...p, [c]: headers[c] };
    }, {});
  }

  private getHttpUrl(url) {
    const root = this.getRequestAdapter()?.getRoot?.();
    return util.getHttpUrl(url, root);
  }

  /**
   * 设置取消token
   * @param options
   */
  private setCancelToken(options: IRequestOptions) {
    if (!options.cancel) {
      return null;
    }
    let cancelId: string;
    const { token: cancelToken, cancel } = this.http.CancelToken.source();
    const cancelHook: any = options.cancel;
    const execCancel = (msg?) => cancel(msg || 'CancelTokenError');
    if (util.isString(cancelHook)) {
      cancelId = cancelHook;
      this.cancelObj.get(cancelId)?.(); // 取消cancelKey的上一次请求
    } else {
      cancelId = util.uniqueId(options.url);
      if (util.isFunction(cancelHook)) {
        cancelHook(execCancel, cancelId);
      }
    }
    this.cancelObj.set(cancelId, execCancel);
    return { cancelToken, [this.cancelId]: cancelId };
  }

  /**
   * 初始化一个新的请求实例
   */
  init(adapter?: IRequestAdapter) {
    return new CreateRequest(adapter);
  }

  getRequest() {
    return this.http;
  }

  /**
   * 取消当前进行中的所有请求
   * @param msg 取消消息
   * @param cancelId 取消id
   */
  abort({ msg, cancelId }: { msg?: string; cancelId?: string }) {
    if (cancelId) {
      if (this.cancelObj.has(cancelId)) {
        this.cancelObj.get(cancelId)?.(msg);
        this.cancelObj.delete(cancelId);
      }
      return;
    }
    this.cancelObj.forEach((exec) => {
      exec(msg);
    });
    this.cancelObj.clear();
  }

  /**
   * 添加拦截器
   * @param eventType 拦截类型: request 请求前（进入洋葱模型前）， response请求后（洋葱模型最内层）
   * @param interceptor 拦截事件
   */
  on<T extends keyof Interceptors>(eventType: T, interceptor: Interceptors[T]) {
    this.interceptors[eventType].push(interceptor);
    return this;
  }

  /**
   * 取消监听器
   * @param eventType 拦截类型: request 请求前（进入洋葱模型前）， response请求后（洋葱模型最内层）
   * @param interceptor 拦截事件
   */
  un<T extends keyof Interceptors>(eventType: T, interceptor?: Interceptors[T]) {
    if (!interceptor) {
      this.interceptors[eventType] = [];
    } else {
      const idx = this.interceptors[eventType].indexOf(interceptor);
      if (idx > -1) {
        this.interceptors[eventType].splice(idx, 1);
      }
    }
    return this;
  }

  /**
   * 注入中间件，扩展请求前后功能，修改url等，参考 52 行代码
   * @param handler 中间件函数，支持async/await， 参数（context/请求前后信息、next/发起请求）
   * @param options 这个配置决定这个middleware加载到哪一层
   */
  use(handler: OnionMiddleware, options?: OnionOptions) {
    this.http.use(handler, options);
    return this;
  }

  /**
   * get请求
   * @param options IRequestOptions
   */
  get<T = IResponse>(options: IRequestOptions): Promise<T> {
    const { url, data, cancel, absUrl, ...payload } = options;
    return this.http(util.handleUrl(absUrl ? url : this.getHttpUrl(url), data, true), {
      method: 'GET',
      responseType: 'json',
      ...this.setCancelToken(options),
      ...payload
    });
  }

  getWithArray(options: IRequestOptions) {
    return wrapCatch((defaultOpts) => this.get({ ...defaultOpts, ...options }))();
  }

  /**
   * post请求
   * @param options IRequestOptions
   */
  post<T = IResponse>(options: IRequestOptions): Promise<T> {
    const { url, data, cancel, absUrl, ...payload } = options;
    return this.http(absUrl ? url : this.getHttpUrl(url), {
      method: 'POST',
      data: util.handleData(data),
      requestType: 'form',
      ...this.setCancelToken(options),
      ...payload
    });
  }

  postWithArray(options: IRequestOptions) {
    return wrapCatch((defaultOpts) => this.post({ ...defaultOpts, ...options }))();
  }

  /**
   * post请求，请求参数放在body里面
   * @param options IRequestOptions
   */
  body<T = IResponse>(options: IRequestOptions): Promise<T> {
    const { url, data, cancel, absUrl, headers = {}, ...payload } = options;
    return this.http(absUrl ? url : this.getHttpUrl(url), {
      method: 'POST',
      requestType: 'json',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        ...headers
      },
      body: util.jsonString(data, null),
      ...this.setCancelToken(options),
      ...payload
    });
  }

  bodyWithArray(options: IRequestOptions) {
    return wrapCatch((defaultOpts) => this.body({ ...defaultOpts, ...options }))();
  }

  /**
   * delete请求
   * @param options IRequestOptions
   */
  delete<T = IResponse>(options: IRequestOptions): Promise<T> {
    const { url, data, cancel, absUrl, ...payload } = options;
    return this.http.delete(absUrl ? url : this.getHttpUrl(url), {
      data: util.handleData(data),
      ...this.setCancelToken(options),
      ...payload
    });
  }

  deleteWithArray(options: IRequestOptions) {
    return wrapCatch((defaultOpts) => this.delete({ ...defaultOpts, ...options }))();
  }

  /**
   * put请求
   * @param options IRequestOptions
   */
  put<T = IResponse>(options: IRequestOptions): Promise<T> {
    const { url, data, cancel, absUrl, ...payload } = options;
    return this.http.put(absUrl ? url : this.getHttpUrl(url), {
      data: util.handleData(data),
      ...this.setCancelToken(options),
      ...payload
    });
  }

  putWithArray(options: IRequestOptions) {
    return wrapCatch((defaultOpts) => this.put({ ...defaultOpts, ...options }))();
  }

  /**
   * 包裹取消函数
   * @param options RequestOptionsInit
   */
  withCancel<T = IResponse>(
    options: RequestOptionsInit & {
      absUrl?: boolean;
      dataToJson?: boolean;
    }
  ): [Promise<T>, Function] {
    const { url, cancel, absUrl, ...payload } = options;
    const cancelToken = this.setCancelToken({ ...options, cancel: options.cancel || true } as IRequestOptions);
    const cancelId = cancelToken?.[this.cancelId] || '';
    return [
      this.http(absUrl ? url : this.getHttpUrl(url), {
        ...cancelToken,
        ...payload
      }),
      this.cancelObj.get(cancelId) as Function
    ];
  }
}

function wrapCatch(fn): () => Promise<[boolean, any]> {
  return async () => {
    try {
      const { code, data, message } = await fn({ skipError: true });
      const success = code === 0;
      return [success, success ? data : message];
    } catch (e) {
      console.log(e);
    }
    return [false, '服务器异常'];
  };
}
