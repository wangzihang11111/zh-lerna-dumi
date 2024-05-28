/**
 * title: 基本使用
 * description: 表单通过config(confKey元数据key值)加载表单配置，通过xtype识别没给条目类型
 */
import { zh, useApi, useValuesChange, Form, useRefState } from '@zh/zh-design';
import React from 'react';
import { useState } from 'react';

const value = {
  form1_placeHolder: '基本使用',
  form1_aa1: '测试用例',
  form1_bb1: null,
  rate: 0.66,
  form1_help1: '01',
  form1_yy1: '#FF0000',
  form1_help1_EXName: 'name01',
  form1_help12: '01,02,03',
  form1_ee1: '20211213',
  form1_bdt: '2021-12-03',
  form1_edt: '2021-12-13',
  form1_duoxuan: '22',
  selectTest: 1,
  form1_hh1: '123456',
  form1_zz1: [1, 2],
  form1_help12_EXName: 'name011,name02222222222222222,name033333333333333',
  wrap: {
    b: '2',
    c: 1
  },
  form1_jj1: 'images/logo.ico'
};

export default () => {
  const [config] = useState<any>([
    {
      name: 'form1_placeHolder',
      label: '提示字段',
      xtype: 'Input',
      placeholder: '请输入提示字段',
      tooltip: true,
      maxLength: 10,
      computed: (v, v2) => {
        console.log(v, v2);
        if (v2.formatTxt) {
          return {};
        }
        return { disabled: v.type === 'disabled', hidden: v.type === 'hidden', required: v.type === 'required' }
      },
    },
    {
      name: 'type',
      label: '状态',
      xtype: 'Select',
      data: [
        { value: 'disabled', label: 'disabled' },
        { value: 'required', label: 'required' },
        { value: 'hidden', label: 'hidden' }
      ]
    },
    {
      name: 'formatTxt',
      label: '文本格式化',
      xtype: 'input',
      colspan: 2,
      formatter: (value) => value.replace(/(\S{4})(?=\S)/g, '$1 '),
      parser: (value) => value!.replace(/(\s+)/g, '')
    },
    {
      name: 'form1_help1',
      label: '单选帮助',
      xtype: 'SingleHelp',
      helpId: 'user',
      nameField: 'form1_help1_EXName',
      required: true,
      acceptInput: true,
      //  emptyValue: '',
      clientSqlFilter(params) {
        const formValues = params.form.getValues();
        console.log(formValues);
        return { color: formValues.bgColor };
      },
      async tooltip(v) {
        await zh.delay(1000);
        return v ? `value:${v.value}` : '';
      },
      onBeforeOpen: () => {
        if (!value.form1_yy1) {
          zh.message('自定义组件不能为空');
          return false;
        }
        return true;
      }
    },
    {
      name: 'form1_help12',
      label: '多选帮助',
      xtype: 'MultipleHelp',
      helpId: 'user',
      nameField: 'form1_help12_EXName'
    },
    { name: 'form1_aa1', label: '文本', xtype: 'Text', placeholder: 'sdfsf' },
    {
      name: ['wrap', 'a'],
      label: '嵌套值输入框a',
      xtype: 'Input',
      placeholder: '请输入',
      valueType: 'string'
    },
    {
      name: ['wrap', 'b'],
      label: '嵌套值输入框b',
      xtype: 'Input',
      placeholder: '请输入',
      valueType: 'string'
    },
    { name: 'rate', label: '百分比', xtype: 'InputNumber', type: 'rate' },
    { name: 'prc', label: '单价', xtype: 'InputNumber', type: 'prc' },
    { name: 'amt', label: '合价', xtype: 'InputNumber', type: 'amt' },
    { name: 'qty', label: '工程量', xtype: 'InputNumber', type: 'qty' },
    {
      name: ['wrap', 'c'],
      label: '下拉框c',
      xtype: 'Select',
      allowClear: true,
      emptyValue: [],
      multiple: true,
      required: true,
      data: [
        { value: 1, label: 'test01' },
        { value: 2, label: 'test02' },
        { value: 3, label: 'test03' }
      ]
    },
    {
      name: 'selectTest',
      label: '下拉框',
      xtype: 'Select',
      allowClear: true,
      required: true,
      data: [
        { value: 1, label: 'test01', unit: 'mg' },
        { value: 2, label: 'test02', unit: 'g' },
        { value: 3, label: 'test03', unit: 'kg' }
      ],
      extra: 'test'
    },
    {
      name: 'form1_ee1',
      label: '日期',
      xtype: 'DatePicker',
      required: true,
      format: 'YYYYMMDD'
    },
    {
      name: 'form1_bdt,form1_edt',
      label: '日期范围',
      xtype: 'RangePicker',
      required: true
    },
    {
      name: 'form1_gg1',
      label: '时间',
      xtype: 'DateTimePicker',
      required: true
    },
    {
      name: 'form1_timer',
      label: '仅时间',
      xtype: 'TimePicker',
      required: true
    },
    { name: 'form1_hh1', label: '密码', xtype: 'Password', required: true },
    {
      name: 'form1_ii1',
      label: '按钮',
      xtype: 'Button',
      antProps: { children: '按钮-测试' }
    },
    { name: 'form1_compact', label: '紧凑模式', xtype: 'Checkbox' },
    { name: 'form1_chk1', label: 'label位置', xtype: 'Switch', inline: true, antProps: { style: { float: 'right' } } },
    {
      name: 'form1_size',
      label: 'size',
      xtype: 'RadioGroup',
      required: true,
      data: [
        { value: 'small', label: 'small' },
        { value: 'middle', label: 'middle' },
        { value: 'large', label: 'large' }
      ],
      colspan: 2
    },
    {
      name: 'form1_zz1',
      label: '多个复选框',
      xtype: 'CheckboxGroup',
      required: true,
      data: [
        { value: 1, label: '测试', disabled: true },
        { value: 2, label: '测试1' },
        { value: 3, label: '测试2' }
      ],
      colspan: 2
    },
    {
      name: 'form1_kk1',
      label: '文本框',
      xtype: 'TextArea',
      required: true,
      rows: 3,
      colspan: 3
    },
    {
      name: 'ddd',
      label: '附件',
      xtype: 'Input',
      colspan: 3
    },
    {
      name: 'form1_jj1',
      label: '图片',
      xtype: 'Image'
    },
    {
      xtype: 'container',
      name: 'aa',
      children: [
        { name: 'form1_chk2', label: '测试', xtype: 'Switch', inline: true, antProps: { style: { float: 'right' } } },
        {
          name: 'ddd',
          required: true,
          label: '停留1',
          xtype: 'Input',
          extra: '天'
        }
      ]
    }
  ]);

  const ref = useApi();
  const [state, setState] = useRefState<any>({ labelPosition: 'left', size: 'middle', compact: false });

  // 监听 form1_chk1 变化
  useValuesChange(({ args }) => {
    setState({ labelPosition: args[0]['form1_chk1'] ? 'top' : 'left' });
  }, 'form1_chk1');

  useValuesChange(({ args }) => {
    setState({ size: args[0]['form1_size'] });
  }, 'form1_size');

  useValuesChange(({ args }) => {
    setState({ compact: args[0]['form1_compact'] });
  }, 'form1_compact');

  useValuesChange(({ args }) => {
    console.log(args);
  }, 'form1_bdt');

  const onValuesChange = async (update) => {
    console.log(update);
  };

  return (
    <>
      <Form
        id="baseForm"
        size={state.size}
        compact={state.compact}
        onValuesChange={onValuesChange}
        labelPosition={state.labelPosition}
        disabled={false}
        ref={ref}
        value={value}
        config={config}
      />
    </>
  );
};
