import { Radio as AntRadio } from 'antd';
import { RadioGroupProps, RadioProps } from 'antd/es/radio/interface';
import { compHoc, CompHocOption, ZhComponent, TypeExtends } from '../util';

export const Radio = compHoc<RadioProps>(AntRadio);

type TypeProps<T> = TypeExtends<T, { onChange?: (value: any) => void }>;

const RadioGroupComp = compHoc<TypeProps<RadioGroupProps>>(
  class extends ZhComponent {
    constructor(props) {
      super(props);
      this.state.value = props.defaultValue;
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      return ZhComponent.propsToState(nextProps, prevState, ['value']);
    }

    setValue(value, cb?) {
      if (this.state.value === value) {
        return;
      }
      this.setState(
        (prev) => ({ ...prev, value }),
        () => {
          this.props.onChange && this.props.onChange(value);
          cb && cb(value);
        }
      );
    }

    getValue() {
      return this.state.value;
    }

    onRadioChange = (e) => {
      const value = e && e.target ? e.target.value : e;
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
      const { data, value, options, onChange, observer, ...others } = this.props;
      return (
        <AntRadio.Group
          options={options || data}
          ref={this.outRef}
          {...others}
          value={this.state.value}
          onChange={this.onRadioChange}
        />
      );
    }
  }
);

const RadioGroup = RadioGroupComp as CompHocOption<typeof RadioGroupComp, typeof AntRadio.Button>;
RadioGroup.Option = AntRadio.Button;

export { RadioGroup };
