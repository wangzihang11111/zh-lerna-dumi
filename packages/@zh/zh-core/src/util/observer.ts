function isFunction(fn) {
  return Object.prototype.toString.call(fn) === '[object Function]';
}

export class Observer {
  private readonly events: Record<string, Set<Function>>;
  private readonly promises: Map<string, Promise<any>>;

  constructor() {
    this.events = {};
    this.promises = new Map();
  }

  subscribe = (fn: Function, type: string = 'global', condition?: Function) => {
    let newFn = fn;
    if (isFunction(fn)) {
      if (condition && isFunction(condition)) {
        newFn = async (...args) => {
          if (condition(...args)) {
            return await fn(...args);
          }
        };
      }

      if (this.promises.has(type)) {
        // 响应提前发布的通知消息
        this.promises.get(type)?.then((r) => {
          newFn(r);
        });
      }
      this.events[type] = this.events[type] || new Set();
      this.events[type].add(newFn);
      return () => {
        this.events[type]?.delete(newFn);
      };
    }
    return () => {};
  };

  /**
   * 发布消息通知（仅执行已经订阅的事件）
   * @param value
   * @param type
   */
  notify = async (value, type: string = 'global') => {
    const typeEvents = this.events[type];
    const arr: any = [];
    if (typeEvents) {
      const currentEvents = [...typeEvents]; // 复制一份进行消息处理，防止处理事件反复订阅导致循环无法结束
      for (let evt of typeEvents) {
        try {
          const result = await evt(value, arr);
          arr.push(result);
        } catch (e) {
          console.log(e);
        }
      }
    }
    return arr;
  };

  /**
   * 获取最后一个订阅消息返回值
   * @param args
   * @param type
   */
  get = async (args, type: string = 'global') => {
    const results = await this.notify(args, type);
    return results[results.length - 1];
  };

  /**
   * 发布消息通知（执行已经订阅的事件，同时保证将来的订阅事件能够直接执行）,一般用于组件加载完成通知
   * @param value
   * @param type
   */
  prevNotify = async (value, type: string = 'global') => {
    // 保证将来订阅的事件直接执行
    this.promises.set(type, Promise.resolve(value));
    return await this.notify(value, type);
  };

  clear = (types: string | string[] = '') => {
    if (types) {
      types = Array.isArray(types) ? types : [types];
      types.forEach((type) => {
        delete this.events[type];
      });
    } else {
      Object.keys(this.events).forEach((key) => {
        delete this.events[key];
      });
    }
  };
}
