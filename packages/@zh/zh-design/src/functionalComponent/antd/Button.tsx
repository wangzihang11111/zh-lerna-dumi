import { Button as AntButton, Popconfirm } from 'antd';
import type { ButtonProps, ButtonType } from 'antd/es/button';
import type { PopconfirmProps } from 'antd/es/popconfirm';
import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { compHoc, zh, useRefCallback, useRefState } from '../../util';

function useButtonClick({
  loading = false,
  onClick,
  containerId,
  delay = 120,
  key,
  getClickParams
}: {
  loading?: boolean;
  onClick?: Function;
  containerId?: string;
  delay?: number;
  key?: string;
  getClickParams?: Function;
}) {
  const [btnLoading, setBtnLoading] = useRefState(loading);
  const isClicking = useRef<any>(0);

  // 解决重复点击
  const refreshClicking = () => {
    isClicking.current = 2;
    setTimeout(() => {
      isClicking.current = 0;
    }, delay);
  };

  const btnClick = useRefCallback(async (e) => {
    if (isClicking.current) {
      return;
    }
    isClicking.current = 1;
    const params = await getClickParams?.();
    const p = onClick?.({ ...e, containerId, key, ...params });
    if (zh.isPromise(p)) {
      // 防止按钮抖动
      setTimeout(() => {
        if (isClicking.current === 1) {
          setBtnLoading(true);
        }
      });
      try {
        return await p;
      } catch (e) {
        console.log(e);
      } finally {
        setBtnLoading(false);
        refreshClicking();
      }
    } else {
      refreshClicking();
      return p;
    }
  });

  useEffect(() => {
    setBtnLoading(loading);
  }, [loading]);

  return { loading: btnLoading, onClick: btnClick };
}

interface IButton extends ButtonProps {
  containerId?: string;
  getClickParams?: Function;
}

export const Button = compHoc<IButton>((props) => {
  const { outRef, observer, containerId, getClickParams, ...others } = props as any;
  const key = others.originid || others['data-cid'] || others.id;
  const { loading, onClick } = useButtonClick({
    loading: others.loading,
    onClick: others.onClick,
    containerId: containerId ?? key,
    key,
    getClickParams
  });
  return <AntButton ref={outRef} {...others} onClick={onClick} loading={loading} />;
}, 'Button');

interface IConfirmButton extends PopconfirmProps {
  type?: ButtonType;
  size?: 'small' | 'middle' | 'large';
  danger?: boolean;
  buttonStyle?: CSSProperties;
  buttonProps?: ButtonProps;
  onBeforeOpen?: React.MouseEventHandler<HTMLElement>;
}

export const ConfirmButton = compHoc<IConfirmButton>(
  ({
    children,
    size = 'middle',
    type = 'primary',
    buttonStyle,
    onBeforeOpen,
    onConfirm,
    onCancel,
    danger = false,
    observer,
    buttonProps,
    ...props
  }: any) => {
    const [visible, setVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [btnLoading, setBtnLoading] = useState(false);

    const handleOk = async () => {
      setConfirmLoading(true);
      await onConfirm?.();
      setVisible(false);
      setConfirmLoading(false);
    };

    const handleCancel = () => {
      setVisible(false);
      setConfirmLoading(false);
      onCancel?.();
    };

    const onVisibleChange = async (value, e) => {
      if (!e && !confirmLoading) {
        if (value && onBeforeOpen) {
          let condition: any = onBeforeOpen(e);
          if (zh.isPromise(condition)) {
            setBtnLoading(true);
            condition = await condition;
            setBtnLoading(false);
          }
          if (condition === false) {
            return;
          }
        }
        setVisible(value);
      }
    };

    return (
      <Popconfirm
        {...props}
        onOpenChange={onVisibleChange}
        open={visible}
        style={{ minWidth: 300 }}
        onConfirm={handleOk}
        cancelButtonProps={{ size: 'middle', ...props.cancelButtonProps }}
        okButtonProps={{ loading: confirmLoading, size: 'middle', ...props.okButtonProps }}
        onCancel={handleCancel}
      >
        <AntButton
          style={buttonStyle}
          type={type}
          disabled={props.disabled}
          {...buttonProps}
          loading={btnLoading}
          danger={danger}
          size={size}
          children={children}
        />
      </Popconfirm>
    );
  }
);
