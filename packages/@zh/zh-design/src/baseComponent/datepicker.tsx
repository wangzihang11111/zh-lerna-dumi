import React from 'react';
import ReactDOM from 'react-dom';
import { compHoc, TypeExtends, zh, ZhComponent } from '../util';

import generatePicker, { PickerProps, PickerTimeProps, RangePickerProps } from 'antd/es/date-picker/generatePicker';
import 'antd/es/date-picker/style/index';
import toDayJs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import generateConfig from 'rc-picker/es/generate/dayjs';

toDayJs.locale('zh-cn');

interface TimePickerProps extends Omit<PickerTimeProps<Dayjs | string>, 'picker'> {}

const AntDatePicker: any = generatePicker<Dayjs>(generateConfig);
const AntTimePicker = React.forwardRef<any, TimePickerProps>((props, ref) => {
  return <AntDatePicker {...props} picker="time" mode={undefined} ref={ref} />;
});

AntTimePicker.displayName = 'TimePicker';

const pickerFormat = {
  date: 'YYYY-MM-DD',
  year: 'YYYY',
  quarter: 'YYYY-[Q]Q',
  month: 'YYYY-MM',
  week: 'YYYY-wo'
};

const getFormat = (props, defaultFormat, type) => {
  const showTime = props.showTime ?? type === 'datetime';
  return (
    props.format ||
    pickerFormat[props.picker] ||
    (showTime ? 'YYYY-MM-DD ' + (showTime.format || 'HH:mm:ss') : '') ||
    defaultFormat
  );
};

function setCurrent(current, format, offset) {
  const f = ['Y', 'M', 'D', 'H', 'm', 's'];
  const pos = zh.getCursorPosition();
  const dw = {
    l: format[pos - 1],
    c: format[pos],
    r: format[pos + 1]
  };
  const flag = f.includes(dw.l) ? dw.l : f.includes(dw.c) ? dw.c : dw.r;
  if (current) {
    switch (flag) {
      case 'Y':
        current.setFullYear(current.getFullYear() + offset);
        break;
      case 'M':
        current.setMonth(current.getMonth() + offset);
        break;
      case 'D':
        current.setDate(current.getDate() + offset);
        break;
      case 'H':
        current.setHours(current.getHours() + offset);
        break;
      case 'm':
        current.setMinutes(current.getMinutes() + offset);
        break;
      case 's':
        current.setMilliseconds(current.getMilliseconds() + offset);
        break;
    }
  }
  const match = format.match(new RegExp(flag + '+'));
  return match ? [format.indexOf(match[0]), match[0].length] : [pos, 0];
}

