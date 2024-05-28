import { Col, Form, Input, Row } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  compHoc,
  cssVar,
  registerComponent,
  zh,
  useDebounce,
  useDevState,
  useExtendRef,
  useRefCallback,
  ValueTypeEnum,
  type IObject
} from '../../util';
import { AutoResize } from '../../widgets';
import { fomatValues, getComp, getObjValue, getSubscribeFn, LayConfWrap, setObjValue } from '../common';
import { formConfProps } from '../config/interface';
import { getInitVals } from '../getInitVals';
import { CompHocProps } from '../props.dt';
import useColspan from '../useColspan';
import { getFormStyle } from './handleStyle';
import './index.less';
import { FormInfo, FormPropsInfo, OptType } from './interface';
import { mergeEventHandler } from './listener';
import Label from './renderLabel';
import ViewItem from './viewItem';
import { initRules, mergeRules } from './volidRule';

export type { FormInfo } from './interface';
export { FormLayout, type InnerFormLayoutInterface };

const gutter = { xs: 8, sm: 16, md: 24, lg: 32 };

function isValueLabel(item) {
  return zh.isObject(item) && item.hasOwnProperty('value') && item.hasOwnProperty('label');
}

function getObjPath(obj, p: any[] = []) {
  const prev = p.length > 0 ? p[p.length - 1] : '';
  const tmpKey = Object.keys(obj)[0];
  const tmpValue = tmpKey ? obj[tmpKey] : '';
  const current: string[] = [];
  if (tmpKey?.indexOf(',') > 0) {
    tmpKey.split(',').forEach((k) => {
      current.push(prev ? `${prev}.${k}` : k);
    });
  }
  current.push(prev ? `${prev}.${tmpKey}` : tmpKey);
  if (zh.isObject(tmpValue) && Object.keys(tmpValue).length > 0) {
    return getObjPath(tmpValue, [...p, ...current]);
  }
  return [...p, ...current];
}

function handleDate(values, itemName, { init = true, emptyValue = '' }) {
  const namePath = zh.isArray(itemName) ? [...itemName] : [itemName];
  const name = namePath.pop();
  if (name?.indexOf(',') > 0) {
    const arr = name.split(',');
    if (init) {
      const v = arr.map((n) => getObjValue(values, [...namePath, n]));
      setObjValue(values, itemName, v);
    } else {
      const v = getObjValue(values, itemName);
      arr.forEach((n, i) => {
        setObjValue(values, [...namePath, n], v[i] ?? emptyValue);
      });
    }
    return true;
  }
  return false;
}

/**
 * 转换form表单的value值，通用帮助或下拉选择转换成{value, label}格式
 * @param initValues
 * @param fields
 */
function convertValues(initValues, fields) {
  const splitStr = ',';
  const fn = (items) => {
    items.forEach((field) => {
      const item = { ...field, ...field.antProps };
      if (item.xtype === 'container') {
        fn(item.children || item.items);
      } else {
        if (item.name && !handleDate(initValues, item.name, { init: true })) {
          const value = getObjValue(initValues, item.name);
          const valueType: ValueTypeEnum = item.valueType;
          const nameField = item.nameField ?? (item.xtype?.endsWith?.('Help') ? `${item.name}EXName` : '');
          if (nameField && !zh.isNullOrEmpty(value, '')) {
            const nameFieldValue = getObjValue(initValues, nameField);
            const label = nameFieldValue ?? value;
            if (item.multiple || item.xtype === 'MultipleHelp') {
              const labelArray = zh.isArray(label) ? label : zh.split(label, splitStr);
              const valueArray = zh.isArray(value) ? value : zh.split(value, splitStr);
              const valueLabel = valueArray
                .map((v: any, i: number) => {
                  return v?.hasOwnProperty('value')
                    ? v
                    : {
                        value: zh.convertData(v, valueType),
                        label: labelArray[i] ?? v
                      };
                })
                .filter(({ label }) => !zh.isNullOrEmpty(label, ''));
              setObjValue(initValues, item.name, valueLabel.length ? valueLabel : null);
            } else {
              setObjValue(
                initValues,
                item.name,
                value.hasOwnProperty('value')
                  ? value
                  : {
                      value: zh.convertData(value, valueType),
                      label
                    }
              );
            }
          } else {
            setObjValue(initValues, item.name, zh.convertData(value, valueType, item.format));
          }
        }
      }
    });
  };
  fn(fields);
  return initValues;
}

