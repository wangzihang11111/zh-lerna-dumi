import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Input,
  InputNumber,
  RadioGroup,
  Select,
  Switch,
  TextArea,
  TimePicker
} from '../../../baseComponent';
import { getRegisterComponentWithProps, stopPropagation, useDebounce, useRefCallback, util } from '../util';

import { useValue } from '../hook/useValue';
import { createEditorProps } from './helpRef';

const ROW_CMP = Symbol('rowCmp');
const REQUEST_DATA = Symbol('requestData');
const waitDelay = 1000 / 60;

const editorRef = {
  select: { Editor: SelectEditor, waitDelay },
  datepicker: { Editor: DatePickerEditor, waitDelay },
  datetimepicker: { Editor: DatePickerEditor, waitDelay, props: { type: 'datetime' } },
  timepicker: { Editor: DatePickerEditor, waitDelay },
  checkbox: { Editor: CheckBoxEditor, waitDelay },
  switch: { Editor: CheckBoxEditor, waitDelay, props: { type: 'switch' } },
  help: { Editor: HelpEditor, waitDelay },
  radiogroup: { Editor: OptionsEditor, waitDelay },
  checkboxgroup: { Editor: OptionsEditor, waitDelay }
};

function isElementType(type) {
  if (typeof type === 'function') return true;
  return !!(type && typeof type === 'object' && type.render && type.$$typeof);
}

/**
 * 获取编辑器react组件
 * @param xType 编辑器类型
 */
function getEditor(xType = 'text') {
  let editor = isElementType(xType) ? Customized : editorRef[xType.toLowerCase()];
  if (!editor && util.isString(xType)) {
    const [Cmp, defaultProps, extendObj] = getRegisterComponentWithProps(xType);
    editor = Cmp ? (extendObj.isHelp ? editorRef.help : Customized) : TextEditor;
    if (Cmp) {
      editor.props = { ...editor.props, ...defaultProps };
    }
  }
  if (editor?.Editor) {
    return [editor.Editor, editor.waitDelay, editor.props];
  }
  return [editor || TextEditor];
}

function getOptions(editor: any, editRef: any, isDisabled = false, editProps): any {
  const {
    type,
    min,
    max,
    step,
    maxLength,
    antProps,
    required,
    listeners,
    hidden,
    disabled,
    regExp,
    xtype,
    dateFormat,
    displayField,
    nameField,
    cache,
    incompatible,
    ...others
  } = editor;
  const props: any = {
    ref: editRef,
    style: {
      width: '100%',
      height: '100%',
      border: 0,
      borderRadius: 0,
      borderColor: 'transparent'
    },
    autoFocus: true,
    disabled: isDisabled,
    ...others,
    ...antProps
  };
  if (type !== undefined) {
    props.type = type;
  } else if (getRegisterComponentWithProps(xtype)[2]?.isHelp) {
    props.type = xtype;
  }
  if (min !== undefined) {
    props.min = min;
  }
  if (max !== undefined) {
    props.max = max;
  }
  if (step !== undefined) {
    props.step = step;
  }
  if (maxLength !== undefined) {
    props.maxLength = maxLength;
  }
  return { ...editProps, ...editor, props, xType: xtype?.toLowerCase?.() };
}

/**
 * 编辑器工厂函数（高阶函数）
 * @param props
 * @constructor
 */
export const EditorFactory = (props: any) => {
  const { column, children = undefined, table, editing = false, style, ...others } = props;
  const { dataIndex } = column;
  const editor = createEditorProps(column.editor);

  if (editor.hidden?.({ row: others.row, dataIndex })) {
    return null;
  }

  if (children && (!editing || table.isDisabled({ row: others.row, dataIndex, column }))) {
    return children;
  }

  return (
    <Editing
      editor={editor}
      editing={editing}
      style={style}
      others={others}
      table={table}
      dataIndex={dataIndex}
      column={column}
    >
      {children}
    </Editing>
  );
};

function Editing({ editing, editor, column, table, dataIndex, children, style, others }) {
  const initRet = useMemo(() => {
    return (
      editing &&
      editor?.listeners?.onBeforeInit?.({
        editor,
        row: others.row,
        dataIndex,
        table: others.table
      })
    );
  }, [editing]);

  if (initRet !== false) {
    const newEditor = initRet ? { ...editor, ...initRet } : editor;
    return (
      <div
        style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', ...style }}
        onClick={stopPropagation}
      >
        <Editor table={table} column={column} editor={newEditor} {...others} />
      </div>
    );
  }

  return <div className="editor-disabled cell-active">{children}</div>;
}

