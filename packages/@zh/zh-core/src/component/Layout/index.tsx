import { Spin } from 'antd';
import React, { CSSProperties, useContext, useMemo, useRef, useState } from 'react';
import { cssVar } from '../../globalConfig';
import { core } from '../../util';
import './index.less';
import { ILayout, LayoutComponent } from './interface';

import { EllipsisOutlined, LeftCircleFilled } from '@ant-design/icons';
import { useUpdateEffect } from '../../hook';

const LayoutContext = React.createContext<{ rootProps: any }>({
  rootProps: {}
});

function getClassName(className: string | undefined, direction?: string) {
  className = className ? `${className} ` : '';
  if (direction) {
    className += direction === 'row' ? 'layout-flex-row' : 'layout-flex-column';
  }
  return className;
}

/**
 * 获取slider组件位置索引（0表示在flex组件的前面，1表示在flex组件的后面）
 * @param children 当前slider的所有兄弟实例
 * @param index 当前slider的兄弟实例中的索引
 */
function getPositionIndex(children: any, index: number) {
  for (let i = index, len = children.length; i < len; i++) {
    if (children[i].props && children[i].props.flex) {
      return 0;
    }
  }
  return 1;
}

/**
 * 获取slider组件的位置及zIndex
 * @param children 父容器的所有子节点
 * @param direction 父容器的属性
 * @param props 当前slider的属性
 */
function getSliderPosition({ children, direction }: any, props: any): any {
  if (!children || (!core.isArray(children) && !core.isReactElement(children))) {
    return null;
  }
  if (!core.isArray(children)) {
    children = [children];
  }
  for (let i = 0, len = children.length; i < len; i++) {
    const childProps = children[i].props;
    if (core.isReactElement(children[i]) && childProps) {
      if (childProps === props) {
        const pIndex = getPositionIndex(children, i);
        const posArr = direction === 'row' ? ['left', 'right'] : ['top', 'bottom'];
        return {
          position: posArr[pIndex],
          zIndex: pIndex === 0 ? i + 1 : len - i + 1
        };
      }
      const p = getSliderPosition(childProps, props);
      if (p) {
        return p;
      }
    }
  }

  return null;
}

function useStyle(props) {
  const { direction, autoFit, style = {}, width, height, center } = props;
  if (width !== undefined) {
    style.width = width;
  }
  if (height !== undefined) {
    style.height = height;
  }
  if (autoFit) {
    const opt = direction === 'row' ? 'height' : 'width';
    style[opt] = style[opt] || '100%';
  }
  if (autoFit === false && direction !== 'row') {
    style['height'] = 'auto';
  }
  if (center) {
    const tmp = core.isArray(center) ? center : [center];
    if (direction === 'row') {
      tmp[0] && (style.alignItems = 'center');
      tmp[1] && (style.justifyContent = 'center');
    } else {
      tmp[0] && (style.justifyContent = 'center');
      tmp[1] && (style.alignItems = 'center');
    }
  }
  return style;
}

function LayoutCmp(props) {
  const { outRef, children, direction, center, className = '', autoFit, style, width, height, ...others } = props;
  const newStyle = useStyle(props);
  return (
    <div ref={outRef} className={`${getClassName(className, direction)} zh-layout`} {...others} style={newStyle}>
      <LayoutContext.Provider value={{ rootProps: { direction, children } }}>{children}</LayoutContext.Provider>
    </div>
  );
}

/**
 * 布局父容器
 * @param props
 * @constructor
 */
export const Layout: LayoutComponent<ILayout> = (props: ILayout) => {
  const { loading, direction = 'column', ...others } = props;

  if (loading === undefined) {
    return <LayoutCmp direction={direction} {...others} />;
  }

  return (
    <Spin spinning={loading} delay={250} wrapperClassName={`zh-spinning-${direction}`}>
      <LayoutCmp direction={direction} {...others} />
    </Spin>
  );
};

/**
 * 自适应布局，根据flex分配宽度
 * @param props
 * @constructor
 */
Layout.Flex = (props) => {
  const { flex = 1, children, style = {}, className, direction, width, height, center, ...others } = props;
  const newStyle = useStyle(props);
  return (
    <div className={getClassName(className, direction)} style={{ flex, overflow: 'auto', ...newStyle }} {...others}>
      {children}
    </div>
  );
};
Layout.Flex.defaultProps = {
  flex: 1
};

/**
 * 固定宽度，可伸缩组件布局
 * @param props
 * @constructor
 */
