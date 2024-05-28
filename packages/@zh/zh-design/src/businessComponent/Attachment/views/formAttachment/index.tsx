import { Divider, Progress, Space } from 'antd';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ColumnProps, Table } from '../../../../functionalComponent';
import { Layout, zh } from '../../../../util';
import { getTableAttachmentApi } from '../../api';
import { AttachmentButton, FileView, RemarkModal } from '../../components';
import { ITableAttachmentProps, TableAttachmentPermission } from '../../interface';
import { getTempAttachment } from '../../service';
import { getFileSize, getFileType } from '../../util';
import { AttachmentToolbar } from './components';
import './index.less';

const fileIconStyle = { fontSize: 20 };
const defaultPermission: TableAttachmentPermission & { manage: 0 | 1 | 2 } = {
  add: 1,
  delete: 1,
  preview: 1,
  download: 1,
  zipDownload: 1,
  manage: 1
};

export const FormAttachment = forwardRef((props: ITableAttachmentProps & { value?: any; onChange?: Function }, ref) => {
  const uploadingRef = useRef(false);
  const tableRef = useRef<any>();
  const {
    value = {},
    onChange,
    permission,
    asrSessionGuid: propAsrSessionGuid,
    asrFill: propAsrFill,
    asrFillName: propAsrFillName,
    orgId,
    uCode: propUCode,
    asrTable,
    asrCode,
    asrAttachTable = 'c_pfc_attachment',
    busTypeCode,
    busUrl,
    approved = 0,
    attachWaterMarkSetDownload = 0,
    maxCount = 10,
    uploadThreadCount = 3,
    chunkSize = 5242880,
    apiRef = useRef({}),
    uploadRef = useRef({}),
    style = {},
    tableStyle = {},
    customOpenTab,
    onSave,
    accept
  } = props;
  const asrSessionGuid = useMemo(() => propAsrSessionGuid || zh.uniqueId(), [propAsrSessionGuid]);
  const {
    asrFill,
    asrFillName,
    uCode,
    tableAttachInfo = {},
    attachmentRecordList = [],
    handleDelete,
    handleDownload,
    handleZipDownload,
    handlePreview
  } = value;
  const [uploadState, setUploadState] = useState({
    success: 0,
    fail: 0,
    all: 0,
    successSize: 0,
    allSize: 0
  });
  const [loading, setLoading] = useState<any>(false);
  const [remarkVisible, setRemarkVisible] = useState(false);
  const [curRow, setCurRow] = useState({});
  const previewFileType = useMemo(() => tableAttachInfo?.previewFileType?.split('.') ?? [], [tableAttachInfo]);
  useImperativeHandle(
    ref,
    () => ({
      getApi: () => apiRef.current
    }),
    []
  );
  const getTableAttach = async () => {
    setLoading(true);
    const data =
      value && Object.keys(value).length > 0
        ? {
            ...value,
            attachmentRecordList: await getTempAttachment({ asrSessionGuid })
          }
        : {
            ...((await getTableAttachmentApi({
              asrSessionGuid,
              asrFill: propAsrFill,
              asrFillName: propAsrFillName,
              orgId,
              uCode: propUCode,
              approved,
              asrTable,
              asrCode,
              asrAttachTable,
              busTypeCode,
              busUrl,
              attachWaterMarkSetDownload,
              customOpenTab,
              onSave
            })) ?? {}),
            uploadingRef
          };
    apiRef.current = data;
    onChange?.(data);
    setLoading(false);
  };
  const isPreview = useCallback(
    (file) => {
      const fileType = getFileType(file?.asrName);
      return fileType && previewFileType.includes(fileType);
    },
    [previewFileType]
  );

  // 表格配置项
  const tableConfig: ColumnProps[] = [
    {
      title: '附件名称',
      dataIndex: 'asrName',
      width: 300,
      flex: 1,
      render: ({ row, rowIndex }) => (
        <span
          className="attachment-flex-center"
          onMouseEnter={() => {
            tableRef.current.getApi().updateRowDataByIndex(rowIndex, { ...row, hoverRow: true });
          }}
          onMouseLeave={() => {
            tableRef.current.getApi().updateRowDataByIndex(rowIndex, { ...row, hoverRow: false });
          }}
        >
          <FileView fileName={row.asrName} fileIconStyle={fileIconStyle} />
          <span style={{ color: 'var(--disabled-color)' }}>（{getFileSize(row.asrSize)}）</span>
          {row.hoverRow && (
            <Space size={0}>
              <AttachmentButton
                size="small"
                type="link"
                permissionStatus={permission?.preview}
                disabled={!isPreview(row)}
                onClick={() => handlePreview(row)}
              >
                预览
              </AttachmentButton>
              <AttachmentButton
                size="small"
                type="link"
                permissionStatus={permission?.download}
                onClick={() => handleDownload(row)}
              >
                下载
              </AttachmentButton>
              <AttachmentButton
                size="small"
                type="link"
                permissionStatus={permission?.delete}
                onClick={() =>
                  handleDelete(row.asrFid).then((v) => {
                    v && getTableAttach();
                  })
                }
              >
                删除
              </AttachmentButton>
            </Space>
          )}
        </span>
      )
    },
    // {
    //   title: '附件状态',
    //   dataIndex: 'asrFlag',
    //   width: 80,
    //   flex: 1,
    //   render: ({ value }) => ['未保存', '已保存'][+value]
    // },
    {
      title: '上传时间',
      dataIndex: 'asrFilldt',
      width: 150,
      render: ({ value }) => value && zh.formatDate(new Date(value), 'YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '上传人',
      dataIndex: 'userName',
      width: 80
    },
    {
      title: '操作',
      dataIndex: 'options',
      width: 80,
      // fixed: 'right',
      render: ({ row }) => (
        <Space size={0} split={<Divider type="vertical" style={{ borderLeft: '1px solid var(--primary-color)' }} />}>
          <a
            style={{ color: 'var(--primary-color)' }}
            onClick={() => {
              setCurRow(row);
              setRemarkVisible(true);
            }}
          >
            备注
          </a>
        </Space>
      )
    }
  ];
  useEffect(() => {
    getTableAttach();
  }, [asrSessionGuid]);
  useEffect(() => {
    const { success, fail, all } = uploadState;
    if (success + fail === all) {
      uploadingRef.current = false;
    }
  }, [uploadState]);
  return (
    <Layout className="zh-form-attachment" style={style} direction="row">
      <Layout.Flex className="zh-form-attachment-content">
        <AttachmentToolbar
          accept={accept}
          uCode={uCode}
          asrSessionGuid={asrSessionGuid}
          asrFill={asrFill}
          asrFillName={asrFillName}
          asrTable={asrTable}
          asrCode={asrCode}
          busTypeCode={busTypeCode}
          orgId={orgId}
          maxCount={maxCount}
          tableAttachInfo={tableAttachInfo}
          attachmentRecordList={attachmentRecordList}
          uploadRef={uploadRef}
          uploadingRef={uploadingRef}
          uploadThreadCount={uploadThreadCount}
          chunkSize={chunkSize}
          getTableAttach={getTableAttach}
          setUploadState={setUploadState}
          handleZipDownload={handleZipDownload}
          permission={permission}
        />
        <Layout style={{ margin: '15px 0 10px' }} direction="row">
          <span>当前进度：</span>
          <Layout.Flex style={{ overflow: 'visible' }}>
            <Progress percent={Math.floor((uploadState.successSize / uploadState.allSize) * 100)} />
          </Layout.Flex>
          <span>
            {uploadState.all && uploadState.all === uploadState.success
              ? `已全部上传`
              : `已上传${uploadState.success}个`}
          </span>
          <span>，共{uploadState.all}个</span>
        </Layout>
        <Layout.Flex className="attachment-form-container" style={tableStyle}>
          <Table
            ref={tableRef}
            remember={false}
            bordered={false}
            headerMenu={false}
            hiddenHeader
            rowHeight={40}
            loading={loading}
            columns={tableConfig}
            dataSource={attachmentRecordList}
          />
        </Layout.Flex>
      </Layout.Flex>
      <RemarkModal
        data={curRow}
        visible={remarkVisible}
        setVisible={setRemarkVisible}
        getTableAttach={getTableAttach}
      />
    </Layout>
  );
});