/**
 * 创建编辑器组件
 * @param column 列信息
 * @param editor 编辑器信息
 * @param row 数据行信息
 * @param table 列表实例
 * @param rendered 是否直接渲染在单元格中（如checkbox，通过render方法渲染到单元格中）
 * @param others 其他属性
 * @constructor
 */
function Editor({ column, editor, row, table, rendered = false, ...others }) {
  const rowIndex = table.getRowIndex(row);
  const editRef = useRef<any>();
  const { dataIndex, dataIndexField } = column;
  const di = dataIndexField || dataIndex;
  const [EditorCmp, changeWait, editProps] = getEditor(editor.xtype);
  const lastRow = { ...row };

  const onKeyDownCallback = useRefCallback((e: any) => {
    if (e.keyCode !== 9 && editRef.current?.stopPropagation) {
      // 阻止冒泡
      stopPropagation(e);
    }
  });
  const onChangeCallback = useDebounce(
    async (currentValue) => {
      util.setObjValue(row, di, currentValue);
      const originValue = editRef.current?.getApi().getOrigin?.() ?? currentValue;
      row.__update__ = { rowIndex, dataIndex, value: currentValue, originValue, lastRow };
      if (column?.levelSummary && table.props.isTree) {
        table.updateParent(row, (r) =>
          util.setObjValue(
            r,
            di,
            util.numberPrecision(
              r.children.reduce((p, c) => {
                return p + util.getObjValue(c, di, 0);
              }, 0)
            )
          )
        );
      }
      await editor.listeners?.onChange?.({
        value: currentValue,
        row,
        lastRow,
        rowIndex,
        table,
        dataIndex,
        getEditor: (dataIndex) => row[ROW_CMP]?.[dataIndex] ?? editRef.current,
        originValue
      });
      table.updateRowDataByIndex(rowIndex, row, true);
      if (rendered) {
        table.endEditing(true);
      }
    },
    { immediate: false, wait: changeWait || 250 }
  );

  const [value, setValue] = useValue(util.getObjValue(row, di), EditorCmp === HelpEditor);

  useEffect(() => {
    if (editRef.current) {
      if (rendered) {
        row[ROW_CMP] = row[ROW_CMP] || {};
        row[ROW_CMP][column.dataIndex] = editRef.current;
      } else {
        table.notify(editRef.current, 'activeEditor').then();
      }
    }
    return () => {
      if (row[ROW_CMP]) {
        delete row[ROW_CMP][column.dataIndex];
      }
    };
  }, [editor.xtype, row, column]);

  useEffect(() => {
    if (editRef.current) {
      editor.listeners?.onInit?.({
        editor: editRef.current,
        row,
        rowIndex,
        dataIndex,
        table
      });
    }
  }, []);

  const onChangeHandler = useRefCallback((...args) => {
    let [currentValue1, currentValue2] = [undefined, undefined];
    const api = editRef.current?.getApi();
    if (api?.getValue) {
      currentValue1 = api.getValue(',');
      currentValue2 = api.getRawValue ? api.getRawValue() : api.getValue();
    } else if (args.length > 0) {
      const e = args[0];
      currentValue1 = e?.target ? e.target.value : e;
      currentValue2 = currentValue1;
    }
    // 更新当前状态
    setValue(currentValue2, () => {
      // 更新数据行的字段
      onChangeCallback(currentValue1);
    });
  });
  return (
    EditorCmp && (
      <EditorCmp
        editorOptions={getOptions(editor, editRef, table.isDisabled({ row, dataIndex, column }), editProps)}
        value={value}
        table={table}
        onKeyDown={onKeyDownCallback}
        onChange={onChangeHandler}
        outRef={editRef}
        column={column}
        dataIndex={di}
        row={row}
        {...others}
      />
    )
  );
}

/**
 * text 文本编辑器
 * @param editorOptions
 * @param value
 * @param outRef
 * @param onChange
 * @constructor
 */
