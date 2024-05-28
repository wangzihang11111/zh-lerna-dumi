import { SearchOutlined } from '@ant-design/icons';
import { Input as AntInput, InputNumber as AntInputNumber } from 'antd';
import type { InputProps, PasswordProps, SearchProps, TextAreaProps } from 'antd/es/input';
import type { InputNumberProps } from 'antd/es/input-number';
import useCursor from 'rc-input-number/es/hooks/useCursor';
import React from 'react';
import { Tooltip } from '../functionalComponent';
import { compHoc, getGlobalConfig, TypeExtends, zh, ZhComponent, useLayoutUpdateEffect } from '../util';

function precisionNum(num, precision) {
  if (!num) {
    return num ?? '';
  }
  if (zh.isNumber(precision)) {
    return Number(num).toFixed(precision);
  }
  return zh.numberPrecision(num);
}

function getInput(Comp, trigger = false) {
  return class extends ZhComponent {
    private parentEl: any = null;
    private inputEl: any = null;

    get editable() {
      return this.props?.editable ?? true;
    }

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
      this.setState({ value }, () => {
        this.props.onChange?.(value);
        cb?.(value);
      });
    }

    getValue() {
      return this.state.value;
    }

    onInputChange = (e) => {
      const currentValue = e && e.target ? e.target.value : e;
      let value = currentValue;
      if (Comp === AntInputNumber && !this.props.formatter && !this.props.parser) {
        const precision: any = this.getPrecision();
        const valueStr = currentValue && zh.isNumber(precision) ? currentValue.toFixed(precision) : currentValue;
        value = +valueStr;
        if (this.props.type === 'rate') {
          value = zh.isNumber(precision) ? +(+value / 100).toFixed(precision + 2) : zh.numberPrecision(+value / 100);
        }
        zh.isNumber(precision) &&
          Promise.resolve().then(() => {
            requestAnimationFrame(() => {
              if (this.inputEl) {
                const showValue = +(this.inputEl.value + ''); //.replace(/\$\s?|(,*)/g, '');
                if (showValue !== +valueStr) {
                  this.inputEl.value = valueStr;
                }
              }
            });
          });
      } else if (Comp !== AntInputNumber && this.props.parser) {
        value = this.props.parser(value);
      }
      if (this.props.hasOwnProperty('value')) {
        // 外部受控
        this.state.value = value;
        this.props.onChange?.(value);
      } else {
        this.setValue(value);
      }
      this.innerNotify([value], 'onChange').then();
    };

    /**
     * 过滤多余的属性
     * @param inputProps
     * @param type input类型
     */
    getInputProps = (inputProps, type) => {
      inputProps.allowClear = inputProps.allowClear ?? true;
      if (Comp === AntInputNumber) {
        delete inputProps.allowClear;
        inputProps.precision = this.getPrecision();
        if (['prc', 'amt', 'amount', 'qty', 'rate', 'percent'].includes(type)) {
          inputProps.controls = false;
        }
        if (!inputProps.disabled && ['prc', 'amt', 'amount', 'qty'].includes(type)) {
          inputProps.onFocus = () => {
            if (this.inputEl) {
              this.inputEl.value = this.getFormatValue(type);
            }
          };
          inputProps.onBlur = () => {
            setTimeout(() => {
              if (this.inputEl) {
                this.inputEl.value = zh.thousandNumber(this.getFormatValue(type));
              }
            });
          };
        }
      } else {
        delete inputProps.formatter;
        delete inputProps.parser;
        if (type) {
          inputProps.type = type;
        }
      }
      if (Comp === AntInput.Password) {
        if (inputProps.disabled) {
          inputProps.visibilityToggle = false;
        }
      }

      if (trigger) {
        delete inputProps.onTrigger;
        delete inputProps.editable;
      }
      if (inputProps.disabled) {
        delete inputProps.allowClear;
        inputProps.placeholder = '';
      }
      return inputProps;
    };

    elClick = (e) => {
      if (this.props.disabled) {
        return;
      }
      if (this.editable) {
        if (zh.closest(e.target, (el) => el.classList.contains('ant-input-suffix'))) {
          this.props.onTrigger?.(e);
        }
      } else {
        if (!zh.closest(e.target, (el) => el.classList.contains('ant-input-suffix'))) {
          this.props.onTrigger?.(e);
        }
      }
    };

    dbClick = (e) => {
      if (this.props.disabled) {
        return;
      }
      this.props.onTrigger?.(e);
    };

    getPrecision() {
      const { type, precision } = this.props;
      const defaultPrecision = undefined;
      if (
        ['percent', 'prc', 'amt', 'amount', 'qty', 'rate'].includes(type) &&
        zh.isNumber(getGlobalConfig().default.precision[type])
      ) {
        const p = getGlobalConfig().default.precision[type];
        if (type === 'rate') {
          return Math.max(0, p - 2);
        }
        return p;
      }
      if (
        !zh.isNullOrEmpty(precision) &&
        ['number', 'prc', 'amt', 'amount', 'qty', 'rate', 'percent'].includes(type)
      ) {
        const tmp = Number(precision);
        return zh.isNumber(tmp) ? (type === 'rate' ? Math.max(0, tmp - 2) : tmp) : defaultPrecision;
      }
      return defaultPrecision;
    }

    componentDidMount(): void {
      this.inputEl = this.outRef.current?.input || this.outRef.current;
      if (trigger) {
        this.parentEl = this.inputEl?.parentElement || this.inputEl || this.outRef.current;
        this.parentEl.addEventListener('click', this.elClick);
        if (this.editable && this.inputEl) {
          this.inputEl.addEventListener('dblclick', this.dbClick);
        }
      }
    }

    componentWillUnmount(): void {
      if (trigger) {
        this.parentEl?.removeEventListener('click', this.elClick);
        if (this.editable) {
          this.inputEl?.removeEventListener('dblclick', this.dbClick);
        }
      }
    }

    getTooltipRender = (title, tooltip) => () => {
      if (zh.isBoolean(tooltip)) {
        return title;
      } else if (zh.isFunction(tooltip)) {
        return tooltip(title);
      }
      return tooltip;
    };

    getFormatValue = (type) => {
      if (type === 'rate' && this.state.value) {
        return precisionNum(+this.state.value * 100, this.getPrecision());
      }
      if (['prc', 'amt', 'amount', 'qty'].includes(type) && !this.props.formatter && !this.props.parser) {
        return precisionNum(this.state.value, this.getPrecision());
      }
      return this.props.formatter && Comp !== AntInputNumber
        ? this.props.formatter(this.state.value || '')
        : this.state.value;
    };

    render() {
      const {
        value,
        onChange,
        suffix,
        style = {},
        editable,
        className,
        type = 'text',
        tooltip,
        observer,
        enterButton,
        id,
        ...inputProps
      } = this.props as any;
      const suffixIcon =
        suffix ||
        (trigger && !inputProps.disabled ? (
          <SearchOutlined
            style={{
              cursor: 'pointer',
              opacity: 0.45,
              fontSize: 14
            }}
          />
        ) : null);
      const formatValue = this.getFormatValue(type);
      const innerProps = this.getInputProps(inputProps, type);
      if (Comp === AntInput.Search && !enterButton && !inputProps.disabled) {
        innerProps.suffix = formatValue ? (
          <></>
        ) : (
          <SearchOutlined style={{ cursor: 'pointer', fontSize: 14, opacity: 0.45 }} />
        );
        innerProps.enterButton = null;
        innerProps.className = zh.classNames(className, `zh-${type}`, 'hidden-addon-icon', {
          'zh-trigger-input': trigger && editable === false
        });
      }
      const renderInput = ({ recordCursor }: any = {}) => (
        <Comp
          ref={this.outRef}
          className={zh.classNames(className, `zh-${type}`, { 'zh-trigger-input': trigger && editable === false })}
          value={formatValue}
          style={{ width: '100%', ...style }}
          suffix={suffixIcon}
          {...innerProps}
          onChange={(e) => {
            recordCursor?.();
            this.onInputChange(e);
          }}
        />
      );
      if ([AntInput].includes(Comp) && this.props.formatter) {
        return <InnerInput renderInput={renderInput} value={formatValue} ins={this} />;
      }
      return tooltip ? (
        <Tooltip title={this.getTooltipRender(formatValue || innerProps.placeholder, tooltip)}>{renderInput()}</Tooltip>
      ) : (
        renderInput()
      );
    }
  };
}

