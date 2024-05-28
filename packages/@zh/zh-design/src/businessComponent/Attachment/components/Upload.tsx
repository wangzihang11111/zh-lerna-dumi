import { Button, Upload as UploadComp } from 'antd';
import { forwardRef, useMemo } from 'react';
import { message } from '../../../functionalComponent';
import { zh, useRefCallback } from '../../../util';
import { getPreSignUploadUrl, getUploadTask, initUploadTask, mergeUploadFile } from '../service';
import { getFileMd5, getFileMd5BySlice, getFileType, getSortNumArr } from '../util';

// 附件上传接入线程池，防止上传附件时并行请求过多的情况
class ThreadPool {
  limit = 3;
  runPool = {};
  waitQueue: { func: Function; callback?: Function }[] = [];
  constructor(props?) {
    if (props?.limit) {
      this.limit = props.limit;
    }
  }
  add(func, callback?) {
    const { length } = Object.keys(this.runPool);
    const resultHandleWrapper = (key) => () => {
      delete this.runPool[key];
      const target = this.waitQueue.shift();
      target && this.add(target.func, target.callback);
      callback?.();
    };
    if (length < this.limit) {
      const key = Date.now();
      const resultHandle = resultHandleWrapper(key);
      this.runPool[key] = func().then(resultHandle).catch(resultHandle);
    } else {
      this.waitQueue.push({ func, callback });
    }
  }
}
// 一个导入本地文件，将文件内容进行输出的组件
export const Upload = forwardRef((props: any, ref) => {
  const {
    asrFill,
    asrFillName,
    asrTable,
    asrCode,
    maxCount,
    chunkSize = 5242880,
    uploadThreadCount = 3,
    data = {},
    accept,
    onFileUpload = () => {},
    attachInfo,
    attachmentRecordList,
    children,
    hidden = false,
    uCode,
    uploadingRef,
    setUploadState,
    ...restProps
  } = props;
  const threadPool = useMemo(() => new ThreadPool({ limit: uploadThreadCount }), []);
  const fileNameList = useMemo(() => (attachmentRecordList ?? []).map((item) => item.asrName), [attachmentRecordList]);
  const fileWhiteList = useMemo(() => {
    if (!attachInfo?.fileWhiteList) return '';
    const fileWhileListArr = attachInfo?.fileWhiteList.split(',').map((item) => (item[0] === '.' ? item : `.${item}`));
    return fileWhileListArr.join(',');
  }, [attachInfo?.fileWhiteList]);
  const initUpload = async (file) => {
    const { name, size } = file;
    if (size === 0) {
      message.error(`文件${name}无任何内容，无法上传`);
      setUploadState((state) => ({
        ...state,
        fail: state.fail + 1
      }));
      return;
    }
    const isBigFile = size > 1024 * 1024 * 10;
    const identifier = await (isBigFile ? getFileMd5BySlice(file, chunkSize) : getFileMd5(file));
    const uploadTaskRes = await getUploadTask({ identifier });
    if (uploadTaskRes?.code === 0) {
      let initData: any = null;
      if (uploadTaskRes.data) {
        initData = uploadTaskRes.data;
      } else {
        const initUploadTaskRes = await initUploadTask({
          identifier,
          totalSize: size,
          chunkSize,
          fileName: zh.CryptoJS.encode(name)
        });
        initUploadTaskRes?.code === 0 && (initData = initUploadTaskRes.data);
      }
      if (!initData) return;
      if (initData.finished) {
        setUploadState((state) => ({
          ...state,
          successSize: state.successSize + size
        }));
        endUpload(identifier, file, initData.finished, true);
      } else {
        chunkFileUpload({ file, info: initData.taskRecord });
      }
    }
  };
  const endUpload = async (identifier, file, alreadyExist = 0, success) => {
    if (success) {
      setUploadState((state) => ({
        ...state,
        success: state.success + 1
      }));
      await mergeUploadFile({
        asrSessionGuid: data.asrSessionGuid,
        identifier,
        alreadyExist: +alreadyExist,
        userId: asrFill,
        userName: asrFillName,
        asrTable,
        asrCode
      });
      onFileUpload(file);
    } else {
      setUploadState((state) => ({
        ...state,
        fail: state.fail + 1
      }));
    }
  };
  const chunkFileUpload = useRefCallback(async ({ file, info }) => {
    const { size } = file;
    const { fileIdentifier: identifier, chunkSize, chunkNum, exitPartList } = info;
    const allPartNumList = getSortNumArr(chunkNum);
    let targetPartNumList = allPartNumList;
    if (exitPartList?.length) {
      targetPartNumList = allPartNumList.filter(
        (partNum) => !exitPartList.map((item) => item.partNumber).includes(partNum)
      );
      setUploadState((state) => ({
        ...state,
        successSize: exitPartList.reduce((value, item) => value + +item.size, +state.successSize)
      }));
    }
    let { length: targetPartNumLength } = targetPartNumList;
    if (!targetPartNumLength) {
      endUpload(identifier, file, 0, true);
    }
    for (const partNum of targetPartNumList) {
      const chunkFile = File.prototype.slice.call(file, (partNum - 1) * chunkSize, Math.min(partNum * chunkSize, size));
      threadPool.add(
        async () => {
          const getPreSignUploadUrlRes = await getPreSignUploadUrl({
            identifier,
            partNumber: partNum
          }).catch(() => {
            message.error(`分片${partNum}， 获取上传地址失败`);
          });
          if (getPreSignUploadUrlRes?.code === 0 && getPreSignUploadUrlRes?.data) {
            await zh.request.put({
              url: getPreSignUploadUrlRes?.data,
              data: chunkFile,
              headers: { 'Content-Type': 'application/octet-stream' }
            });
            setUploadState((state) => ({
              ...state,
              successSize: state.successSize + chunkFile.size
            }));
          }
        },
        () => {
          targetPartNumLength -= 1;
          if (!targetPartNumLength) {
            endUpload(identifier, file, 0, true);
          }
        }
      );
    }
  });
  const initUploadState = (all) => {
    uploadingRef.current = true;
    setUploadState({
      success: 0,
      fail: 0,
      all,
      successSize: 0,
      allSize: 0
    });
  };

  return (
    <div style={{ display: hidden ? 'none' : 'inline-block' }}>
      <UploadComp
        ref={ref}
        multiple
        accept={accept ?? fileWhiteList ?? '*'}
        maxCount={1}
        showUploadList={false}
        beforeUpload={async (file, fileList) => {
          const index = fileList.findIndex((item) => item === file);
          const suffix = getFileType(file.name);
          const fileText = `文件（${file.name}）的`;
          if (attachInfo?.specialChars) {
            for (const str of attachInfo?.specialChars) {
              if (file.name.includes(str)) {
                message.error(fileText + '文件名包含特殊符号，无法上传');
                return false;
              }
            }
          }
          if (accept ?? fileWhiteList) {
            const fileWhiteListArr = (accept ?? fileWhiteList)
              .split(',')
              .map((item) => (item[0] === '.' ? item : `.${item}`));
            if (!fileWhiteListArr.includes(`.${suffix}`)) {
              message.error(`不允许文件格式为${suffix}的附件上传，请重新上传`);
              return false;
            }
          }
          if (!attachInfo?.fileWhiteList && attachInfo?.fileBlackList) {
            const fileBlackListArr = attachInfo?.fileBlackList
              .split(',')
              .map((item) => (item[0] === '.' ? item : `.${item}`));
            if (suffix && fileBlackListArr.includes(`.${suffix}`)) {
              message.error(`不允许文件格式为${suffix}的附件上传，请重新上传`);
              return false;
            }
          }
          if (file.size / 1048576 > attachInfo?.maxSize) {
            message.error(fileText + '文件大小超出上限，无法上传');
            return false;
          }
          if (fileNameList.includes(file.name)) {
            message.error(fileText + '文件名已存在');
            return false;
          }
          if (file.size / 1048576 > attachInfo?.warnSize) {
            const res = await zh.confirm(`${fileText}文件大小超过${attachInfo?.warnSize}M,确定继续上传吗`);
            if (!res) {
              return false;
            }
          }
          if (fileList.length + attachmentRecordList?.length > maxCount) {
            message.error('文件数量已达到上限，无法上传新文件');
            return false;
          }
          if (!index) initUploadState(fileList.length);
          setUploadState((state) => ({
            ...state,
            allSize: state.allSize + file.size
          }));
          await initUpload(file);
          return false;
        }}
        {...restProps}
      >
        {children ?? <Button type="primary">上传文件</Button>}
      </UploadComp>
    </div>
  );
});
