import { zh } from '../../util';
import { customRequest } from './util';

/**
 * 表格附件初始化接口（加载附件时调用）
 */
export async function tableAttachInit(data) {
  try {
    const res = await customRequest.post({
      url: '/fileSrv/record/attachmentRecord/tableAttachInit',
      data
    });
    if (res?.code === 0) {
      return res?.data;
    }
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取临时附件
 */
export async function getTempAttachment(data) {
  try {
    const res = await customRequest.get({
      url: '/fileSrv/record/attachmentTempRecord/listByAsrSessionGuid',
      data
    });
    if (res?.code === 0) {
      return res?.data;
    }
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 初始化上传任务
 */
export async function initUploadTask(data) {
  try {
    return await customRequest.post({
      url: '/fileSrv/record/attachmentRecord/initTask',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取预签名上传链接
 */
export async function getPreSignUploadUrl(data) {
  try {
    return await customRequest.get({
      url: '/fileSrv/record/attachmentRecord/preSignUploadUrl',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 合并文件
 */
export async function mergeUploadFile(data) {
  try {
    return await customRequest.post({
      url: '/fileSrv/record/attachmentRecord/merge',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取上传任务
 */
export async function getUploadTask(data) {
  try {
    return await customRequest.get({
      url: '/fileSrv/record/attachmentRecord/taskInfo',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取文件链接
 */
export async function getFileUrl(data) {
  try {
    return await customRequest.get({
      url: '/fileSrv/record/attachmentRecord/getFileUrl',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 附件上传接口（分块上传，分块大小1M）
 */
export async function attachUpload(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.post({
      url: '/JFileSrv/file/newUpload',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 附件删除接口
 */
export async function attachDelete(data) {
  try {
    return await customRequest.post({
      url: '/fileSrv/record/attachmentRecord/delete',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 附件保存接口
 */
export async function attachSave(data) {
  return await customRequest.post({
    url: '/fileSrv/record/attachmentRecord/save',
    data
  });
}

/**
 * 附件获取下载信息接口（调用下载接口前调用）
 */
export async function attachGetDownloadInfo(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/JFileSrv/reactAttach/getDownloadInfo',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}
/**
 * 附件下载接口
 */
export async function attachDownload(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/JFileSrv/file/download',
      //  url: 'http://10.18.44.11:30599/JFileSrv/file/download',
      //  absUrl: true,
      headers: { dbToken },
      responseType: 'arrayBuffer',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 附件下载记录保存接口
 */
export async function attachSaveDownloadRecord(data) {
  try {
    return await customRequest.post({
      url: '/fileSrv/record/attachmentDownloadHistory/save',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 附件获取下载水印文件信息接口（下载水印文件接口前调用）
 */
export async function attachGetDownloadWaterMarkInfo(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/JFileSrv/watermark/getWaterMarkFileForReact',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 附件下载水印接口
 */
export async function attachDownloadWaterMarkFile(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/JFileSrv/watermark/downloadWaterMarkFile',
      headers: { dbToken },
      responseType: 'arrayBuffer',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取水印内容接口
 */
export async function attachGetWaterMarkContent(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/JFileSrv/watermark/getWaterMarkContentForReact',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 表格附件修改备注接口
 */
export async function tableAttachSaveRemark(data) {
  try {
    return await customRequest.post({
      url: '/fileSrv/record/attachmentTempRecord/updateRemark',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 工作流附件取数参数获取接口
 */
export async function getTaskAttachmentParams(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/api/WorkFlow3/WorkFlowApp/GetTaskAttachment',
      headers: { Authorization: zh.getUser().ucode ?? dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 来源单据附件取数参数获取接口
 */
export async function getBillSourceAttachmentParams(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/api/IMP/EngineApi/GetBillSourceInfo',
      headers: { Authorization: zh.getUser().ucode ?? dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取下载记录接口
 */
export async function getDownLoadList(data) {
  try {
    return await customRequest.get({
      url: '/fileSrv/record/attachmentDownloadHistory/list',
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 保存标签接口
 */
export async function saveTags(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.post({
      url: '/JFileSrv/reactAttach/docTagsSave',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 共享保存接口
 */
export async function shareSave(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.post({
      url: '/JFileSrv/reactAttach/saveAttachShare',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 创建打包任务接口
 */
export async function createZip(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/fileSrv/record/attachmentRecord/createZipTask',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取压缩包下载信息接口
 */
export async function getZipDowndloadInfo(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/fileSrv/record/attachmentRecord/getZipTaskProgress',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 下载压缩包接口
 */
export async function getZipUrl(data, dbToken = zh.getUser().ucode) {
  try {
    return await zh.request.get({
      url: '/fileSrv/record/attachmentRecord/downloadZipFile',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 修改分类接口
 */
export async function editCategory(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.post({
      url: '/JFileSrv/attachtype/modifyAttachType',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取附件预览列表
 */
export async function getPreviewAttachmentList(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.body({
      url: '/JFileSrv/file/previewBatch',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取单据审批流状态
 */
export async function getAttachmentAuditStatus(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.get({
      url: '/SUP/Attachment/AttachmentGetAuditStatus',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}

/**
 * 获取单据审批流状态
 */
export async function getAttachmentCountBatch(data, dbToken = zh.getUser().ucode) {
  try {
    return await customRequest.body({
      url: '/fileSrv/record/attachmentRecord/getCountBatch',
      headers: { dbToken },
      data
    });
  } catch (e) {
    console.log(e);
  }
  return null;
}
