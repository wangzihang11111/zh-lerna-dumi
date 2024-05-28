import { CheckCircleOutlined, DownOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { Col, Form, Popconfirm, Row, Skeleton, Tag } from 'antd';
import { FormInstance } from 'antd/lib/form';
import {
  CSSProperties,
  forwardRef,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';
import {
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Input,
  InputNumber,
  RadioGroup,
  RangePicker,
  Select,
  Switch
} from '../../baseComponent';
import { Button, ModalContext, Panel, showModal, Tabs, Tooltip } from '../../functionalComponent';
import {
  compHoc,
  cssVar,
  getGlobalConfig,
  getRegisterComponentWithProps,
  Layout,
  zh,
  useAsyncEffect,
  useAsyncSuspense,
  useDevState,
  useExtendRef,
  useObjectEffect,
  useRefCallback,
  useRefs,
  useRefState,
  useUpdateEffect,
  type ICurrentObject,
  type IObject
} from '../../util';
import { Grid } from '../grid';
import { MultipleHelp, SingleHelp } from '../help';
import {
  addQueryScheme,
  deleteQueryScheme,
  getQueryPanelInfo,
  getQueryScheme,
  getQuerySchemeData,
  getQuerySchemeDetail,
  getQuerySchemeTree,
  getQuerySettingInfo,
  resetQuerySettingInfo,
  saveQuerySchemeData,
  saveQuerySettingInfo,
  setQueryPanelData,
  updateQuerySchemeStatus
} from './service';

import './index.less';
import type { IQueryInfo, IQueryPanelProps } from './interface';

// 默认显示最大行数
const defaultShowRowCount = 1;

enum TabKeyEnum {
  tab1 = 'settingCondition',
  tab2 = 'settingScheme'
}

const defaultLocale = {
  search: '查询',
  reset: '重置',
  up: '收起',
  down: '更多',
  rememberCheckbox: '记忆搜索',
  settingTitle: '查询设置',
  settingCondition: '条件设置',
  settingScheme: '方案设置',
  resetText: '恢复默认',
  okText: '确认',
  cancelText: '取消',
  settingText: '设置',
  queryScheme: '查询方案',
  confirmText: '恢复默认将会删除该页面内嵌查询自己修改过的所有数据，确认恢复默认吗？'
};

type LocaleType = keyof typeof defaultLocale;

export type IQueryPanelPropsType = IQueryPanelProps<LocaleType>;

/**
 * 运算符的value映射关系
 */
const operatorType = {
  eq: '=',
  gt: '>',
  lt: '<',
  ge: '>=',
  le: '<=',
  like: '%*%',
  LLike: '*%',
  RLike: '"%*'
};

/**
 * 查询设置界面grid列配置
 */
const settingConditionCfg: any = {
  busKey: 'id',
  columns: [
    {
      header: '表名',
      dataIndex: 'searchTable'
    },
    {
      header: '字段',
      dataIndex: 'searchField'
    },
    {
      header: '字段名称',
      dataIndex: 'fieldNameChn'
    },
    {
      header: '运算符',
      dataIndex: 'operator',
      width: 70,
      render: function ({ row }) {
        return operatorType[row.operator] || row.operator;
      }
    },
    {
      header: '布局顺序',
      dataIndex: 'displayIndex',
      width: 75,
      editor: {
        xtype: 'InputNumber',
        min: 0
      }
    },
    {
      header: '列占比',
      dataIndex: 'colSpan',
      width: 75,
      hidden: true,
      editor: {
        xtype: 'InputNumber',
        min: 1,
        step: 1,
        max: 4
      }
    },
    {
      header: '是否显示',
      dataIndex: 'displayFlg',
      width: 80,
      align: 'center',
      editor: {
        xtype: 'checkbox',
        antProps: { checkedValue: 1, unCheckedValue: 0 }
      }
    }
  ],
  busFields: [
    'id',
    'bizCode',
    'pageId',
    'searchTable',
    'searchField',
    'fieldNameChn',
    'fieldType',
    'operator',
    'defaultdata',
    'displayIndex',
    'colSpan',
    'displayFlg',
    'remark'
  ]
};
const settingSchemeCfg: any = {
  busKey: 'id',
  showRowNumber: true,
  columns: [
    {
      header: '字段',
      resizable: true,
      dataIndex: 'searchfield'
    },
    {
      header: '字段名称',
      resizable: true,
      dataIndex: 'cname'
    },
    {
      header: '运算符',
      dataIndex: 'combflg',
      resizable: true,
      render: function ({ row }) {
        return operatorType[row.combflg] || row.combflg;
      }
    },
    {
      header: '查询值',
      dataIndex: 'fieldvalue',
      resizable: true,
      flex: 2,
      format: { type: 'option' },
      editor: {
        xtype: 'select',
        editable: true,
        data: [
          { value: '@YYYY-MM-DD', label: '当前日期' },
          { value: '@yearfirst', label: '本年第一天' },
          { value: '@monthfirst', label: '本月第一天' },
          { value: '@yearlast', label: '本年最后一天' },
          { value: '@monthlast', label: '本月最后一天' },
          { value: '@YYYY', label: '当前年度' },
          { value: '@MM', label: '当前月度' },
          { value: '@DD', label: '当前天' },
          { value: '@userid', label: '操作员主键' },
          { value: '@username', label: '操作员名称' },
          { value: '@deptid', label: '操作员部门主键' },
          { value: '@deptno', label: '操作员部门编码' },
          { value: '@depename', label: '操作员部门名称' },
          { value: '@orgid', label: '登录组织主键' },
          { value: '@ocode', label: '登录组织编码' },
          { value: '@orgname', label: '登录组织名称' },
          { value: '@projectid', label: '操作员默认项目主键' },
          { value: '@projectno', label: '操作员默认项目编码' },
          { value: '@projectname', label: '操作员默认项目名称' },
          { value: '@hrid', label: '操作员对应员工主键' }
        ]
      }
    }
  ],
  busFields: [
    'phid',
    'searchtable',
    'searchfield',
    'cname',
    'combflg',
    'fieldvalue',
    'sortmode',
    'pphid',
    'sortorder',
    'fieldtype'
  ]
};

/**
 * 查询设置界面底部按钮区域
 * @param locale 多语言
 * @constructor
 */
function SettingFooter({ locale }) {
  const ctx = useContext(ModalContext);
  const [loading, setLoading] = useState({ reset: false, ok: false });
  const [tabKey, setTabKey] = useState(TabKeyEnum.tab1);
  const refreshQueryPanel = (value = 'panel') => {
    ctx.ins.notify(value, 'updateRefresh').then();
    ctx.ins.destroy();
  };

  const resetClick = () => {
    setLoading((pre) => ({ ...pre, reset: true }));
    resetQuerySettingInfo({ pageId: ctx.params.pageId }).then(() => {
      refreshQueryPanel();
    });
  };

  const okClick = async () => {
    const { key, isChanged, result, schemeId } = ctx.ins.getApi().getResult();
    if (isChanged) {
      if (key === TabKeyEnum.tab1) {
        if (
          await saveQuerySettingInfo({
            pageId: ctx.params.pageId,
            data: result
          })
        ) {
          refreshQueryPanel();
        }
      } else {
        if (
          await saveQuerySchemeData({
            schemeId,
            data: result
          })
        ) {
          refreshQueryPanel('scheme');
        }
      }
    } else {
      ctx.ins.destroy();
    }
  };

  ctx.ins.setApi({
    switchTab(key) {
      setTabKey(key);
    }
  });

  const buttonProps: any = {
    style: { marginLeft: 10, minWidth: 68 }
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '16px'
      }}
    >
      {tabKey === TabKeyEnum.tab1 && (
        <Popconfirm
          title={locale.confirmText}
          okText={locale.okText}
          cancelText={locale.cancelText}
          placement="topRight"
          onConfirm={resetClick}
        >
          <Button loading={loading.reset} {...buttonProps}>
            {locale.resetText}
          </Button>
        </Popconfirm>
      )}
      <Button {...buttonProps} onClick={() => ctx.ins.destroy()}>
        {locale.cancelText}
      </Button>
      <Button {...buttonProps} type="primary" onClick={okClick}>
        {locale.okText}
      </Button>
    </div>
  );
}

