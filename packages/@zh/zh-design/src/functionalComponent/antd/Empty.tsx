import { Empty as AntEmpty, type EmptyProps } from 'antd';

//AntEmpty.PRESENTED_IMAGE_SIMPLE = AntEmpty.PRESENTED_IMAGE_DEFAULT;

export function Empty(props: EmptyProps) {
  return <AntEmpty {...props} />;
}
