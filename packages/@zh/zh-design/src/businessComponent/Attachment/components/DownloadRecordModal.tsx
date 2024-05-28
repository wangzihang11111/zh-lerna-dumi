import { Modal } from 'antd';
import { useEffect, useState } from 'react';
import { getDownLoadList } from '../service';
import { Table } from '../../../functionalComponent';

export const DownloadRecordModal = (props) => {
  const { data, visible, setVisible = () => {} } = props;
  const [dataSource, setDataSource] = useState<any[]>([]);
  const onCancel = () => setVisible(false);
  const tableConfig = [
    {
      title: '下载人',
      dataIndex: 'userName',
      flex: 1
    },
    {
      title: '下载时间',
      dataIndex: 'createTime',
      flex: 1
    }
  ];
  useEffect(() => {
    const { asrFid } = data;
    visible &&
      getDownLoadList({
        asrFid
      }).then((res) => {
        if (res?.code === 0) {
          setDataSource(res?.data ?? []);
        }
      });
  }, [data, visible]);
  return (
    <Modal open={visible} title="下载记录" onOk={onCancel} onCancel={onCancel}>
      <Table rowHeight={40} columns={tableConfig} dataSource={dataSource} virtualScrolling={false} />
    </Modal>
  );
};
