import { ArrowsAltOutlined, CloseOutlined, ShrinkOutlined } from '@ant-design/icons';
import type { ButtonProps, ModalFuncProps, ModalProps } from 'antd';
import { Modal as AntModal } from 'antd';
import { ModalStaticFunctions } from 'antd/es/modal/confirm';
import React, {
  createContext,
  CSSProperties,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import './index.less';

import { Resizable } from 'react-resizable';
import { ZhIcon } from '../../icon';
import { cssVar, getAntApp, Layout, Observer, zh, useDraggable, useUpdateEffect, type PromiseType } from '../../util';
import { polyfillResize } from '../../widgets';
import { Button } from '../antd/Button';

const destroyFns = new Set<() => void>();

type propsType<T> = { [key: string]: T };

type Destructor = () => void;

interface IModalIns {
  destroy: () => void;
  update: (configUpdate: ModalFuncProps) => void;
  getApi: () => any;
  setApi: (events: propsType<(...args) => void>) => void;
  subscribe: (fn: Function, type?: string) => Destructor;
  notify: (value?: any, type?: string) => Promise<any[]>;
  updateContent: (content: ReactNode) => void;
}

interface IFooter {
  children?: React.ReactNode | boolean;
  onOk?: (ins: IModalIns, payload: any[]) => any;
  onCancel?: (ins: IModalIns, payload: any[]) => any;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okButtonProps?: any;
  cancelButtonProps?: any;
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
}

interface ICtx {
  ins: IModalIns;
  size?: IModalParamProps['size'];
  params: propsType<any>;
  okClick?: () => Promise<void>;
  cancelClick?: () => Promise<void>;
}

export const ModalContext = createContext<ICtx>({ ins: {} as any, params: {} }); //创建context

export const useModal = () => {
  const ctx = useContext(ModalContext);
  return [ctx.ins, ctx] as [IModalIns, ICtx];
};

let injectModal: any = null;
export const InjectModalCtx = React.memo(() => {
  const [modal, contextHolder] = AntModal.useModal();
  injectModal = modal;
  return <>{contextHolder}</>;
});

const modalDefaultHeader: { style: CSSProperties; className: string } = {
  className: 'ant-modal-header zh-title-tip',
  style: {
    alignItems: 'center',
    padding: '0 var(--modal-header-padding-horizontal) 0 0',
    display: 'flex',
    position: 'relative',
    cursor: 'move',
    height: 'var(--modal-header-height, 40)',
    backgroundColor: 'var(--modal-header-bg)'
  }
};

export function ModalHeader({
  title,
  closable,
  fullscreenable,
  close,
  children
}: {
  title: ReactNode;
  closable: boolean;
  fullscreenable: boolean;
  close: Function;
  children?: ReactNode;
}) {
  const [, ctx] = useModal();
  const elRef = useRef<any>();
  const [full, setFull] = useState(false);
  const setTransform = useDraggable(elRef, {
    shouldCancel: (e) => full || !!zh.closest(e.target, (el) => el.className === 'disabled-draggable')
  });

  useUpdateEffect(() => {
    setTransform && setTransform(zh.closest(elRef.current, (el) => el.className === 'ant-modal-content'));
  }, [setTransform]);

  useUpdateEffect(() => {
    ctx.ins.getApi()?.setFullscreen?.(full);
    setTransform(
      zh.closest(elRef.current, (el) => el.className === 'ant-modal-content'),
      full ? { dx: 0, dy: 0 } : {}
    );
  }, [full]);

  // 如果是reactElement类型，可以直接重写整个Header
  if (zh.isReactElement(title)) {
    return <div ref={elRef}>{title}</div>;
  }

  return (
    <Layout direction="row" outRef={elRef} {...modalDefaultHeader}>
      <span className="zh-modal-title">{title}</span>
      <Layout.Flex>
        <div className="zh-modal-title-children">
          {zh.isReactElement(children)
            ? React.cloneElement(children as any, { className: 'disabled-draggable' })
            : children}
        </div>
      </Layout.Flex>
      {fullscreenable && (
        <div
          className="header-right-icon disabled-draggable"
          title={full ? '退出全屏' : '全屏'}
          onClick={() => setFull(!full)}
        >
          {full ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
        </div>
      )}
      {closable && (
        <div className="header-right-icon disabled-draggable" title="关闭" onClick={close as any}>
          <CloseOutlined />
        </div>
      )}
    </Layout>
  );
}

function Footer({ footer }: { footer?: IFooter }) {
  const ctx = useContext(ModalContext);
  const {
    children = null,
    okText = '确定',
    cancelText = '取消',
    okButtonProps = {},
    cancelButtonProps = {},
    leftNode,
    rightNode
  } = footer || {};
  if (children === false) {
    return null;
  }
  if (children && children !== true) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: `${ctx.size === 'large' ? 24 : 16}px`
      }}
    >
      {leftNode}
      {cancelText && (
        <Button
          {...cancelButtonProps}
          style={{ marginLeft: 8, minWidth: 68, ...cancelButtonProps.style }}
          onClick={ctx.cancelClick}
        >
          {cancelText}
        </Button>
      )}
      {okText && (
        <Button
          type="primary"
          {...okButtonProps}
          style={{ marginLeft: 8, minWidth: 68, ...okButtonProps.style }}
          onClick={ctx.okClick}
        >
          {okText}
        </Button>
      )}
      {rightNode}
    </div>
  );
}