function getDatePicker(Comp, type = '', dFormat = 'YYYY-MM-DD') {
  return class extends ZhComponent {
    private pos: number = -1;
    private input: any;

    constructor(props) {
      super(props);
      const defaultFormat = getFormat(props, dFormat, type);
      this.state = {
        props,
        open: props.defaultOpen || props.open,
        defaultFormat,
        value: this.getDayJs(props.value ?? props.defaultValue, defaultFormat)
      };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      const { value, format, picker, showTime, open } = nextProps;
      // 当传入的value发生变化的时候，更新state, 这个props可以被当做缓存，仅用作判断
      const newState: any = {};
      if (open !== prevState.props.open) {
        newState.open = open;
        newState.props = nextProps;
      }
      if (value !== prevState.props.value) {
        newState.value = value;
        newState.props = nextProps;
      }
      if (
        format !== prevState.props.format ||
        picker !== prevState.props.picker ||
        showTime !== prevState.props.showTime
      ) {
        newState.defaultFormat = getFormat(nextProps, dFormat, type);
        newState.props = nextProps;
      }
      return newState.props ? newState : null;
    }

    getShowTime() {
      return this.props.showTime ?? type === 'datetime';
    }

    setValue(value, cb?) {
      if (this.state.value === value) {
        return;
      }
      value = this.getDayJs(value);
      if (value && (zh.isArray(value) ? value.some((v) => !v.isValid()) : !value.isValid())) {
        return;
      }

      const newValue = value || null;
      this.setState({ value: newValue }, () => {
        this.props.onChange && this.props.onChange(this.getValue());
        cb && cb(newValue);
      });
    }

    getValue() {
      const value = this.getDayJs(this.state.value);
      if (!value) {
        return null;
      }
      return type === 'range'
        ? value.map((val) => (val ? val.format(this.state.defaultFormat) : null))
        : value.format(this.state.defaultFormat);
    }

    getRawValue() {
      return this.getDayJs(this.state.value || null);
    }

    isOpened() {
      return !!this.state.open;
    }

    onDatePickerChange = (value) => {
      if (this.props.hasOwnProperty('value')) {
        // 外部受控
        this.state.value = this.getDayJs(value);
        this.props.onChange && this.props.onChange(this.getValue());
      } else {
        this.setValue(value);
      }
      this.innerNotify([value], 'onChange').then();
    };

    getDayJs(value: any, defaultFormat?) {
      if (zh.isArray(value)) {
        return value.map((v) => this.getDayJs(v));
      }
      if (zh.isDate(value)) {
        return toDayJs(value);
      }
      return !value || toDayJs.isDayjs(value) ? value : toDayJs(value, defaultFormat || this.state.defaultFormat);
    }

    _onKeyDown = (e: any) => {
      if (this.isOpened()) {
        if (e.keyCode === 38 || e.keyCode === 40) {
          // 支持上下键
          const val = this.getRawValue();
          if (!val) {
            this.setValue(new Date());
          } else {
            const current = val.toDate();
            setCurrent(current, this.state.defaultFormat, e.keyCode - 39);
            this.pos = zh.getCursorPosition();
            this.setValue(current);
          }
          e.preventDefault();
        }
      }
    };

    componentDidMount(): void {
      if (type !== 'range') {
        const domNode: any = ReactDOM.findDOMNode(this);
        this.input = domNode?.querySelector('input');
        this.input?.addEventListener('keydown', this._onKeyDown);
      }
    }

    componentWillUnmount(): void {
      this.input?.removeEventListener('keydown', this._onKeyDown);
    }

    shouldComponentUpdate(nextProps: Readonly<any>, nextState: Readonly<any>, nextContext: any): boolean {
      return super.shouldComponentUpdate(nextProps, nextState, nextContext);
    }

    componentDidUpdate(): void {
      if (this.pos >= 0) {
        if (document.activeElement !== this.input) {
          return;
        }
        requestAnimationFrame(() => {
          zh.setCursorPosition(this.input, this.pos);
          this.pos = -1;
        });
      }
    }

    onOpenChange = (open: boolean) => {
      if (!this.props.hasOwnProperty('open')) {
        this.setState({ open });
      }
      this.props.onOpenChange?.(open);

      // 明明可以单击选择，有人就是要双击，导致事件穿透，触发了弹窗下组件的点击事件，测试觉得这是个bug，临时这样处理
      const targetEl = window.event?.target as any;
      if (!open && !this.getShowTime() && targetEl) {
        if (targetEl?.className?.indexOf?.('ant-picker-') === 0) {
          // 如果是点击单元格
          document.body.style.pointerEvents = 'none';
          setTimeout(() => {
            document.body.style.pointerEvents = '';
          }, 250);
        }
      }
    };

    render() {
      const { value, onChange, onOpenChange, observer, ...dataPickerProps } = this.props as any;
      if (dataPickerProps.disabled) {
        dataPickerProps.allowClear = false;
        dataPickerProps.suffixIcon = null;
        dataPickerProps.placeholder = '';
        dataPickerProps.inputReadOnly = true;
      } else {
        dataPickerProps.allowClear = dataPickerProps.allowClear ?? true;
        if (type === 'range' && zh.isString(dataPickerProps.placeholder)) {
          dataPickerProps.placeholder = [dataPickerProps.placeholder, dataPickerProps.placeholder];
        }
      }
      return (
        <Comp
          ref={this.outRef}
          style={{ width: '100%' }}
          {...dataPickerProps}
          open={this.state.open}
          showTime={this.getShowTime()}
          value={this.getDayJs(this.state.value)}
          format={this.state.defaultFormat}
          onOpenChange={this.onOpenChange}
          onChange={this.onDatePickerChange}
        />
      );
    }
  };
}

type TypeProps<T> = TypeExtends<T, { onChange?: (value: any) => void }>;

export const DatePicker = compHoc<TypeProps<PickerProps<Dayjs | string>>>(getDatePicker(AntDatePicker));

export const DateTimePicker = compHoc<TypeProps<PickerProps<Dayjs | string>>>(getDatePicker(AntDatePicker, 'datetime'));

export const RangePicker = compHoc<TypeProps<RangePickerProps<Dayjs | string>>>(
  getDatePicker(AntDatePicker.RangePicker, 'range')
);

export const TimePicker = compHoc<TypeProps<TimePickerProps>>(getDatePicker(AntTimePicker, '', 'HH:mm:ss'));
