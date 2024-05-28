import { Result } from 'antd';

/**
 * 404 页面
 * @constructor
 */
export function NotFound() {
  const pathname = window.location['prevRoute']?.pathname || '#';
  return (
    <Result
      status="404"
      title="404"
      subTitle={
        <span>
          Sorry, the page<span style={{ fontWeight: 'bold', fontSize: 14, margin: '0 6px' }}>{pathname}</span>you
          visited does not exist.`
        </span>
      }
    />
  );
}
