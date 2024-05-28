import { DownloadOutlined, FileAddOutlined, FileExcelOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { message } from '../../../functionalComponent';
import { AttachmentButton, Upload } from '../components';
import { getFileType } from '../util';

const editOrViewDataMap = {
  edit: {
    text: '编辑',
    param: 'Edit',
    fileTypeList: ['doc', 'docx', 'xls', 'xlsx']
  },
  view: {
    text: '查看',
    param: 'View',
    fileTypeList: ['doc', 'docx', 'xls', 'xlsx', 'pdf']
  }
};

export function Toolbar(props) {
  const {
    permission,
    uCode,
    accept,
    asrSessionGuid,
    asrFill,
    asrFillName,
    asrTable,
    asrCode,
    approved = 0,
    typeId,
    maxCount = 10,
    attachType,
    tableAttachInfo,
    attachmentRecordList,
    checkedList,
    uploadRef,
    uploadingRef,
    uploadThreadCount,
    chunkSize,
    shareSave,
    setUploadState,
    setCheckedListMap,
    getTableAttach,
    handleDelete,
    handleEditOrView,
    handleDownload,
    handleZipDownload,
    handleEditCategory
  } = props;
  // 工具栏操作函数
  const onToolbarClick = (id) => {
    const editOrView = function (id) {
      const { text, param, fileTypeList } = editOrViewDataMap[id] ?? {};
      if (!checkedList.length || checkedList.length > 1) {
        message.warning(`请选择一行进行${text}`);
      } else {
        const [file] = checkedList;
        const fileType = getFileType(file.asrName);
        if (fileTypeList.includes(fileType)) {
          handleEditOrView(file, param);
        } else {
          message.error(`${text}操作只支持${fileTypeList.toString()}`);
        }
      }
    };
    switch (id) {
      case 'delete': {
        if (!checkedList.length) {
          message.warning('请选择至少一行进行删除');
        } else {
          if (attachType !== 'approvedAttach' && +approved === 1) {
            message.error('已审批的单据只能删除审批后附件');
          } else {
            handleDelete(checkedList.map((item) => item.asrFid).join(',')).then((v) => {
              if (v) {
                setCheckedListMap((state) => ({ ...state, [attachType]: [] }));
                getTableAttach();
              }
            });
          }
        }
        break;
      }
      case 'edit':
      case 'view': {
        editOrView(id);
        break;
      }
      case 'download': {
        if (!checkedList.length) {
          message.warning('请选择至少一行进行下载');
        } else {
          checkedList.forEach((file) => handleDownload(file));
        }
        break;
      }
      case 'zipDownload': {
        handleZipDownload();
        break;
      }
      case 'editCategory': {
        if (!checkedList.length) {
          message.warning('请选择至少一行进行分类编辑');
        } else {
          handleEditCategory(checkedList).then(getTableAttach);
        }
        break;
      }
    }
  };
  return (
    <Space size={[15, 10]} wrap>
      {permission.add === 2 ? null : (
        <Upload
          ref={uploadRef}
          asrFill={asrFill}
          asrFillName={asrFillName}
          asrTable={asrTable}
          asrCode={asrCode}
          accept={accept}
          maxCount={maxCount}
          data={{ asrSessionGuid, approved, typeId }}
          attachInfo={tableAttachInfo}
          attachmentRecordList={attachmentRecordList}
          uCode={uCode}
          uploadingRef={uploadingRef}
          uploadThreadCount={uploadThreadCount}
          chunkSize={chunkSize}
          setUploadState={setUploadState}
          onFileUpload={async (file) => {
            // await shareSave(
            //   {
            //     asrSessionGuid,
            //     asrFid: file.uid,
            //     sharedOne: asrFill,
            //     sharedOneName: asrFillName,
            //     shareType: 'self'
            //   },
            //   uCode
            // );
            getTableAttach();
          }}
        >
          <AttachmentButton
            permissionStatus={permission.add}
            disabled={uploadingRef.current}
            icon={<FileAddOutlined />}
          >
            <span>新增</span>
            {/* <CaretDownOutlined /> */}
          </AttachmentButton>
        </Upload>
      )}
      <AttachmentButton
        permissionStatus={permission.delete}
        icon={<FileExcelOutlined />}
        onClick={() => onToolbarClick('delete')}
      >
        删除
      </AttachmentButton>
      {/* <AttachmentButton
        permissionStatus={permission.edit}
        icon={<FormOutlined />}
        onClick={() => onToolbarClick('edit')}
      >
        编辑
      </AttachmentButton>
      <AttachmentButton
        permissionStatus={permission.view}
        icon={<FileSearchOutlined />}
        onClick={() => onToolbarClick('view')}
      >
        查看
      </AttachmentButton> */}
      <AttachmentButton
        permissionStatus={permission.download}
        icon={<DownloadOutlined />}
        onClick={() => onToolbarClick('download')}
      >
        下载
      </AttachmentButton>
      <AttachmentButton
        permissionStatus={permission.zipDownload}
        icon={<DownloadOutlined />}
        onClick={() => onToolbarClick('zipDownload')}
      >
        打包下载
      </AttachmentButton>
      {tableAttachInfo?.billAttachTypeList?.length ? (
        <AttachmentButton
          permissionStatus={permission.editCategory}
          icon={<FileSearchOutlined />}
          onClick={() => onToolbarClick('editCategory')}
        >
          编辑分类
        </AttachmentButton>
      ) : null}
    </Space>
  );
}