function TextEditor({ editorOptions, value, outRef, onChange }: any) {
  const { type = 'text', xType, props } = editorOptions;
  const Comp =
    xType === 'inputnumber' || ['number', 'amount', 'amt', 'qty', 'prc', 'rate', 'percent'].includes(type)
      ? InputNumber
      : xType === 'textarea' || type === 'textarea'
      ? TextArea
      : Input;

  props.type = type;
  if (Comp === InputNumber) {
    props.keyboard = false;
    if (type === 'rate') {
      props.suffix = '%';
    }
  }

  useEffect(() => {
    const api = outRef.current?.getApi();
    if (api?.select) {
      api?.select();
    } else {
      api?.focus?.({
        cursor: 'all'
      });
    }
  }, []);

  return <Comp {...props} allowClear autoComplete="off" value={value} onChange={onChange} />;
}

/**
 * checkbox 或 switch 选择器
 * @param defaultProps
 * @constructor
 */
function CheckBoxEditor(defaultProps) {
  const { type = 'checkbox', xType } = defaultProps.editorOptions;
  const Comp = xType === 'switch' || type === 'switch' ? Switch : Checkbox;

  return <Comp {...getEditorProps('check', defaultProps)} />;
}
function getCheckProps(defaultProps) {
  const { editorOptions, value, onChange, table, dataIndex } = defaultProps;

  const {
    incompatible = false,
    props: { style, ...others }
  } = editorOptions;

  const { checkedValue = true, unCheckedValue = false } = others;

  const onChangeHandler = (val) => {
    if (incompatible) {
      if (val === checkedValue) {
        const rows = table.getRows();
        rows.forEach((r, i) => {
          if (util.getObjValue(r, dataIndex) === checkedValue) {
            rows[i] = { ...r };
            util.setObjValue(rows[i], dataIndex, unCheckedValue);
          }
        });
        onChange(checkedValue);
        return true;
      }
      return false;
    } else {
      onChange(val);
    }
  };

  return { ...others, autoFocus: false, value, onChange: onChangeHandler };
}

/**
 * 选项组
 */
function OptionsEditor(defaultProps) {
  const { xType } = defaultProps.editorOptions;

  const Comp = xType === 'checkboxgroup' ? CheckboxGroup : RadioGroup;

  return (
    <div style={{ overflow: 'auto', height: '100%', display: 'flex', alignItems: 'center' }}>
      <Comp {...getEditorProps('options', defaultProps)} />
    </div>
  );
}
function getOptionsProps(defaultProps) {
  const { editorOptions, value, onChange } = defaultProps;
  const {
    props: { style, ...others }
  } = editorOptions;

  return { ...others, autoFocus: false, value, onChange };
}

function getValueLabel({ row, value, valueType, nameField, multiple }) {
  if (util.isNullOrEmpty(value)) {
    return multiple ? undefined : util.convertData(value, valueType);
  }
  const splitStr = ',';
  const defaultLabel = row.hasOwnProperty(nameField) ? row[nameField] : '';
  const label = row.hasOwnProperty(nameField) ? row[nameField] ?? '' : value;
  let valueLabel: any;
  if (multiple && !util.isNullOrEmpty(value)) {
    const labelArray = util.isArray(label) ? label : label ? label.toString().split(splitStr) : [];
    const valueArray = util.isArray(value) ? value : value.toString().split(splitStr);
    valueLabel = valueArray
      .map((v: any, i: number) => {
        return v?.hasOwnProperty('value')
          ? v
          : {
              value: util.convertData(v, valueType),
              label: labelArray[i] ?? defaultLabel
            };
      })
      .filter(({ label }) => !util.isNullOrEmpty(label, ''));
    if (valueLabel?.length === 0) {
      valueLabel = null;
    }
  } else {
    valueLabel = value.hasOwnProperty('value')
      ? value
      : {
          value: util.convertData(value, valueType),
          label
        };
  }
  return valueLabel;
}

/**
 * 下拉选择器
 * @param defaultProps
 */
