import { Input, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { message } from '../../../functionalComponent';
import { tableAttachSaveRemark } from '../service';

export const RemarkModal = (props) => {
  const { data, visible, setVisible = () => {}, getTableAttach } = props;
  const { asrSessionGuid, asrFid, asrRemark } = data;
  const [remark, setRemark] = useState('');
  const onCancel = () => {
    setRemark('');
    setVisible(false);
  };
  useEffect(() => {
    visible && setRemark(asrRemark);
  }, [asrRemark, visible]);
  return (
    <Modal
      open={visible}
      title="修改备注"
      onOk={() => {
        tableAttachSaveRemark({
          asrFid,
          asrRemark: remark
        }).then((res) => {
          if (res?.code === 0) {
            message.success('保存成功');
            getTableAttach();
            onCancel();
          }
        });
      }}
      onCancel={onCancel}
      okText="保存"
    >
      <Input.TextArea rows={5} value={remark} onChange={(e) => setRemark(e.target.value)} />
    </Modal>
  );
};