function FormLayoutComp(cmpProps: FormPropsInfo) {
  const [props, children] = useDevState({
    type: 'form',
    id: cmpProps['id'] || cmpProps['data-cid'] || 'form',
    props: cmpProps,
    items: cmpProps.formConf.children,
    itemKey: 'name'
  });
  const formConf = useMemo(() => ({ ...cmpProps.formConf, children }), [cmpProps.formConf, children]);
  const {
    formSetRef,
    design,
    opt,
    busKey = 'id',
    defaultValue: dv,
    value,
    disabled,
    initSc,
    outRef,
    rules,
    style: formStyle,
    formStyle: rowStyle,
    size: formSize,
    compact: formCompact = false,
    className: defaultFormClassName,
    bordered: defaultBordered,
    onLoad,
    fieldProps,
    disabledNotify = false,
    colon: defaultColon
  } = props;

  const computedDeps = useRef<{ deps: Set<string>; proxy?: any; rules: IObject[] }>({
    deps: new Set(),
    proxy: null,
    rules: []
  });

  const [fields] = useMemo(() => {
    computedDeps.current.deps.clear();
    computedDeps.current.proxy = null;
    const fn = (items, pname = '') => {
      return items.map((item) => {
        const tmp = { ...item };
        if (tmp.xtype === 'container') {
          tmp.children = fn(tmp.children || tmp.items, tmp.name);
          delete tmp.name;
        } else if (zh.isString(tmp.name) && pname) {
          tmp.name = [pname, tmp.name];
        }
        return tmp;
      });
    };

    return [fn(formConf.children || [])];
  }, [formConf.children]);

  const isChange = useRef(false);
  const defaultValue = useMemo(
    () => convertValues(getInitVals({ children: fields }, 'form', value || dv) || {}, fields),
    [value, dv, fields]
  );
  const initValue = useMemo(() => zh.deepCopy(defaultValue), []);
  const colspan = formConf.colspan ?? props.colspan;
  const labelPosition = formConf.labelPosition ?? (props.labelPosition || 'left');
  const formLayout = formConf.layout ?? (props.layout || (labelPosition === 'top' ? 'vertical' : 'horizontal'));
  const cacheItems = useMemo(() => ({}), [formConf]);
  const [form]: Array<any> = Form.useForm();
  const [dspan, setDspan] = useState(zh.isNumber(colspan) ? 24 / colspan : 8);
  const gDisabled = formConf.disabled ?? disabled;
  const optType: OptType = opt || zh.getQueryValue('opt');
  const labelWidth = formConf.labelWidth || props.labelWidth || cssVar.formLabelWidth;
  const [m, setM]: any = useState({});
  const [u, forceUpdate] = useState({});
  const bordered = formConf.bordered ?? defaultBordered;
  const colon = bordered ? false : formConf.colon ?? defaultColon ?? true;
  const isView = formConf.view ?? props.view;
  const formClassName = zh.classNames('zh-form-wrapper', defaultFormClassName, {
    'zh-compact-form': formCompact,
    'zh-bordered-form': bordered,
    'zh-view-form': isView
  });
  const mergeHandler = useMemo(
    () =>
      mergeEventHandler(() => {
        setM((m: any) => ({ ...m }));
      }),
    []
  );
  const handlers = mergeHandler();
  const containerId = `${props.id || props['data-cid'] || formConf.name || 'form'}`;
  const { breakPairs, breakPoints, setBreakPairs } = useColspan(containerId, colspan);
  const labelAlign = props.labelAlign || formConf.labelAlign || 'right';

  useEffect(() => {
    onLoad?.();
    outRef.current._compIns.getObserver().prevNotify({ ins: outRef.current }, 'onLoad').then();
  }, [formConf]);

  //合并事件
  useEffect(() => {
    mergeHandler(initSc, true);
  }, [initSc]);

  useEffect(() => {
    setM(rules);
  }, [rules]);

  const syncValues = (changedValues) => {
    if (changedValues !== defaultValue) {
      zh.deepMerge(defaultValue, changedValues);
    }
    if (computedDeps.current.deps.size > 0) {
      const changedKeys = Object.keys(changedValues);
      const needUpdate = changedKeys.some((k) => computedDeps.current.deps.has(k));
      needUpdate && forceUpdate({});
    }
  };

  useEffect(() => {
    syncValues(defaultValue);
    form.setFieldsValue(defaultValue);
  }, [defaultValue]);

  const rewriteFormApi = {
    resetFields() {
      isChange.current = true;
      syncValues(initValue);
      form.resetFields();
    },
    setFieldsValue(values: object) {
      isChange.current = true;
      syncValues(values);
      form.setFieldsValue(defaultValue);
    },
    setFieldValue(name: string, value: any) {
      rewriteFormApi.setFieldsValue({ [name]: value });
    }
  };

  const validData = () => {
    return form.validateFields().then(
      () => true,
      () => false
    );
  };

  useExtendRef(outRef, {
    ...form,
    ...rewriteFormApi,
    isChanged: () => isChange.current,
    setModel: setM,
    clear: () => {
      Object.keys(defaultValue).forEach((key) => {
        defaultValue[key] = undefined;
      });
      form.setFieldsValue(defaultValue);
    },
    getFormatValues: getFormatValues,
    getValues: (mergeValues = true, undefinedValue = '') => beforeSubmit({ mergeValues, undefinedValue }),
    changeFormValues: (values: any = {}) => rewriteFormApi.setFieldsValue(values),
    mergeRules: (newRule: any) => setM((m: any) => mergeRules(m, newRule)),
    mergeHandler: mergeHandler,
    isValid: validData,
    validData,
    validateForm: form.validateFields,
    getItem: (name: string) => form.getFieldInstance(name)?.getApi?.(),
    setBreakPairs,
    setHidden: (name: string, hidden: Boolean = true) => {
      setConfigByName(name, { hidden });
    },
    setRequired: (name: string, required: string | boolean = true) => {
      setConfigByName(name, { required });
    },
    getConfig: () => formConf,
    setConfig,
    setConfigByName,
    getDspan: () => dspan,
    focus: () => {
      focusItem(fields);

      function focusItem(items: any[]) {
        for (let index = 0; index < items.length; index++) {
          const element = items[index];
          if (Array.isArray(element.children) && focusItem(element.children)) {
            return true;
          }
          if (element.disabled || element.hidden) {
          } else {
            const item = form.getFieldInstance(element.name)?.getApi?.();
            if (item?.focus) {
              item?.focus?.();
              return true;
            }
          }
        }
        return false;
      }
    },
    subscribe: getSubscribeFn(outRef),
    setReadOnly(name: string | string[] | boolean = true, disabled = true) {
      if (zh.isBoolean(name)) {
        zh.fastDp.form.updateProps({ id: containerId, props: { disabled } });
      } else {
        setConfigByName(name as string | string[], { disabled });
      }
    }
  });

  const convertItem = useRefCallback((itm: any) => {
    const fp = fieldProps?.[itm.name];
    const { computed, encrypted, ...newItem }: any = fp
      ? {
          ...itm,
          ...(zh.isFunction(fp) ? fp(itm) : fp)
        }
      : itm;
    if (encrypted) {
      return {
        ...newItem,
        xtype: () => <Input value="*****" disabled />
      };
    }
    if (zh.isFunction(computed)) {
      const formatValue = beforeSubmit();
      // 依赖收集
      if (computedDeps.current.deps.size === 0) {
        const v1 = new Proxy(formatValue, {
          get(t, p: string) {
            computedDeps.current.deps.add(p);
            return t[p];
          }
        });
        const v2 = new Proxy(defaultValue, {
          get(t, p: string) {
            computedDeps.current.deps.add(p);
            return t[p];
          }
        });
        computedDeps.current.proxy = { v1, v2 };
      }
      if (computedDeps.current.proxy) {
        zh.assign(newItem, computed(computedDeps.current.proxy.v1, computedDeps.current.proxy.v2));
      } else {
        zh.assign(newItem, computed(formatValue, defaultValue));
      }
    }
    return newItem;
  });

  /**
   * 渲染表单条目
   */
  const _renderItem = useRefCallback((originItem, index) => {
    const item = convertItem(originItem);
    const key = item.name || item.itemId || index;
    if (item.hidden) return '';
    let cellStyle = { paddingLeft: 0, paddingRight: 0 };
    formLayout === 'inline' && (cellStyle['with'] = formConf.minWidth || 300);
    const span = getColspan(item.colspan) || 1;
    return (
      <Col key={key} style={cellStyle} data-id={key} span={span}>
        {renderFormItem(item, index)}
      </Col>
    );

    function renderFormItem(item: any, index) {
      item = item || {};
      const { instance: Comp } = getComp(item);
      if (Comp === 'Group') {
        return (
          <div
            className={'zh-group'}
            style={{ display: item.hidden ? 'none' : 'flex' }}
            key={`group_${item.name || item.itemId || index}`}
          >
            {renderGroup(item, index)}
          </div>
        );
      } else {
        return renderFI(item, index);
      }
    }

    function renderFI(item: any, index) {
      const { instance: Comp, props: defaultProps }: any = isView ? { instance: ViewItem } : getComp(item);
      const nameKey = zh.isArray(item.name) ? item.name.join('.') : item.name;
      const listener = (handlers.children || {})[nameKey] || {};
      const newRules = { ...m, ...initRules({ children: [item] }) };
      let rules = newRules[nameKey] || [];
      const dp = filterProps(item);
      const disabled = item.disabled ?? gDisabled;
      disabled && (dp['disabled'] = !!disabled);
      const clientSqlFilter = dp.clientSqlFilter;
      if (zh.isFunction(clientSqlFilter)) {
        dp.clientSqlFilter = (args) => clientSqlFilter({ ...args, form: outRef.current });
      }
      'getPopupContainer' in dp && (dp['getPopupContainer'] = getPopupContainer);
      const { onChange, ...others } = { ...dp, ...listener } as any;
      bordered && (others.bordered = false);
      if (
        !item.hasOwnProperty('extra') &&
        ['InputNumber', 'Input'].includes(item.xtype) &&
        ['percent', 'rate'].includes(item.type)
      ) {
        item.extra = '%';
      }
      const inline = formLayout === 'vertical' && item.inline;
      const align = inline ? 'left' : formLayout === 'vertical' ? 'left' : labelAlign;
      const getItemProps = () => {
        const p: any = {
          label: item.label ? (
            <Label
              width={inline || formLayout !== 'vertical' ? item.labelWidth || labelWidth : '100%'}
              label={item.label}
              langKey={item.langKey || item.name}
              labelAlign={align}
            />
          ) : (
            ''
          ),
          labelAlign: align,
          className: `item-checked-customer formItem ${(!item.label && 'form-item-nolabel') || ''}${
            inline ? ' vertical-inline' : ''
          }`,
          key: nameKey || item.itemId || index,
          required: item.required,
          style: item.style,
          hidden: item.hidden
        };
        if (!item.extra) {
          p.rules = item.hidden ? undefined : rules;
          p.name = item.name;
        }
        if (item.dependencies) {
          p.dependencies = item.dependencies;
        }
        return p;
      };
      const getItemCmp = () => {
        return <Comp {...(isView ? { 'data-item': item } : {})} {...others} {...defaultProps} />;
      };

      return (
        <Form.Item {...getItemProps()}>
          {item.extra ? (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Form.Item
                name={item.name}
                noStyle
                style={{ flex: 1, minWidth: 0 }}
                rules={item.hidden ? undefined : rules}
              >
                {getItemCmp()}
              </Form.Item>
              {item.extra}
            </div>
          ) : (
            getItemCmp()
          )}
        </Form.Item>
      );
    }

    function renderGroup(item, index) {
      const items = item.children || item.items || [];
      if (item.customerStyle) {
        return (
          <div style={item.customerStyle}>
            {items.map((it: any, idx: number) => renderFI(convertItem(it), `${index}-${idx}`))}
          </div>
        );
      } else {
        const noColToFormStyle = {
          display: 'flex',
          width: '100%',
          marginBottom: 0,
          ...(item.style || {})
        };
        return (
          <Form.Item
            key={`group_item_${index}`}
            label={
              item.label ? (
                <Label
                  width={formLayout !== 'vertical' ? item.labelWidth || labelWidth : '100%'}
                  label={item.label}
                  langKey={item.langKey || item.name}
                  labelAlign={formLayout === 'vertical' ? 'left' : labelAlign}
                />
              ) : (
                ''
              )
            }
            className={`item-checked-customer formItem formContainerItem`}
            style={noColToFormStyle}
            required={item.required}
          >
            {items.map((it: any, idx: number) => renderFormItem(convertItem(it), `${index}-${idx}`))}
          </Form.Item>
        );
      }
    }
  });

  /**
   * 渲染表单
   */
  const _renderForm = useMemo(() => {
    computedDeps.current.proxy = null;
    return fields.map(_renderItem);
  }, [fields, formConf, m, dspan, gDisabled, formLayout, u]);
  const fstyle = useMemo(() => getFormStyle(formConf, rowStyle), [formConf, rowStyle]);
  const hasBorderStyle = bordered || formConf.bordered ? 'border-form' : '';
  const className = useMemo(() => zh.classNames('zh-form', formLayout, hasBorderStyle), [design]);
  const formHandler = { ...handlers };
  delete formHandler.children;

  const getDspan = useRefCallback(({ width }: any) => {
    let index = breakPoints.findIndex((item) => {
      return item > width;
    });
    index = index === -1 ? breakPoints.length - 1 : index;
    const defaultSpan = 24 / breakPairs[breakPoints[index]];
    if (dspan !== defaultSpan) {
      setDspan(defaultSpan || 4);
    }
  });

  async function dealPropsChange(changedValues, allValues, oldValues) {
    const changedEvent = props.onValuesChange || handlers['onValuesChange'];
    const res = await changedEvent?.(changedValues, allValues);
    if (res === false) {
      rewriteFormApi.setFieldsValue(oldValues);
    } else if (zh.isObject(res)) {
      syncValues(res);
      if (res !== changedValues) {
        rewriteFormApi.setFieldsValue(defaultValue);
      }
    }
    return res !== false;
  }

  const notify = useDebounce(
    (updateValue) => {
      zh.getPageObserver().notify(
        {
          key: getObjPath(updateValue),
          containerId: props['cid'] || containerId,
          form: outRef.current,
          instance: formSetRef?.current || outRef.current,
          args: [updateValue, defaultValue]
        },
        'onValuesChange'
      );
    },
    { wait: 250 }
  );

  function handleValuesChange(updateValue, allValues) {
    const oldValues = zh.deepCopy(defaultValue);
    isChange.current = true;
    const paths = getObjPath(updateValue);
    // 日期范围特殊处理
    if (paths.length >= 3 && paths[paths.length - 1].indexOf(',') > 0) {
      const v = getObjValue(updateValue, paths[paths.length - 1]) || [];
      setObjValue(updateValue, paths[paths.length - 3], v[0]);
      setObjValue(updateValue, paths[paths.length - 2], v[1]);
    }
    syncValues(updateValue);

    dealPropsChange(updateValue, allValues, oldValues).then((success) => {
      const listener = handlers.children || {};
      Object.keys(updateValue).forEach((key) => {
        const dp = filterProps(getFormItem(key) || {}); //二开属性里面的onChange事件覆盖listener
        const onChange = dp.onChange || listener[key]?.onChange;
        if (onChange && updateValue[key] !== oldValues[key]) {
          onChange(updateValue[key], oldValues[key]);
        }
      });
      if (success && !disabledNotify) {
        outRef.current.innerNotify?.([updateValue, defaultValue], 'onValuesChange');
        formSetRef?.current?.innerNotify([updateValue, defaultValue], 'onValuesChange');
        notify(updateValue);
      }
    });
  }

  return (
    <div id={`${containerId}_ctx`} style={{ position: 'relative' }}>
      <AutoResize onResize={getDspan}>
        <Form
          name={containerId}
          {...handlers}
          onValuesChange={handleValuesChange}
          form={form}
          size={formSize}
          style={formStyle}
          layout={formLayout}
          className={formClassName}
          colon={colon}
        >
          <Row className={className} style={fstyle} gutter={gutter}>
            {_renderForm}
          </Row>
        </Form>
      </AutoResize>
    </div>
  );

  function getFormatValues(initValues = {}) {
    const id = busKey || 'id';
    const data = { ...initValues, ...beforeSubmit() };
    const opt = optType || (data?.[id] ? 'modifiedRow' : 'newRow');
    return fomatValues(formConf.name, 'form', opt, id, data)()[formConf.name];
  }

  function beforeSubmit({ mergeValues = true, undefinedValue = '', includeHiddenItem = true } = {}) {
    let initValues = form.getFieldsValue();
    if (mergeValues) {
      initValues = { ...defaultValue, ...initValues };
    }

    const fn = (items) => {
      items.forEach((field) => {
        const item = { ...field, ...field.antProps };
        const originValue = getObjValue(initValues, item.name);
        if (item.name) {
          if (field.xtype === 'container') {
            fn(field.children || field.items);
          } else {
            if ((item.hidden && !includeHiddenItem) || item.encrypted) {
              zh.deleteObjKey(initValues, item.name);
            } else {
              const nameField = item.nameField;
              const emptyValue = item.emptyValue ?? undefinedValue;
              if (Array.isArray(originValue)) {
                if (handleDate(initValues, item.name, { init: false, emptyValue })) {
                } else if (originValue.length > 0 && isValueLabel(originValue[0])) {
                  setObjValue(initValues, item.name, originValue.map((item) => item.value).join());
                  nameField && setObjValue(initValues, nameField, originValue.map((item) => item.label).join());
                } else if (originValue.length === 0) {
                  setObjValue(initValues, item.name, emptyValue);
                  nameField && setObjValue(initValues, nameField, '');
                } else if (!zh.isObject(originValue[0])) {
                  setObjValue(initValues, item.name, originValue.join());
                }
              } else if (isValueLabel(originValue)) {
                setObjValue(initValues, item.name, originValue.value);
                nameField && setObjValue(initValues, nameField, originValue.label);
              }
              if (getObjValue(initValues, item.name) === undefined) {
                setObjValue(initValues, item.name, emptyValue);
              }
            }
          }
        }
      });
    };

    fn(fields);

    return initValues;
  }

  function getPopupContainer() {
    return props.getPopupContainer ? props.getPopupContainer() : document.getElementById(`${containerId}_ctx`);
  }

  function getColspan(itemColspan: any) {
    if (itemColspan === undefined || itemColspan === null) {
      return dspan;
    }
    const cs = itemColspan * dspan;
    return cs > 24 ? 24 : Math.round(cs);
  }

  function getFormItem(key, formItems?) {
    if (cacheItems[key]) return cacheItems[key];
    formItems = formItems || fields;
    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (item.name === key) {
        cacheItems[key] = item;
        return item;
      }
      const items = item.children || item.items || [];
      if (items.length) {
        const tmp = getFormItem(key, items);
        if (tmp) {
          return tmp;
        }
      }
    }
  }

  function setConfig(config: ((prevConfig: object[]) => object[]) | object) {
    const prevConfig = [...formConf.children];
    if (zh.isFunction(config)) {
      const newConfig = config(prevConfig);
      newConfig && zh.fastDp.form.setItems({ id: containerId, items: newConfig });
    } else {
      let isUpdated = false;
      Object.keys(config).forEach((name) => {
        const item = prevConfig.find((item) => {
          const itemName = zh.isArray(item.name) ? item.name.join('.') : item.name;
          return itemName === name;
        });
        if (item) {
          Object.assign(item, config[name]);
          isUpdated = true;
        }
      });
      isUpdated && zh.fastDp.form.setItems({ id: containerId, items: prevConfig });
    }
  }

  function setConfigByName(name: string | string[], config: object) {
    const keys = zh.isArray(name) ? name : [name];
    setConfig(
      keys.reduce((p, c) => {
        p[c] = config;
        return p;
      }, {})
    );
  }
}