/**
 * 查询设置界面列表操作区域
 * @constructor
 */
function SettingContent({ locale }) {
  const ctx = useContext(ModalContext);
  const { pageId } = ctx.params;
  const [getRef, removeRef] = useRefs();
  const varRef = useRef<{ tabKey: TabKeyEnum; schemeUpdate: boolean }>({
    tabKey: TabKeyEnum.tab1,
    schemeUpdate: false
  });
  const buttons = useMemo(
    () => [
      'add',
      'delete',
      { id: 'u_start', hidden: true, text: '启用', icon: <CheckCircleOutlined /> },
      { id: 'u_stop', hidden: true, text: '停用', icon: <PauseCircleOutlined /> }
    ],
    []
  );
  const [scheme, setScheme] = useState<{ key?: string; title?: string }>({});
  const schemeId = scheme.key;
  const conditionRequest = useRefCallback(async () => await getQuerySettingInfo({ pageId }));
  const treeRequest = useRefCallback(async () => await getQuerySchemeTree({ pageId }));
  const schemeRequest = useCallback(() => getQuerySchemeData({ schemeId }), [schemeId]);
  const onTbClick = useRefCallback(async ({ id, toolbar }) => {
    const successCallback = (update = true) => {
      const treeApi = getRef('treeRef').current.getApi();
      varRef.current.schemeUpdate = update;
      treeApi.refresh();
    };
    switch (id) {
      case 'add':
        const schemeName = await new Promise((resolve) => {
          const InnerInput = () => {
            const [status, setStatus] = useState<any>('');
            const onInputChange = (value) => {
              setStatus(value ? '' : 'error');
            };
            useExtendRef(getRef('schemeName'), () => {
              return { setStatus };
            });

            useEffect(() => {
              return () => removeRef('schemeName');
            }, []);

            return <Input ref={getRef('schemeName')} size="large" onChange={onInputChange} status={status} />;
          };

          showModal({
            title: '新增-方案名称',
            width: 360,
            contentStyle: { padding: '15px 20px' },
            content: <InnerInput />,
            okText: '确定',
            cancelText: '取消',
            closable: false,
            onOk: (ins) => {
              const inputApi = getRef('schemeName').current.getApi();
              const name = inputApi.getValue();
              if (name) {
                ins.destroy();
                resolve(name);
              } else {
                inputApi.setStatus('error');
              }
            },
            onCancel: (ins) => {
              ins.destroy();
              resolve(false);
            }
          });
        });
        if (schemeName) {
          if (await addQueryScheme({ schemeName, pageId })) {
            successCallback();
          }
        }
        break;
      case 'delete':
        if (!schemeId) {
          return await zh.alert('请先选择方案！');
        }
        if (!(await zh.confirm('确认删除方案？'))) {
          return;
        }
        if (await deleteQueryScheme({ schemeId })) {
          setScheme({});
          successCallback();
        }
        break;
      case 'u_start':
        if (await updateQuerySchemeStatus({ schemeId, status: 1 })) {
          successCallback();
        }
        break;
      case 'u_stop':
        if (await updateQuerySchemeStatus({ schemeId, status: 0 })) {
          successCallback();
        }
        break;
      default:
        break;
    }
  });
  const onTreeSelectedChange = useRefCallback((keys, nodes) => {
    setScheme(nodes[0]);
  });

  ctx.ins.setApi({
    getResult() {
      const api = getRef(varRef.current.tabKey).current.getApi();
      if (varRef.current.tabKey === TabKeyEnum.tab1) {
        return {
          key: varRef.current.tabKey,
          isChanged: api.isChanged(),
          result: api.getRows()
        };
      } else {
        return {
          key: varRef.current.tabKey,
          schemeId,
          isChanged: varRef.current.schemeUpdate || api.isChanged(),
          result: api.getRows()
        };
      }
    }
  });

  const tabTitle = (title) => <span style={{ padding: '0 5px' }}>{title}</span>;

  useEffect(() => {
    if (scheme.key) {
      const status = scheme.title?.endsWith('(停)');
      getRef('schemeTb').current?.getApi().setHidden('u_start', !status);
      getRef('schemeTb').current?.getApi().setHidden('u_stop', status);
    }
  }, [scheme]);

  return (
    <Tabs
      tabBarGutter={20}
      onChange={(key) => {
        varRef.current.tabKey = key as TabKeyEnum;
        ctx.ins.getApi().switchTab(key);
      }}
      items={[
        {
          label: tabTitle(locale.settingCondition),
          key: TabKeyEnum.tab1,
          children: (
            <Grid
              ref={getRef(TabKeyEnum.tab1)}
              bordered={true}
              headerMenu={false}
              request={conditionRequest}
              {...settingConditionCfg}
              style={{ borderTop: 0 }}
            />
          )
        } //,
        // {
        //   label: tabTitle(locale.settingScheme),
        //   key: TabKeyEnum.tab2,
        //   children: (
        //     <Layout direction="column" autoFit>
        //       <ToolBar
        //         onClick={onTbClick}
        //         ref={getRef('schemeTb')}
        //         style={{ borderBottom: `1px solid ${cssVar.borderColorSplit}`, height: 40 }}
        //         buttons={buttons}
        //       />
        //       <Layout.Flex direction="row">
        //         <Layout.Slider size={180} style={{ borderBottom: `1px solid ${cssVar.borderColorSplit}` }}>
        //           <AsyncTree
        //             request={treeRequest}
        //             nowrap={false}
        //             defaultChange
        //             ref={getRef('treeRef')}
        //             onSelectedChange={onTreeSelectedChange}
        //             showFilter={false}
        //           />
        //         </Layout.Slider>
        //         <Layout.Flex>
        //           <Grid
        //             bordered={true}
        //             ref={getRef(TabKeyEnum.tab2)}
        //             request={schemeRequest}
        //             {...settingSchemeCfg}
        //             style={{ borderTop: 0 }}
        //           />
        //         </Layout.Flex>
        //       </Layout.Flex>
        //     </Layout>
        //   )
        // }
      ]}
    />
  );
}

