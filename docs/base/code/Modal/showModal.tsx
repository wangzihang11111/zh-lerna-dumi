/**
 * title: 指令方式
 * description: 通过 showModal 接口动态创建模态窗口
 */
import { ModalContext, Button, Layout, message, showModal } from '@zh/zh-design';
import { useContext, useEffect } from 'react';
import React from 'react';

function Content() {
  const { ins, params } = useContext(ModalContext);

  useEffect(() => {
    ins.subscribe(() => {
      console.log('onOk');
    }, 'onOk');
    ins.subscribe(() => {
      console.log('onCancel');
    }, 'onCancel');
  }, []);

  return (
    <Layout style={{ padding: 25 }}>
      <div>参数: {params.arg1}</div>
      <div>
        <a onClick={() => ins.destroy()}>关闭modal</a>
      </div>
      <Layout.Flex>Content</Layout.Flex>
    </Layout>
  );
}

export default () => {
  const createModal = () => {
    showModal({
      title: '标题',
      height: 300, // 设置高度开启拖拽调整大小功能
      params: { arg1: '参数1' },
      content: <Content />,
      async onOk(ins) {
        await message.info('3秒后关闭');
        ins.destroy();
      },
      async onCancel(ins) {
        ins.destroy();
      }
    });
  };

  return (
    <>
      <Button type="primary" onClick={createModal}>
        动态创建模态框
      </Button>
    </>
  );
};
