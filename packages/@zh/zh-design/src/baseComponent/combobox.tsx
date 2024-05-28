import { AutoComplete } from 'antd';
import { AutoCompleteProps } from 'antd/es/auto-complete';
import { compHoc, TypeExtends, zh, ZhComponent } from '../util';

type TypeProps<T> = TypeExtends<
  T,
  {
    onChange?: (value: any) => void;
  }
>;

export const Combobox = compHoc<TypeProps<AutoCompleteProps>>(
  class extends ZhComponent {
    constructor(props) {
      super(props);
      this.state.value = props.defaultValue;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      return ZhComponent.propsToState(nextProps, prevState, ['value']);
    }

    setValue(val, cb?) {
      if (this.state.value === val) {
        return;
      }
      const value = this.labelInValue(val);
      this.setState(
        (prev) => ({ ...prev, value }),
        () => {
          this.props.onChange && this.props.onChange(value);
          cb && cb(value);
        }
      );
    }

    getValue() {
      const v = this.state.value;
      if (v?.value === undefined) {
        return v;
      }
      return v.value;
    }

    getRawValue() {
      return this.labelInValue(this.state.value);
    }

    getText() {
      return this.getRawValue()?.label;
    }

    labelInValue(val) {
      if (zh.isNullOrEmpty(val)) {
        return undefined;
      }
      const value = val.value ?? val;
      return this.props.options.find((o) => o.value === value) ?? { value, label: value };
    }

    onHandlerChange = (e) => {
      const value = this.labelInValue(e);
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
      const { value, onChange, showSearch, observer, ...others } = this.props;
      return (
        <AutoComplete
          ref={this.outRef}
          {...others}
          filterOption={(inputValue, option) => {
            if (zh.isString(option?.label)) {
              return option?.label.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1;
            }
            return false;
          }}
          showSearch={false}
          value={this.getText()}
          onChange={this.onHandlerChange}
        />
      );
    }
  },
  'Combobox'
);
