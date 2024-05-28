import { getRegisterComponentWithProps } from '../util';

// type xtype 转换
const xtypeRef = {
  SingleHelp: {
    xtype: 'help',
    type: 'SingleHelp'
  },
  MultipleHelp: {
    xtype: 'help',
    type: 'MultipleHelp',
    multiple: true
  },
  OrgHelp: {
    xtype: 'help',
    type: 'OrgHelp'
  },
  UserHelp: {
    xtype: 'help',
    type: 'UserHelp'
  }
};

export function createEditorProps(editor) {
  let others: any = { ...editor };
  if (['help'].includes(editor.type?.toLowerCase?.()) && editor.xtype) {
    others = { xtype: 'help', type: editor.xtype };
  }

  const xType = others.xtype?.toLowerCase?.();
  if (xtypeRef[xType]) {
    return { ...others, ...xtypeRef[xType] };
  }

  if (['help'].includes(xType)) {
    const [cmp, defaultProps] = getRegisterComponentWithProps(others.type);
    if (cmp) {
      return { ...defaultProps, ...others, xtype: 'help' };
    }
    return { ...others, xtype: 'help' };
  } else {
    const [cmp, defaultProps, extendObj] = getRegisterComponentWithProps(xType);
    if (extendObj?.isHelp) {
      return {
        ...defaultProps,
        ...others,
        xtype: 'help',
        type: xType
      };
    }
  }

  return others;
}