function filterProps(fp, props) {
  if (fp) {
    const { antProps, ...others } = fp;
    return { ...props, ...others, ...antProps };
  }
  return props;
}

/**
 * 接口返回的元数据映射到react组件
 * @param fieldInput 自定义的fieldItem组件
 * @param field 查询字段元数据
 * @param fieldProps 自定义的fieldItem组件的属性
 * @param disabled 是否可用
 * @param formId form表单的name属性
 * @param placeholder
 */
function getInput({ formId, field: originField, fieldInput, fieldProps }, disabled = false, placeholder) {
  if (fieldInput) {
    const node = fieldInput(originField, disabled, placeholder);
    if (node) {
      return node;
    }
  }
  const fp = fieldProps[originField.itemId] || fieldProps[originField.name] || {};
  if (originField.hasOwnProperty('ormMode')) {
    originField.ORMMode = originField.ormMode;
  }
  const field = {
    ...originField,
    ...(zh.isFunction(fp) ? fp(originField) : fp)
  };
  const baseProps = {
    id: field.name || field.itemId || field.id,
    disabled,
    ...filterProps(fp, field.antProps)
  };
  const commonProps = {
    placeholder: field.placeholder ?? placeholder,
    ...baseProps,
    allowClear: true
  };
  ['request', 'params', 'showTime', 'renderExtraFooter', 'disabledTime', 'input', 'params'].forEach((key) => {
    if (!commonProps.hasOwnProperty(key) && field.hasOwnProperty(key)) {
      commonProps[key] = field[key];
    }
  });
  switch (field.xtype) {
    case 'Select':
      return (
        <Select
          {...commonProps}
          data={field.data}
          valueField={field.valueField || 'value'}
          labelField={field.displayField || 'label'}
        />
      );
    case 'SingleHelp':
      return (
        <SingleHelp
          {...commonProps}
          helpId={field.helpId || field.helpid}
          clientSqlFilter={field.clientSqlFilter}
          valueField={field.valueField}
          displayField={field.displayField}
          userCodeField={field.usercodeField || field.userCodeField}
          modalProps={{ getContainer: `#${formId}` }}
        />
      );
    case 'MultipleHelp':
      return (
        <MultipleHelp
          {...commonProps}
          helpId={field.helpId || field.helpid}
          clientSqlFilter={field.clientSqlFilter}
          valueField={field.valueField}
          displayField={field.displayField}
          userCodeField={field.usercodeField || field.userCodeField}
          modalProps={{ getContainer: `#${formId}` }}
        />
      );
    case 'DatePicker':
      return <DatePicker {...commonProps} />;
    case 'DateTimePicker':
      return <DatePicker {...commonProps} showTime />;
    case 'RangePicker':
      return <RangePicker {...commonProps} />;
    case 'RangeTimePicker':
      return <RangePicker {...commonProps} showTime />;
    case 'InputNumber':
      return (
        <InputNumber
          {...commonProps}
          step={field.step}
          precision={field.decimalPrecision}
          decimalSeparator={field.decimalSeparator}
        />
      );
    case 'Switch':
      return <Switch {...baseProps} />;
    case 'Checkbox':
      return <Checkbox {...baseProps} />;
    case 'CheckboxGroup':
      return <CheckboxGroup {...commonProps} options={field.data} />;
    case 'RadioGroup':
      return <RadioGroup {...commonProps} options={field.data} />;
    default: {
      if (zh.isFunction(field.xtype)) {
        const FieldComp = field.xtype;
        return <FieldComp {...commonProps} />;
      }
      const [instance, defaultProps, extendObj] = getRegisterComponentWithProps(field.xtype);
      const { instance: Comp }: any = { instance: instance || Input };
      field.hasOwnProperty('clientSqlFilter') && (defaultProps.clientSqlFilter = field.clientSqlFilter);
      field.hasOwnProperty('valueField') && (defaultProps.valueField = field.valueField);
      field.hasOwnProperty('displayField') && (defaultProps.displayField = field.displayField);
      field.hasOwnProperty('usercodeField') && (defaultProps.userCodeField = field.usercodeField);
      extendObj?.isHelp && (defaultProps.modalProps = { getContainer: `#${formId}` });
      return <Comp {...commonProps} {...defaultProps} />;
    }
  }
}

