import React from 'react';
import { message, showModal } from '../../functionalComponent';
import { zh } from '../../util';
import { ITableAttachmentApi, ITableAttachmentApiProps, ITableAttachmentProps } from './interface';
import {
  attachDelete,
  attachGetWaterMarkContent,
  attachSave,
  attachSaveDownloadRecord,
  createZip,
  editCategory,
  getAttachmentCountBatch as getAttachmentCountBatchService,
  getFileUrl,
  // getTaskAttachmentParams,
  // getBillSourceAttachmentParams,
  getZipDowndloadInfo,
  getZipUrl,
  shareSave,
  tableAttachInit
} from './service';
import { downloadFile, getFileType, openTab as openTabApi } from './util';
import { TableAttachment } from './views';

const isDev = process.env.NODE_ENV === 'development';
const titleMap = {
  View: '文件查看',
  Edit: '文件编辑',
  Preview: '文件预览'
};

const getShareValue = (sharedOne, sharedOneName) => {
  const shareValue: { label: string; value: any }[] = [];
  if (sharedOne && sharedOneName) {
    const sharedOneList = sharedOne.split(',');
    const sharedOneNameList = sharedOneName.split(',');
    if (sharedOneList.length === sharedOneNameList.length) {
      for (let i = 0; i < sharedOneList.length; i++) {
        shareValue.push({ label: sharedOneNameList[i], value: sharedOneList[i] });
      }
    }
  }
  return shareValue;
};

export const getTableAttachmentApi = async (params: ITableAttachmentApiProps): Promise<ITableAttachmentApi> => {
  const {
    asrSessionGuid: propAsrSessionGuid,
    asrFill: propAsrFill,
    asrFillName: propAsrFillName,
    orgId: propOrgId,
    uCode: propUCode,
    asrTable,
    asrCode,
    asrAttachTable = 'c_pfc_attachment',
    busTypeCode,
    busUrl,
    attachWaterMarkSetDownload = 0,
    approved = 0,
    customOpenTab,
    onSave
  } = params;
  const openTab =
    typeof customOpenTab === 'function'
      ? (title, path, params) => customOpenTab(title, zh.handleUrl(path, params))
      : openTabApi;
  const userInfo = zh.getUser();
  const asrFill = propAsrFill ?? userInfo.userID;
  const asrFillName = propAsrFillName ?? userInfo.userName;
  const orgId = propOrgId ?? userInfo.orgID;
  const uCode = propUCode ?? userInfo.ucode;
  const asrSessionGuid = propAsrSessionGuid ?? zh.uniqueId();
  const getTableAttachInfo = async () =>
    await tableAttachInit({
      asrSessionGuid,
      asrTable,
      asrCode,
      asrAttachTable,
      busTypeCode,
      orgId,
      busUrl,
      uCode
    });
  const tableAttachInfo = await getTableAttachInfo();
  const attachmentRecordList =
    tableAttachInfo?.attachmentRecordList?.map((item) => ({ ...item, asrName: decodeURIComponent(item.asrName) })) ??
    [];
  return {
    asrSessionGuid,
    asrFill,
    asrFillName,
    asrTable,
    asrCode,
    asrAttachTable,
    busTypeCode,
    orgId,
    busUrl,
    uCode,
    tableAttachInfo,
    attachmentRecordList,
    getTableAttachInfo,
    handleEditOrView: async (file, type) => {
      const { asrName, asrFid, asrFill } = file;
      const fileType = getFileType(asrName);
      const { waterMarkEnable } = tableAttachInfo;
      const url = '/WM/Archive/KingGridObject/KingGridObjectEdit';
      const params: any = {
        dbToken: uCode,
        RecordID: asrSessionGuid,
        BillId: asrFid,
        DataFrom: 'attachment',
        AsrName: asrName,
        FileType: `.${fileType}`,
        OpType: type,
        BillBusinessType: busTypeCode
      };
      if (+waterMarkEnable === 1) {
        const res = await attachGetWaterMarkContent(
          {
            busTypeCode,
            asrFill,
            orgId
          },
          uCode
        );
        params.WaterMark = res?.data;
      }
      openTab(titleMap[type], url, params);
    },
    handleDelete: async (id) => {
      const res = await attachDelete({
        asrSessionGuid,
        asrFidList: id
      });
      if (res?.code === 0) {
        message.success('删除成功');
        return true;
      }
    },
    handleDownload: async (file) => {
      const res = await getFileUrl({ identifier: file.fileMd5 });
      if (res?.code === 0) {
        attachSaveDownloadRecord({
          asrFid: file.asrFid,
          userId: asrFill,
          userName: asrFillName
        });
        const origin = isDev ? 'http://10.18.3.205:8081' : location.origin;
        downloadFile(file.asrName, origin + res.data, 'url');
      }
    },
    handleZipDownload: async () => {
      const res = await createZip({ asrTable, asrCode });
      if (res?.code === 0) {
        (async function getZipDowndloadInfoLoop() {
          const res = await getZipDowndloadInfo({ asrTable, asrCode });
          if (res?.code === 0) {
            const { data } = res;
            if (data < 100) {
              setTimeout(getZipDowndloadInfoLoop, 2000);
            } else {
              const zipUrl = await getZipUrl(
                {
                  asrTable,
                  asrCode
                },
                uCode
              );
              const origin = isDev ? 'http://10.18.3.205:8081' : location.origin;
              downloadFile('package', origin + zipUrl, 'url');
            }
          }
        })();
      }
    },
    handlePreview: async (file) => {
      const res = await getFileUrl({ identifier: file.fileMd5 });
      if (res?.code === 0) {
        const origin = isDev ? 'http://10.18.3.205:8081' : location.origin;
        const prevUrl = `${origin}/filePreview/onlinePreview?url=${zh.Base64.encode(origin + res.data)}`;
        openTab(titleMap.Preview, prevUrl);
      }
    },
    handleEditCategory: async (checkedList) => {
      const res = await zh.external.openHelp({
        type: 'SingleHelp',
        helpId: 'AttachmentTypeHelpPlugin',
        valueField: 'typeid',
        labelField: 'typename',
        clientSqlFilter: `cuid=${tableAttachInfo.cuid}&bustypecode=${busTypeCode}`
      });
      if (res) {
        const editRes = await editCategory(
          {
            asrSessionGuid,
            asrFids: checkedList.map((item) => item.asrFid).join(','),
            typeId: res.value
          },
          uCode
        );
        if (editRes?.code === 0) {
          message.success('操作成功');
        }
      }
    },
    handleChangeShareType: async (v, data) => {
      const { asrFid, sharedOne, sharedOneName } = data;
      if (v === 'self') {
        await shareSave(
          {
            asrSessionGuid,
            asrFid,
            sharedOne: asrFill,
            sharedOneName: asrFillName,
            shareType: v
          },
          uCode
        );
      } else {
        const helpTypeMap = {
          empno: 'UserHelp',
          dept: 'DeptHelp'
        };
        const helpType = helpTypeMap[v] || 'UserHelp';
        const res = await zh.external.openHelp({
          type: helpType,
          multiple: true,
          value: getShareValue(sharedOne, sharedOneName)
        });
        if (res) {
          await shareSave(
            {
              asrSessionGuid,
              asrFid,
              sharedOne: res.map((item) => item.value).join(','),
              sharedOneName: res.map((item) => item.label).join(','),
              shareType: v
            },
            uCode
          );
        }
      }
    },
    handleValid: () => {
      if (tableAttachInfo?.billAttachTypeList?.length) {
        const item = tableAttachInfo.billAttachTypeList.find((item) => item.mustInput === 1 && item.count === 0);
        if (item) {
          message.error(`${item.typeName}下面必须有至少一个附件才可以保存`);
          return false;
        }
      }
      return true;
    },
    handleSave: async (params: any = {}) => {
      const { asrCode: originAsrCode, asrTable: originAsrTable, asrSessionGuid: originAsrSessionGuid } = params;
      const res = await attachSave({
        asrCode: originAsrCode ?? asrCode,
        asrTable: originAsrTable ?? asrTable,
        asrSessionGuid: originAsrSessionGuid ?? asrSessionGuid
      });
      if (res?.code === 0) {
        onSave?.(res?.data);
        message.success('保存成功');
      }
    }
  };
};

