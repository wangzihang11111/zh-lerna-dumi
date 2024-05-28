import { Divider, Progress, Space } from 'antd';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Button, ColumnProps, message, ModalContext, Table, Tabs } from '../../../../functionalComponent';
import { Layout, zh } from '../../../../util';
import { getTableAttachmentApi } from '../../api';
import { CategoryTree, DownloadRecordModal, FileView, RemarkModal, Toolbar } from '../../components';
import { ITableAttachmentProps, TableAttachmentPermission } from '../../interface';
import { getTempAttachment, shareSave } from '../../service';
import { getFileSize, getFileType } from '../../util';
import './index.less';

const fileIconStyle = { fontSize: 20 };
const defaultPermission: TableAttachmentPermission = {
  add: 1,
  delete: 1,
  edit: 1,
  view: 1,
  preview: 1,
  download: 1,
  zipDownload: 1,
  editCategory: 1
};
const shareTypeOptions = [
  { label: '自己', value: 'self' },
  { label: '人员', value: 'empno' },
  { label: '部门', value: 'dept' }
];

const attachmentCategoryOptions = [
  { label: '单据附件', key: 'attach' },
  { label: '审批后附件', key: 'approvedAttach' }
  // { label: '工作流附件', value: 'workFlowAttach' },
  // { label: '来源单据附件', value: 'oriBizAttach' },
];

