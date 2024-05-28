/**
 * title: SingleHelp 单选帮助
 * description: valueField 配置编码字段，labelField配置名称字段（显示值），返回值为固定对象格式：{value:'',label:''}
 */
import { Button, SingleHelp } from '@zh/zh-design';
import React from 'react';
import { useState } from 'react';

export default function () {
  const [value, setValue] = useState<{ value: string; label: string }>();

  return (
    <>
      <div>
        非受控
        <SingleHelp helpId="eco_project_sturct" />
      </div>
      <div>
        受控
        <Button size="small" type="primary" onClick={() => setValue({ value: '02', label: 'changed' })}>
          change value
        </Button>
        <SingleHelp helpId="user" value={value} onChange={setValue} />
      </div>
    </>
  );
}
