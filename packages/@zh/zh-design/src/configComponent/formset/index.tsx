import { useMemo } from 'react';
import { compHoc, history, registerComponent, zh, useExtendRef } from '../../util';
import { fomatValues, getSubscribeFn, LayConfWrap } from '../common';
import { formConfProps } from '../config/interface';
import { CompHocProps } from '../props.dt';
import { FormFieldSet as DefaultComp } from './FormFieldSet';
import { FormSetInfo, FormSetPropsInfo } from './interface';

export { default as FormFieldSet } from './FormFieldSet';
export type { FormFieldSetInfo, FormSetInfo } from './interface';

export function FormSetComp(props: FormSetPropsInfo) {
  const {
    formConf = [],
    opt,
    defaultValue: dv,
    value,
    initSc = {},
    outRef,
    busKey,
    onValuesChange,
    style: formSetStyle,
    className: formSetClassName,
    rules,
    collapsible,
    collapse: defaultCollapse //展开
  } = props as any;
  const defaultValue = useMemo(() => {
    return value || dv || {};
  }, [value, dv]);
  const s = Array.isArray(formConf) ? formConf : formConf.children || formConf.fieldSets;
  const { query }: any = history.location;
  const optType = opt || query.opt;
  const defaultCollapsible = collapsible ?? (formConf as any).collapsible ?? true;
  const collapse = defaultCollapse !== undefined ? defaultCollapse : formConf.collapse;

  function getFormatValues() {
    const id = busKey || 'id';
    const opt = optType || defaultValue?.[id] ? 'modifiedRow' : 'newRow';
    let g = fomatValues('COMMON_KEY', 'form', opt, id)(defaultValue);
    s.forEach((item: any, index) => {
      g = g(getData(item.name || item.itemId || `fieldset${index + 1}`, 'getValues', false));
    });
    return g()['COMMON_KEY'];
  }

  function getValues() {
    let v = {};
    s.forEach((item: any) => {
      v = { ...v, ...getData(item.name || item.itemId, 'getValues', false) };
    });
    return { ...defaultValue, ...v };
  }

  function mergeHandler(v: any) {
    s.forEach((item: any, index) => {
      const key = item.name || item.itemId || `fieldset${index + 1}`;
      const t = zh.getCmp(key);
      t && t.getApi().mergeHandler(v[key]);
    });
  }

  useExtendRef(outRef, {
    mergeHandler,
    getValues,
    getFormatValues,
    validateForm,
    isValid,
    validData: isValid,
    getItem: (name: string) => {
      for (let i = 0; i < s.length; i++) {
        const t = zh.getCmpApi(s[i].name || s[i].itemId || `fieldset${i + 1}`)?.getItem?.(name);
        if (t) return t;
      }
    },
    isChanged() {
      return s.some((item, index) => zh.getCmpApi(item.name || item.itemId || `fieldset${index + 1}`)?.isChanged());
    },
    getConfig: () => formConf,
    getForm: (key: string) => zh.getCmp(key)?.getApi(),
    subscribe: getSubscribeFn(outRef)
  });

  function validateForm() {
    return Promise.all(
      s.map((item: any, index) => getData(item.name || item.itemId || `fieldset${index + 1}`, 'validateForm'))
    );
  }

  function isValid() {
    return Promise.all(
      s.map((item: any, index) => getData(item.name || item.itemId || `fieldset${index + 1}`, 'isValid'))
    ).then((result) => {
      return result.every((r) => r === true);
    });
  }

  const defaultConfig: any = useMemo(() => {
    const cfg = { ...(Array.isArray(formConf) ? {} : formConf) };
    delete cfg.children;
    delete cfg.fieldSets;
    return cfg;
  }, [formConf]);

  const containerId = `${props.id || props['data-cid'] || defaultConfig.name || 'formset'}`;

  return (
    <div className={zh.classNames('formSetContainer', formSetClassName)} style={formSetStyle}>
      {s &&
        s.map((item, index) => {
          const name = item.name || item.itemId || `fieldset${index + 1}`;
          if (!item.children) {
            item.children = item.allfields;
          }
          return item.hidden ? null : (
            <ItemRender
              defaultConfig={defaultConfig}
              item={item}
              title={item.title ?? item.label ?? item.desTitle}
              initSc={initSc[name]}
              id={name}
              cid={containerId}
              key={name}
              formSetRef={outRef}
              colspan={item.colspan || props.colspan}
              compact={item.compact || props.compact}
              layout={item.layout || props.layout || 'horizontal'}
              opt={optType}
              rules={rules}
              panelProps={{ ...props.panelProps, ...item.panelProps }}
              formStyle={{ ...props.formStyle, ...item.formStyle }}
              size={item.size || props.size}
              disabled={props.disabled}
              collapsible={item.collapsible ?? (defaultCollapsible && (item.title || item.title))}
              collapse={typeof collapse === 'boolean' ? collapse : collapse?.[name]}
              value={defaultValue}
              onValuesChange={onValuesChange}
            />
          );
        })}
    </div>
  );
}

function ItemRender({ item, defaultConfig, ...others }) {
  const cfg = useMemo(() => ({ ...defaultConfig, ...item }), [defaultConfig, item]);
  return <DefaultComp formConf={cfg} {...others} />;
}

function getData(id: string, key: string, ...args) {
  const t = zh.getCmp(id).getApi();
  return (t && t[key](...args)) || {};
}

const FormSet = compHoc<CompHocProps<formConfProps.FormSet, FormSetInfo>>(LayConfWrap(FormSetComp), 'FormSet');

export default FormSet;

registerComponent({ FormSet });
