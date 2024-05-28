import { DownloadOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import { openAttachment } from '../../../../api';
import { AttachmentButton, Upload } from '../../../../components';

export function AttachmentToolbar(props) {
  const {
    uCode,
    accept,
    asrSessionGuid,
    asrFill,
    asrFillName,
    asrTable,
    asrCode,
    busTypeCode,
    orgId,
    maxCount = 10,
    tableAttachInfo,
    attachmentRecordList,
    uploadRef,
    uploadingRef,
    uploadThreadCount,
    chunkSize,
    setUploadState,
    permission,
    getTableAttach,
    handleZipDownload
  } = props;
  // 工具栏操作函数
  const onToolbarClick = (id) => {
    switch (id) {
      case 'zipDownload': {
        handleZipDownload();
        break;
      }
    }
  };
  return (
    <Space size={[15, 10]} wrap>
      <Upload
        ref={uploadRef}
        asrFill={asrFill}
        asrFillName={asrFillName}
        asrTable={asrTable}
        asrCode={asrCode}
        accept={accept}
        maxCount={maxCount}
        data={{ asrSessionGuid }}
        attachInfo={tableAttachInfo}
        attachmentRecordList={attachmentRecordList}
        uCode={uCode}
        uploadingRef={uploadingRef}
        uploadThreadCount={uploadThreadCount}
        chunkSize={chunkSize}
        setUploadState={setUploadState}
        onFileUpload={async (file) => {
          getTableAttach();
        }}
      >
        <AttachmentButton permissionStatus={permission?.add} disabled={uploadingRef.current} icon={<UploadOutlined />}>
          上传文件
        </AttachmentButton>
      </Upload>
      <AttachmentButton
        permissionStatus={permission?.zipDownload}
        icon={<DownloadOutlined />}
        onClick={() => onToolbarClick('zipDownload')}
      >
        全部下载
      </AttachmentButton>
      <AttachmentButton
        permissionStatus={permission?.manage}
        icon={<PaperClipOutlined />}
        onClick={async () => {
          await openAttachment({
            asrTable,
            asrCode,
            busTypeCode,
            orgId,
            asrSessionGuid,
            permission
          });
          getTableAttach();
        }}
      >
        附件管理({attachmentRecordList.length})
      </AttachmentButton>
    </Space>
  );
}