function ModalContent({
  ins,
  size: sizeProp,
  title,
  contentStyle,
  children,
  footer,
  contentIcon,
  closable,
  fullscreen,
  params
}: {
  ins: IModalIns;
  title: any;
  contentIcon?: { type: string; style?: CSSProperties };
  size: IModalParamProps['size'];
  contentStyle?: CSSProperties;
  footer?: IFooter;
  params?: any;
  closable?: boolean;
  fullscreen?: boolean;
  children: ReactNode;
}) {
  const { onOk, onCancel } = footer || {};

  const providerValue = useMemo(() => {
    return {
      ins,
      params,
      size: sizeProp,
      // 水印
      waterMark: zh.external.getWaterMark?.(),
      // 确定事件
      okClick: async () => {
        const args = await ins.notify(ins, 'onOk');
        await onOk?.(ins, args);
      },
      // 取消事件
      cancelClick: async () => {
        const args = await ins.notify(ins, 'onCancel');
        if (onCancel) {
          await onCancel(ins, args);
        } else {
          ins?.destroy();
        }
      }
    };
  }, [ins, params, onOk, onCancel]);

  const divRef = useRef<HTMLDivElement>(null);

  const [size, setSize] = useState({ width: params.width, height: params.height });
  const [dragSize, setDragSize] = useState<CSSProperties>({
    position: 'absolute',
    backgroundColor: '#000',
    pointerEvents: 'none',
    width: params.width,
    height: params.height,
    zIndex: 2,
    opacity: 0.15,
    display: 'none',
    top: 0,
    left: 0
  });

  const onResize = (e, opt) => {
    setDragSize((prevState) => ({ ...prevState, width: opt.size.width, height: opt.size.height }));
  };

  const onResizeStart = (e, opt) => {
    setDragSize((prevState) => ({
      ...prevState,
      display: 'block',
      width: opt.size.width,
      height: opt.size.height
    }));
  };

  useUpdateEffect(() => {
    polyfillResize();
  }, [size]);

  const onResizeStop = (e, opt) => {
    zh.batchedUpdates(() => {
      setDragSize((prevState) => ({
        ...prevState,
        display: 'none',
        width: opt.size.width,
        height: opt.size.height
      }));
      setSize(opt.size);
      ins.update({
        width: opt.size.width
      });
    });
  };

  useEffect(() => {
    if (params.height > 0) {
      const newHeight = divRef.current?.clientHeight;
      if (newHeight && size.height !== newHeight) {
        setSize({ width: params.width, height: newHeight });
      }
    }
  }, []);

  const canResize = size.height !== 'auto';

  const content = (style?) => (
    <ModalContext.Provider value={providerValue}>
      <Layout style={{ ...style }}>
        {title && (
          <ModalHeader
            title={title}
            closable={!!closable}
            fullscreenable={canResize ? !!fullscreen : false}
            close={providerValue.cancelClick}
          />
        )}
        <Layout.Flex direction="row" style={contentStyle}>
          {contentIcon?.type
            ? React.createElement(ZhIcon[contentIcon?.type], {
                style: {
                  fontSize: 22,
                  alignSelf: 'start',
                  marginRight: 8,
                  color: cssVar.primaryColor,
                  ...contentIcon?.style
                }
              })
            : null}
          <Layout.Flex>{children}</Layout.Flex>
        </Layout.Flex>
        {footer && <Footer footer={footer} />}
      </Layout>
      {providerValue.waterMark}
    </ModalContext.Provider>
  );

  if (!canResize) {
    return content(size);
  } else {
    const { clientWidth, clientHeight } = document.documentElement || document.body;
    ins.setApi({
      setFullscreen(fullscreen = true) {
        if (fullscreen) {
          zh.batchedUpdates(() => {
            setSize({ width: '100vw', height: '100vh' });
            ins.update({
              width: '100vw',
              style: { marginTop: 0, maxWidth: '100vw', position: 'fixed', left: 0, top: 0 }
            });
          });
        } else {
          zh.batchedUpdates(() => {
            setSize({ width: dragSize.width, height: dragSize.height });
            ins.update({
              width: dragSize.width,
              style: { marginTop: -50, position: 'relative', left: 'unset', top: 'unset' }
            });
          });
        }
        return fullscreen;
      }
    });
    return (
      <Resizable
        width={dragSize.width}
        height={dragSize.height}
        minConstraints={[params.width / 2 || 100, params.height / 2 || 80]}
        maxConstraints={[clientWidth - 40, clientHeight - 130]}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        onResize={onResize}
      >
        <div ref={divRef}>
          <div
            style={{
              ...size,
              zIndex: 1,
              maxWidth: '100%',
              maxHeight: '100%',
              pointerEvents: `${dragSize.display === 'block' ? 'none' : 'initial'}`
            }}
          >
            {content()}
          </div>
          <div style={dragSize} />
        </div>
      </Resizable>
    );
  }
}

