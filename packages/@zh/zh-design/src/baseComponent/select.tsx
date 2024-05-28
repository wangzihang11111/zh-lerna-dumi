import { Select as AntSelect } from 'antd';
import { SelectProps } from 'antd/es/select';
import React from 'react';
import { Tooltip } from '../functionalComponent';
import { compHoc, PromiseType, TypeExtends, zh, ZhComponent } from '../util';
import { Combobox } from './combobox';

type TypeProps<T> = TypeExtends<
  T,
  {
    multiple?: boolean;
    /**
     * @description       自定义tooltip
     */
    tooltip?: string | ((value) => PromiseType<React.ReactNode>);
    allowNull?: boolean; // 允许value为null
    fitHeight?: boolean;
    data?: Array<any>;
    valueField?: string;
    labelField?: string;
    onChange?: (value: any) => void;
    request?: (params: any) => Promise<any>; // 数据请求，返回promise对象
  }
>;

const SelectComp = compHoc<TypeProps<SelectProps>>(
  class extends ZhComponent {
    private _cancel: any = false;

    private _getLabel(value, data?) {
      const { valueField = 'value', labelField = 'label' } = this.props;
      const options: any = data || this.props.options || this.state?.data;
      const label = options?.find((option) => option[valueField] == value)?.[labelField];
      if (zh.isNullOrEmpty(label, '')) {
        const ps: any = (this.props.children as any)?.find(({ props }) => props.value == value)?.props || {};
        return ps[labelField] ?? ps.children;
      }
      return label;
    }

    private _updateLabelInValue(value, data?) {
      if (this.props.labelInValue === false) {
        return value;
      }
      const options: any = data || this.props.options || this.state?.data;
      const labelInValue: any = zh.isObject(value) ? { ...value } : { value };
      const { valueField = 'value' } = this.props;
      labelInValue.label =
        this._getLabel(labelInValue.value, data) ??
        (labelInValue.hasOwnProperty('label') ? labelInValue.label : labelInValue.value);
      if (options && !labelInValue.origin) {
        labelInValue.origin = { ...options.find((option) => option[valueField] == value) };
      }
      if (labelInValue.value === undefined || (!this.props.allowNull && labelInValue.value === null)) {
        return undefined;
      }
      return labelInValue;
    }

    private formatValue(value, data?) {
      const multiple = this.isMultiple();

      if (multiple && !zh.isArray(value)) {
        value = zh.isNullOrEmpty(value) ? [] : [value];
      }

      return multiple
        ? value?.map((v) => this._updateLabelInValue(v, data)).filter((f) => f !== undefined)
        : this._updateLabelInValue(value, data);
    }

    isMultiple() {
      return this.props.multiple || this.props.mode === 'multiple';
    }

    constructor(props) {
      super(props);
      this.state = {
        data: zh.isArray(props.data) ? props.data : undefined,
        request: props.request,
        loading: !!props.request,
        value: props.defaultValue
      };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      if (zh.isArray(nextProps.data)) {
        return ZhComponent.propsToState(nextProps, prevState, ['value', 'data']);
      }
      return ZhComponent.propsToState(nextProps, prevState, ['value']);
    }

    componentDidMount(): void {
      if (this.state.request) {
        this.requestData().then();
      }
    }

    componentDidUpdate(prevProps: Readonly<any>): void {
      if (prevProps.request !== this.props.request && this.props.request) {
        this.requestData().then();
      }
    }

    async requestData(params: any = {}) {
      const { request } = this.props;
      this.setState({ loading: true });
      const res = await request(params);
      if (!this._cancel) {
        this.setData(zh.parseJson(res));
      }
    }

    setData(data: any) {
      if (data !== this.state.data) {
        const value = this.formatValue(this.state.value, data);
        this.setState({ data, value, loading: false }, () => {
          this.props.onChange && this.props.onChange(value, data);
        });
      } else if (this.state.loading) {
        this.setState({ loading: false });
      }
    }

    componentWillUnmount(): void {
      this._cancel = true;
    }

    setValue(val, option?, cb?) {
      const value = this.formatValue(val);
      this.setState(
        (prev) => ({
          ...prev,
          value
        }),
        () => {
          this.props.onChange && this.props.onChange(value, option);
          cb && cb(value, option);
        }
      );
    }

    getValue(joinStr?: string) {
      const value = this.formatValue(this.state.value);
      const val = (v: any) => {
        if (v?.value === undefined) {
          return v;
        }
        return v.value;
      };
      if (this.isMultiple()) {
        const tmp = value?.map(val);
        return joinStr ? tmp.join(joinStr) : tmp;
      }
      return val(value);
    }

    getRawValue() {
      return this.formatValue(this.state.value);
    }

    getOrigin() {
      if (!this.state.value) {
        return undefined;
      }
      if (this.isMultiple()) {
        const originArr: any = [];
        this.state.value.forEach?.((item) => {
          if (item && item.hasOwnProperty('value')) {
            item.origin && originArr.push(item.origin);
          }
        });
        return originArr;
      }
      return this.state.value.origin;
    }

    getText(joinStr?: string) {
      const value = this.formatValue(this.state.value);
      if (this.isMultiple()) {
        const tmp = value?.map((v: any) => (zh.isObject(v) ? v.label || this._getLabel(v.value) : this._getLabel(v)));
        return joinStr ? tmp.join(joinStr) : tmp;
      }
      return value?.label ?? this._getLabel(this.getValue());
    }

    onSelectChange = (value, option) => {
      if (this.props.labelInValue !== false) {
        if (zh.isArray(value)) {
          value.forEach((v, index) => {
            if (!v.origin) {
              v.origin = { ...(option?.[index]?.['data-origin'] || option?.[index] || v) };
            }
          });
        } else if (value) {
          if (!value.origin) {
            value.origin = { ...(option?.['data-origin'] || option || value) };
          }
        }
      }
      if (this.props.hasOwnProperty('value')) {
        // 外部受控
        this.state.value = this.formatValue(value);
        this.props.onChange && this.props.onChange(value, option);
      } else {
        this.setValue(value, option);
      }
      this.innerNotify([value], 'onChange').then();
    };

    getTooltipRender = (value, tooltip) => () => {
      if (zh.isFunction(tooltip)) {
        return tooltip(value);
      }
      return tooltip;
    };

    render() {
      const {
        request,
        value,
        open,
        options,
        allowClear = true,
        allowNull,
        labelInValue = true,
        labelField = 'label',
        valueField = 'value',
        fitHeight = false,
        tooltip,
        multiple,
        data: propsData,
        observer,
        ...others
      } = this.props;
      const { loading, data } = this.state;
      const prop: any = { value: this.formatValue(this.state.value, data) };
      if (fitHeight) {
        prop.className = zh.classNames(others.className, 'fit-height');
      }
      if (open !== undefined) {
        prop.open = loading ? false : open;
      }
      if (allowClear !== undefined) {
        prop.allowClear = loading ? false : allowClear;
      }
      if (multiple) {
        prop.mode = 'multiple';
      }
      if (others.disabled) {
        prop.suffixIcon = null;
        prop.allowClear = false;
        prop.placeholder = '';
        // 不可编辑状态下，允许复制文本
        if (!others.onMouseDownCapture) {
          prop.onMouseDownCapture = (e) => e.stopPropagation();
        }
      }
      // 禁用默认title，后面有更好的方案或者等antd支持以后替换
      if (tooltip) {
        prop.className = zh.classNames(others.className, 'disable-title');
      }
      const renderSelect = () => {
        const dataOptions = loading ? [] : data;
        return dataOptions ? (
          <AntSelect
            ref={this.outRef}
            labelInValue={labelInValue}
            loading={loading}
            {...others}
            {...prop}
            dropdownStyle={{ display: loading ? 'none' : '' }}
            onChange={this.onSelectChange}
          >
            {dataOptions.map((item) => {
              const value = item[valueField];
              const label = item[labelField];
              return (
                <AntSelect.Option data-origin={item} key={value} value={value} label={label} disabled={!!item.disabled}>
                  {label}
                </AntSelect.Option>
              );
            })}
          </AntSelect>
        ) : (
          <AntSelect
            ref={this.outRef}
            labelInValue={labelInValue}
            options={options}
            {...others}
            {...prop}
            onChange={this.onSelectChange}
          />
        );
      };
      return tooltip ? (
        <Tooltip title={this.getTooltipRender(prop.value, tooltip)} titleDep={prop.value}>
          {renderSelect()}
        </Tooltip>
      ) : (
        renderSelect()
      );
    }
  },
  'Select'
);

type OptionType = typeof AntSelect.Option;

export class Select extends React.Component<TypeProps<SelectProps> & { editable?: boolean }> {
  static Option: OptionType = AntSelect.Option;
  outRef = React.createRef<any>();

  getApi() {
    return this.outRef.current?.getApi();
  }

  setReadOnly(...args) {
    this.getApi()?.setReadOnly?.(...args);
  }

  on(...args) {
    this.getApi()?.on?.(...args);
  }

  render() {
    const { editable = false, id, displayField, ...others } = this.props as any;
    let ds = others.options || others.data;
    if (editable && ds) {
      const {
        options,
        data,
        multiple,
        request,
        mode,
        valueField = 'value',
        labelField = 'label',
        fitHeight,
        allowNull,
        labelInValue,
        ...cbProps
      } = others;
      if (valueField !== 'value' || labelField !== 'label') {
        ds = ds.map((d) => ({ value: d[valueField], label: d[labelField] }));
      }
      return <Combobox {...cbProps} options={ds} ref={this.outRef} />;
    }
    return <SelectComp {...others} ref={this.outRef} />;
  }
}
