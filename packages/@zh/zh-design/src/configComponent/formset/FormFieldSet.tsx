import { useState } from 'react';
import { Panel } from '../../functionalComponent';
import { compHoc, registerComponent, zh } from '../../util';
import { getComp, LayConfWrap } from '../common';
import { formConfProps } from '../config/interface';
import { CompHocProps } from '../props.dt';
import { FormFieldSetInfo, FormFieldSetPropsInfo } from './interface';

export function FormFieldSet(props: FormFieldSetPropsInfo) {
  const {
    title,
    collapsible = true,
    formConf = {},
    style: formFieldStyle,
    className: formFieldClassName,
    collapse: defaultCollapse,
    formSetRef,
    panelProps,
    outRef
  } = props;

  const [collapsed, setCollapsed] = useState(
    defaultCollapse !== undefined ? defaultCollapse : formConf.collapse !== undefined ? formConf.collapse : false
  );

  const defaultTitle = zh.getPageLang()[formConf.langKey] ?? title ?? formConf.label;

  const Comp = getComp({
    xtype: formConf.xtype === 'fieldset' || !formConf.xtype ? 'Form' : formConf.xtype
  }).instance;

  return (
    <Panel
      className={zh.classNames('zh-form-set', formFieldClassName)}
      title={defaultTitle}
      collapsible={collapsible}
      open={!collapsed}
      onOpenChange={() => setCollapsed(!collapsed)}
      style={formFieldStyle}
      {...panelProps}
    >
      <div className="content">
        {props.children ? (
          props.children
        ) : (
          <Comp {...props} ref={outRef} config={formConf} formSetRef={formSetRef || outRef} titleProps={undefined} />
        )}
      </div>
    </Panel>
  );
}

const FormFieldSetCom = compHoc<CompHocProps<formConfProps.FormFieldSet, FormFieldSetInfo>>(
  LayConfWrap(FormFieldSet),
  'FormFieldSet'
);
export default FormFieldSetCom;

registerComponent({ FormFieldSet });
