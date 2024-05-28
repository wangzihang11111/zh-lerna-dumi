/**
 * title: 组件方式
 * description: 属性继承 <a href="https://ant.design/components/modal-cn/">ant modal</a>
 */
import { Button, Modal } from '@zh/zh-design';
import { useState } from 'react';
import React from 'react';

export default () => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    //Modal.confirm({content:'aaa', title: '提示'});
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };
  return (
    <>
      <Button type="primary" onClick={showModal}>
        打开模态对话框
      </Button>
      <Modal title="标题" open={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
        <p>contents...</p>
      </Modal>
    </>
  );
};
