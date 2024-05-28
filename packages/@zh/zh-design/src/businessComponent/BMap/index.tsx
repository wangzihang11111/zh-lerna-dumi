import React from 'react';
import { BMap, core } from '../../util';

export const openBMap = (props) => {
  if (!(window as any).BMap) {
    core.alert('当前环境不支持打开百度地图，请确认平台是否引用了百度地图API文件');
    return;
  }
  return new Promise((resolve) => {
    const { position } = props;
    const apiRef = React.createRef<any>();
    const handleOk = async (ins) => {
      const value = apiRef.current?.getValue() ?? {};
      ins.destroy();
      resolve({
        value,
        closeStatus: 'ok'
      });
    };
    const handleCancel = (ins) => {
      const value = apiRef.current?.getValue() ?? {};
      ins.destroy();
      resolve({
        value,
        closeStatus: 'cancel'
      });
    };
    core.external.showModal({
      title: '地图',
      width: 1000,
      height: 700,
      body: { position: 'relative' },
      content: <BMap ref={apiRef} position={position} />,
      async onOk(ins) {
        await handleOk(ins);
      },
      async onCancel(ins) {
        await handleCancel(ins);
      }
    });
  });
};
