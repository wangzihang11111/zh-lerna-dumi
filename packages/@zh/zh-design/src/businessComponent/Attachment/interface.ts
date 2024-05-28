import { CSSProperties, MutableRefObject } from 'react';

type PermissionEnum = 0 | 1 | 2;

// 0 禁用 1 显示 2 隐藏
export interface TableAttachmentPermission {
  /**
   * @description 新增
   * @default 1
   */
  add?: PermissionEnum;
  /**
   * @description 删除
   * @default 1
   */
  delete?: PermissionEnum;
  /**
   * @description 编辑
   * @default 1
   */
  edit?: PermissionEnum;
  /**
   * @description 查看
   * @default 1
   */
  view?: PermissionEnum;
  /**
   * @description 预览
   * @default 1
   */
  preview?: PermissionEnum;
  /**
   * @description 下载
   * @default 1
   */
  download?: PermissionEnum;
  /**
   * @description 打包下载
   * @default 1
   */
  zipDownload?: PermissionEnum;
  /**
   * @description 编辑分类
   * @default 1
   */
  editCategory?: PermissionEnum;
}
export interface ITableAttachmentApiProps {
  /**
   * @description 打开附件控件时分配的操作guid
   * @default -
   */
  asrSessionGuid?: string;
  /**
   * @description 上传人编码
   * @default 用户登录信息
   */
  asrFill?: string;
  /**
   * @description 上传人名称
   * @default 用户登录信息
   */
  asrFillName?: string;
  /**
   * @description 组织phid
   * @default 用户登录信息
   */
  orgId?: string;
  /**
   * @description 账套号
   * @default 用户登录信息
   */
  uCode?: string;
  /**
   * @description 审批状态
   * @default 0
   */
  approved?: 0 | 1;
  /**
   * @description 业务表名
   * @default -
   */
  asrTable: string;
  /**
   * @description 业务单据phId
   * @default -
   */
  asrCode: string;
  /**
   * @description 关联操作的业务附件表名
   * @default c_pfc_attachment
   */
  asrAttachTable?: string;
  /**
   * @description 业务类型编码
   * @default -
   */
  busTypeCode?: string;
  /**
   * @description 业务单据url
   * @default -
   */
  busUrl?: string;
  /**
   * @description 是否控制下载时不要加水印 0:不控制 1：控制不加水印
   * @default 0
   */
  attachWaterMarkSetDownload?: 0 | 1;
  /**
   * @description 替代默认打开逻辑，自定义打开附件的逻辑（编辑，查看，预览通用）
   * @default -
   */
  customOpenTab?: (title: string, path: string) => void;
  /**
   * @description 可上传的文件类型（格式同Upload组件的accept）
   * @default -
   */
  accept?: string;
  /**
   * @description 附件加载完成的回调
   * @default -
   */
  onLoad?: (args: any) => void;
  /**
   * @description 附件保存成功后的回调
   * @default -
   */
  onSave?: (args: any) => void;
}
export interface ITableAttachmentProps extends ITableAttachmentApiProps {
  /**
   * @description 按钮权限
   * @default { add: 1, delete: 1, edit: 1, view: 1, preview: 1, download: 1, zipDownload: 1 }
   */
  permission?: TableAttachmentPermission;
  /**
   * @description 是否允许附件下载 0:不控制 1：是 2：否
   * @default 0
   */
  downloadAttachment?: 0 | 1 | 2;
  /**
   * @description 控件状态
   * @default add
   */
  status?: 'add' | 'edit' | 'view';
  /**
   * @description 最大上传文件数
   * @default 10
   */
  maxCount?: number;
  /**
   * @description 上传文件并行线程数
   * @default 3
   */
  uploadThreadCount?: number;
  /**
   * @description 文件上传分片大小（字节）
   * @default 5242880
   */
  chunkSize?: number;
  /**
   * @description 组件最外层容器样式
   * @default {}
   */
  style?: CSSProperties;
  /**
   * @description 分类样式
   * @default {}
   */
  categoryStyle?: CSSProperties;
  /**
   * @description 表格样式
   * @default { minHeight: 180 }
   */
  tableStyle?: CSSProperties;
  /**
   * @description 是否受控(通过api打开表格附件时设置该属性可手动控制保存，点击确定时会返回主要参数和保存的方法)
   * @default true
   */
  control?: boolean;
  /**
   * @description 获取Api的ref,传入ref时会自动为该ref的current属性赋值API
   * @default -
   */
  apiRef?: MutableRefObject<any>;
  /**
   * @description 获取附件上传Upload组件的ref
   * @default -
   */
  uploadRef?: MutableRefObject<any>;
}
export interface ITableAttachmentApi {
  /**
   * @description 打开附件控件时分配的操作guid
   * @default -
   */
  asrSessionGuid?: string;
  /**
   * @description 上传人编码
   * @default 用户登录信息
   */
  asrFill?: string;
  /**
   * @description 上传人名称
   * @default 用户登录信息
   */
  asrFillName?: string;
  /**
   * @description 业务表名
   * @default -
   */
  asrTable: string;
  /**
   * @description 业务单据phId
   * @default -
   */
  asrCode: string;
  /**
   * @description 关联操作的业务附件表名
   * @default c_pfc_attachment
   */
  asrAttachTable?: string;
  /**
   * @description 业务类型编码
   * @default -
   */
  busTypeCode?: string;
  /**
   * @description 组织phid
   * @default 用户登录信息
   */
  orgId?: string;
  /**
   * @description 业务单据url
   * @default -
   */
  busUrl?: string;
  /**
   * @description 账套号
   * @default 用户登录信息
   */
  uCode?: string;
  /**
   * @description 附件信息
   * @default -
   */
  tableAttachInfo: Array<any>;
  /**
   * @description 附件列表
   * @default -
   */
  attachmentRecordList: Array<any>;
  /**
   * @description 获取附件信息
   * @default -
   */
  getTableAttachInfo: Function;
  /**
   * @description 编辑/查看附件
   * @default -
   */
  handleEditOrView: Function;
  /**
   * @description 删除附件
   * @default -
   */
  handleDelete: Function;
  /**
   * @description 下载附件
   * @default -
   */
  handleDownload: Function;
  /**
   * @description 打包下载附件
   * @default -
   */
  handleZipDownload: Function;
  /**
   * @description 预览附件
   * @default -
   */
  handlePreview: Function;
  /**
   * @description 编辑附件分类
   * @default -
   */
  handleEditCategory: Function;
  /**
   * @description 改变附件共享类型
   * @default -
   */
  handleChangeShareType: Function;
  /**
   * @description 保存附件
   * @default -
   */
  handleSave: Function;
  /**
   * @description 附件合法性校验
   * @default -
   */
  handleValid: Function;
}
