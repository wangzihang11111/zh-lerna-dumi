/**
 * title: 基本使用
 * description: 表单通过config(confKey元数据key值)加载表单配置，通过xtype识别没给条目类型
 */
import { FormSet } from '@zh/zh-design';
import React from 'react';
import { useState } from 'react';

export default () => {
  const [config] = useState<any>({
    "id": "testallqmqmthreemform",
    "buskey": "id",
    "bindtable": "testallqmqmthree_main",
    "desTitle": "全码1主表+3明细的主表",
    "fieldSets": [{
      "desTitle": "基本信息",
      "itemId": "f1",
      "langKey": "",
      "allfields": [{
        "label": "varchar_文本",
        "name": "varcharWb",
        "langKey": "varcharWb",
        "maxLength": 50,
        "colspan": 1,
        "xtype": "Input"
      }, {
        "label": "审批状态",
        "name": "status",
        "langKey": "appStatus",
        "maxLength": 50,
        "colspan": 1,
        "data": [{
          "label": "未审批",
          "value": 0
        }, {
          "label": "已审批",
          "value": 1
        }],
        "xtype": "Select"
      }],
      "xtype": "fieldset"
    }, {
      "desTitle": "补充信息",
      "itemId": "f2",
      "langKey": "",
      "allfields": [{
        "label": "help_vc_多选帮助",
        "name": "varcharDxbz",
        "langKey": "varcharDxbz",
        "maxLength": 50,
        "colspan": 1,
        "helpId": "testallqmqm_m_ext",
        "nameField": "varcharDxbzEXName",
        "xtype": "MultipleHelp"
      }, {
        "label": "varchar_组织帮助",
        "name": "varcharZzbz",
        "langKey": "varcharZzbz",
        "maxLength": 50,
        "colspan": 1,
        "xtype": "OrgHelp"
      }, {
        "label": "text_帮助",
        "name": "textBz",
        "langKey": "textBz",
        "colspan": 1,
        "helpId": "testqm",
        "nameField": "textBzEXName",
        "xtype": "SingleHelp"
      }, {
        "label": "text_单选",
        "name": "dx",
        "langKey": "textDanx",
        "colspan": 1,
        "data": [{
          "label": "text_单选0",
          "value": "0"
        }, {
          "label": "text_单选1",
          "value": "1"
        }, {
          "label": "text_单选2",
          "value": "2"
        }],
        "xtype": "RadioGroup"
      }, {
        "label": "tinyint开关",
        "name": "kg",
        "langKey": "tinyintKg",
        "colspan": 1,
        "xtype": "Switch"
      }],
      "xtype": "fieldset"
    }]
  });

  return (
    <>
      <FormSet
        id="formSet"
        colspan={1}
        layout='vertical'
        compact
        config={config}
      />
    </>
  );
};
