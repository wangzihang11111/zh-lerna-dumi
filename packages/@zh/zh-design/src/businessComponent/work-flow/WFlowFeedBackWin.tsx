import { useContext, useEffect, useMemo } from 'react';
import { OrgTree } from '../org-tree';
import { NGLang, wfAlert } from './util';
import { Layout, zh, useApi, useRefCallback, useRefState } from '../../util';
import { BaseHelp, ModalContext } from '../../functionalComponent';
import { Form } from '../../configComponent';

const columnProps = {
  sortable: false,
  resizable: false,
  columnSort: false,
  tooltip: true
};

/**
 * 组织树
 * @param tableRef
 * @param props
 * @constructor
 */
function WFOrgHelp({ tableRef, ...props }) {
  const params = useMemo(() => {
    return { orgattr: '18', isRight: false };
  }, []);
  const onDataLoad = useRefCallback((nodes) => {
    nodes.push({
      title: NGLang.noDeptData,
      isLeaf: true,
      id: '0.1',
      key: '0.1',
      OCode: '$ljb$'
    });
    return nodes;
  });
  return <OrgTree params={params} defaultSelectedFirstNode dataLoad={onDataLoad} {...props} />;
}

async function getFeedBackUser(params = {}) {
  const resp: any = await zh.request.get({
    url: 'WorkFlow3/WorkFlow/GetFeedBackUserByPage',
    data: { limit: 25, page: 0, ...params }
  });

  resp.Record = resp.Record.map((r) => {
    return { UserNo: r.userNo, UserName: r.userName, ...r };
  });

  return resp;
}

/**
 * 接收人员选择
 */
const NGFeedBackUserHelp = (props) => {
  const { ...others } = props;
  others.contentParams = {};
  others.onBeforeOpen = useRefCallback(async () => {
    const { Record: record } = await getFeedBackUser();
    const right = [
      {
        ...columnProps,
        header: NGLang.userNo,
        flex: 1,
        dataIndex: 'UserNo'
      },
      {
        ...columnProps,
        header: NGLang.userName,
        flex: 1,
        dataIndex: 'UserName'
      }
    ];
    const commonParam = {
      valueField: 'UserNo',
      labelField: (r) => `${r.UserName}(${r.UserNo})`
    };
    if (record.length > 0) {
      return {
        request() {
          return { total: record.length, record };
        },
        helpTitle: NGLang.selectpsn,
        columns: {
          left: [
            ...right,
            {
              ...columnProps,
              header: NGLang.userDept,
              flex: 2,
              dataIndex: 'deptName'
            },
            {
              ...columnProps,
              header: NGLang.userOrg,
              flex: 3,
              dataIndex: 'orgName'
            }
          ],
          right
        },
        ...commonParam
      };
    } else {
      return {
        FilterTree: WFOrgHelp,
        request: async ({ pageIndex, pageSize, keyword, treeNodes }) => {
          const data: any = {
            hasright: false,
            filterUserPhid: '',
            page: pageIndex - 1,
            start: (pageIndex - 1) * pageSize,
            limit: pageSize
          };
          keyword && (data.gobelfilter = encodeURI(encodeURI(keyword)));
          if (treeNodes && treeNodes.length > 0) {
            data.queryfilter = { DeptId: treeNodes[0].id };
            data.OCode = treeNodes[0].OCode;
          }
          const resp = await zh.request.body({ url: 'HR/Emp/User/GetUserList', data });
          return { total: resp.data.totalRows, record: resp.data.Record };
        },
        autoLoad: false,
        helpTitle: NGLang.operatorHelp,
        columns: right,
        ...commonParam
      };
    }
  });
  return <BaseHelp modal multiple input={false} allowClear={false} {...others} />;
};

const formConf = [
  { label: NGLang.FeedBackTitle, required: true, name: 'title', xtype: 'NGInput' },
  { label: NGLang.FeedBackReceive, required: true, name: 'receiveuser', xtype: NGFeedBackUserHelp },
  { label: NGLang.FeedBackMsg, required: true, name: 'msg', xtype: 'TextArea', autoSize: { minRows: 4, maxRows: 6 } }
];

/**
 * 流程反馈
 * @param workFlowInfo 工作流对象信息
 * @constructor
 */
export function WFlowFeedBackWin({ workFlowInfo }) {
  const [values, setValues] = useRefState({ title: '流程反馈消息', receiveuser: [], msg: '' });
  const mCtx = useContext(ModalContext);
  const formRef = useApi();
  const invokeOkHandler = useRefCallback(async () => {
    const api = formRef.current?.getApi();
    try {
      const formValues = await api.validateForm();
      const mst = api.getFormatValues();
      mst.form.newRow.receiveusercode = mst.form.newRow.receiveuser;
      mst.form.newRow.receiveuser = formValues.receiveuser.map((v) => v.label).join('');
      const resp = await zh.request.get({
        url: 'WorkFlow3/WorkFlow/SaveFeedBack',
        data: {
          piid: workFlowInfo.wfpiid,
          mststore: mst
        }
      });
      if (resp.code === 0) {
        await wfAlert(NGLang.alertTitle, NGLang.sendSuccess);
        mCtx.ins.destroy();
      } else {
        await wfAlert(NGLang.alertTitle, NGLang.sendError);
      }
    } catch (e) {
      console.log(e);
    }
  });

  useEffect(() => {
    getFeedBackUser({ rtntype: 1 }).then(({ Record: users }) => {
      if (users.length > 0) {
        setValues((prev) => {
          return {
            ...prev,
            receiveuser: users.map((user) => {
              const { UserNo, UserName } = user;
              return { value: UserNo, label: `${UserName}(${UserNo})`, origin: user };
            })
          };
        });
      }
    });
    mCtx.ins.setApi({ invokeOkHandler });
  }, []);

  return (
    <Layout style={{ height: 300, padding: '15px 5px 0 5px' }}>
      <Form ref={formRef} opt="newRow" defaultValue={values} colspan={1} config={formConf} />
    </Layout>
  );
}
