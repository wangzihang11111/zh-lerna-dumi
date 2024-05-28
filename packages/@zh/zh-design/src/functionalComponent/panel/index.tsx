import React, { CSSProperties, ReactNode, useRef } from 'react';
import { Layout, RightOutlined, zh, useRefValue, useUpdateEffect } from '../../util';
import { FullPage, type IFullPageProps } from '../fullPage';

function InnerPanel({
  title,
  extra = null,
  children,
  style,
  className,
  bodyStyle,
  headerStyle,
  autoFit = false,
  collapsible = false,
  showArrow = true,
  showPrefix = true,
  compact = false,
  open = true,
  onOpenChange,
  innerRef,
  blankStyle,
  flexDirection
}: IPanel & { innerRef?: React.RefObject<HTMLElement> }) {
  const [innerOpen, setInnerOpen] = useRefValue(open, true);
  const layoutStyle: CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: 2,
    marginBottom: `${autoFit || compact ? 0 : 'var(--inner-margin, 16px)'}`,
    ...style
  };

  // 收起的时候需要把高度属性删掉，否则没法正常收起
  if (!innerOpen) {
    delete layoutStyle.minHeight;
    delete layoutStyle.flex;
    delete layoutStyle.height;
  }

  useUpdateEffect(() => {
    if (innerOpen !== open) {
      onOpenChange?.(innerOpen);
    }
  }, [innerOpen]);

  const titleClick = (e) => {
    if (!collapsible) {
      return;
    }
    if (
      !e ||
      e.target === e.currentTarget ||
      e.target.parentNode === e.currentTarget ||
      zh.closest(e.target, (el) => el.classList?.contains('zh-collapse-handle'))
    ) {
      setInnerOpen?.(!innerOpen);
      return;
    }
  };

  const hasHeader = !!(collapsible || title || extra);
  const offset = compact ? -2 : 0;
  const getHeader = (innerStyle: CSSProperties = {}) => {
    if (hasHeader) {
      return (
        <div
          className={zh.classNames('zh-panel-title')}
          onClick={titleClick}
          style={{
            height: 'auto',
            minHeight: compact ? 36 : 45,
            cursor: `${collapsible ? 'pointer' : 'default'}`,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            paddingRight: 12,
            ...innerStyle,
            ...headerStyle
          }}
        >
          {showPrefix && (
            <div style={{ backgroundColor: 'var(--primary-color)', width: 4, height: 12, flexShrink: 0 }} />
          )}
          <div
            className="zh-collapse-handle"
            style={{ fontSize: 16 + offset, marginLeft: showPrefix ? 12 + offset : 16 + offset, fontWeight: 600 }}
          >
            {title || ''}
          </div>
          <span
            ref={innerRef}
            className="zh-collapse-handle"
            style={{ minWidth: 30, textAlign: 'right', flex: 1, width: 0, ...blankStyle }}
          />
          {extra}
          {collapsible && showArrow ? (
            <span style={{ fontSize: 0, marginLeft: 8 }}>
              <RightOutlined
                className="zh-collapse-handle"
                style={{ transition: 'all .3s ease', fontSize: 16, transform: `rotate(${innerOpen ? 90 : 0}deg)` }}
              />
            </span>
          ) : null}
        </div>
      );
    }
    return null;
  };
  if (children) {
    return (
      <Layout autoFit={autoFit} className={zh.classNames('zh-panel', className)} style={layoutStyle}>
        {getHeader()}
        <Layout.Flex
          direction={flexDirection}
          style={{ padding: 16 + offset, ...bodyStyle, display: `${innerOpen ? 'block' : 'none'}` }}
        >
          {children}
        </Layout.Flex>
      </Layout>
    );
  }
  if (hasHeader) {
    return (
      <div className={zh.classNames('zh-panel', className)} style={layoutStyle}>
        {getHeader({ borderBottom: 0 })}
      </div>
    );
  }
  return null;
}

/**
 * 容器组件
 */
export const Panel = React.forwardRef<{ setFullPage(full: boolean): void }, IPanel>(
  ({ fullScreen = false, ...props }, ref) => {
    const hasHeader = !!(props.collapsible || props.title || props.extra);
    const innerRef = useRef<HTMLElement>(null);
    if (fullScreen && hasHeader) {
      return (
        <FullPage ref={ref} getIconContainer={() => innerRef.current} {...(fullScreen === true ? {} : fullScreen)}>
          <InnerPanel {...props} innerRef={innerRef} />
        </FullPage>
      );
    } else {
      return <InnerPanel {...props} />;
    }
  }
);

export interface IPanel {
  /**
   * @description       标题
   */
  title?: ReactNode;
  /**
   * @description       标题扩展内容
   */
  extra?: ReactNode;
  blankStyle?: CSSProperties;
  /**
   * @description       内容
   */
  children?: ReactNode;
  /**
   * @description       整体样式
   */
  style?: CSSProperties;
  /**
   * @description       内容样式
   */
  bodyStyle?: CSSProperties;
  /**
   * @description       头部样式
   */
  headerStyle?: CSSProperties;
  className?: string;
  /**
   * @description       容器是否自适应父容器高度
   */
  autoFit?: boolean;
  /**
   * @description       是否支持全屏
   */
  fullScreen?: boolean | Partial<IFullPageProps>;
  /**
   * @description       内容区域的flex布局方向direction
   */
  flexDirection?: 'column' | 'row';
  /**
   * @description       是否可折叠
   * @default           false
   */
  collapsible?: boolean;
  /**
   * @description       是否展示当前面板上的箭头（collapsible 为true有效）
   * @default           true
   */
  showArrow?: boolean;
  /**
   * @description       展开状态（collapsible 为true有效）
   * @default           true
   */
  open?: boolean;
  /**
   * @description       展开状态切换时（collapsible 为true有效）
   */
  onOpenChange?(open: boolean): void;
  /**
   * @description       是否标题前面的竖杠标记
   * @default           true
   */
  showPrefix?: boolean;
  /**
   * @description       紧凑模式
   * @default           false
   */
  compact?: boolean;
}