export const getAttachmentCountBatch = async (params) => {
  const { asrCode, asrTable } = params;
  const res = await getAttachmentCountBatchService({ asrCode, asrTable });
  return res;
};

export const openAttachment = (props: ITableAttachmentProps) =>
  new Promise((resolve) => {
    const { control = true, categoryStyle = {}, style = {}, status, ...restProps } = props;
    const apiRef = React.createRef<any>();
    const handleOk = async (ins) => {
      const api = apiRef.current?.getApi() ?? {};
      if (api.uploadingRef.current) {
        zh.message('正在上传中，无法关闭弹窗');
        return;
      }
      if (api.handleValid?.()) {
        await (!control && api?.handleSave?.());
        ins.destroy();
        resolve({
          ...api,
          closeStatus: 'ok'
        });
      }
    };
    const handleCancel = (ins) => {
      const api = apiRef.current?.getApi() ?? {};
      ins.destroy();
      resolve({
        ...api,
        closeStatus: 'cancel'
      });
    };
    showModal({
      title: '附件',
      width: 1000,
      height: 700,
      footer: false,
      params: { isModal: true, handleOk, handleCancel },
      content: (
        <TableAttachment
          {...restProps}
          status={status}
          style={{ height: '100%', ...style }}
          categoryStyle={{
            borderBottomLeftRadius: 10,
            ...categoryStyle
          }}
          ref={apiRef}
        />
      ),
      async onOk(ins) {
        await handleOk(ins);
      },
      async onCancel(ins) {
        await handleCancel(ins);
      }
    });
  });
