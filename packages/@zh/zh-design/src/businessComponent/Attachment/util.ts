import SparkMD5 from 'spark-md5';
import { message } from '../../functionalComponent';
import { zh, type IObject } from '../../util';

type requestType = 'get' | 'post' | 'body';
const requestTypeList: requestType[] = ['get', 'post', 'body'];
const requestFactory = (type: requestType) => async (option) => {
  const res = await zh.request[type](option);
  if (res?.code === 0) {
    return {
      ...res,
      success: true
    };
  } else {
    message.error(res?.message ?? '未知错误');
    return {
      ...res,
      success: false
    };
  }
};
export const customRequest = requestTypeList.reduce<IObject>(
  (value, item) => ({ ...value, [item]: requestFactory(item) }),
  {}
);

export const openTab = (title = '文件预览', url, params = {}) => {
  const targetUrl = zh.handleUrl(url, params);
  if (zh.isRunMaster) {
    zh.open(targetUrl, { microAppName: 'outlink', AppTitle: title });
  } else {
    window.open(targetUrl);
  }
};

export const downloadFile = (filename, blob, type = 'blob') => {
  const element = document.createElement('a');
  element.download = filename;
  element.href = type === 'url' ? blob : URL.createObjectURL(blob);
  element.click();
};

export const getFileSize = (size) => {
  if (size === null || Number.isNaN(+size)) return size;
  const num = 1024;
  const unitMap = ['B', 'KB', 'MB', 'GB'];
  size = +size;
  for (let i = 0; i < 4; i++) {
    if (size < Math.pow(num, i + 1)) return `${(size / Math.pow(num, i)).toFixed(2)}${unitMap[i]}`;
  }
  return `${(size / Math.pow(num, 4)).toFixed(2)}TB`;
};

// 判断是否可用金格控件打开
export const isJingeOpen = (fileType, showControl) => {
  if (['doc', 'docx', 'xls', 'xlsx'].includes(fileType) && showControl !== 0) {
    if (
      (showControl === 1 && ['doc', 'docx'].includes(fileType)) ||
      (showControl === 2 && ['xls', 'xlsx'].includes(fileType)) ||
      showControl === 3
    ) {
      return true;
    }
  }
  return false;
};

// 获取文件类型
export const getFileType = (fileName: string) => fileName?.split('.').slice(-1)[0]?.toLowerCase();

// 获取文件md5
export const getFileMd5 = (file) =>
  new Promise((resolve) => {
    const fileReader = new FileReader();
    const spark = new SparkMD5.ArrayBuffer();
    spark.append(Buffer.from(file.name, 'utf-8'));
    fileReader.onload = (e) => {
      spark.append(e.target?.result);
      resolve(spark.end());
    };
    fileReader.readAsArrayBuffer(file);
  });

// 获取大文件的MD5
export const getFileMd5BySlice = (file, chunkSize = 1024 * 1024 * 2) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    const spark = new SparkMD5.ArrayBuffer();
    const chunks = Math.ceil(file.size / chunkSize);
    let currentChunk = 0;
    spark.append(Buffer.from(file.name, 'utf-8'));
    fileReader.onload = function (e) {
      spark.append(e.target?.result);
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        resolve(spark.end());
      }
    };
    fileReader.onerror = function (error) {
      reject(error);
    };
    function loadNext() {
      fileReader.readAsArrayBuffer(
        File.prototype.slice.call(file, currentChunk * chunkSize, Math.min((currentChunk + 1) * chunkSize, file.size))
      );
    }
    loadNext();
  });

export function getSortNumArr(num = 10) {
  const arr: number[] = [];
  for (let i = 0; i < num; i++) {
    arr.push(i + 1);
  }
  return arr;
}
