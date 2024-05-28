import {
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Image,
  Input,
  InputNumber,
  Password,
  Radio,
  RadioGroup,
  RangePicker,
  Select,
  Switch,
  TextArea,
  TimePicker
} from '../../baseComponent';
import {Button} from '../../functionalComponent';
import { anyProp, arrayProp, getSPT, numberProp, selectorPropTypes, strProp } from './basePropType';
import { Text } from './fromItem';
import { COMP_CONF } from './interface';

const GRoup = { instance: 'Group' };
//组件及属性配置;
export const Comp_Info: COMP_CONF = {
  FormPanel: GRoup,
  container: GRoup,
  Text: { instance: Text },
  CheckBoxGroup: {
    instance: Checkbox,
    props: {
      unCheckedValue: anyProp(false),
      checkedValue: anyProp(true),
      inputValue: anyProp(true),
      uncheckedValue: anyProp(false)
    }
  },
  Checkbox: {
    instance: Checkbox,
    props: {
      unCheckedValue: anyProp(false),
      checkedValue: anyProp(true),
      inputValue: anyProp(true),
      uncheckedValue: anyProp(false)
    }
  },
  Switch: {
    instance: Switch,
    props: {
      unCheckedValue: anyProp(false),
      checkedValue: anyProp(true),
      inputValue: anyProp(true),
      uncheckedValue: anyProp(false)
    }
  },
  CheckboxGroup: {
    instance: CheckboxGroup,
    props: {
      data: anyProp([])
    }
  },
  TextArea: {
    instance: TextArea,
    props: {
      placeholder: strProp(''),
      help: strProp(''),
      readOnly: getSPT(false, 'booleanData'),
      maxLength: numberProp(undefined),
      allowClear: selectorPropTypes.booleanProp,
      showCount: getSPT(false, 'booleanData'),
      autoSize: anyProp(false)
    }
  },
  Input: {
    instance: Input,
    props: {
      placeholder: strProp(''),
      help: strProp(''),
      autoComplete: strProp('off'),
      readOnly: getSPT(false, 'booleanData'),
      maxLength: numberProp(undefined),
      allowClear: selectorPropTypes.booleanProp
    },
    listener: {
      onChange: `function onChange(val,event){debugger; console.log("----",val,event)}`
    }
  },
  InputNumber: {
    instance: InputNumber,
    props: {
      precision: numberProp(0),
      readOnly: selectorPropTypes.booleanProp,
      min: numberProp(0),
      max: numberProp(undefined),
      step: numberProp(1)
    }
  },
  Select: {
    instance: Select,
    props: {
      data: arrayProp,
      valueField: strProp('value'),
      labelField: strProp('label'),
      mode: strProp(''),
      getPopupContainer: selectorPropTypes.booleanProp
    },
    children: 'Radio'
  },
  DatePicker: {
    instance: DatePicker,
    props: {
      getPopupContainer: selectorPropTypes.booleanProp
    }
  },
  RangePicker: {
    instance: RangePicker,
    props: {
      getPopupContainer: selectorPropTypes.booleanProp
    }
  },
  DateTimePicker: {
    instance: DatePicker,
    props: {
      showTime: getSPT(true, 'booleanData'),
      getPopupContainer: selectorPropTypes.booleanProp
    },
    defaultProps: {
      showTime: true
    }
  },
  TimePicker: {
    instance: TimePicker,
    props: {
      getPopupContainer: selectorPropTypes.booleanProp
    }
  },
  Password: { instance: Password },
  Button: { instance: Button, props: { children: strProp('') } },
  Image: { instance: Image },
  Radio: { instance: Radio },
  RadioGroup: { instance: RadioGroup }
};
