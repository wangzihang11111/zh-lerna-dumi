import CssMotion from 'rc-motion';
import React, { CSSProperties } from 'react';

export function ZhCollapse({
  visible,
  children,
  style
}: {
  visible: boolean;
  children: React.ReactNode;
  style?: CSSProperties;
  size?: 'width' | 'height';
}) {
  return (
    <CssMotion {...initCollapseMotion({})} visible={visible}>
      {({ className: motionClassName, style: motionStyle }) => (
        <div className={motionClassName} style={{ ...style, ...motionStyle }}>
          {children}
        </div>
      )}
    </CssMotion>
  );
}

const getCollapsedSize = (size) => () => ({ [size]: 0, opacity: 0 });
const getRealSize = (size) => (node) => {
  const { scrollHeight, scrollWidth } = node;
  return { [size]: size === 'height' ? scrollHeight : scrollWidth, opacity: 1 };
};
const getCurrentSize = (size) => (node) => ({
  [size]: node ? (size === 'height' ? node.offsetHeight : node.offsetWidth) : 0
});
const skipOpacityTransition = (size) => (_, event) => event?.deadline === true || event.propertyName === size;

const initCollapseMotion = ({ rootCls = 'ant', size = 'height' }) => ({
  motionName: `${rootCls}-motion-collapse`,
  onAppearStart: getCollapsedSize(size),
  onEnterStart: getCollapsedSize(size),
  onAppearActive: getRealSize(size),
  onEnterActive: getRealSize(size),
  onLeaveStart: getCurrentSize(size),
  onLeaveActive: getCollapsedSize(size),
  onAppearEnd: skipOpacityTransition(size),
  onEnterEnd: skipOpacityTransition(size),
  onLeaveEnd: skipOpacityTransition(size),
  motionDeadline: 500,
  motionAppear: false,
  forceRender: true
});