function getValueFromArray(values) {
  if (zh.isArray(values)) {
    return values.length > 0
      ? values
          .map((item) => {
            return item.hasOwnProperty('value') ? item.value ?? '' : item;
          })
          .join()
      : undefined;
  }
  return values;
}

/**
 * 格式化表单数据，方便后端接口使用
 * @param values form的value值
 */
function convertFormValues(values) {
  const handleDate = (key, value) => {
    if (zh.isString(value)) {
      value = value.trim();
    }
    if (key.indexOf('date*le') > -1 && value?.length < 11) {
      // 小于等于的日期控件需要加一天，否则数据库无法查出当天数据
      key = key.replace('date*le', 'date*lt');
      value = zh.addDate(value, 1, 'date', 'YYYY-MM-DD');
    }
    return [key, value];
  };
  return Object.keys(values).reduce((p, key) => {
    const kv = values[key];
    if (zh.isNullOrEmpty(kv) || (zh.isArray(kv) && kv.length === 0)) {
      return p;
    }
    // 如果是日期范围组件
    if (key.indexOf(',') > 0 && zh.isArray(kv)) {
      const arr = key.split(',');
      kv.forEach((v, i) => {
        if (!zh.isNullOrEmpty(v)) {
          const [k, nv] = handleDate(arr[i], v);
          p[k] = nv;
        }
      });
    } else {
      let value = kv.hasOwnProperty('value') ? kv.value : getValueFromArray(kv);
      [key, value] = handleDate(key, value);
      p[key] = value;
    }
    return p;
  }, {});
}