const common_props = new Set([
  'name',
  'label',
  // 'placeholder',
  'defaultValue',
  'required',
  'disabled',
  'colspan',
  'langKey'
]);

function filterProps(item) {
  let dp = Object.keys(item).reduce((acc: any, key) => {
    if (!common_props.has(key)) {
      acc[key] = item[key];
    }
    return acc;
  }, {});
  delete dp.inline;
  delete dp.style;
  delete dp.nameField;
  delete dp.extra;
  delete dp.dependencies;
  dp = { ...dp, ...dp.antProps };
  delete dp['antProps'];
  delete dp.customRule;
  delete dp.onlyRequiredStyle;
  delete dp.rules;
  delete dp.defaultValue;
  delete dp.valueType;
  delete dp.emptyValue;
  delete dp.xtype;
  delete dp.labelWidth;
  if (!dp.maxLength) {
    // 过滤无效设置，maxLength=0逻辑上应该是没有意义的
    delete dp.maxLength;
  }
  return dp;
}

const InnerFormLayout = compHoc<CompHocProps<formConfProps.FormLayout, FormInfo>>(LayConfWrap(FormLayoutComp), 'Form');

type InnerFormLayoutType = typeof InnerFormLayout;

interface InnerFormLayoutInterface extends InnerFormLayoutType {
  AntForm: typeof Form;
}

const FormLayout = InnerFormLayout as InnerFormLayoutInterface;

FormLayout.AntForm = Form;

registerComponent({ Form: InnerFormLayout });