Layout.Slider = (props) => {
  const {
    children,
    icon: defaultIcon,
    style: defaultStyle,
    className,
    size,
    resize,
    resizeOption = {},
    draggable: defaultDraggable,
    draggableStyle,
    autoExpand = false,
    defaultCollapsed = false,
    collapsed,
    bordered,
    remeberKey,
    collapseOptions,
    ...otherProps
  } = props;
  const others = otherProps as any;
  const itRef = useRef<any>(null);
  const draggable = collapseOptions ? false : defaultDraggable;
  const { rootProps } = useContext(LayoutContext);
  const sliderPosition = useMemo(() => getSliderPosition(rootProps, props) || {}, []);
  const {
    minSize = collapseOptions ? getSliderDefaultSize(sliderPosition, collapseOptions).min : 0,
    maxSize = 800,
    doubleClick = !collapseOptions
  } = resizeOption;
  const sizeProp = sliderPosition.position === 'left' || sliderPosition.position === 'right' ? 'width' : 'height';

  const cacheKey = remeberKey ? `${core.getUser().userID}_${remeberKey}` : '';
  const cacheValue = cacheKey ? core.getCache(cacheKey, { toObject: true }) || {} : {};
  const [newProps, setNewProps] = useState({
    hidden: cacheValue.collapsed ?? collapsed ?? defaultCollapsed,
    style: { [sizeProp]: size }
  });

  const widthOrHeight = { [sizeProp]: size };
  const hiddenStyle = newProps.hidden ? { [sizeProp]: minSize } : newProps.style;

  const { icon, style } = getSliderProps({
    position: sliderPosition.position,
    size: hiddenStyle[sizeProp],
    collapseOptions,
    defaultStyle,
    defaultIcon,
    collapsed: newProps.hidden,
    onChange: () => {
      setNewProps((p) => ({ ...p, hidden: !p.hidden }));
    }
  });

  const elRef = useRef<any>();
  const sliderRef = useRef<any>();

  const sliderEvents = {
    offsetSize: 90,
    current: {
      mask: null, // mousedown增加一个全局遮罩，解决iframe区域无法拖动的问题
      bodyCursor: document.body.style.cursor,
      target: null,
      cloneTarget: null,
      position: sliderPosition.position
    } as any,
    mousedown(e: any) {
      if (autoExpand) {
        return;
      }
      sliderEvents.current.target = sliderRef.current;
      sliderEvents.current.cloneTarget = sliderEvents.current.target.cloneNode();
      // sliderEvents.current.cloneTarget.classList.add('slider-active');
      sliderEvents.current.cloneTarget.style.zIndex = sliderEvents.offsetSize;
      sliderEvents.current.pos = { x: e.clientX, y: e.clientY, distance: 0 };
      if (sizeProp === 'width') {
        sliderEvents.current.pos.size = elRef.current.offsetWidth;
        document.body.style.cursor = 'col-resize';
      } else {
        sliderEvents.current.pos.size = elRef.current.offsetHeight;
        document.body.style.cursor = 'row-resize';
      }
      elRef.current.appendChild(sliderEvents.current.cloneTarget);
      sliderEvents.current.target.classList.add('slider-dragging');

      window.addEventListener('mouseup', sliderEvents.mouseup, false);
      window.addEventListener('mousemove', sliderEvents.mousemove, false);
    },
    mousemove(e: any) {
      sliderEvents.current.cloneTarget.classList.add('slider-active');
      const movePos = { offset: -4, prop: '', distance: 0 };
      switch (sliderEvents.current.position) {
        case 'left':
          movePos.prop = 'right';
          movePos.distance = sliderEvents.current.pos.x - e.clientX;
          break;
        case 'right':
          movePos.prop = 'left';
          movePos.distance = e.clientX - sliderEvents.current.pos.x;
          break;
        case 'top':
          movePos.prop = 'bottom';
          movePos.distance = sliderEvents.current.pos.y - e.clientY;
          break;
        case 'bottom':
          movePos.prop = 'top';
          movePos.distance = e.clientY - sliderEvents.current.pos.y;
          break;
      }
      sliderEvents.current.pos.distance = 0 - movePos.distance;
      sliderEvents.current.cloneTarget.style[movePos.prop] = movePos.offset + movePos.distance + 'px';
      if (!sliderEvents.current.mask) {
        sliderEvents.current.mask = document.createElement('div');
        sliderEvents.current.mask.style.cssText =
          'position:absolute;top:0px;left:0px;right:0;bottom:0;opacity:0;background:#fff;z-index:99999;';
        document.body.appendChild(sliderEvents.current.mask);
      }
    },
    mouseup() {
      window.removeEventListener('mousemove', sliderEvents.mousemove, false);
      window.removeEventListener('mouseup', sliderEvents.mouseup, false);
      elRef.current.removeChild(sliderEvents.current.cloneTarget);
      sliderEvents.current.cloneTarget = null;
      sliderEvents.current.target.classList.remove('slider-dragging');
      sliderEvents.current.target = null;
      document.body.style.cursor = sliderEvents.current.bodyCursor;
      if (sliderEvents.current.mask) {
        document.body.removeChild(sliderEvents.current.mask);
        sliderEvents.current.mask = null;
      }
      if (sliderEvents.current.pos.distance) {
        const newSize = Math.min(
          maxSize,
          Math.max(sliderEvents.current.pos.size + sliderEvents.current.pos.distance, minSize)
        );
        setNewProps({
          hidden: newSize === minSize,
          style: {
            [sizeProp]: newSize
          }
        });
        resize?.(newSize, sizeProp);
      }
    }
  };
  const zIndex = sliderPosition.zIndex + sliderEvents.offsetSize;

  const onDoubleClick = (e: any) => {
    if (autoExpand || !doubleClick) {
      return;
    }
    e.stopPropagation();
    const nextHidden = !newProps.hidden;
    setNewProps((p) => ({ ...p, hidden: nextHidden }));
    resize?.(nextHidden ? minSize : newProps.style[sizeProp], sizeProp);
  };

  useUpdateEffect(() => {
    if (collapsed !== undefined && newProps.hidden !== collapsed) {
      setNewProps((p) => ({ ...p, hidden: collapsed }));
    }
  }, [collapsed]);

  useUpdateEffect(() => {
    if (newProps.style[sizeProp] !== size) {
      setNewProps((p) => ({ ...p, style: { [sizeProp]: size } }));
    }
  }, [size]);

  const isHidden = newProps.hidden && minSize === 0;

  useUpdateEffect(() => {
    cacheKey && core.setCache(cacheKey, { collapsed: newProps.hidden });
  }, [newProps.hidden, cacheKey]);

  if (autoExpand) {
    others.onMouseOver = () => {
      itRef.current && clearTimeout(itRef.current);
      itRef.current = setTimeout(() => {
        newProps.hidden && setNewProps((p) => ({ ...p, hidden: false }));
      }, 120);
    };
    others.onMouseOut = () => {
      itRef.current && clearTimeout(itRef.current);
      itRef.current = setTimeout(() => {
        itRef.current = null;
        !newProps.hidden && setNewProps((p) => ({ ...p, hidden: true }));
      }, 500);
    };
  }

  const getOuterStyle = (pos) => {
    const newStyle: CSSProperties = {};
    const m = { top: 'marginBottom', right: 'marginLeft', bottom: 'marginTop', left: 'marginRight' };
    if (bordered) {
      newStyle[m[pos]] = 6;
      newStyle.border = `1px solid ${isHidden ? 'transparent' : cssVar.borderColorSplit}`;
    }
    return { ...newStyle, ...style, padding: 0, ...widthOrHeight, ...hiddenStyle };
  };

  const getInnerStyle = () => {
    const newStyle: CSSProperties = {};
    if (style?.padding) {
      newStyle.padding = style.padding;
    }
    if (isHidden) {
      newStyle.opacity = 0;
    }
    return newStyle;
  };

  const dragIcon = draggable ? icon === undefined ? <DraggableIcon /> : icon : null;

  return (
    <div
      ref={elRef}
      className={`zh-slider ${className || ''}`}
      style={getOuterStyle(sliderPosition.position)}
      {...others}
    >
      <div style={getInnerStyle()}>{children}</div>
      {draggable && (
        <span
          ref={sliderRef}
          className={`slider-bar${autoExpand ? ' disabled' : ''} slider-${sliderPosition.position}${
            isHidden ? ' slider-hidden' : ''
          }${dragIcon ? ' slider-icon' : ''}`}
          style={{ zIndex, ...draggableStyle }}
          onMouseDown={sliderEvents.mousedown}
          onDoubleClick={onDoubleClick}
          children={
            dragIcon
              ? React.cloneElement(dragIcon, {
                  style: getIconStyle(sliderPosition.position, 40),
                  className: 'translate-icon',
                  position: sliderPosition.position
                })
              : null
          }
        />
      )}
      {icon && !draggable && (
        <span
          className={`icon-bar slider-icon slider-${sliderPosition.position}${isHidden ? ' slider-hidden' : ''}`}
          style={{ zIndex }}
          children={React.cloneElement(icon, {
            style: getIconStyle(sliderPosition.position, 50),
            className: 'translate-icon'
          })}
          onDoubleClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
};
Layout.Slider.defaultProps = {
  size: 180,
  draggable: true
};

function getIconStyle(pos, size = 36) {
  const style: CSSProperties = { backgroundColor: cssVar.primaryColor, borderRadius: 6, position: 'relative' };
  switch (pos) {
    case 'top':
    case 'bottom': {
      style.left = '50%';
      style.marginLeft = 0 - size / 2;
      style.marginTop = `${pos === 'bottom' ? -8 : 0}px`;
      style.width = size;
      style.height = 8;
      break;
    }
    case 'left':
    case 'right': {
      style.top = '50%';
      style.marginTop = 0 - size / 2;
      style.marginLeft = `${pos === 'right' ? -8 : 0}px`;
      style.width = 8;
      style.height = size;
      break;
    }
  }
  return style;
}

function DraggableIcon({
  style,
  className,
  position = ''
}: {
  style?: CSSProperties;
  className?: string;
  position?: string;
}) {
  return (
    <div className={className} style={style}>
      <EllipsisOutlined
        rotate={['top', 'bottom'].includes(position) ? 0 : 90}
        style={{ color: '#fff', fontSize: 22 }}
      />
    </div>
  );
}

const flexAlign = { top: 'start', bottom: 'end', center: 'center', left: 'start', right: 'end' };

function getSliderProps({ collapsed, size, onChange, defaultIcon, collapseOptions, defaultStyle, position }) {
  if (!collapseOptions) {
    return { icon: defaultIcon, style: defaultStyle };
  }

  const distance = parseInt(collapseOptions.style?.height ?? 30);
  function IconBar1({ className }: any) {
    const {
      title = '',
      align = position === 'top' ? 'center' : 'left',
      style,
      icon = () => (
        <span
          style={{
            transform: position === 'top' ? `rotate(${collapsed ? 0 : 180}deg)` : `rotate(${collapsed ? 180 : 0}deg)`,
            borderTop: '4px solid #999',
            borderRight: '4px solid transparent',
            borderLeft: '4px solid transparent',
            marginRight: 5
          }}
        />
      )
    } = collapseOptions;

    return (
      <div
        onClick={onChange}
        className={className}
        style={{
          height: 30,
          opacity: 1,
          left: 5,
          right: 5,
          justifyContent: flexAlign[align],
          transform: `translateY(${position === 'top' ? 0 : '-100%'})`,
          ...style
        }}
      >
        {core.isFunction(icon) ? icon(collapsed) : icon}
        {core.isFunction(title) ? title(collapsed) : title}
      </div>
    );
  }

  function IconBar2({ className }: any) {
    const {
      title = '',
      align = 'top',
      style: deafultStyle,
      icon = () => (
        <LeftCircleFilled
          rotate={collapsed ? (position === 'left' ? 180 : 0) : position === 'left' ? 0 : 180}
          style={{ color: cssVar.primaryColor }}
        />
      )
    } = collapseOptions;

    const { height, ...style } = deafultStyle || {};

    const divStyle: CSSProperties = collapsed
      ? { bottom: 0, writingMode: 'vertical-lr', letterSpacing: 5 }
      : { height: distance, whiteSpace: 'nowrap' };

    const spaceDistance = Math.max(6, (distance - 16) / 2);
    if (position === 'left') {
      if (!collapsed) {
        divStyle.flexDirection = 'row-reverse';
        divStyle.justifyContent = 'space-between';
        divStyle.paddingLeft = spaceDistance;
      }
      divStyle.transform = 'translateX(-100%)';
    } else {
      divStyle.transform = 'translateX(0)';
    }

    return (
      <div
        onClick={onChange}
        className={className}
        style={{
          top: 0 - distance,
          left: 0,
          width: size,
          opacity: 1,
          backgroundColor: cssVar.borderColorSplit,
          justifyContent: flexAlign[align],
          ...divStyle,
          ...style
        }}
      >
        <span
          style={{
            fontSize: Math.max(12, Math.min(16, distance - 2 * spaceDistance)),
            margin: spaceDistance,
            display: 'inline-flex'
          }}
        >
          {core.isFunction(icon) ? icon(collapsed) : icon}
        </span>
        {core.isFunction(title) ? title(collapsed) : title}
      </div>
    );
  }
  switch (position) {
    case 'top':
      return { icon: <IconBar1 />, style: { marginBottom: distance, ...defaultStyle } };
    case 'bottom':
      return { icon: <IconBar1 />, style: { marginTop: distance, ...defaultStyle } };
    case 'left':
      return { icon: <IconBar2 />, style: { marginTop: distance, ...defaultStyle } };
    case 'right':
      return { icon: <IconBar2 />, style: { marginTop: distance, ...defaultStyle } };
    default:
      return { icon: defaultIcon, style: defaultStyle };
  }
}

function getSliderDefaultSize(slider, collapseOptions) {
  const { position } = slider || {};
  const distance = parseInt(collapseOptions.style?.height ?? 30);
  return { min: ['left', 'right'].includes(position) ? distance : 0 };
}