export interface IModalParamProps extends ModalFuncProps {
  /**
   * @description       设置Context的params参数
   */
  params?: {};
  /**
   * @description       模态框的宽度
   * @default           1000
   */
  width?: number | string;
  /**
   * @description       模态框的高度，设置值后开启resize功能
   * @default           auto
   */
  height?: number | string;
  /**
   * @description       标题
   */
  title?: ReactNode;
  /**
   * @description       内容
   */
  content: ReactNode;
  /**
   * @description       自定义底部按钮
   * @default           true
   */
  footer?: React.ReactNode | boolean;
  /**
   * @description       定义底部按钮左边组件, footer设置true有效
   */
  footerLeft?: React.ReactNode;
  /**
   * @description       定义底部按钮右边组件, footer设置true有效
   */
  footerRight?: React.ReactNode;
  /**
   * @description       是否显示右上角的关闭按钮
   * @default           true
   */
  closable?: boolean;
  /**
   * @description       是否显示右上角的全屏按钮
   * @default           true
   */
  fullscreen?: boolean;
  /**
   * @description       点击确定回调
   */
  onOk?: (ins: IModalIns, ...args) => any;
  /**
   * @description       点击取消回调
   */
  onCancel?: (ins: IModalIns, ...args) => any;
  /**
   * @description       ok 按钮 props
   */
  okButtonProps?: ButtonProps;
  /**
   * @description       cancel 按钮 props
   */
  cancelButtonProps?: ButtonProps;
  /**
   * @description       确定按钮文字
   * @default           确定
   */
  okText?: React.ReactNode;
  /**
   * @description       取消按钮文字
   * @default           取消
   */
  cancelText?: React.ReactNode;
  useModal?: boolean | Omit<ModalStaticFunctions, 'warn'>;
  contentStyle?: CSSProperties;
  size?: 'large';
}

/**
 * 打开一个模态窗口
 */
