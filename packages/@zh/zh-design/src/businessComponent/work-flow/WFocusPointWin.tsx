import { useContext, useEffect } from 'react';
import { Layout, zh, useApi } from '../../util';
import { ModalContext } from '../../functionalComponent';
import { Form } from '../../configComponent';

/**
 * 确认事项弹窗内容
 * @param callback
 * @param fields
 * @constructor
 */
export function WFocusPointWin({ callback, fields }) {
  const formRef = useApi();
  const mCtx = useContext(ModalContext);

  useEffect(() => {
    mCtx.ins.setApi({
      invokeOkHandler: async () => {
        const api = formRef.current?.getApi();
        try {
          const values = await api.validateForm();
          Object.keys(values).forEach((key) => {
            if (zh.isObject(values[key]) && values[key].hasOwnProperty('value')) {
              values[key] = values[key].value;
            }
          });
          mCtx.ins.destroy();
          callback(values);
        } catch (e) {
          console.log(e);
        }
      }
    });
  }, []);
  return (
    <Layout style={{ height: 300, padding: '15px 5px 0 5px' }}>
      <Form ref={formRef} colspan={1} config={fields} />
    </Layout>
  );
}
