import { useCallback, useEffect, useRef, useState } from 'react';
import { useAsyncEffect } from './useEffect';

const readerCache = new Map();

function initializeDataReader(apiFn, promiseRef, param) {
  const fetchInfo = {
    data: undefined,
    error: undefined,
    status: 'init'
  };

  const fetching = apiFn(param)
    .then((data) => {
      fetchInfo.data = data;
      fetchInfo.status = 'done';
    })
    .catch((e) => {
      fetchInfo.error = e;
      fetchInfo.status = 'error';
    });

  promiseRef.current = new Promise((resolve) => {
    fetching.finally(() => {
      resolve('');
    });
  });

  return () => {
    if (fetchInfo.status === 'init') {
      throw fetching;
    } else if (fetchInfo.status === 'error') {
      throw fetchInfo.error;
    }
    return fetchInfo;
  };
}

/**
 * 配合 React.Suspense 实现异步懒加载
 * @param apiFunction 数据请求方法
 * @param param 数据请求方法参数
 * @param key 缓存初始化reader的key，解决Suspense 组件下异常会多次初始化，导致方法执行多次
 */
export function useAsyncSuspense(apiFunction, param, key?: any) {
  const promiseRef = useRef();

  const [dataReader, setDataReader] = useState(() => {
    if (key) {
      if (!readerCache.has(key)) {
        readerCache.set(key, initializeDataReader(apiFunction, promiseRef, param));
      }
      return { reader: readerCache.get(key) };
    }
    return {
      reader: initializeDataReader(apiFunction, promiseRef, param)
    };
  });

  useEffect(() => {
    // 清空，防止数据被缓存
    if (readerCache.has(key)) {
      readerCache.delete(key);
    }
  }, [key]);

  const updateDataReader = useCallback(
    (newParameters) => {
      setDataReader({
        reader: initializeDataReader(apiFunction, promiseRef, newParameters)
      });
    },
    [apiFunction]
  );

  // 保证异步组件加载完成后执行二开代码
  useAsyncEffect(async () => {
    await promiseRef.current;
  }, []);

  return [dataReader.reader, updateDataReader];
}
