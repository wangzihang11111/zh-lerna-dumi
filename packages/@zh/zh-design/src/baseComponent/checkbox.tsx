import { Checkbox as AntCheckbox, Switch as AntSwitch } from 'antd';
import { CheckboxGroupProps, CheckboxOptionType, CheckboxProps } from 'antd/es/checkbox';
import { SwitchProps } from 'antd/es/switch';
import { compHoc, zh, ZhComponent, TypeExtends } from '../util';

export interface ICheckboxExtraProps {
  checkedValue?: any;
  unCheckedValue?: any;
  value?: any;
  onChange?: (value: any) => void;
}

function getComp(Comp) {
  return class extends ZhComponent {
    constructor(props) {
      super(props);
      this.state.value = props.defaultChecked;
      this.state.loading = false;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      return ZhComponent.propsToState(nextProps, prevState, ['checked|value', 'value']);
    }

    async _propOnChangeHandler(value, lastValue = undefined) {
      const isSwitch = Comp === Switch;
      const p = this.props.onChange?.(value);
      let ret = true;
      if (zh.isPromise(p)) {
        try {
          isSwitch && this.setState({ loading: true });
          ret = await p;
        } catch (e) {
          console.log(e);
        } finally {
          isSwitch && this.setState({ loading: false });
        }
      } else {
        ret = p;
      }
      if (ret === false && lastValue !== undefined) {
        this.state.value = lastValue;
      }
      return ret;
    }

    setValue(value, cb?) {
      if (this.state.value === value) {
        return;
      }
      this.setState(
        (prev) => ({ ...prev, value }),
        () => {
          this._propOnChangeHandler(value).then();
          cb && cb(value);
        }
      );
    }

    getValue() {
      return this.state.value;
    }

    onCompChange = (e) => {
      const { checkedValue = 1, unCheckedValue = 0 } = this.props;
      const value = e.target?.checked ?? e ? checkedValue : unCheckedValue;
      if (this.props.hasOwnProperty('checked') || this.props.hasOwnProperty('value')) {
        // 外部受控
        const lastValue = this.state.value;
        this.state.value = value;
        this._propOnChangeHandler(value, lastValue).then((r) => {
          if (r === false) {
            this.state.value = lastValue;
          }
        });
      } else {
        this.setValue(value);
      }
      this.innerNotify([value], 'onChange').then();
    };

    render() {
      const {
        defaultChecked,
        checked,
        value,
        bordered, // 表单元素公有属性，checkbox没有，需要过滤，否则antd会报警告
        onChange,
        checkedValue = 1,
        unCheckedValue = 0,
        observer,
        ...others
      } = this.props;

      const newProps: any = { ...others };

      if (Comp === Switch && this.state.hasOwnProperty('loading')) {
        newProps.loading = this.state.loading;
      }

      return (
        <Comp
          ref={this.outRef}
          checked={this.state.value === checkedValue}
          {...newProps}
          onChange={this.onCompChange}
        />
      );
    }
  };
}

type TypeProps<T> = TypeExtends<T, ICheckboxExtraProps>;

export const Checkbox = compHoc<TypeProps<CheckboxProps>>(getComp(AntCheckbox), 'Checkbox');
export const Switch = compHoc<TypeProps<SwitchProps>>(getComp(AntSwitch), 'Switch');

export const CheckboxGroup = compHoc<CheckboxGroupProps & { data?: Array<CheckboxOptionType> }>(
  class extends ZhComponent {
    constructor(props) {
      super(props);
      this.state.value = props.defaultValue;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      return ZhComponent.propsToState(nextProps, prevState, ['value']);
    }

    setValue(value) {
      this.setState(
        (prev) => ({ ...prev, value }),
        () => {
          this.props.onChange && this.props.onChange(value);
        }
      );
    }

    getValue() {
      return this.state.value;
    }

    onCheckBoxChange = (value) => {
      if (this.props.hasOwnProperty('value')) {
        // 外部受控
        this.state.value = value;
        this.props.onChange && this.props.onChange(value);
      } else {
        this.setValue(value);
      }
      this.innerNotify([value], 'onChange').then();
    };

    render() {
      const {
        bordered, // 表单元素公有属性，checkbox没有，需要过滤，否则antd会报警告
        defaultValue,
        data,
        options,
        value,
        onChange,
        observer,
        ...others
      } = this.props;
      return (
        <AntCheckbox.Group
          options={options || data}
          value={this.state.value}
          {...others}
          onChange={this.onCheckBoxChange}
        />
      );
    }
  },
  'CheckboxGroup'
);
