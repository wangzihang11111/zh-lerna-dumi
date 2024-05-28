export interface IUser {
  loginOrgType: 'GROUP' | 'CU' | 'ORG';
  accessToken: string;
  appCode: string;
  controlUnitAdmin: boolean;
  email: string;
  mobile: string;
  orgFuncRights: boolean;
  orgId: string;
  orgName: string;
  orgNo: string;
  organizationAdmin: boolean;
  platformAdmin: boolean;
  projectId?: string;
  projectName?: string;
  projectNo?: string;
  serverRunType: string;
  tenantId: string;
  tenantName: string;
  tenantNo: string;
  userId: string;
  userName: string;
  userNo: string;
  [x: string]: any;
}