function InnerInput({ renderInput, value, ins }) {
  const { placeholder, tooltip, formatter } = ins.props;

  const [recordCursor, restoreCursor] = useCursor(ins.outRef.current?.input, true);

  useLayoutUpdateEffect(() => {
    formatter && value && restoreCursor();
  }, [value]);

  return tooltip ? (
    <Tooltip title={ins.getTooltipRender(value || placeholder, tooltip)}>{renderInput({ recordCursor })}</Tooltip>
  ) : (
    renderInput({ recordCursor })
  );
}

type TypeProps<T> = TypeExtends<
  T,
  { onChange?: (value: any) => void; tooltip?: true | string | ((value) => React.ReactNode) }
>;

export const Input = compHoc<
  TypeProps<InputProps & { formatter?: (value: string) => string; parser?: (formatValue: string) => string }>
>(getInput(AntInput));

// prc 是单价 amt是合价 qty是工程量，rate是百分比
export const InputNumber = compHoc<
  TypeProps<InputNumberProps & { type?: 'number' | 'amount' | 'percent' | 'prc' | 'amt' | 'qty' | 'rate' }>
>(getInput(AntInputNumber));
export const TextArea = compHoc<TypeProps<TextAreaProps>>(getInput(AntInput.TextArea));
export const Password = compHoc<TypeProps<PasswordProps>>(getInput(AntInput.Password));
export const Search = compHoc<TypeProps<SearchProps>>(getInput(AntInput.Search));

export const InputTrigger = compHoc<InputProps & { onTrigger?: Function; editable?: boolean }>(
  getInput(AntInput, true)
);