function SelectEditor(defaultProps) {
  useEffect(() => {
    defaultProps.outRef.current && (defaultProps.outRef.current.editing = true);
  }, []);

  return <Select {...getEditorProps('select', defaultProps)} />;
}
function getSelectProps(defaultProps) {
  const {
    editorOptions,
    dataIndex,
    column: { editor, valueType },
    value,
    row,
    outRef,
    onChange,
    onKeyDown
  } = defaultProps;

  const { multiple, request, data, valueField, labelField, nameField, props } = editorOptions;

  const displayField = nameField || editorOptions.displayField || `${dataIndex}EXName`;

  const newProps: any = {
    showSearch: true,
    allowClear: true,
    maxTagCount: multiple ? 'responsive' : undefined,
    ...props,
    value: getValueLabel({ row, value, valueType, nameField: displayField, multiple }),
    autoComplete: 'off',
    defaultOpen: true,
    data,
    filterOption: (input: string, { value, children, label }: any) => {
      input = input.toLowerCase();
      const text = children ?? label ?? '';
      return (
        (value && (value + '').toLowerCase().indexOf(input) >= 0) ||
        (text && (text + '').toLowerCase().indexOf(input) >= 0)
      );
    },
    mode: multiple ? 'multiple' : undefined
  };

  delete newProps.multiple;

  if (valueField) {
    newProps.valueField = valueField;
  }
  if (labelField) {
    newProps.labelField = labelField;
  }

  const refRequest = useCallback(async () => {
    if (request) {
      // 缓存列的请求数据，减少请求
      if (editor.cache && editor[REQUEST_DATA]) {
        return editor[REQUEST_DATA];
      }
      editor[REQUEST_DATA] = await request(row);
      return editor[REQUEST_DATA];
    }
  }, [request, row]);

  if (request) {
    newProps.request = refRequest;
  }

  newProps.onChange = (...args) => {
    const api = outRef.current?.getApi();
    if (api) {
      if (api.getText && dataIndex !== displayField) {
        row[displayField] = api.getText(',');
      }
      onChange();
    } else {
      onChange(...args);
    }
  };

  newProps.onDropdownVisibleChange = (open: boolean) => {
    outRef.current && (outRef.current.editing = open);
  };

  newProps.onKeyDown = (e) => {
    const keyCodes: number[] = [9, 35, 36, 37, 39];
    if (keyCodes.includes(e.keyCode)) {
      outRef.current && (outRef.current.stopPropagation = false);
    }
    onKeyDown(e);
  };

  newProps.onInputKeyDown = () => {
    outRef.current && (outRef.current.stopPropagation = outRef.current.editing);
  };

  return newProps;
}

/**
 * 时间选择器
 * @param defaultProps
 */
function DatePickerEditor(defaultProps) {
  const { type, xType } = defaultProps.editorOptions;
  const Comp: any = xType === 'timepicker' || type === 'time' ? TimePicker : DatePicker;

  const { onKeyDown, ...newProps } = getEditorProps('date', defaultProps);

  return (
    <div style={{ width: '100%', height: '100%' }} onKeyDown={onKeyDown}>
      <Comp {...newProps} />
    </div>
  );
}
function getDateProps(defaultProps) {
  const { editorOptions, value, outRef, onChange, onKeyDown } = defaultProps;
  const getPickerAndFormat = (type: any) => {
    switch (type) {
      case 'datetime':
        return { f: 'YYYY-MM-DD HH:mm:ss', p: 'date' };
      case 'time':
        return { f: 'HH:mm:ss' };
      case 'year':
        return { f: 'YYYY', p: type };
      case 'quarter':
        return { f: 'YYYY-[Q]Q', p: type };
      case 'month':
        return { f: 'YYYY-MM', p: type };
      case 'week':
        return { f: 'YYYY-wo', p: type };
      default:
        return { f: 'YYYY-MM-DD', p: 'date' };
    }
  };
  const { dateFormat, type, xType, props } = editorOptions;
  const pf = getPickerAndFormat(xType === 'timepicker' ? 'time' : type);
  delete props.type;
  return {
    defaultOpen: true,
    placeholder: dateFormat || pf.f,
    ...props,
    picker: pf.p,
    value,
    allowClear: true,
    autoComplete: 'off',
    showTime: type === 'datetime',
    format: dateFormat || pf.f,
    onChange,
    onKeyDown(e: any) {
      const keyCodes: number[] = [9, 35, 36, 37, 39];
      outRef.current &&
        (outRef.current.stopPropagation = keyCodes.includes(e.keyCode) ? false : outRef.current?.getApi().isOpened());
      onKeyDown(e);
    }
  };
}

/**
 * 通用帮助 (包括自定义帮助 xtype='help')
 * @param defaultProps
 * @constructor
 */
