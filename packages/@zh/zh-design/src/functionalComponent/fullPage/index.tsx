import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import React, { CSSProperties, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { zh, useUpdateEffect } from '../../util';

import './index.less';

export interface IFullPageProps {
  children: React.ReactNode;
  iconStyle?: CSSProperties;
  style?: CSSProperties;
  innerStyle?: CSSProperties;
  /**
   * @description   是否显示icon图标
   * @default       true
   */
  showIcon?: boolean;
  /**
   * @description   是否常驻icon图标，showIcon=true 时有效
   * @default       false
   */
  residentIcon?: boolean;
  /**
   * @description   全屏的dom层级
   * @default       99
   */
  zIndex?: number;
  className?: string;
  /**
   * @description   自定义全屏按钮所在的容器
   */
  getIconContainer?(): HTMLElement | null;
  /**
   * @description   全屏切换后回调
   */
  onFullScreen?(full: boolean): void;
  /**
   * @description   全屏撑满的容器
   * @default       整个窗口或子应用窗口
   */
  getFullContainer?(): HTMLElement | null;
}

const fullStyleInBody = {
  position: 'fixed',
  width: '100%',
  height: '100%',
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
};

function InnerPage(
  {
    children,
    className,
    iconStyle = {},
    style = {},
    showIcon = true,
    residentIcon = false,
    innerStyle = {},
    getIconContainer,
    getFullContainer,
    zIndex = 99,
    onFullScreen
  }: IFullPageProps,
  ref
) {
  const el = useRef<any>();
  const [isFullPage, setIsFullPage] = useState(false);
  const _innerStyle = { width: '100%', height: '100%', ...innerStyle };
  const [fullStyle, setFullStyle] = useState({});
  const fullHandle = (newIsFullPage: boolean) => {
    if (newIsFullPage) {
      const { top, left, right, bottom } = el.current?.getBoundingClientRect?.() || {};
      if (top !== undefined) {
        const mw = document.documentElement.clientWidth;
        const mh = document.documentElement.clientHeight;
        el.current.parentStyle = {
          width: el.current.parentElement.offsetWidth,
          height: el.current.parentElement.offsetHeight
        };
        el.current.parentElement.style.width = el.current.parentStyle.width + 'px';
        el.current.parentElement.style.height = el.current.parentStyle.height + 'px';
        el.current.style.position = 'fixed';
        el.current.style.top = top + 'px';
        el.current.style.left = left + 'px';
        el.current.style.right = mw - right + 'px';
        el.current.style.bottom = mh - bottom + 'px';
        el.current.style.width = 'auto';
        el.current.style.height = 'auto';
        setTimeout(() => {
          setIsFullPage(true);
        });
        return;
      }
    }
    el.current.style.width = zh.isNumber(_innerStyle.width) ? _innerStyle.width + 'px' : _innerStyle.width;
    el.current.style.height = zh.isNumber(_innerStyle.height) ? _innerStyle.height + 'px' : _innerStyle.height;
    setIsFullPage(newIsFullPage);
  };

  useUpdateEffect(() => {
    if (isFullPage) {
      const escEvent = (e) => {
        if (e.keyCode === 27) {
          setIsFullPage(false);
        }
      };
      let newStyle = fullStyleInBody;
      let io: any;
      let container: any = getFullContainer?.();
      if (!container) {
        const name = zh.external.getQianKun?.().name;
        container = name ? document.body.querySelector(`div[data-qiankun="${name}"]`) : null;
      }
      if (container) {
        el.current.targetContainer = container;
        el.current.lastDisplay = el.current.style.display;
        const domRect = container.getBoundingClientRect();
        const mw = document.documentElement.clientWidth;
        const mh = document.documentElement.clientHeight;
        newStyle = {
          ...fullStyleInBody,
          left: domRect.left,
          top: domRect.top,
          right: mw - domRect.right,
          bottom: mh - domRect.bottom
        };
        if (window.IntersectionObserver) {
          let io: any = new IntersectionObserver(
            (entries) => {
              if (el.current) {
                if (entries[0].isIntersecting) {
                  el.current.style.display = el.current.lastDisplay;
                } else {
                  el.current.style.display = 'none';
                }
              }
            },
            {
              root: el.current.targetContainer.parentElement,
              threshold: [0, 1]
            }
          );
          io.observe(el.current.targetContainer);
        }
      } else {
        el.current.targetContainer = document.body;
      }
      el.current.lastOverFlow = el.current.targetContainer.style.overflow;
      el.current.targetContainer.style.overflow = 'hidden';
      document.addEventListener('keydown', escEvent);
      setFullStyle(newStyle);
      return () => {
        document.removeEventListener('keydown', escEvent);
        if (io) {
          io.disconnect();
          io = null;
        }
      };
    } else {
      el.current.targetContainer.style.overflow = el.current.lastOverFlow;
    }
    onFullScreen?.(isFullPage);
  }, [isFullPage]);

  useImperativeHandle(ref, () => ({
    setFullPage: fullHandle
  }));

  return (
    <div
      className={className}
      style={
        isFullPage ? { ...style, ...el.current.parentStyle } : { display: 'inline-block', width: '100%', ...style }
      }
    >
      <div
        className={zh.classNames('zh-full-page', { 'resident-icon': showIcon && (residentIcon || isFullPage) })}
        ref={el}
        style={isFullPage ? { zIndex, ..._innerStyle, ...fullStyle } : _innerStyle}
      >
        <Icon
          getIconContainer={getIconContainer}
          showIcon={showIcon}
          onClick={() => fullHandle(!isFullPage)}
          iconStyle={iconStyle}
          isFullPage={isFullPage}
        />
        {children}
      </div>
    </div>
  );
}

function Icon({ getIconContainer, showIcon, onClick, isFullPage, iconStyle }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const targetEl: any = useMemo(() => {
    const iconContaner = zh.isFunction(getIconContainer) ? getIconContainer() : null;
    if (iconContaner && !iconContaner.style.position) {
      iconContaner.style.position = 'relative';
    }
    return iconContaner;
  }, [mounted]);

  if (mounted) {
    const getChildren = (style: CSSProperties) => {
      return (
        showIcon && (
          <span
            title={isFullPage ? '退出全屏' : '全屏'}
            onClick={onClick}
            className="btn-icon"
            style={{ fontSize: 18, lineHeight: 0, ...style, ...iconStyle }}
            children={isFullPage ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          />
        )
      );
    };
    return targetEl
      ? ReactDOM.createPortal(getChildren({ top: '50%', right: 5, transform: 'translateY(-50%)' }), targetEl)
      : getChildren({ top: 12, right: 12 });
  }
  return null;
}

export const FullPage = React.forwardRef<{ setFullPage(full: boolean): void }, IFullPageProps>(InnerPage);
