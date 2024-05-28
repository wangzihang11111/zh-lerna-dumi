import { Input, InputNumber, Select } from '../../baseComponent';
import { ComponentClass, FunctionComponent } from 'react';

export const strProp = (dv: string, writeable?: boolean, cnLabel?) => ({
  type: 'string',
  defaultValue: dv,
  editor: Input,
  writeable: writeable === undefined ? true : !!writeable,
  cnLabel: cnLabel //属性汉化名称
});

export const numberProp = (dv: number | any, writeable?: boolean, cnLabel?) => ({
  type: 'number',
  defaultValue: dv,
  editor: InputNumber,
  writeable: writeable === undefined ? true : !!writeable,
  cnLabel: cnLabel
});

export const arrayProp = {
  type: 'array',
  defaultValue: [{ value: 'test', label: 'sxxxx' }],
  editor: Input,
  writeable: true
};

export const anyProp = (dv: any, w = true, editor = Input) => ({
  type: 'any',
  defaultValue: dv,
  editor: editor,
  writeable: w
});

export const customProp = (dv: any, editor: ComponentClass | FunctionComponent, writeable?: boolean) => ({
  type: 'any',
  defaultValue: dv,
  editor: editor,
  writeable: writeable === undefined ? true : !!writeable
});

type selectData = Array<{ value: boolean | string; label: string }>;
const wrapSelector = (data: selectData) => (props: any) => {
  const { onChange } = props;
  function handleChange(evt: any) {
    onChange && onChange(evt.value, evt);
  }
  return <Select {...props} value={{ value: props.value }} data={data || []} onChange={handleChange} />;
};

export const selectorProp = (dv: any, data: selectData, writeable?: boolean, cnLabel?: string) => ({
  type: 'any',
  defaultValue: dv,
  editor: wrapSelector(data),
  writeable: writeable === undefined ? true : !!writeable,
  cnLabel: cnLabel
});

const boolData = [
  { value: true, label: 'true' },
  { value: false, label: 'false' }
];
const textAlignData = [
  { value: 'left', label: '左' },
  { value: 'center', label: '中' },
  { value: 'right', label: '右' }
];
const xtypeData = ['ngText', 'ngNumber', 'ngComboBox', 'Checkbox', 'SelectPicker', 'ngDate', 'ngDateTime'].map(
  (key: any) => ({
    value: key,
    label: key
  })
);

export const selectorPropTypes = {
  booleanProp: selectorProp(false, boolData, true),
  textAlignProp: selectorProp('left', textAlignData, true),
  xtypeProp: selectorProp('ngText', xtypeData, true)
};

const tData = {
  booleanData: boolData,
  textAlignData: textAlignData,
  xtypeData: xtypeData
};

export function getSPT(
  dv: any,
  type: 'booleanData' | 'textAlignData' | 'xtypeData',
  writeable?: boolean,
  cnLabel?: string
) {
  return selectorProp(dv, tData[type] || boolData, writeable, cnLabel);
}
