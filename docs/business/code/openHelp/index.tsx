/**
 * title: openHelp 方法打开
 * description: 通过调用 .external.openHelp 打开通用帮助，业务帮助注册以后也可以打开
 */
import { zh, Button, SingleHelp } from '@zh/zh-design';
import { useState } from 'react';
import React from 'react';

export default () => {
  const [result, setResult] = useState<any>({});

  const open = (type: string) => async () => {
    const ret = await zh.external.openHelp({
      type,
      helpId: 'org',
      valueField: 'value',
      labelField: 'label',
      value: result[type]
    });
    console.log('result', ret);
    ret && setResult((prevState) => ({ ...prevState, [type]: ret }));
  };

  const onResult = (result) => {
    console.log(result);
  };

  return (
    <div>
      <div>
        <Button type="primary" onClick={open('SingleHelp')}>
          打开单选帮助
        </Button>
        &nbsp;&nbsp;
        <Button type="primary" onClick={open('MultipleHelp')}>
          打开多选帮助
        </Button>
        &nbsp;&nbsp;
        <SingleHelp
          helpId={'user'}
          buttonMode={{ text: 'button模式打开多选帮助', onResult }}
          valueField={'value'}
          labelField={'label'}
        />
      </div>
      <div>{zh.jsonString(result)}</div>
    </div>
  );
};
