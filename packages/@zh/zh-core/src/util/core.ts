const global = window as any;

function getCurrentWindow(key?) {
    return key ? global[key] : global;
}

function getProto(o) {
    return Object.prototype.toString.call(o);
}

const baseCore = {
    isPromise(obj): obj is Promise<any> {
        return obj instanceof Promise;
    },
    isArray(arr): arr is any[] {
        return getProto(arr) === '[object Array]';
    },
    isFunction(fn): fn is Function {
        return ['[object Function]', '[object AsyncFunction]'].includes(getProto(fn));
    },
    isObject(obj: any): obj is Record<string, any> {
        return getProto(obj) === '[object Object]';
    },
    isNumber(v): v is number {
        return typeof v === 'number';
    },
    isString(str): str is string {
        return typeof str === 'string';
    },
    isBoolean(obj): boolean {
        return obj === !!obj;
    },
    isDate(date): date is Date {
        return date instanceof Date && !isNaN(date.getTime());
    },
    isNullOrEmpty(val: any, except?: null | undefined | ''): boolean {
        const ret = val === undefined || val === null || val === '';
        return arguments.length > 1 ? ret && val !== except : ret;
    },
    deepCopy(obj: any, structuredClone = true) {
        if (baseCore.isNullOrEmpty(obj) || typeof obj !== 'object') {
            return obj;
        }
        // 复制时间
        if (baseCore.isDate(obj)) {
            return new Date(obj.valueOf());
        }

        if (structuredClone && window['structuredClone']) {
            try {
                return window['structuredClone'](obj);
            } catch {
                return baseCore.deepCopy(obj, false);
            }
        }

        const root: any = baseCore.isArray(obj) ? [] : {};

        // 栈
        const loopList: any = [
            {
                parent: root,
                key: undefined,
                data: obj
            }
        ];

        while (loopList.length) {
            const node = loopList.pop();
            const parent = node.parent;
            const key = node.key;
            const data = node.data;

            // 初始化赋值目标，key为undefined则拷贝到父元素，否则拷贝到子元素
            let res = parent;
            if (typeof key !== 'undefined') {
                res = parent[key] = baseCore.isArray(data) ? [] : {};
            }

            for (let k in data) {
                if (data.hasOwnProperty(k)) {
                    if (!baseCore.isNullOrEmpty(data[k]) && typeof data[k] === 'object') {
                        if (baseCore.isDate(data[k])) {
                            res[k] = new Date(data[k].valueOf());
                        } else {
                            loopList.push({
                                parent: res,
                                key: k,
                                data: data[k]
                            });
                        }
                    } else {
                        res[k] = data[k];
                    }
                }
            }
        }

        return root;
    },

    jsonString: (json: any, undefinedValue?) => {
        return baseCore.isObject(json) || baseCore.isArray(json)
            ? JSON.stringify(json, (_, v) => {
                return v === undefined ? undefinedValue : v;
            })
            : json;
    },
    parseJson: (jsonStr: any) => {
        if (!jsonStr || !baseCore.isString(jsonStr)) {
            return jsonStr;
        }
        const _parse: any = (useJsonParse: boolean) => {
            try {
                let result: any;
                if (useJsonParse) {
                    result = JSON.parse(jsonStr);
                } else {
                    const keywords = [
                        'window',
                        'document',
                        'XMLHttpRequest',
                        'ActiveXObject',
                        'fetch',
                        '$zh',
                        'alert',
                        'console'
                    ].join();
                    const toJson = new Function(`"use strict"; return (function(${keywords}){ return ${jsonStr} })();`);
                    result = toJson.call(null);
                }
                if (['object', 'function', 'boolean', 'string'].includes(typeof result)) {
                    return result;
                }
                return jsonStr;
            } catch (e) {
                return useJsonParse ? _parse(false) : jsonStr;
            }
        };
        return _parse(true);
    }
};

function setGlobalVar(key, value) {
    const global = getCurrentWindow();
    global[key] = value;
}

export { getCurrentWindow, setGlobalVar, baseCore };