function HelpEditor(defaultProps) {
  const { type = 'SingleHelp' } = defaultProps.editorOptions;

  const [Comp, props] = getRegisterComponentWithProps(type);

  if (!Comp) {
    console.warn(`${type} unregister`);
    return null;
  }

  defaultProps.editorOptions.type = defaultProps.editorOptions.type || type;

  return <Comp {...props} {...getEditorProps('help', defaultProps)} />;
}
function getHelpProps(defaultProps) {
  const {
    editorOptions,
    table,
    dataIndex,
    column: { valueType },
    value,
    row,
    outRef,
    onChange,
    onKeyDown
  } = defaultProps;
  const {
    valueField,
    labelField,
    ORMMode = true,
    clientSqlFilter,
    nameField,
    props,
    request,
    type,
    helpid: helpId
  } = editorOptions;
  const displayField = nameField || editorOptions.displayField || `${dataIndex}EXName`;

  const multiple = type === 'MultipleHelp' ? true : type === 'SingleHelp' ? false : editorOptions.multiple;

  const dealSqlFilter = () => {
    const sqlFilter = props.clientSqlFilter || clientSqlFilter;
    if (sqlFilter) {
      const exec = (expr) => {
        if (util.isString(expr) && /((\$D)|(\$R)|(\$V)|(\$DI))\./.test(expr)) {
          try {
            const fn = new Function('$D', '$R', '$V', '$DI', `return ${expr}`);
            return fn(table.getRows(), row, value, dataIndex) ?? expr;
          } catch (e) {}
        }
        return expr;
      };
      if (util.isFunction(sqlFilter)) {
        return (args) => sqlFilter({ helpId, ...args, ds: table.getRows(), row, value, dataIndex });
      } else if (util.isString(sqlFilter)) {
        return exec(sqlFilter);
      } else {
        return Object.keys(sqlFilter).reduce((p, k) => {
          return { ...p, [k]: exec(sqlFilter[k]) };
        }, {});
      }
    }
    return sqlFilter;
  };

  const newProps: any = {
    valueField,
    labelField: labelField || (nameField ? editorOptions.displayField : undefined),
    ORMMode,
    ...props,
    clientSqlFilter: dealSqlFilter(),
    request,
    helpId: helpId || editorOptions.helpId,
    value: getValueLabel({ row, value, valueType, nameField: displayField, multiple }),
    onInputKeyDown() {
      outRef.current && (outRef.current.stopPropagation = outRef.current.editing);
    },
    onChange(...args) {
      const api = outRef.current?.getApi();
      if (api) {
        if (api.getText && dataIndex !== displayField) {
          row[displayField] = api.getText(',');
        }
        onChange();
      } else {
        onChange(...args);
      }
    },
    onOpenChange(open, type) {
      table.setEditLock(open);
      if (type === 'dropdown' && outRef.current) {
        outRef.current.editing = open;
      }
    },
    onKeyDown(e) {
      const keyCodes: number[] = [9, 35, 36, 37, 39];
      if (outRef.current && keyCodes.includes(e.keyCode)) {
        outRef.current.stopPropagation = false;
      }
      onKeyDown(e);
    }
  };

  if (!newProps.valueField) {
    delete newProps.valueField;
  }
  if (!newProps.labelField) {
    delete newProps.labelField;
  }

  return newProps;
}

function getEditorProps(editType, defaultProps) {
  switch (editType) {
    case 'help':
      return getHelpProps(defaultProps);
    case 'date':
      return getDateProps(defaultProps);
    case 'select':
      return getSelectProps(defaultProps);
    case 'check':
      return getCheckProps(defaultProps);
    case 'options':
      return getOptionsProps(defaultProps);
    default:
      return {};
  }
}

/**
 * 自定义组件
 * @constructor
 */
function Customized(allProps) {
  const { editorOptions, ...payload } = allProps;
  const {
    props: { ref, ...others },
    ...options
  } = editorOptions;
  const [Comp, defaultProps] = isElementType(options.xtype)
    ? [options.xtype, {}]
    : getRegisterComponentWithProps(options.xtype);

  const newProps = {
    ...defaultProps,
    ...payload,
    ...others,
    editorOptions: options,
    props(editType) {
      const tmp = getEditorProps(editType, { ...defaultProps, ...allProps });
      tmp.outRef = tmp.ref; // 有些函数组件没有包装forwardRef，会导致ref丢失，可能导致数据没法回调
      return tmp;
    }
  };

  return <Comp {...newProps} />;
}
