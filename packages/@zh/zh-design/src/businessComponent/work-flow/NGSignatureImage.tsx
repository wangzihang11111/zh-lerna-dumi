import { Form } from 'antd';
import { CSSProperties, useContext, useEffect, useState } from 'react';
import { Password, Select } from '../../baseComponent';
import { Button, ModalContext, usingProgress } from '../../functionalComponent';
import { zh, useRefCallback } from '../../util';
import { getSignatureListByCurrentUser, validSignatureInfoByPassword } from './service';
import { commonStyle, NGLang, wfAlert, wfModal } from './util';

interface IProps {
  onChange?: ({ code, url }) => void;
  signature?: { code: string; url: string };
  style?: CSSProperties;
}

export function WfSignatureImage(props: IProps) {
  const [signature, setSignature] = useState({
    code: props.signature?.code || '',
    url: props.signature?.url || zh.getHttpUrl('NG3Resource/pic/OtherHelp_Sign.jpg')
  });

  const onChangeHandler = useRefCallback((obj) => {
    setSignature(obj);
    props.onChange?.(obj);
  });

  const handleDBClick = useRefCallback(async () => {
    const sigList = await usingProgress(() => getSignatureListByCurrentUser(), { title: NGLang.getSignature });
    if (!sigList.length) {
      await wfAlert(NGLang.alertTitle, NGLang.hasNoSignature);
      return;
    }
    await wfModal({
      title: NGLang.signatureWinTitle,
      width: 500,
      content: <ModalContent sigList={sigList} onChange={onChangeHandler} />
    });
  });

  return (
    <div
      title="双击选择"
      onDoubleClick={handleDBClick}
      style={{
        ...commonStyle.borderStyle,
        cursor: 'pointer',
        backgroundImage: `url(${signature.url})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        height: '100%',
        ...props?.style
      }}
    />
  );
}

const style: any = {
  main: {
    display: 'flex',
    flexDirection: 'column',
    padding: '5px 12px',
    height: 240
  },
  form: {
    width: '100%',
    flexWrap: 'nowrap',
    marginBottom: '5px',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  formItem: { width: '40%' },
  btnItem: { width: '20%' },
  imgStyle: { overflow: 'auto', display: 'flex', flex: 1, ...commonStyle.borderStyle }
};

function ModalContent({ sigList, onChange }) {
  const [currData, setCurrData]: any = useState(null);
  const [form] = Form.useForm();
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState('');
  const [pwdIsRight, setPwdIsRight] = useState(false);
  const ctx = useContext(ModalContext);

  const previewHandler = useRefCallback(async () => {
    if (!currData || !currData.PhId) {
      await wfAlert(NGLang.alertTitle, NGLang.choseSignature);
      return;
    }
    const pwd = form.getFieldValue('pwd');
    if (!pwd) {
      await wfAlert(NGLang.alertTitle, NGLang.noPwd);
      return;
    }
    setBtnLoading(true);
    const valid = await validSignatureInfoByPassword({ PhId: currData.PhId, pwd });
    setBtnLoading(false);
    if (valid) {
      setImgSrc(currData?.MarkPath);
      setBtnDisabled(true);
      setPwdIsRight(true);
      return;
    }
    await wfAlert(NGLang.alertTitle, NGLang.pwdError);
  });
  const invokeOkHandler = useRefCallback(async () => {
    if (!currData) {
      await wfAlert(NGLang.alertTitle, NGLang.choseSignature);
      return;
    }
    if (!pwdIsRight) {
      const pwd = form.getFieldValue('pwd');
      if (!pwd) {
        await wfAlert(NGLang.alertTitle, NGLang.noPwd);
        return;
      } else {
        const valid = await validSignatureInfoByPassword({ PhId: currData.PhId, pwd });
        if (!valid) {
          await wfAlert(NGLang.alertTitle, NGLang.pwdError);
          return;
        }
      }
    }
    onChange?.({ code: currData.PhId, url: currData.MarkPath });
    ctx.ins.destroy();
  });

  useEffect(() => {
    ctx.ins.setApi({
      invokeOkHandler,
      invokeCancelHandler: () => {
        ctx.ins.destroy();
      }
    });
  }, [invokeOkHandler]);

  const handleSignatureSelect = useRefCallback((val, { origin }) => {
    form.setFieldsValue({ pwd: '' });
    if (origin.MarkPass) {
      setPwdIsRight(false);
      setImgSrc('');
      setBtnDisabled(false);
    } else {
      setPwdIsRight(true);
      setImgSrc(origin.MarkPath);
      setBtnDisabled(true);
    }
    setCurrData(origin);
  });

  return (
    <main style={style.main}>
      <Form layout="inline" style={style.form} form={form}>
        <Form.Item
          style={style.formItem}
          messageVariables={{ another: 'good' }}
          label={NGLang.taskHisSignature}
          name="cname"
        >
          <Select
            size="small"
            placeholder={NGLang.signatureWinTitle}
            options={sigList}
            onSelect={handleSignatureSelect}
          />
        </Form.Item>
        <Form.Item style={style.formItem} label={NGLang.pwd} name="pwd">
          <Password size="small" />
        </Form.Item>
        <Button size="small" loading={btnLoading} type="primary" onClick={previewHandler} disabled={btnDisabled}>
          {NGLang.perview}
        </Button>
      </Form>
      <div style={style.imgStyle}>
        <img src={imgSrc} style={{ margin: 'auto' }} alt="" />
      </div>
    </main>
  );
}