export function showModal(allProps: IModalParamProps & { contentIcon?: { type: string; style?: CSSProperties } }) {
  const {
    width,
    height,
    footer,
    footerLeft,
    footerRight,
    title,
    params,
    useModal = true,
    content,
    getContainer,
    closable = true,
    fullscreen = true,
    okText,
    cancelText,
    onOk,
    onCancel,
    okButtonProps = {},
    cancelButtonProps = {},
    afterClose: defaultAfterClose,
    contentStyle,
    className,
    type,
    icon,
    contentIcon,
    size = 'large',
    ...props
  } = allProps;
  const api: any = {};
  const observer = new Observer();
  const modalObj = useModal ? (zh.isBoolean(useModal) ? injectModal || AntModal : useModal) : AntModal;
  const afterClose = () => {
    defaultAfterClose?.();
  };
  const ins: IModalIns = {
    ...modalObj.info({
      width: width || 'auto',
      className: zh.classNames(className, 'zh-ant-modal'),
      icon: null,
      getContainer: getContainer ?? (zh.isRunMaster ? false : document.body),
      destroyOnClose: true,
      maskClosable: false,
      keyboard: false,
      title: null,
      footer: null,
      centered: true,
      zIndex: 1001,
      afterClose: () => {
        observer.clear();
        afterClose?.();
      },
      content: null,
      styles: { body: { padding: 0 }, content: { padding: 0 } },
      ...props
    }),
    getApi: () => api,
    setApi: (events) => zh.assign(api, events),
    subscribe: (...args) => {
      return observer.subscribe(...args);
    },
    notify: (...args) => {
      return observer.notify(...args);
    }
  };
  if (modalObj !== AntModal) {
    const oldDestroy = ins.destroy;
    ins.destroy = (...args) => {
      destroyFns.delete(ins.destroy);
      ins.notify([args], 'beforeDestroy');
      oldDestroy(...args);
      observer.clear();

      // antd4 useModal 模式下 afterClose 被重写了
      // if (afterClose) {
      //   setTimeout(() => {
      //     afterClose();
      //   }, 250);
      // }
    };
    destroyFns.add(ins.destroy);
  }

  const updateContent = (c, newOptions = {}) => {
    ins.update({
      ...newOptions,
      content: (
        <ModalContent
          ins={ins}
          title={title}
          size={size}
          contentIcon={contentIcon}
          closable={closable}
          fullscreen={fullscreen}
          contentStyle={contentStyle}
          footer={{
            children: footer,
            leftNode: footerLeft,
            rightNode: footerRight,
            okText,
            cancelText,
            okButtonProps,
            cancelButtonProps,
            onOk,
            onCancel
          }}
          params={{ ...params, width: width || 600, height: height || 'auto' }}
        >
          {c}
        </ModalContent>
      )
    });
  };

  updateContent(content);
  ins.updateContent = updateContent;
  return ins;
}

export function showAsyncModal(
  allProps: Omit<IModalParamProps, 'onOk' | 'onCancel' | 'afterClose'> & {
    /**
     * @description promise.resolve前的钩子，返回false取消resolve
     * @param isOk  是否点击确认按钮
     */
    beforeResolve?: (isOk: boolean) => PromiseType<boolean>;
    /**
     * @description 是否自动销毁
     * @default     false
     */
    autoDestroy?: boolean;
  }
) {
  const { beforeResolve, autoDestroy = false, ...params } = allProps;
  return new Promise<[Boolean, IModalIns]>((resolve) => {
    showModal({
      ...params,
      onOk: async (ins) => {
        if ((await beforeResolve?.(true)) !== false) {
          resolve([true, ins]);
          autoDestroy && ins.destroy();
        }
      },
      onCancel: async (ins) => {
        if ((await beforeResolve?.(false)) !== false) {
          resolve([false, ins]);
          autoDestroy && ins.destroy();
        }
      }
    });
  });
}

/**
 * 使用异步confirm
 * @param props
 */
export function showConfirm(props: ModalFuncProps) {
  return new Promise((resolve) => {
    getAntApp().modal.confirm({
      ...props,
      onOk() {
        resolve(true);
      },
      onCancel() {
        resolve(false);
      },
      afterClose() {
        props.afterClose?.();
      }
    });
  });
}

const oldDestroyAll = AntModal.destroyAll;
AntModal.destroyAll = () => {
  oldDestroyAll();
  destroyFns.forEach((close) => {
    close?.();
  });
};

export function InnerModal({ styles = {}, bodyStyle, ...props }: ModalProps) {
  return (
    <AntModal
      centered
      zIndex={1001}
      getContainer={zh.isRunMaster ? false : document.body}
      {...props}
      styles={{ ...styles, body: { ...styles.body, ...bodyStyle } }}
    />
  );
}

const Modal = InnerModal as typeof AntModal;

Object.keys(AntModal).forEach((key) => {
  if (!Modal.hasOwnProperty(key)) {
    Object.defineProperty(Modal, key, {
      get() {
        return getAntApp()?.modal?.[key] || AntModal[key];
      }
    });
  }
});

export { Modal };

zh.registerExternal({ showModal, showConfirm, showAsyncModal });