export const TableAttachment = forwardRef((props: ITableAttachmentProps, ref) => {
  const uploadingRef = useRef(false);
  const { ins, params } = useContext(ModalContext);
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
    approved = 0,
    permission: originPermission = {},
    downloadAttachment = 0,
    attachWaterMarkSetDownload = 0,
    status = 'add',
    maxCount = 10,
    uploadThreadCount = 3,
    chunkSize = 5242880,
    apiRef = useRef({}),
    uploadRef = useRef({}),
    style = {},
    categoryStyle = {},
    tableStyle = {},
    customOpenTab,
    onLoad,
    onSave,
    accept
  } = props;
  const asrSessionGuid = useMemo(() => propAsrSessionGuid || zh.uniqueId(), [propAsrSessionGuid]);
  const [tableAttachmentApi, setTableAttachmentApi] = useState<any>({});
  const {
    asrFill,
    asrFillName,
    uCode,
    tableAttachInfo = {},
    attachmentRecordList = [],
    handleEditOrView,
    handleDelete,
    handleDownload,
    handleZipDownload,
    handlePreview,
    handleEditCategory
  } = tableAttachmentApi;
  const [uploadState, setUploadState] = useState({
    success: 0,
    fail: 0,
    all: 0,
    successSize: 0,
    allSize: 0
  });
  const [loading, setLoading] = useState<any>(false);
  const [checkedListMap, setCheckedListMap] = useState({
    attach: [],
    approvedAttach: []
  });
  const [remarkVisible, setRemarkVisible] = useState(false);
  const [downloadRecordVisible, setDownloadRecordVisible] = useState(false);
  const [curRow, setCurRow] = useState({});
  const [attachType, setAttachType] = useState('attach');
  const [typeId, setTypeId] = useState(0);
  const checkedList = useMemo(() => checkedListMap[attachType], [checkedListMap, attachType]);
  const previewFileType = useMemo(() => tableAttachInfo?.previewFileType?.split('.') ?? [], [tableAttachInfo]);
  const permission = useMemo(() => {
    if (status === 'view') {
      const curPermission: TableAttachmentPermission = {
        ...defaultPermission,
        ...originPermission,
        add: 2,
        delete: 2,
        edit: 2
      };
      if (curPermission.view !== 1) {
        curPermission.preview = 0;
        curPermission.download = 0;
        curPermission.zipDownload = 0;
      }
      if (+downloadAttachment !== 0) {
        curPermission.download = downloadAttachment;
        curPermission.zipDownload = downloadAttachment;
      }
      return curPermission;
    } else {
      const curPermission: TableAttachmentPermission = { ...defaultPermission, ...originPermission };
      if (
        curPermission.add === 1 &&
        curPermission.delete !== 1 &&
        checkedList.length &&
        checkedList.findIndex((item) => +item.asrFlag === 1) === -1
      ) {
        curPermission.delete = 1;
      }
      if (+downloadAttachment !== 0) {
        curPermission.download = downloadAttachment;
        curPermission.zipDownload = downloadAttachment;
      }
      return curPermission;
    }
  }, [originPermission, status, checkedList, downloadAttachment]);
  const attachListMap = useMemo(
    () => ({
      attach: attachmentRecordList?.filter((item) => +item.approved === 0) ?? [],
      approvedAttach: attachmentRecordList?.filter((item) => +item.approved === 1) ?? []
    }),
    [attachmentRecordList]
  );
  const attachList = useMemo(
    () => (typeId ? attachListMap[attachType].filter((item) => item.typeId === typeId) : attachListMap[attachType]),
    [attachListMap, attachType, typeId]
  );
  const filterAttachmentCategoryOptions = useMemo(() => {
    if (+approved === 1 || attachmentRecordList?.findIndex((item) => +item.approved === 1) > -1) {
      return attachmentCategoryOptions;
    } else {
      return attachmentCategoryOptions.filter((item) => item.key !== 'approvedAttach');
    }
  }, [approved, attachmentRecordList]);
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
      tableAttachmentApi && Object.keys(tableAttachmentApi).length > 0
        ? {
            ...tableAttachmentApi,
            attachmentRecordList: await getTempAttachment({ asrSessionGuid })
          }
        : {
            ...((await getTableAttachmentApi({
              asrSessionGuid,
              asrFill: propAsrFill,
              asrFillName: propAsrFillName,
              orgId: propOrgId,
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
    setTableAttachmentApi(data);
    apiRef.current = data;
    onLoad?.(data);
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
      width: 120,
      flex: 1,
      tooltip: true,
      filter: true,
      render: ({ row }) => (
        <span className="attachment-flex-center">
          <FileView
            isPreview={permission.preview !== 2 && isPreview(row)}
            fileName={row.asrName}
            fileIconStyle={fileIconStyle}
            onClick={async () => {
              if (permission.preview === 0) {
                message.error('没有预览权限，无法预览');
                return;
              }
              await handlePreview(row);
            }}
          />
        </span>
      )
    },
    {
      title: '附件状态',
      dataIndex: 'asrFlag',
      width: 80,
      flex: 1,
      render: ({ value }) => ['未保存', '已保存'][+value]
    },
    // {
    //   title: '附件分类',
    //   dataIndex: 'typeName',
    //   width: 80,
    //   flex: 1
    // },
    {
      title: '备注',
      dataIndex: 'asrRemark',
      width: 80,
      flex: 1,
      tooltip: true
    },
    {
      title: '附件大小',
      dataIndex: 'asrSize',
      width: 80,
      flex: 1,
      render: ({ value }) => getFileSize(value)
    },
    {
      title: '上传人',
      dataIndex: 'userName',
      width: 80,
      flex: 1
    },
    {
      title: '上传时间',
      dataIndex: 'asrFilldt',
      width: 150,
      flex: 1,
      render: ({ value }) => value && zh.formatDate(new Date(value), 'YYYY-MM-DD HH:mm:ss')
    },
    // {
    //   title: '共享方式',
    //   dataIndex: 'shareType',
    //   width: 80,
    //   flex: 1,
    //   render: ({ value, row }) => (
    //     <Select
    //       className="share-type-select"
    //       options={shareTypeOptions}
    //       defaultValue={value && value.split(',')[0]}
    //       bordered={false}
    //       onSelect={(v) => handleChangeShareType(v, row).then(getTableAttach)}
    //     />
    //   )
    // },
    // {
    //   title: '共享给',
    //   dataIndex: 'sharedOneName',
    //   width: 80,
    //   flex: 1,
    //   tooltip: true
    // },
    {
      title: '操作',
      dataIndex: 'options',
      flex: 1,
      width: 150,
      fixed: 'right',
      render: ({ row }) => (
        <Space size={0} split={<Divider type="vertical" style={{ borderLeft: '1px solid var(--primary-color)' }} />}>
          <a
            style={{ color: 'var(--primary-color)' }}
            onClick={() => {
              setCurRow(row);
              setRemarkVisible(true);
            }}
          >
            修改备注
          </a>
          <a
            style={{ color: 'var(--primary-color)' }}
            onClick={() => {
              setCurRow(row);
              setDownloadRecordVisible(true);
            }}
          >
            下载记录
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
    <Layout className="zh-table-attachment" style={style} direction="row">
      {tableAttachInfo?.billAttachTypeList?.length ? (
        <CategoryTree style={categoryStyle} data={tableAttachInfo?.billAttachTypeList} onSelect={setTypeId} />
      ) : null}
      <Layout.Flex className="zh-table-attachment-content">
        <Toolbar
          accept={accept}
          permission={permission}
          uCode={uCode}
          asrSessionGuid={asrSessionGuid}
          asrFill={asrFill}
          asrFillName={asrFillName}
          asrTable={asrTable}
          asrCode={asrCode}
          approved={approved}
          attachType={attachType}
          typeId={typeId}
          maxCount={maxCount}
          tableAttachInfo={tableAttachInfo}
          attachmentRecordList={attachmentRecordList}
          checkedList={checkedList}
          uploadRef={uploadRef}
          uploadingRef={uploadingRef}
          uploadThreadCount={uploadThreadCount}
          chunkSize={chunkSize}
          shareSave={shareSave}
          getTableAttach={getTableAttach}
          setUploadState={setUploadState}
          setCheckedListMap={setCheckedListMap}
          handleEditOrView={handleEditOrView}
          handleDelete={handleDelete}
          handleDownload={handleDownload}
          handleZipDownload={handleZipDownload}
          handleEditCategory={handleEditCategory}
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
        {filterAttachmentCategoryOptions.length > 1 ? (
          <Tabs
            fitHeight={false}
            size="small"
            defaultActiveKey={filterAttachmentCategoryOptions[0].key}
            items={filterAttachmentCategoryOptions}
            onChange={(v) => setAttachType(v)}
            tabBarStyle={{ backgroundColor: '#F9FAFB', padding: '0 22px 3px' }}
          />
        ) : null}
        <Layout.Flex className="attachment-table-container" style={tableStyle}>
          <Table
            remember={false}
            key={attachType}
            checkbox
            headerMenu={false}
            rowHeight={40}
            loading={loading}
            onCheckedChange={(list) => setCheckedListMap((state) => ({ ...state, [attachType]: list }))}
            columns={tableConfig}
            dataSource={attachList}
          />
        </Layout.Flex>
        {params?.isModal ? (
          <div style={{ display: 'flex', margin: '15px 5px 5px', justifyContent: 'flex-end' }}>
            <Button onClick={() => params?.handleCancel(ins)} style={{ width: 84, marginRight: 10 }}>
              取消
            </Button>
            <Button onClick={() => params?.handleOk(ins)} type="primary" style={{ width: 84 }}>
              确定
            </Button>
          </div>
        ) : null}
      </Layout.Flex>
      <RemarkModal
        data={curRow}
        visible={remarkVisible}
        setVisible={setRemarkVisible}
        getTableAttach={getTableAttach}
      />
      <DownloadRecordModal data={curRow} visible={downloadRecordVisible} setVisible={setDownloadRecordVisible} />
    </Layout>
  );
});

// const getWorkFlowAttach = async () => {
//   const res = await getTaskAttachmentParams({
//     bizid: asrTable,
//     pkstr: asrCode
//   })
// }
// const getOriBizAttach = async () => {
//   const res = await getBillSourceAttachmentParams({
//     tableName: asrTable,
//     busId: asrCode
//   })
// }
