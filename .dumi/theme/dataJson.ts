function sleep(timestamp: number) {
  return new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(timestamp);
    }, timestamp);
  });
}

/**
 * 模拟请求数据
 */
export default {
  'basedata/org/getCompleteOrgTree': async () => {
    await sleep(500);
    return { code: 0, data: [] };
  },
  'engine/metadata/langSet/getlangMap': {
    code: 0, data: {}
  },
  'auth/resolve/getNoGrantButtons': {
    code: 0, data: 'edit,delete||'
  },
  // 模拟通用帮助接口
  'SUP/RichHelp/GetHelpTabFlg': 'listStyle',
  'SUP/RichHelp/GetHelpInfo': function (params) {
    if (params.helpid === 'fg3_user') {
      return {
        code: 0,
        data: {
          Title: '操作员帮助',
          columns: [
            {
              dataIndex: 'UserNo',
              header: '编号',
              flex: 2
            },
            {
              dataIndex: 'UserName',
              header: '名称',
              flex: 3
            }
          ],
          showTree: '0',
          showList: '1',
          helpLang: '{}'
        }
      };
    }
    return {
      status: 'ok',
      data: {
        Title: '城市帮助',
        columns: [
          { dataIndex: 'value', header: '城市编号', flex: 1 },
          { dataIndex: 'label', header: '城市名称', flex: 1 }
        ],
        showTree: '0',
        showList: '1',
        helpLang: '{}',
        isShowSearch: true,
        querySearchList: [{
          ORMMode: true,
          listFields: 'No,Name,PhId',
          listHeadTexts: '代码,名称',
          showAutoHeader: false,
          usercodeField: 'value',
          valueField: 'value',
          displayField: 'label',
          helpid: 'holidaytype',
          matchFieldWidth: false,
          clientSqlFilter: '',
          id: null,
          xtype: 'SingleHelp',
          fieldLabel: '请假类型',
          name: 'Ctype*int32*eq*1',
          mustInput: false,
          colspan: 1,
          iconCls: null,
          value: '',
          itemId: 'Ctype',
          FieldUIId: null,
          langKey: null
        },
        {
          ORMMode: true,
          listFields: 'Phid,Cname,Phid',
          listHeadTexts: '代码,名称',
          showAutoHeader: false,
          usercodeField: 'value',
          valueField: 'value',
          displayField: 'label',
          helpid: 'holidayname',
          matchFieldWidth: false,
          clientSqlFilter: 'type=1',
          id: null,
          xtype: 'SingleHelp',
          fieldLabel: '假种1',
          name: 'PhidHolitype*int64*eq*1',
          mustInput: false,
          colspan: 1,
          iconCls: null,
          value: '',
          itemId: 'PhidHolitype',
          FieldUIId: null,
          langKey: null
        },
        {
          data: [
            { code: '1', name: '新增' },
            { code: '2', name: '请假审批中' },
            {
              code: '3',
              name: '请假已审批'
            },
            { code: '4', name: '销假' },
            { code: '5', name: '销假审批中' },
            { code: '6', name: '已销假' },
            {
              code: '7',
              name: '作废'
            },
            { code: '8', name: '作废审批中' }
          ],
          queryMode: 'local',
          editable: true,
          ORMMode: true,
          listFields: null,
          listHeadTexts: null,
          showAutoHeader: false,
          valueField: null,
          displayField: null,
          helpid: '',
          matchFieldWidth: true,
          usercodeField: null,
          clientSqlFilter: '',
          id: null,
          xtype: 'Select',
          fieldLabel: '状态',
          name: 'Cstatus*int32*eq*1',
          mustInput: false,
          colspan: 1,
          iconCls: null,
          value: '',
          itemId: 'Cstatus',
          FieldUIId: null,
          langKey: null
        },
        {
          id: null,
          xtype: 'DatePicker',
          fieldLabel: '请假开始时间',
          name: 'Factbdt*date*ge*1',
          mustInput: false,
          colspan: 1,
          iconCls: null,
          value: '',
          itemId: 'Factbdt',
          FieldUIId: null,
          langKey: 'Factbdt*date*ge*1'
        },
        {
          id: null,
          xtype: 'DatePicker',
          fieldLabel: '至',
          name: 'Factbdt*date*le*1',
          mustInput: false,
          colspan: 1,
          iconCls: null,
          value: '',
          itemId: 'Factbdt',
          FieldUIId: null,
          langKey: 'Factbdt*date*le*1'
        },
        {
          decimalPrecision: 2,
          decimalSeparator: '.',
          isInQuerySetting: true,
          showPercent: false,
          step: 1.0,
          id: null,
          xtype: 'InputNumber',
          fieldLabel: '请假天数',
          name: 'Factday*number*eq*1',
          mustInput: false,
          colspan: 1,
          iconCls: null,
          value: null,
          itemId: 'Factday',
          FieldUIId: null,
          langKey: null
        },
        {
          maxLength: 200,
          id: null,
          xtype: 'Input',
          fieldLabel: '请假事由',
          name: 'Reason*str*like*1',
          mustInput: false,
          colspan: 3,
          iconCls: null,
          value: '',
          itemId: 'Reason',
          FieldUIId: null,
          langKey: 'Reason*str*like*1'
        }]
      }
    };
  },
  'SUP/RichHelp/SetHelpTabFlg': '',
  'SUP/RichHelp/GetHelpList': function ({ query }) {
    const record = [
      { value: '10000', label: '北京' },
      { value: '10001', label: '北京1111111111111111111111111111' },
      { value: '10002', label: '杭州' },
      { value: '10003', label: '武汉' },
      { value: '10004', label: '上海' },
      { value: '10005', label: '广州' }
    ].filter(({ value, label }) => value.indexOf(query) > -1 || label.indexOf(query) > -1);
    return {
      totalRows: record.length,
      Record: record
    };
  },
  'SUP/RichHelp/SaveCommonUseData': {
    Status: 'success'
  },
  'SUP/RichHelp/DeleteCommonUseData': {
    Status: 'success'
  },
  'SUP/RichHelp/GetCommonUseList': function () {
    const record = [
      { value: '10000', label: '北京' },
      { value: '10005', label: '广州' }
    ];
    return {
      totalRows: record.length,
      Record: record
    };
  },
  'SUP/RichHelp/saveLastUseData': {
    Status: 'success'
  },
  'SUP/RichHelp/getLastUseList': function () {
    const record = [
      { value: '10000', label: '北京' },
      { value: '10005', label: '广州' }
    ];
    return {
      totalRows: record.length,
      Record: record
    };
  },
  'HR/Emp/User/GetUserList': {
    totalRows: 2,
    Record: [
      {
        PhId: '329190425000001',
        NgRecordVer: 96,
        Creator: '0',
        NgInsertDt: '2021-09-10 14:19:19',
        Editor: '0',
        NgUpdateDt: '2021-09-10 14:19:19',
        UserNo: '577',
        FirstName: '',
        LastName: '',
        UserName: '管一帆',
        LgSign: 0,
        Status: 0,
        UserClass: '0',
        DeptId: '518190918000001',
        StrDate: '',
        EndDate: '',
        MuCPwd: 0,
        PwdIdentity: '',
        PwdDateTime: '',
        Question: '',
        Answer: '',
        Email: '',
        MobileNo: '',
        ChgPwdDate: '',
        Errtimes: '',
        DesktopActor: '0',
        IpCtrl: 0,
        UiaKey: '',
        GuestFlg: 0,
        MultiCorpFlg: 0,
        SingleSignOnOrg: '0',
        LastLoginOrg: '0',
        CurOrgId: '0',
        HrId: '319190505000001',
        DiffOrgRoleRight: 0,
        IsUbe: 0,
        CurrentPc: '0',
        WeChat: '',
        CurrentProject: '0',
        Descript: '',
        HrName: '管一帆',
        DeptName: '',
        IsGroupAdmin: false,
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: ''
      },
      {
        PhId: '329190425000002',
        NgRecordVer: 25,
        Creator: '0',
        NgInsertDt: '2021-09-10 14:19:19',
        Editor: '0',
        NgUpdateDt: '2021-09-10 14:19:19',
        UserNo: 'wgs',
        FirstName: '',
        LastName: '',
        UserName: '笑嘻嘻',
        LgSign: 0,
        Status: 0,
        UserClass: '0',
        DeptId: '329190425000005',
        StrDate: '',
        EndDate: '',
        MuCPwd: 0,
        PwdIdentity: '',
        PwdDateTime: '',
        Question: '',
        Answer: '',
        Email: '',
        MobileNo: '',
        ChgPwdDate: '',
        Errtimes: '',
        DesktopActor: '0',
        IpCtrl: 0,
        UiaKey: '',
        GuestFlg: 0,
        MultiCorpFlg: 0,
        SingleSignOnOrg: '0',
        LastLoginOrg: '0',
        CurOrgId: '0',
        HrId: '518190819000001',
        DiffOrgRoleRight: 0,
        IsUbe: 0,
        CurrentPc: '0',
        WeChat: '',
        CurrentProject: '0',
        Descript: '',
        HrName: '笑嘻嘻',
        DeptName: '',
        IsGroupAdmin: false,
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: ''
      }
    ]
  },
  'DMC/Org/OrgRelat/GetOrgRelatItem': [
    {
      id: '180111000001',
      PhId: '250180112000001',
      UserParam: 'Y',
      OCode: '201904250002',
      OName: '杭州新中大科技股份有限公司',
      text: '杭州新中大科技股份有限公司'
    }
  ],
  'SUP/GetLanguageInfoByBusType': {},
  // 模拟灵动菜单接口
  'SUP/CustomFloatMenu/GetFloatMenuByCode': {
    items: [
      {
        Code: 'JD_PLAN_M4',
        Name: '实际进度填报',
        Url: 'PMS/PMS/JdPlanM/JdPlanMListFor',
        Param: null,
        OrgUrl: null
      },
      { Code: 'CZ_ACT_M', Name: '实际产值填报', Url: '/PMS/PMS/CzActM/CzActMList', Param: null, OrgUrl: null }
    ]
  },
  // 内嵌查询
  'engine/metadata/queryPanel/getQueryPanelUIControl': {
    "code": 0,
    "message": "操作成功",
    "data": {
      "list": [
        {
          "xtype": "RangeTimePicker",
          "label": "单据日期",
          "name": "bill_date*str*gt*1,bill_date*str*lt*1",
          "required": false,
          "colSpan": 2,
          "langKey": "billDate"
        },
        {
          "xtype": "Input",
          "label": "付款账户账号",
          "name": "pay_acc_no*str*like*1",
          "required": false,
          "colSpan": 1,
          "langKey": "payAccNo",
          "maxLength": 100
        },
        {
          "xtype": "Input",
          "label": "收款银行名",
          "name": "rec_acc_bankname*str*like*1",
          "required": false,
          "colSpan": 1,
          "langKey": "recAccBankname",
          "maxLength": 100
        },
        {
          "xtype": "InputNumber",
          "label": "支付金额",
          "name": "payamt*str*gt*1",
          "required": false,
          "colSpan": 1,
          "langKey": "payamt",
          "precision": 2,
          "step": 1.0,
          "showPercent": false
        },
        {
          "xtype": "Input",
          "label": "用途",
          "name": "purpose*str*like*1",
          "required": false,
          "colSpan": 1,
          "langKey": "purpose",
          "maxLength": 100
        },
        {
          "xtype": "Input",
          "label": "备注",
          "name": "remark*str*like*1",
          "required": false,
          "colSpan": 1,
          "langKey": "remark",
          "maxLength": 100
        }
      ],
      "rememberStr": {},
      "isCheck": "0"
    }
  },
  'SUP/QueryPanel/GetIndividualQueryPanelInfo': { Record: [] },
  'MDP/BusObj/QuerySetting/GetSchemeListByPageId': {
    totalRows: 2,
    items: [
      {
        phid: 579220914000001,
        cname: '方案一',
        bustype: 6162,
        status: '1',
        belong: 579191010000003
      },
      {
        phid: 579220914001001,
        cname: '方案二',
        bustype: 6162,
        status: '1',
        belong: 579191010000003
      }
    ]
  },
  // 审批流
  'api/WorkFlow3/WorkFlowapi/GetFlowExecutionInfo': {
    actType: 1,
    parentTaskId: '',
    canAppEnd: false,
    compId: 'EFORM0000600068_edit',
    activityId: 'ext-gen1543',
    hasParentTask: false,
    compType: 2,
    isBizApproved: false,
    createTime: '2021-02-16T11:30:27.78',
    bizAttPermission: 'all',
    biz_properties: [],
    canAddTis: true,
    canTermination: true,
    needsignature: false,
    canUndo: true,
    canTransmit: true,
    firstNode: false,
    canAttach: true,
    minCommentLen: 0,
    actionButton: false,
    canFeedBack: true,
    canCancelAudit: false,
    showdefaultsign: true,
    signatureFlag: true,
    toDoOpinion: '0',
    uiConstraint: [],
    customBizProp: [],
    wftaskid: '51447',
    remarkPanelWidth: 249,
    wfpiid: '51417',
    wfotype: 'taskhandle',
    smsenabled: 'false',
    Lang: { taskRemark: '办理意见1111', attach: '项目附件' }
  },
  'api/workflow3/workflowapp/GetProcInstHisViewData': {
    flowDt: []
  },
  'WorkFlow3/WorkFlow/GetWorkFlowHis': {
    hasHis: true,
    showSignEditButton: true,
    data: [
      {
        msg: '发起流程',
        taskid: '51423',
        piid: '51417',
        user_id_: '518200430000001',
        username: '自定义单工作流_测试',
        cno: 'gzl_ls',
        end_time: '2021-02-16 11:30',
        start_time: '2021-02-16 11:30',
        voicemessageid_: '',
        deptname: '一项目部',
        task_des: '流程发起',
        nodeid: 'ext-firstautotask',
        signcode: '',
        duration: '0秒',
        bizid: 'EFORM0000600068',
        startuser: 518200430000001,
        actionname: '新增',
        action: null,
        flowstatus: 1,
        att_count: 0,
        focuspoint: null,
        mobile_app_: 0,
        phoneno: '13978303807',
        signature: null
      }
    ],
    success: true
  },
  'WM/Common/CommonWord/GetCommonWordHelp': {
    totalRows: 6,
    Record: [
      {
        PhId: '518200107000001',
        NgRecordVer: 1,
        Cno: '1f27b58e-3aa9-47ef-9dc8-8de485b56059',
        Cname: '好的',
        Remark: '',
        PhidCboo: '329190425000002',
        PhidFiller: '329190425000003',
        Filldt: '2020-01-07 13:09:47',
        Ctype: 1,
        NgInsertDt: '2020-01-07 13:12:23',
        NgUpdateDt: '2020-01-07 13:12:23',
        CurOrgId: '329190425000002',
        Creator: '329190425000003',
        Editor: '329190425000003',
        PhidFiller_ExName: '',
        PhidCboo_ExName: '',
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: '',
        ListFilterVal: '',
        QueryField1Val: '',
        QueryField2Val: '',
        UIMultiConfigID: '0'
      },
      {
        PhId: '518200716000001',
        NgRecordVer: 2,
        Cno: '65b09fa3-7e08-44bc-9d6d-08cbc8381b0e',
        Cname: '同意',
        Remark: '',
        PhidCboo: '329190425000002',
        PhidFiller: '518190524000002',
        Filldt: '2020-07-16 11:40:14',
        Ctype: 1,
        NgInsertDt: '2020-07-16 11:43:43',
        NgUpdateDt: '2020-07-16 11:50:30',
        CurOrgId: '329190425000002',
        Creator: '518190524000002',
        Editor: '329190425000003',
        PhidFiller_ExName: '',
        PhidCboo_ExName: '',
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: '',
        ListFilterVal: '',
        QueryField1Val: '',
        QueryField2Val: '',
        UIMultiConfigID: '0'
      },
      {
        PhId: '518200807000001',
        NgRecordVer: 1,
        Cno: '597d52ae-18e3-43a0-8a7d-6edfe0e8c1a3',
        Cname: '准了',
        Remark: '准了',
        PhidCboo: '329190425000002',
        PhidFiller: '329190425000002',
        Filldt: '2020-08-07 16:09:16',
        Ctype: 1,
        NgInsertDt: '2020-08-07 16:09:25',
        NgUpdateDt: '2020-08-07 16:09:25',
        CurOrgId: '329190425000002',
        Creator: '329190425000002',
        Editor: '329190425000002',
        PhidFiller_ExName: '',
        PhidCboo_ExName: '',
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: '',
        ListFilterVal: '',
        QueryField1Val: '',
        QueryField2Val: '',
        UIMultiConfigID: '0'
      },
      {
        PhId: '518210302000001',
        NgRecordVer: 1,
        Cno: 'd41bc6f4-c1dd-4d5f-a7dd-1e2e484b3abd',
        Cname: '同意',
        Remark: '',
        PhidCboo: '518210127000001',
        PhidFiller: '518201217000001',
        Filldt: '2021-03-02 14:47:13',
        Ctype: 1,
        NgInsertDt: '2021-03-02 14:47:20',
        NgUpdateDt: '2021-03-02 14:47:20',
        CurOrgId: '518210127000001',
        Creator: '518201217000001',
        Editor: '518201217000001',
        PhidFiller_ExName: '',
        PhidCboo_ExName: '',
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: '',
        ListFilterVal: '',
        QueryField1Val: '',
        QueryField2Val: '',
        UIMultiConfigID: '0'
      },
      {
        PhId: '518201210000013',
        NgRecordVer: 1,
        Cno: 'f143017f-68f2-4167-b327-176d26d80807',
        Cname:
          '意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批意见是固定格式需求户财务部审批流程的审批',
        Remark: '',
        PhidCboo: '329190425000002',
        PhidFiller: '329190425000002',
        Filldt: '2020-12-10 16:49:33',
        Ctype: 1,
        NgInsertDt: '2020-12-10 16:49:35',
        NgUpdateDt: '2020-12-10 16:49:35',
        CurOrgId: '329190425000002',
        Creator: '329190425000002',
        Editor: '329190425000002',
        PhidFiller_ExName: '',
        PhidCboo_ExName: '',
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: '',
        ListFilterVal: '',
        QueryField1Val: '',
        QueryField2Val: '',
        UIMultiConfigID: '0'
      },
      {
        PhId: '518210302000002',
        NgRecordVer: 1,
        Cno: '0b3d5c33-d082-46c0-b29a-0a42ced47f94',
        Cname: '好了好了同意了',
        Remark: '',
        PhidCboo: '518210127000001',
        PhidFiller: '518201217000001',
        Filldt: '2021-03-02 14:47:31',
        Ctype: 1,
        NgInsertDt: '2021-03-02 14:47:39',
        NgUpdateDt: '2021-03-02 14:47:39',
        CurOrgId: '518210127000001',
        Creator: '518201217000001',
        Editor: '518201217000001',
        PhidFiller_ExName: '',
        PhidCboo_ExName: '',
        ListNotEvaluateProerty: 'System.Collections.Generic.List`1[System.String]',
        ForeignKeys: '',
        BusinessPrimaryKeys: '',
        PersistentState: 0,
        _OldIdValue_: '',
        PropertyBytes: '',
        ListFilterVal: '',
        QueryField1Val: '',
        QueryField2Val: '',
        UIMultiConfigID: '0'
      }
    ]
  },
  'WorkFlow3/WorkFlow/GetNextTaskNodes': {
    success: true,
    data: [
      {
        id: 'ext-gen1543',
        username: '辣辣辣,苏苏,问问,费控测试,张三6,解玉聪,王波,李红艳,777,lbs,石彦斌,王寿琼,ggg,李玮',
        activityName: '审核3',
        actionname: '审核',
        phoneno: '13596589658'
      },
      { id: 'ext-gen1726', activityName: '审批', username: '', phoneno: '空' }
    ]
  },
  'WM/Archive/WmIoSignature/GetSignatureListByCurrentUser': { totalRows: 0, Record: [] },
  // 模拟项目组织树数据请求
  'DMC/BusIntegration/BusIntegrationTree/GetOrgTreeData': [
    {
      PhId: '329190425000002',
      children: [
        {
          PhId: '518190530000001',
          code: '201904250002.01',
          expanded: false,
          iconCls: 'icon-department',
          id: 'DPT518190530000001',
          name: '客户支持中心',
          nodeType: 'DPT',
          parentId: 'ORG329190425000002',
          text: '客户支持中心_[201904250002.01]'
        },
        {
          PhId: '518190611000001',
          code: '201904250002.02',
          expanded: false,
          iconCls: 'icon-department',
          id: 'DPT518190611000001',
          name: '产品管理部',
          nodeType: 'DPT',
          parentId: 'ORG329190425000002',
          text: '产品管理部_[201904250002.02]'
        }
      ],
      code: '201904250002',
      expanded: true,
      iconCls: 'icon-organization',
      id: 'ORG329190425000002',
      name: '杭州新中大科技股份有限公司',
      nodeType: 'ORG',
      parentId: 'root',
      text: '杭州新中大科技股份有限公司_[201904250002]'
    }
  ],
  // 二开
  'SUP/IndividualUI/GetUserDefScriptUrl': {
    Status: 'success',
    Data: 'use_def.js'
  },
  'engine/metadata/uiExtendScheme/getUiSchemeInfoByBizCode': function (params) {
    return {
      code: 0,
      data: {
        uiContent: {
          // 表单元数据
          form: {
            pcmcntmform: {
              name: 'pcmcntmform',
              bindtable: 'pcmcntmform',
              buskey: 'id',
              fields: [
                {
                  label: '单据编码',
                  name: 'cno',
                  disabled: true,
                  required: true
                }
              ]
            },
            mainForm: {
              name: 'mainForm',
              bindtable: 'fg3_customsettleinfo',
              buskey: 'id',
              fields: [
                {
                  label: '单据编码',
                  name: 'cno',
                  disabled: true,
                  required: true
                },
                {
                  label: '单据日期',
                  name: 'dt',
                  xtype: 'DatePicker',
                  required: true
                },
                {
                  label: '申请人',
                  name: 'apply',
                  required: true
                },
                {
                  label: '备注',
                  name: 'remark'
                }
              ]
            },
            footForm: {
              name: 'footForm',
              bindtable: 'fg3_customsettleinfo',
              buskey: 'id',
              colspan: 3,
              fields: [
                {
                  label: '制单人',
                  name: 'creator',
                  xtype: 'Text'
                },
                {
                  label: '制单日期',
                  name: 'create_dt',
                  xtype: 'Text',
                  colspan: 2
                },
                {
                  label: '修改人',
                  name: 'updater',
                  xtype: 'Text'
                },
                {
                  label: '制单日期',
                  name: 'update_dt',
                  xtype: 'Text',
                  colspan: 2
                },
                {
                  label: '审批人',
                  name: 'approve',
                  xtype: 'Text'
                },
                {
                  label: '审批日期',
                  name: 'approve_dt',
                  xtype: 'Text'
                },
                {
                  label: '审批状态',
                  name: 'approve_status',
                  xtype: 'Text'
                }
              ]
            }
          },
          // 表格元数据
          grid: {
            billList: {
              name: 'billList',
              bindtable: 'fg3_customfile',
              columns: [
                {
                  header: '项目组织',
                  width: 180,
                  flex: 1,
                  dataIndex: 'cboo'
                },
                {
                  header: '区域',
                  width: 180,
                  flex: 1,
                  dataIndex: 'area'
                },
                {
                  header: '项目',
                  width: 180,
                  flex: 1,
                  dataIndex: 'project'
                },
                {
                  header: '申请人',
                  width: 180,
                  flex: 1,
                  dataIndex: 'apply'
                },
                {
                  header: '单据日期',
                  width: 180,
                  flex: 1,
                  dataIndex: 'dt'
                },
                {
                  header: '申请人部门',
                  width: 180,
                  flex: 1,
                  dataIndex: 'dept'
                },
                {
                  header: '单据状态',
                  width: 180,
                  flex: 1,
                  dataIndex: 'status'
                }
              ]
            },
            editList: {
              name: 'editList',
              bindtable: 'fg3_detaillist',
              columns: [
                {
                  header: '物资编码',
                  dataIndex: 'wz_no',
                  dataIndexField: 'cno'
                },
                {
                  header: '物资名称',
                  dataIndex: 'cno',
                  editor: {
                    xtype: 'SingleHelp',
                    displayField: 'cname',
                    required: true,
                    helpId: 'fg_dept',
                    valueField: 'value',
                    labelField: 'label'
                  }
                },
                {
                  header: '单位',
                  dataIndex: 'unit',
                  editor: {
                    xtype: 'Select',
                    required: true,
                    data: [
                      { value: '01', label: '千克' },
                      { value: '02', label: '吨' }
                    ]
                    //  displayField: 'unit_EXName'
                  }
                },
                {
                  header: '申请数量',
                  dataIndex: 'applyCount',
                  editor: {
                    xtype: 'Input',
                    type: 'number'
                  }
                },
                {
                  header: '处理原因',
                  dataIndex: 'reason',
                  tooltip: true,
                  editor: true
                },
                {
                  header: '电话',
                  dataIndex: 'mobile'
                },
                {
                  header: '报价单价',
                  dataIndex: 'price',
                  format: {
                    type: 'expr',
                    formatter: '$R.price ? ($R.price + "元/" + $R.unitEXName) : "--"'
                  }
                }
              ]
            }
          },
          // 表单集元数据
          fieldSetForm: {
            PaymentBill: {
              id: 'PaymentBill',
              buskey: 'PhId',
              bindtable: 'fc3_payment_bill',
              desTitle: '支付单明细',
              minWidth: 400,
              columnsPerRow: 4,
              autoScroll: false,
              fieldSets: [
                {
                  xtype: 'fieldset',
                  itemId: 'baseInfo',
                  desTitle: '基础信息',
                  collapsible: true,
                  border: false,
                  allfields: [
                    { xtype: 'container', children: [{ name: 'a', label: 'a' }] },
                    { name: 'BillNo', label: '单据编码' },
                    { name: 'BillName', label: '单据名称' },
                    {
                      name: 'PhidApplyPsn',
                      label: '申请人',
                      xtype: 'SingleEmpHelp',
                      valueField: 'PhId',
                      labelField: 'BillName'
                    },
                    { name: 'PhidDept', label: '申请部门', xtype: 'DeptHelp' },
                    {
                      name: 'BillDt',
                      label: '单据日期',
                      xtype: 'DatePicker',
                      required: true
                    },
                    {
                      name: 'PhidRecPayType',
                      label: '付款类型',
                      disabled: true,
                      xtype: 'Select',
                      required: true
                    },
                    {
                      name: 'PhidBusType',
                      label: '业务类型',
                      xtype: 'SingleHelp',
                      helpId: 'fc3_bus_type',
                      valueField: 'PhId',
                      labelField: 'Name',
                      userCodeField: 'Code,Name',
                      clientSqlFilter: ''
                    }
                  ]
                },
                {
                  xtype: 'fieldset',
                  itemId: 'payInfo',
                  desTitle: '付款方信息',
                  collapsible: true,
                  border: false,
                  allfields: [
                    {
                      name: 'PhidPayOrg',
                      label: '付款组织',
                      xtype: 'OrgHelp',
                      required: true,
                      params: { isRight: true }
                    },
                    {
                      name: 'PhidPc',
                      label: '付款项目',
                    },
                    {
                      name: 'PhidAuxPc',
                      label: '辅助项(项目)'
                    },
                    {
                      name: 'PhidInnerAcc',
                      label: '内部资金账户',
                      xtype: 'SingleHelp',
                      helpId: 'CsHelp_InnerAcc',
                      valueField: 'PhId',
                      labelField: 'Name',
                      userCodeField: 'Code,Name'
                    },
                    {
                      name: 'ApplyAmtFc',
                      label: '申请金额',
                      disabled: true,
                      xtype: 'InputThousandthNumber',
                      numberType: 'Amt',
                      required: true
                    },
                    {
                      name: 'ApproveAmtFc',
                      label: '审批金额',
                      disabled: true,
                      xtype: 'InputThousandthNumber',
                      numberType: 'Amt',
                      required: true
                    },
                    {
                      name: 'PhidPayway',
                      label: '结算方式',
                      xtype: 'CsHelp',
                      helpId: 'fc_payway',
                      valueField: 'PhId',
                      labelField: 'Payname'
                    },
                    {
                      name: 'WriteoffAmtFc',
                      label: '冲销金额',
                      disabled: true,
                      xtype: 'InputThousandthNumber',
                      numberType: 'Amt'
                    },
                    { name: 'Purpose', label: '用途' },
                    { name: 'Remark', label: '备注' },
                    {
                      name: 'PhidBusOrg',
                      label: '业务组织',
                      xtype: 'OrgHelp',
                      required: true
                    },
                    {
                      name: 'RefundAmtFc',
                      label: '已退款金额',
                      xtype: 'InputThousandthNumber',
                      numberType: 'Amt',
                      disabled: true
                    },
                    {
                      colspan: 4,
                      name: 'PhidSettleOrg',
                      label: '结算路径',
                      xtype: 'BillingPath'
                    }
                  ]
                },
                {
                  xtype: 'fieldset',
                  itemId: 'bankPayInfo',
                  desTitle: '银行支付信息',
                  collapsible: false,
                  border: false,
                  allfields: [
                    // 组织银行账户专用帮助，可编辑，必输；当结算路径为空时，按付款组织过滤；当结算路径不为空时，按结算路径最后的结算组织过滤；
                    {
                      name: 'PhidOuterAcc',
                      label: '组织银行账户',
                      required: true,
                      xtype: 'CsHelp',
                      helpId: 'fc3_outer_acc_accountno',
                      valueField: 'PhId',
                      labelField: 'AccName'
                    },

                    {
                      name: 'PhidOuterAcc_EXBankName',
                      label: '银行名称',
                      disabled: true
                    },
                    { name: 'PhidOuterAcc_EXAccNo', label: '银行账号', disabled: true },
                    { name: 'PhidOuterAcc_EXName', label: '开户名', disabled: true },
                    // 	0:未支付|1:已支付|2:部分支付
                    // 下拉字段：未支付|部分支付|已支付，只读，必输；
                    {
                      name: 'PayStatus',
                      label: '支付状态',
                      xtype: 'Select',
                      disabled: true,
                      required: true,
                      data: [
                        { value: 0, label: '未支付' },
                        { value: 1, label: '已支付' },
                        { value: 2, label: '部分支付' }
                      ]
                    },
                    // Payname
                    {
                      name: 'PhidOperatorPsn',
                      label: '经办人',
                      xtype: 'CsHelp',
                      helpId: 'fg3_user',
                      valueField: 'PhId',
                      labelField: 'UserName'
                    },
                    { name: 'PayDate', label: '付款日期', disabled: true },
                    // 0:不启用|1:单笔支付|2:批量代发
                    // 下拉字段：不启用|单笔支付|批量代发，可编辑；新增时自动带出“不启用”，当不启用时，【银企支付信息】明细表不显示；否则显示
                    {
                      name: 'EbankFlag',
                      label: '银企接口',
                      xtype: 'Select',
                      data: [
                        { label: '不启用', value: 0 },
                        { label: '单笔支付', value: 1 },
                        { label: '批量代发', value: 2 }
                      ]
                    }
                  ]
                },
                {
                  xtype: 'fieldset',
                  itemId: 'otherInfo',
                  desTitle: '其他',
                  collapsible: false,
                  border: false,
                  allfields: [
                    {
                      name: 'PrintFlag',
                      label: '打印标识',
                      xtype: 'Select',
                      disabled: true,
                      data: [
                        { label: '已打印', value: 1 },
                        { label: '未打印', value: 0 }
                      ]
                    },
                    { name: 'PrintCount', label: '打印次数', disabled: true }
                  ]
                }
              ]
            }
          },
          // 工具条元数据
          toolbar: {
            listbar: {
              "top": {
                "buttons": ["add", "delete"]
              },
              "grid": {
                "buttons": ["edit", "view", "check", "history"]
              }
            },
            editbar: {
              "TabPage1": {
                "buttons": ["addrow", "deleterow"]
              },
              "top": {
                "buttons": ["save", "attachment", "|", "back"]
              }
            }
          },
          // tab页元数据
          tabPanel: {
            tab1: {
              "id": "tab1",
              "desTitle": "tab",
              "items": [{
                "id": "TabPage1",
                "title": "明细表",
                "langKey": "TabPage1"
              }]
            }
          }
        },
        billNoRule: []
      }
    };
  },
  'SUP/ReactMobileCustom/GetMobileUI': {
    Msg: null,
    Status: 'success',
    Data: {
      editUI: {
        form: {
          P_form_cjd_mst: {
            id: 'P_form_cjd_mst',
            buskey: 'phid',
            bindtable: 'p_form_cjd_mst',
            desTitle: '自定义表单',
            columnsPerRow: 1,
            fields: [
              {
                label: '单据编号',
                itemId: 'bill_no',
                name: 'bill_no',
                maxLength: 100,
                required: true,
                langKey: 'bill_no',
                xtype: 'Input'
              },
              {
                label: '单据名称',
                itemId: 'title',
                name: 'title',
                maxLength: 100,
                langKey: 'title',
                xtype: 'Input'
              },
              {
                label: '工程项目',
                itemId: 'pc',
                name: 'pc',
                langKey: 'pc',
                nameField: 'pc_name',
                xtype: 'ProjectHelp'
              },
              {
                label: '创建日期',
                itemId: 'ng_insert_dt',
                name: 'ng_insert_dt',
                langKey: 'ng_insert_dt',
                xtype: 'Input'
              },
              {
                label: '录入人',
                itemId: 'fillpsn',
                name: 'fillpsn',
                langKey: 'fillpsn',
                nameField: 'fillpsn_name',
                helpid: 'fg3_user',
                valueField: 'phid',
                displayField: 'username',
                xtype: 'SingleHelp'
              }
            ]
          }
        },
        grid: {
          P_form_cjd_dtl: {
            id: 'P_form_cjd_dtl',
            buskey: 'phid',
            bindtable: 'p_form_cjd_dtl',
            desTitle: '明细',
            columns: [
              {
                LangKey: 'pc',
                dataIndex: 'pc',
                width: 100,
                header: '工程项目',
                editor: {
                  xtype: 'ProjectHelp',
                  nameField: 'pc_name'
                }
              },
              {
                LangKey: 'u_remark',
                dataIndex: 'u_remark',
                width: 100,
                header: '备注',
                editor: {
                  xtype: 'Input'
                }
              },
              {
                LangKey: 'u_shjian',
                dataIndex: 'u_shjian',
                width: 100,
                header: '时间',
                editor: {
                  xtype: 'DatePicker'
                }
              },
              {
                LangKey: 'u_bz',
                dataIndex: 'u_bz',
                width: 100,
                header: '帮助',
                editor: {
                  xtype: 'SingleHelp',
                  nameField: 'u_bz_name',
                  helpid: 'epm_org',
                  valueField: 'phid',
                  displayField: 'oname'
                }
              }
            ]
          }
        }
      },
      listUI: {
        cardPanel: {
          Pms3_aq_chk_m: {
            id: 'Pms3_aq_chk_m',
            bindtable: 'pms3_aq_chk_m',
            desTitle: '列表',
            xtype: 'cardPanel',
            totalRows: 4,
            totalColumns: 2,
            fields: [
              {
                index: 0,
                placeHolder: '单据编码',
                bindField: 'BillNo',
                colSpan: 2,
                rowSpan: 1,
                height: 38,
                backColor: '255,255,255',
                halign: 'Left',
                valign: 'Center',
                font: {
                  name: '微软雅黑',
                  size: 9,
                  bold: false,
                  underline: false,
                  italic: false,
                  foreColor: '255,165,0'
                }
              },
              {
                index: 1,
                placeHolder: null,
                bindField: 'Remarks',
                colSpan: 2,
                rowSpan: 2,
                height: 76,
                backColor: '255,255,255',
                halign: 'Left',
                valign: 'Center',
                font: {
                  name: '微软雅黑',
                  size: 14,
                  bold: true,
                  underline: false,
                  italic: true,
                  foreColor: '0,0,0'
                }
              },
              {
                index: 2,
                placeHolder: null,
                bindField: 'PhidChkDept_EXName',
                colSpan: 1,
                rowSpan: 1,
                height: 38,
                backColor: '255,255,255',
                halign: 'Left',
                valign: 'Center',
                font: {
                  name: '微软雅黑',
                  size: 9,
                  bold: false,
                  underline: false,
                  italic: false,
                  foreColor: '255,0,0'
                }
              },
              {
                index: 3,
                placeHolder: null,
                bindField: 'ChkDate',
                colSpan: 1,
                rowSpan: 1,
                height: 38,
                backColor: '255,255,255',
                halign: 'Right',
                valign: 'Center',
                font: {
                  name: '微软雅黑',
                  size: 9,
                  bold: false,
                  underline: false,
                  italic: false,
                  foreColor: '65,105,225'
                }
              }
            ]
          }
        }
      },
      toolbar: {
        listbar: {
          top: {
            ngbuttons: [
              {
                id: 'add',
                url: '',
                region: 'Left',
                text: '新增',
                iconCls: 'duigou',
                langKey: 'add'
              },
              {
                id: 'verify',
                url: 'cert/verify',
                region: 'Right',
                text: '审核',
                iconCls: 'a-1111',
                langKey: 'verify'
              }
            ]
          },
          contextmenu: {
            ngbuttons: [
              {
                id: 'add',
                url: '',
                region: 'Left',
                text: '新增',
                iconCls: 'icon-New',
                langKey: 'add'
              },
              {
                id: 'verify',
                url: 'cert/verify',
                region: 'Right',
                text: '审核',
                iconCls: 'icon-Verify',
                langKey: 'verify'
              }
            ]
          },
          bottom: {
            ngbuttons: [
              {
                id: 'add',
                url: '',
                region: '',
                text: '新增',
                iconCls: 'danjuyinyong',
                langKey: ''
              },
              {
                id: 'verify',
                url: '',
                region: '',
                text: '审核',
                iconCls: 'jianpan',
                langKey: ''
              },
              {
                id: 'test',
                url: '',
                region: 'Right',
                text: '测试',
                iconCls: '',
                langKey: ''
              }
            ]
          }
        },
        editbar: {
          top: {
            ngbuttons: [
              {
                id: 'save',
                url: 'cert/save',
                region: 'Left',
                text: '保存',
                iconCls: 'icon-save',
                langKey: 'save'
              },
              {
                id: 'verify',
                url: 'cert/verify',
                region: 'Left',
                text: '审核',
                iconCls: 'icon-Verify',
                langKey: 'verify'
              },
              {
                id: 'unverify',
                url: 'cert/unvalid',
                region: 'Right',
                text: '去审核',
                iconCls: 'icon-Verify',
                langKey: 'deverify'
              }
            ]
          }
        }
      },
      methodUrl: {
        list: 'PMS/PMS/AqChkM/GetAqChkMList',
        form: 'PMS/PMS/AqChkM/GetAqChkMInfo',
        grid: 'PMS/PMS/AqChkM/GetAqChkMInfo'
      },
      scriptUrl: '',
      userDefScriptUrl: '',
      isApp: true,
      isImp: false
    }
  },
  // 模拟移动端通用帮助
  '/SUP/RichHelp/GetAppHelpInfo': {
    status: 'ok',
    data: {
      Title: '项目帮助',
      AllField: 'pc_no,project_name,phid',
      codeField: 'phid',
      nameField: 'project_name',
      userCodeField: 'pc_no',
      itemTpl: ''
    }
  },
  '/SUP/RichHelp/GetAppHelpList': {
    totalRows: 231,
    Record: [
      {
        rownumber: '1',
        pc_no: '202202090002',
        project_name: '28916',
        phid: '306220209000002'
      },
      {
        rownumber: '2',
        pc_no: '202202090003',
        project_name: '234500',
        phid: '306220209000003'
      },
      {
        rownumber: '3',
        pc_no: '202202090004',
        project_name: '276820',
        phid: '306220209000004'
      },
      {
        rownumber: '4',
        pc_no: '202202090005',
        project_name: '107785',
        phid: '306220209000005'
      },
      {
        rownumber: '5',
        pc_no: '202202090006',
        project_name: '238698',
        phid: '306220209000006'
      },
      {
        rownumber: '6',
        pc_no: '202202090007',
        project_name: '106083',
        phid: '306220209000007'
      },
      {
        rownumber: '7',
        pc_no: '202202090008',
        project_name: '180274',
        phid: '306220209000008'
      },
      {
        rownumber: '8',
        pc_no: '202202090009',
        project_name: '234023',
        phid: '306220209000009'
      },
      {
        rownumber: '9',
        pc_no: '202202090010',
        project_name: '296582',
        phid: '306220209000010'
      },
      {
        rownumber: '10',
        pc_no: '202202090011',
        project_name: '159649',
        phid: '306220209000011'
      },
      {
        rownumber: '11',
        pc_no: '202202090012',
        project_name: '147294',
        phid: '306220209000012'
      },
      {
        rownumber: '12',
        pc_no: '202202090013',
        project_name: '144792',
        phid: '306220209000013'
      },
      {
        rownumber: '13',
        pc_no: '202202090014',
        project_name: '101492',
        phid: '306220209000014'
      },
      {
        rownumber: '14',
        pc_no: '202202090015',
        project_name: '299284',
        phid: '306220209000015'
      },
      { rownumber: '15', pc_no: '202202090016', project_name: '112949', phid: '306220209000016' }
    ]
  },
  'PMS/PMS/AqChkM/GetAqChkMList': {
    totalRows: 1,
    Record: [
      {
        phid: '616220217000001',
        BillNo: '202202170001',
        BillDt: '2022-02-17',
        Title: '',
        PhidPc: '616220216000004',
        PhidPc_EXName: 'qw1(20220216-04)',
        AsrFlg: '0',
        WfFlg: '0',
        DaFlg: '0',
        PhidChkpsn: '616211013000012',
        PhidChkpsn_EXName: 'zhao',
        ChkDt: '2022-02-17 13:47:41',
        ChkFlg: '1',
        PhidOcode: '421190626000001',
        PhidOcode_EXName: '杭州新中大科技股份有限公司(又变更了)',
        LevelCode: '0',
        LevelCode_EXName: '',
        PrintCount: 0,
        BillType: '',
        UserType: '',
        PhidSchemeid: '616200606000002',
        Remarks:
          '正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测正式版测',
        PhidTarget: '0',
        PhidTarget_EXName: '',
        PhidSpotctl: '5',
        PhidSpotctl_EXName: '公用',
        PhidChktype: '0',
        PhidChktype_EXName: '',
        PhidChkname: '0',
        PhidChkname_EXName: '',
        PhidChknames: '',
        PhidChknames_EXName: '',
        PhidChkuser: '616201119000001',
        PhidChkuser_EXName: '',
        JoinUser: '',
        PhidMoment: '0',
        PhidMoment_EXName: '',
        ChkDate: '2022-02-17',
        ChkAdd: '',
        Score: 0,
        ImpInfo: '',
        PhidSourcemid: '0',
        ItemResource: '',
        PhidChkuserdes: '35353',
        PhidDep: '0',
        PhidDepdes: '测试的',
        PhidWbs: '0',
        PhidWbs_EXName: '',
        PhidResMan: '0',
        PhidResMandes: '',
        PhidPcmanager: '0',
        PhidPcmanager_EXName: '',
        JoiUserdes: '',
        PhidChkDept: '421190626000003',
        PhidChkDept_EXName: '评测部',
        PhidChkPlan: '0',
        PhidChkPlan_EXName: '',
        Creator_EXName: 'zhao',
        ChkSta: '',
        PhidRresMan: '',
        ChkResult: '0',
        ChkResult_EXName: '',
        PhidRecord: '',
        PhidRecordName: '',
        PersistentState: 0,
        NgRecordVer: 3,
        NgInsertDt: '2022-02-17 10:29:50',
        NgUpdateDt: '2022-02-17 13:46:41',
        Creator: '616211013000012',
        Editor: '616211013000012',
        CurOrgId: '421190626000001',
        _OldIdValue_: '',
        PropertyBytes: '',
        user_zjy: null,
        user_zjy_name: null,
        ListFilterVal: '',
        QueryField1Val: '',
        QueryField2Val: '',
        UIMultiConfigID: '0'
      }
    ],
    summaryData: {}
  },
  'workflow/processDefinition/getStartProcessExecutionInfo': {
    "code": 0,
    "message": "操作成功",
    "data": {
      "processDefinitions": [
        {
          "id": "zh_675021:2:685003",
          "key": "zh_675021",
          "name": "收款分配单主流程测试",
          "chosen": true,
          "description": "1207-1",
          "userId": "111",
          "deploymentId": "685001",
          "deploymentTime": "2023-12-07 09:40:52.484",
          "version": 2
        },
        {
          "id": "zh_675064:1:675068",
          "key": "zh_675064",
          "name": "普通流程test",
          "chosen": true,
          "description": "审核-审批",
          "userId": "111",
          "deploymentId": "675066",
          "deploymentTime": "2023-11-28 22:28:08.913",
          "version": 1
        },
        {
          "id": "zh_675070:1:675074",
          "key": "zh_675070",
          "name": "回退方式测试",
          "chosen": true,
          "description": "回退设置：可回退（重新按顺序/仅回退节点）默认展示（重新按顺序）",
          "userId": "111",
          "deploymentId": "675072",
          "deploymentTime": "2023-11-28 22:40:49.729",
          "version": 1
        },
        {
          "id": "zh_675088:9:683409",
          "key": "zh_675088",
          "name": "排他分支",
          "chosen": true,
          "description": "1202-2",
          "userId": "111",
          "deploymentId": "683407",
          "deploymentTime": "2023-12-02 16:55:42.708",
          "version": 9
        },
        {
          "id": "zh_675116:2:683234",
          "key": "zh_675116",
          "name": "并行分支",
          "chosen": true,
          "description": "1201",
          "userId": "103",
          "deploymentId": "683232",
          "deploymentTime": "2023-12-01 19:22:21.885",
          "version": 2
        },
        {
          "id": "zh_675122:2:683238",
          "key": "zh_675122",
          "name": "包容分支",
          "chosen": true,
          "description": "1201",
          "userId": "103",
          "deploymentId": "683236",
          "deploymentTime": "2023-12-01 19:25:18.515",
          "version": 2
        },
        {
          "id": "zh_675128:1:675132",
          "key": "zh_675128",
          "name": "任务执行人配置测试",
          "chosen": true,
          "userId": "111",
          "deploymentId": "675130",
          "deploymentTime": "2023-11-28 23:42:25.388",
          "version": 1
        },
        {
          "id": "zh_675134:1:683242",
          "key": "zh_675134",
          "name": "系列流程联合测试",
          "chosen": true,
          "description": "1201-1",
          "userId": "103",
          "deploymentId": "683240",
          "deploymentTime": "2023-12-01 19:38:18.316",
          "version": 1
        },
        {
          "id": "zh_680673:5:683417",
          "key": "zh_680673",
          "name": "矩阵运转",
          "chosen": true,
          "description": "1204",
          "userId": "111",
          "deploymentId": "683415",
          "deploymentTime": "2023-12-04 17:06:04.575",
          "version": 5
        },
        {
          "id": "zh_682644:1:682648",
          "key": "zh_682644",
          "name": "多名片/描述超长流程测试",
          "chosen": true,
          "description": "1130",
          "userId": "111",
          "deploymentId": "682646",
          "deploymentTime": "2023-11-30 17:07:59.960",
          "version": 1
        },
        {
          "id": "zh_682922:6:683341",
          "key": "zh_682922",
          "name": "排他网关（新）",
          "chosen": true,
          "userId": "111",
          "deploymentId": "683339",
          "deploymentTime": "2023-12-02 15:36:16.010",
          "version": 6
        },
        {
          "id": "zh_683444:2:685007",
          "key": "zh_683444",
          "name": "test_001",
          "chosen": true,
          "description": "1212",
          "userId": "111",
          "deploymentId": "685005",
          "deploymentTime": "2023-12-07 10:29:08.819",
          "version": 2
        },
        {
          "id": "zh_685009:2:690003",
          "key": "zh_685009",
          "name": "缺陷验证",
          "chosen": true,
          "description": "1213",
          "userId": "111",
          "deploymentId": "690001",
          "deploymentTime": "2023-12-13 11:10:55.601",
          "version": 2
        },
        {
          "id": "zh_687636:1:687640",
          "key": "zh_687636",
          "name": "非统管子流程绑定验证",
          "chosen": true,
          "description": "1211",
          "userId": "111",
          "deploymentId": "687638",
          "deploymentTime": "2023-12-11 16:05:37.915",
          "version": 1
        },
        {
          "id": "zh_687669:1:687673",
          "key": "zh_687669",
          "name": "非统管子流程",
          "chosen": true,
          "userId": "111",
          "deploymentId": "687671",
          "deploymentTime": "2023-12-11 16:28:34.027",
          "version": 1
        },
        {
          "id": "zh_687675:1:687679",
          "key": "zh_687675",
          "name": "非统管父流程",
          "chosen": true,
          "userId": "111",
          "deploymentId": "687677",
          "deploymentTime": "2023-12-11 16:29:30.673",
          "version": 1
        },
        {
          "id": "zh_692506:1:692510",
          "key": "zh_692506",
          "name": "验证测试1213",
          "chosen": true,
          "description": "1213",
          "userId": "111",
          "deploymentId": "692508",
          "deploymentTime": "2023-12-13 17:39:40.308",
          "version": 1
        }
      ]
    }
  },
  'workflow/processDefinition/getProcessInitialActivity': {
    "code": 0,
    "message": "操作成功",
    "data": {
      "id": "Activity_1s3qnyv",
      "name": "流程发起节点",
      "requiredSignature": false,
      "minCommentLength": 0
    }
  },
  'workflow/process/checkPreStartProcessInstance': {
    "code": 0,
    "message": "操作成功",
    "data": {
      "dynamicUserNodes": [
        {
          "id": "Activity_1tp9j2b",
          "name": "主流程1",
          "needAssignUser": true,
          "assignAnyUsers": true,
          "minUserCount": 0,
          "dependAssignedNodes": [],
          "users": []
        }
      ]
    }
  },
  'workflow/process/startProcessInstance': {
    "code": 0,
    "message": "操作成功",
    "data": "12345"
  },
  'basedata/api/user/getUserDataForApp': {
    "code": 0,
    "message": "操作成功",
    "data": {
      "userAppVoList": [
        {
          "id": "29",
          "userNo": "ZJ1029",
          "userName": "诚悬",
          "mainDeptName": "财务部",
          "mainOrgName": "中国建筑集团有限公司",
          "userJobList": [
            {
              "userId": "29",
              "deptId": "108060803",
              "deptNo": "108060803",
              "deptName": "财务部",
              "orgId": "1",
              "orgName": "中国建筑集团有限公司",
              "sign": 1
            }
          ]
        },
        {
          "id": "102",
          "userNo": "YG1001",
          "userName": "钱多多",
          "mainDeptName": "财务部",
          "mainOrgName": "中国建筑集团有限公司",
          "userJobList": [
            {
              "userId": "102",
              "deptId": "108060803",
              "deptNo": "108060803",
              "deptName": "财务部",
              "orgId": "1",
              "orgName": "中国建筑集团有限公司",
              "sign": 1
            }
          ]
        },
        {
          "id": "103",
          "userNo": "YG1002",
          "userName": "钱达梦",
          "mainDeptName": "财务部",
          "mainOrgName": "中国建筑集团有限公司",
          "userJobList": [
            {
              "userId": "103",
              "deptId": "108060803",
              "deptNo": "108060803",
              "deptName": "财务部",
              "orgId": "1",
              "orgName": "中国建筑集团有限公司",
              "sign": 1
            }
          ]
        }
      ],
      "deptAppVoList": []
    }
  },
  'basedata/user/queryUserById': {
    "code": 0,
    "message": "操作成功",
    "data": {
      "id": "1711939513356746829",
      "userNo": "60037120",
      "userName": "张杰",
      "email": "zha****e@newgrand.cn",
      "mobile": "150****2659",
      "status": 2,
      "belongOrgId": "54",
      "belongOrgName": "中建数字科技有限公司",
      "externalBelongOrgName": "中建数字科技有限公司",
      "belongDeptId": "0",
      "belongProjectId": "1724273804144673551",
      "externalBelongProjName": "技术与大数据平台组",
      "positionStatus": "015",
      "positionStatusName": "厂商人员",
      "gender": 1,
      "employer": "",
      "userProjectList": [
        {
          "id": "1729862790784303860",
          "userId": "1711939513356746829",
          "projectId": "1724273804144673551",
          "projectNo": "9920136887",
          "projectName": "技术与大数据平台组",
          "orgId": "54",
          "orgName": "中建数字科技有限公司",
          "post": "前端开发工程师",
          "sign": 1,
          "deleted": 0,
          "recordVer": 1
        },
        {
          "id": "1729862801190372006",
          "userId": "1711939513356746829",
          "projectId": "1724273966036418666",
          "projectNo": "20231204",
          "projectName": "手动录入的测试项目",
          "orgId": "20",
          "orgName": "中国建筑第八工程局有限公司",
          "sign": 2,
          "deleted": 0,
          "recordVer": 1
        },
        {
          "id": "1729862801190372007",
          "userId": "1711939513356746829",
          "projectId": "1724273052001108841",
          "projectNo": "1220154583",
          "projectName": "郑州市轨道交通6号线一期工程东北段正线风水电安装及装修工程施工项目05标段",
          "orgId": "2178",
          "orgName": "中国建筑第七工程局有限公司轨道交通事业部",
          "post": "测试手动录入",
          "sign": 2,
          "deleted": 0,
          "recordVer": 1
        }
      ],
      "userDeptList": [
        {
          "id": "1729862801190372004",
          "userId": "1711939513356746829",
          "deptId": "1711984298192896014",
          "deptNo": "2100079209",
          "deptName": "综合管理部",
          "orgId": "54",
          "orgName": "中建数字科技有限公司",
          "post": "前端开发",
          "sign": 2,
          "deleted": 0,
          "recordVer": 1
        },
        {
          "id": "1729862801190372005",
          "userId": "1711939513356746829",
          "deptId": "108060814",
          "deptNo": "108060814",
          "deptName": "八局工程产品",
          "orgId": "20",
          "orgName": "中国建筑第八工程局有限公司",
          "sign": 2,
          "deleted": 0,
          "recordVer": 1
        }
      ],
      "companyTwoLvl": "2069449"
    }
  },
  // 模拟移动端高级搜索表单数据
  'SUP/ReactMobileCustom/GetIndividualQueryPanelForApp': {
    Data: {
      list: [],
      langInfo: {}
    }
  },
  // 模拟表单内容
  'PMS/PMS/AqChkM/GetAqChkGridInfo': {
    totalRows: 1,
    Record: [
      {
        phid: '1111',
        Deduction: '1111',
        ChkResult: '1111',
        AuditDt: '2022-06-22',
        PhidSpotctl: '111',
        PhidChktype: '111'
      },
      {
        phid: '22222',
        Deduction: '2222',
        ChkResult: '222',
        AuditDt: '2022-06-23',
        PhidSpotctl: '22',
        PhidChktype: '2222'
      }
    ]
  },
  // 模拟附件初始化加载数据
  '/API/attachment/appattach/Get': {
    AttachList: [
      {
        AsrCode: '73784-1656135713852',
        AsrFid: 'dbf67a9e-0a6d-4d04-89ff-431ecc11d852',
        AsrFillDt: '2022/06/25 13:42:10',
        AsrName: '测试图片.png',
        AsrSize: '3.33MB',
        AsrTable: 'pms3_aq_chk_d',
        FilePath: 'https://gw.alipayobjects.com/zos/basement_prod/90740380-bbb7-4329-95e5-64533934c6cf.svg'
      },
      {
        AsrCode: '59629-1656135880022',
        AsrFid: '4f2dc364-553c-4dba-8f07-49a120a4e2b1',
        AsrFillDt: '2022/06/25 13:44:53',
        AsrName: '测试视频 (1).mp4',
        AsrSize: '2.73MB',
        AsrTable: 'pms3_aq_chk_d',
        FilePath: 'https://www.runoob.com/try/demo_source/mov_bbb.mp4'
      },
      {
        AsrCode: '59629-1656135880022',
        AsrFid: '4f2dc364-553c-4dba-8f07-49a120a4e2b2',
        AsrFillDt: '2022/06/25 13:44:53',
        AsrName: '测试视频 (2).mp4',
        AsrSize: '2.73MB',
        AsrTable: 'pms3_aq_chk_d',
        FilePath: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4'
      },
      {
        AsrCode: '59629-1656135880022',
        AsrFid: '4f2dc364-553c-4dba-8f07-49a120a4e2b3',
        AsrFillDt: '2022/06/25 13:44:53',
        AsrName: '测试音频 (1).mp3',
        AsrSize: '2.73MB',
        AsrTable: 'pms3_aq_chk_d',
        FilePath: 'http://downsc.chinaz.net/Files/DownLoad/sound1/201906/11582.mp3'
      },
      {
        AsrCode: '59629-1656135880022',
        AsrFid: '4f2dc364-553c-4dba-8f07-49a120a4e2b4',
        AsrFillDt: '2022/06/25 13:44:53',
        AsrName: '测试pdf (1).pdf',
        AsrSize: '2.73MB',
        AsrTable: 'pms3_aq_chk_d',
        FilePath: 'http://blog.java1234.com/pdf20211008.pdf'
      }
    ],
    Error: '',
    Success: 'true'
  },
  // 模拟附件上传返回数据
  '/API/attachment/appattach/Post': {
    AttachList: [
      {
        AsrCode: '59629-1656135880022',
        AsrFid: 'ee1e5cdc-13a6-4367-bd19-4ce8bb6755c7',
        AsrFillDt: '2022/06/25 13:47:39',
        AsrName: '极限竞速：地平线 5 (6).png',
        AsrSize: '4.36MB',
        AsrTable: 'pms3_aq_chk_d',
        FilePath: 'https://gw.alipayobjects.com/mdn/rms_08e378/afts/img/A*P0S-QIRUbsUAAAAAAAAAAABkARQnAQ'
      }
    ],
    Error: '',
    Success: 'true'
  },
  // 模拟标签附件初始化接口返回数据
  '/JFileSrv/reactAttach/labelAttachInit': {
    data: {
      fileBlackList: '.com,.exe,.asp,.bak,.bat,.dll,.dat,.c,.h,.html,.jar ', //黑名单
      fileWhiteList: 'jpg,txt,doc,docx,yaml', //白名单
      maxSize: '1024', //文件限制大小
      warnSize: '500', //文件提醒大小
      specialChars: ':%&()+[]{}#$!@ ,^:/?=', //特殊符号限制
      waterMarkEnable: '1', //是否启用水印，如果启用下载时调用水印接口下载文件
      showControl: '0', //预览doc、docx、xls、xlsx文件时判断此选项0:word和excel都不使用金格打开 1:word使用金格打开 2:excel使用金格打开 3:word和excel都使用金格打开
      previewFileType: '.bmp.pdf.doc.xlsx.pptx.docx.', //可以预览的文件类型,此类文件文件名称高亮显示并且点击文件名可以调用预览页面进行预览
      attachmentRecordList: [
        {
          phid: 4022519245144001, //文件phid
          md5: null,
          asrFid: 'd47usgsbaomtwznbabvvten6bnepollfm2o9', //文件fid
          asrId: null,
          asrName: 'webstorm2020_244113.zip', //文件名
          asrTempName: null,
          asrFill: '9999', //上传人编号
          asrFillName: '测试', //上传人名称
          asrFilldt: '2022-06-11T14:28:29.000+08:00', //上传时间
          asrFlag: '1', //文件保存标志，0:未保存 1:已保存
          asrDesc: null,
          asrParam: null,
          asrTable: 'wm3_file_lib_m', //业务表
          asrStartPart: null,
          asrTotalPart: null,
          asrPartSize: null,
          asrCode: '9999', //业务单据号
          asrCheck: null,
          asrSessionGuid: 'f6178ff1-e613-4dde-8ade-0c9925719777', //打开附件控件时分配的操作guid
          asrSize: 1708, //文件大小
          asrSort: 5,
          asrFidOld: null,
          uploadtype: '0',
          bustypecode: 'EntFileList',
          containerid: null,
          assodoced: null,
          approved: '0', //是否单据审批后上传附件 0:否 1:是
          asrZip: 0,
          asrAttachTable: 'c_pfc_attachment',
          cname: null,
          sharedOne: null,
          shareType: null,
          sharedOneName: null,
          asr_preview_enabled: null,
          doctagphids: null,
          doctagnames: null,
          sourcePath: null,
          asrRemark: null, //备注
          asrCodeOri: null,
          asrTableOri: null,
          busTypeCodeOri: null,
          oriDescription: null,
          asrGuid: null,
          typeId: null, //分类phid
          typeName: null //分类名称
        }
      ]
    },
    msg: 'success',
    code: 200
  },
  // 模拟表格附件初始化接口返回数据
  '/JFileSrv/reactAttach/tableAttachInit': {
    data: {
      fileBlackList: '.com,.exe,.asp,.bak,.bat,.dll,.dat,.c,.h,.html,.jar ', //黑名单
      fileWhiteList: 'jpg,txt,doc,docx,yaml', //白名单
      maxSize: '1024', //文件限制大小
      warnSize: '500', //文件提醒大小
      specialChars: ':%&()+[]{}#$!@ ,^":/?=',
      waterMarkEnable: '1', //是否启用水印，如果启用下载时调用水印接口下载文件
      showControl: '0', //预览doc、docx、xls、xlsx文件时判断此选项0:word和excel都不使用金格打开 1:word使用金格打开 2:excel使用金格打开 3:word和excel都使用金格打开
      previewFileType: '.bmp.pdf.doc.xlsx.pptx.docx.', //可以预览的文件类型,此类文件文件名称高亮显示并且点击文件名可以调用预览页面进行预览
      //单据附件
      attachmentRecordList: [
        {
          phid: 4022519245144001, //文件phid
          md5: null,
          asrFid: 'd47usgsbaomtwznbabvvten6bnepollfm2o9', //文件fid
          asrId: null,
          asrName: 'test666.docx', //文件名
          asrTempName: null,
          asrFill: '9999', //上传人编号
          asrFillName: '测试', //上传人名称
          asrFilldt: '2022-06-11T14:28:29.000+08:00', //上传时间
          asrFlag: '1', //文件保存标志，0:未保存 1:已保存
          asrDesc: null,
          asrParam: null,
          asrTable: 'wm3_file_lib_m', //业务表
          asrStartPart: null,
          asrTotalPart: null,
          asrPartSize: null,
          asrCode: '9999', //业务单据号
          asrCheck: null,
          asrSessionGuid: 'f6178ff1-e613-4dde-8ade-0c9925719777', //打开附件控件时分配的操作guid
          asrSize: 1708, //文件大小
          asrSort: 5,
          asrFidOld: null,
          uploadtype: '0',
          bustypecode: 'EntFileList',
          containerid: null,
          assodoced: null,
          approved: '0', //是否单据审批后上传附件 0:否 1:是
          asrZip: 0,
          asrAttachTable: 'c_pfc_attachment',
          cname: null,
          sharedOne: null,
          shareType: null,
          sharedOneName: null,
          asr_preview_enabled: null,
          doctagphids: null,
          doctagnames: null,
          sourcePath: null,
          asrRemark: null, //备注
          asrCodeOri: null,
          asrTableOri: null,
          busTypeCodeOri: null,
          oriDescription: null,
          asrGuid: null,
          typeId: null, //分类phid
          typeName: null //分类名称
        }
      ]
    },
    msg: 'success',
    code: 200
  }
};