export interface IQueryInstance extends FormInstance {
  getSearchValues: () => any;
  getItem: (name: string) => any;
  setFieldValue: (name, value) => void;
  query: () => void;
  getQueryInfo: () => void;
}

function FiledLabel({ label }) {
  if (label) {
    const labelStyle: CSSProperties = {
      display: 'inline-block',
      color: 'initial',
      textAlign: 'right',
      wordBreak: 'break-all',
      whiteSpace: 'normal',
      maxHeight: '35px',
      lineHeight: 1.25
    };
    return (
      <Tooltip title={label} overflow>
        <span style={labelStyle}>{label}</span>
      </Tooltip>
    );
  }
  return <span />;
}

const buttonStyle = { marginLeft: 8 };

/**
 * 内嵌查询控件的Form
 */
const QueryForm = compHoc<IQueryPanelPropsType & { reader: any; update: any }, IQueryInstance>(function ({
  reader,
  ...others
}) {
  const queryInfo: IQueryInfo = reader().data;

  const [props, fields] = useDevState({ type: 'query', props: others, items: queryInfo.fields, itemKey: 'name' });
  const {
    pageId,
    items,
    onSearch,
    onReset,
    onLoad,
    buttonProps,
    outRef,
    size = 'default',
    readonlyItems = [],
    update,
    gridRef,
    fieldInput,
    fieldProps,
    showLabel = true,
    showAll = false,
    needRemember = true,
    needSetting = true,
    defaultExpand = false,
    columns = 4,
    values,
    onValuesChange,
    querySchemeContainer,
    id
  } = props;
  const chk = useRef<any>();
  const getDisabled = useCallback(
    (field: any) => {
      return (
        field.disabled ||
        field.readonly ||
        field.readOnly ||
        readonlyItems.includes(field.itemId) ||
        readonlyItems.includes(field.name)
      );
    },
    [readonlyItems.join(',')]
  );
  const [form] = Form.useForm();
  const computedDeps = useRef<Set<string>>(new Set());
  const [u, forceUpdate] = useState({});
  const defaultValues = useMemo(() => values || {}, [values]);
  const [expand, setExpand] = useState(defaultExpand || showAll);
  const [refreshScheme, setRefreshScheme] = useState({});
  const memoObj = useMemo(() => {
    let initialValues;
    if (!needRemember || items) {
      initialValues = {};
    } else if (queryInfo.isChecked) {
      initialValues = queryInfo.values;
    } else {
      initialValues = fields.reduce((pre, field) => {
        return getDisabled(field) ? { ...pre, [field.name]: queryInfo.values[field.name] } : pre;
      }, {});
    }
    return {
      rememberValues: initialValues,
      fields,
      formId: id || `form${Math.random().toString(32).slice(2)}`
    };
  }, [id, queryInfo, getDisabled, needRemember, fields, items]);

  const cacheValues = useMemo(
    () => ({ ...memoObj.rememberValues, ...defaultValues }),
    [memoObj.rememberValues, defaultValues]
  );
  const syncValues = (changedValues) => {
    Object.assign(cacheValues, changedValues);
    const changedKeys = Object.keys(changedValues);
    changedKeys.forEach((key) => {
      if (defaultValues.hasOwnProperty(key)) {
        defaultValues[key] = changedValues[key];
      }
    });
    if (computedDeps.current.size > 0) {
      const needUpdate = changedKeys.some((k) => computedDeps.current.has(k));
      needUpdate && forceUpdate({});
    }
  };

  useEffect(() => {
    form.setFieldsValue(cacheValues);
  }, [cacheValues]);

  const getGridApi = () => {
    const gridIns = zh.isString(gridRef) ? zh.getCmp(gridRef) : gridRef?.current;
    return gridIns?.getApi?.();
  };

  const searchEvent = useRefCallback(async () => {
    let searchValues: any = outRef.current.getSearchValues();
    zh.debug(searchValues);
    if (onSearch) {
      const hookRet: any = await onSearch(outRef.current, searchValues);
      if (hookRet) {
        searchValues = { ...searchValues, ...hookRet };
      }
    }
    await new Promise((resolve) => {
      getGridApi()?.query(searchValues || outRef.current.getSearchValues(), resolve);
    });
  });

  const rewriteFormApi = {
    setFieldsValue(values: IObject) {
      syncValues(values);
      form.setFieldsValue(values);
    }
  };

  useExtendRef(outRef, {
    ...form,
    ...rewriteFormApi,
    getSearchValues: () => convertFormValues(form.getFieldsValue()),
    getItem: (name) => form.getFieldInstance(name)?.getApi(),
    setFieldValue: (name, value) => rewriteFormApi.setFieldsValue({ [name]: value }),
    query: searchEvent,
    getQueryInfo() {
      return queryInfo;
    }
  });

  const onFinish = (values) => {
    if (needRemember && !items) {
      setQueryPanelData({ pageId, values, checked: chk.current?.getApi().getValue() }).then();
    }
    searchEvent().then();
  };

  const convertItem = useRefCallback(({ computed, ...newItem }: any) => {
    if (zh.isFunction(computed)) {
      const formatValue = convertFormValues(cacheValues);
      // 依赖收集
      if (computedDeps.current.size === 0) {
        const p1 = new Proxy(formatValue, {
          get(t, p: string) {
            computedDeps.current.add(p);
            return t[p];
          }
        });
        const p2 = new Proxy(formatValue, {
          get(t, p: string) {
            computedDeps.current.add(p);
            return t[p];
          }
        });
        zh.assign(newItem, computed(p1, p2));
      } else {
        zh.assign(newItem, computed(formatValue, cacheValues));
      }
    }
    return newItem;
  });

  const [totalColSpan, queryFields] = useMemo(() => {
    const { fields, formId } = memoObj;
    const col = fields.length > 3 ? columns : fields.length;
    const colStyle = fields.length === 1 && (fields[0].colSpan || fields[0].colspan) !== 3 ? { maxWidth: '66%' } : {};
    const avgSpan = 24 / col;
    let showFieldCount = col * defaultShowRowCount;
    let tcs = 0;
    const allFields = fields.map((originItem) => {
      const f = convertItem(originItem);
      const colspan = Math.min(col, f.colSpan || f.colspan || 1);
      showFieldCount -= colspan;
      tcs += colspan;
      return {
        ...f,
        hidden: expand ? false : showFieldCount < 0,
        colspan: colspan * avgSpan
      };
    });
    return [
      tcs,
      allFields.map((field: any) => {
        const fp = fieldProps ? fieldProps[field.itemId] || fieldProps[field.name] : null;
        const _field = fp
          ? {
              ...field,
              ...(zh.isFunction(fp) ? fp(field) : fp)
            }
          : field;

        const hasLabel = !!(showLabel && _field.label);
        return (
          <Col span={_field['colspan']} key={_field['name']} hidden={_field['hidden']} style={colStyle}>
            <Form.Item
              name={_field['name']}
              colon={hasLabel}
              label={<FiledLabel label={hasLabel ? _field['label'] : ''} />}
            >
              {getInput(
                {
                  formId,
                  field,
                  fieldInput,
                  fieldProps: fieldProps || {}
                },
                getDisabled(field),
                hasLabel ? '' : _field['label']
              )}
            </Form.Item>
          </Col>
        );
      })
    ];
  }, [u, memoObj, expand, columns, fieldInput, fieldProps, getDisabled]);

  const clearValues = () => {
    form.setFieldsValue(
      fields.reduce((pre, field) => {
        if (getDisabled(field)) {
          return pre;
        }
        cacheValues[field.name] = undefined;
        if (defaultValues.hasOwnProperty(field.name)) {
          defaultValues[field.name] = undefined;
        }
        return { ...pre, [field.name]: undefined };
      }, {})
    );
  };

  const locale = props.locale ? zh.extend(defaultLocale, props.locale) : defaultLocale;

  const querySetting = useRefCallback(() => {
    const { width, height } = getGlobalConfig().default.helpConfig;
    let refreshType = '';
    const ins = showModal({
      params: { pageId },
      title: locale.settingTitle,
      width,
      height,
      contentStyle: { padding: '0 5px' },
      content: <SettingContent locale={locale} />,
      footer: <SettingFooter locale={locale} />,
      getContainer: `#${memoObj.formId}`,
      afterClose: () => {
        if (refreshType) {
          refreshType === 'panel' && update({ pageId });
          refreshType === 'scheme' && setRefreshScheme({});
        }
        refreshType = '';
      }
    });
    ins.subscribe((type) => {
      refreshType = type;
    }, 'updateRefresh');
  });
  const checkChanged = useRefCallback((checked) =>
    setQueryPanelData({ pageId, checked, values: form.getFieldsValue() })
  );

  /**
   * 如果查询控件绑定grid，则第一次自动执行查询事件
   */
  useAsyncEffect(
    async (ctx) => {
      await onLoad?.(outRef.current);
      (outRef.current as any)._compIns.getObserver().prevNotify({ ins: outRef.current }, 'onLoad');
      ctx.isMounted &&
        gridRef &&
        zh.AllReady(
          () => {
            ctx.isMounted && searchEvent();
          },
          null,
          { delay: false }
        );
    },
    [pageId]
  );

  useUpdateEffect(() => {
    gridRef && searchEvent();
  }, [gridRef]);

  useObjectEffect(
    () => {
      gridRef && searchEvent();
    },
    values,
    false
  );

  useUpdateEffect(() => {
    update({ pageId });
  }, [update, pageId]);

  const handleValuesChange = async (changedValues, allValues) => {
    const res = await onValuesChange?.(changedValues, allValues);
    if (res === false) {
      form.setFieldsValue(cacheValues);
    } else if (zh.isObject(res)) {
      syncValues(res);
      form.setFieldsValue(cacheValues);
    } else {
      syncValues(changedValues);
    }
  };
  const setting = (
    <Button style={buttonStyle} onClick={querySetting} {...buttonProps}>
      {locale.settingText}
    </Button>
  );

  const buttons = (
    <Row>
      <Col span={24} style={{ display: 'flex', alignItems: 'center' }}>
        <Button style={buttonStyle} type="primary" onClick={() => form.submit()} {...buttonProps}>
          {locale.search}
        </Button>
        <Button
          style={buttonStyle}
          onClick={() => {
            clearValues();
            onReset?.(outRef.current);
            form.submit();
          }}
          {...buttonProps}
        >
          {locale.reset}
        </Button>
        {needSetting && !items && setting}
        {needRemember && !items && (
          <Checkbox
            ref={chk}
            checkedValue={true}
            unCheckedValue={false}
            defaultChecked={queryInfo.isChecked}
            onChange={checkChanged}
            style={{ marginLeft: buttonStyle.marginLeft }}
          >
            {locale.rememberCheckbox}
          </Checkbox>
        )}
        {totalColSpan > columns && !showAll && (
          <a
            style={{ fontSize: 12, marginLeft: buttonStyle.marginLeft }}
            onClick={() => {
              setExpand(!expand);
            }}
          >
            {expand ? locale.up : locale.down}
            <DownOutlined
              style={{
                marginLeft: '0.3em',
                transition: 'all 0.3s ease 0s',
                transform: `rotate(${expand ? '180deg' : 0})`
              }}
            />
          </a>
        )}
      </Col>
    </Row>
  );

  if (totalColSpan < 4) {
    return (
      <Panel
        title="查询"
        blankStyle={{ flex: 'none' }}
        headerStyle={{ minHeight: 45, height: 'auto' }}
        extra={
          <>
            <Layout.Flex style={{ overflow: 'visible', flex: 1, width: 0 }}>
              <Form
                size={size as any}
                form={form}
                name={memoObj.formId}
                className="query_search_form"
                style={{ padding: 0 }}
                onValuesChange={handleValuesChange}
                onFinish={onFinish}
              >
                <Row gutter={24} className="query_fields query_items" style={{ margin: 0, justifyContent: 'end' }}>
                  {queryFields}
                </Row>
              </Form>
            </Layout.Flex>
            {buttons}
          </>
        }
      />
    );
  }
  return (
    <Panel title="查询" headerStyle={{ minHeight: 45, height: 'auto' }} extra={buttons}>
      <Layout.Flex style={{ overflow: 'visible' }}>
        <Form
          size={size as any}
          form={form}
          name={memoObj.formId}
          className="query_search_form"
          onValuesChange={handleValuesChange}
          style={{ padding: 0 }}
          onFinish={onFinish}
        >
          <Row gutter={24} className="query_fields" style={{ margin: '0 -16px -10px -16px' }}>
            {queryFields}
          </Row>
        </Form>
      </Layout.Flex>
    </Panel>
  );

  // return (
  //   <QueryScheme
  //     pageId={pageId}
  //     refreshScheme={refreshScheme}
  //     form={form}
  //     clearValues={clearValues}
  //     locale={locale}
  //     querySchemeContainer={querySchemeContainer}
  //   />
  // );
},
'QueryPanel');

