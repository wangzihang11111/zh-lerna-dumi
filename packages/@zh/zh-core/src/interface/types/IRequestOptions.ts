import type { RequestOptionsInit, ResponseError } from 'umi-request';
import type { IObject } from './ts.lib';

export interface IRequestOptions extends RequestOptionsInit {
  url: string;
  data?: any;
  cancel?: Function | string | boolean;
  absUrl?: boolean;
  dataToJson?: boolean;
  skipError?: boolean; // 是否跳过错误处理
  [key: string]: any; // 个性化参数，一般用于自定义拦截器逻辑判断
}

/**
 * request适配器接口
 */
export interface IRequestAdapter {
  /**
   * 请求头
   */
  getHeader?(): IObject | Promise<IObject>;

  /**
   * 请求root地址
   */
  getRoot?(): string;

  /**
   * 错误处理函数
   */
  errorHandler?(error: ResponseError): void | boolean;

  /**
   * 请求默认配置项
   */
  getDefaultOptions?(): RequestOptionsInit;
}

/**
 * response返回格式
 */
export interface IResponse {
  code: number;
  message: string;
  data?: any;
}
