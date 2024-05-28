/**
 * 类似于 Record，返回一个值为 T 类型的对象类型
 */
export type IObject<T = any> = {
  [x: string | symbol]: T;
};

/**
 * 返回包含getApi的对象类型
 */
export interface ICurrentObject<T = any> extends IObject {
  getApi(): T;
}

/**
 * 全局更新状态config参数配置
 */
export interface IUpdateConfig {
  /**
   * @description    是否立即执行
   */
  immediate?: boolean;

  /**
   * @description    是否批量更新
   * @default        true
   */
  batchedUpdate?: boolean;
}

/**
 * 扩展组件的Option属性
 */
export type CompHocOption<CompType, OptionType = any> = CompType & { Option: OptionType };

/**
 * 从 T 对象类型中剔除某些属性 K，并创建一个新的类型(支持联合类型)
 */
export type TypeOmit<T, K extends keyof any> = T extends {} ? Omit<T, K> : T;

/**
 * 重写T对象的部分属性
 */
export type TypeExtends<T, K extends {}> = TypeOmit<T, keyof K> & K;

/**
 * 让 T 的所有属性（包括子属性）可选
 */
export type PartialAll<T> = {
  [P in keyof T]?: T[P] extends {} ? PartialAll<T[P]> : T[P];
};

/**
 * 返回T类型或者Promise<T>
 */
export type PromiseType<T> = T | Promise<T>;

/**
 * 返回T类型或者T类型的函数
 */
export type TypeOrFn<T, P = any> = T | ((params: P) => T);