function QueryScheme({ pageId, form, clearValues, refreshScheme, locale, querySchemeContainer }) {
  const [activeScheme, setActiveScheme] = useState('');
  const [schemes, setSchemes] = useRefState<any[]>([]);
  useEffect(() => {
    getQueryScheme({ pageId }).then(setSchemes);
  }, [refreshScheme]);

  const handleChange = (schemeId) => {
    schemeId !== activeScheme && setActiveScheme(schemeId);
  };

  useEffect(() => {
    if (activeScheme) {
      getQuerySchemeDetail({ schemeId: activeScheme }).then((values) => {
        clearValues();
        form.setFieldsValue(values);
        form.submit();
      });
    }
  }, [activeScheme]);

  if (schemes?.length > 0) {
    const renderScheme = (marginTop) => {
      return (
        <div style={{ marginTop }}>
          <span style={{ color: '#000', fontWeight: 600 }}>{locale.queryScheme}：</span>
          {schemes.map((scheme) => (
            <Tag
              key={scheme.phid}
              color={activeScheme === scheme.phid ? cssVar.primaryColor : 'var(--primary-1)'}
              style={{ cursor: 'pointer', color: activeScheme === scheme.phid ? '#fff' : '#999' }}
              onClick={() => handleChange(scheme.phid)}
              children={scheme.cname}
            />
          ))}
        </div>
      );
    };
    const container = document.getElementById(querySchemeContainer);
    return container ? ReactDOM.createPortal(renderScheme(0), container) : renderScheme(10);
  }

  return null;
}

/**
 * 加载中的骨架视图
 * @param columnCount 显示列数
 * @param size 大小
 * @constructor
 */
function QueryFormLoading(columnCount, size) {
  return (
    <div
      className="query_search_form"
      style={{ marginBottom: 'var(--inner-margin, 16px)', padding: 'var(--inner-margin, 16px)' }}
    >
      <div className="skeleton-flex" style={{ marginBottom: 10, display: 'flex' }}>
        {new Array(columnCount).fill(1).map((v, index) => (
          <Skeleton.Button key={index} active size={size} style={{ marginLeft: index === 0 ? 0 : 24 }} />
        ))}
      </div>
      <div style={{ display: 'flex' }}>
        <Skeleton.Button active style={{ width: 32 }} size={size} />
        <div style={{ flex: 1 }} />
        <Skeleton.Button active size={size} style={{ margin: '0 8px' }} />
        <Skeleton.Button active size={size} />
      </div>
    </div>
  );
}

/**
 * 内嵌查询控件
 * @param props
 * @constructor
 */
export const QueryPanel = forwardRef<ICurrentObject<IQueryInstance>, IQueryPanelPropsType>((props, ref) => {
  const renderForm = (reader, update) => (
    <QueryForm
      ref={ref}
      {...props}
      id={(props.id || props.pageId || 'query').replace(/:/g, '_')}
      reader={reader}
      update={update}
    />
  );

  const cacheData = useMemo(() => {
    return {
      fields: props.items,
      values: {},
      isChecked: false
    };
  }, [props.items]);

  if (props.items) {
    const [dataReader, setDataReader] = [
      () => ({
        data: cacheData
      }),
      () => void 0
    ];
    return <div style={{ ...props.style }}>{renderForm(dataReader, setDataReader)}</div>;
  }
  return <AsyncQuery props={props} renderForm={renderForm} />;
});

function AsyncQuery({ props, renderForm }) {
  const [dataReader, setDataReader] = useAsyncSuspense(
    getQueryPanelInfo,
    {
      pageId: props.pageId || props.id
    },
    props.pageId || props.id
  );

  useEffect(() => {
    const { gridRef } = props;
    const gridIns = zh.isString(gridRef) ? zh.getCmp(gridRef) : gridRef?.current;
    gridIns?.getApi?.()?.startLoading?.();
  }, []);

  return (
    <div style={props.style}>
      <Suspense fallback={QueryFormLoading(props.columns || 4, props.size || 'default')}>
        {renderForm(dataReader, setDataReader)}
      </Suspense>
    </div>
  );
}
