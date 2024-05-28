import { LoadingOutlined } from '@ant-design/icons';
import { Tooltip as AntTooltip } from 'antd';
import { TooltipProps } from 'antd/es/tooltip';
import { useRef } from 'react';
import { zh, useAsyncEffect, useRefState, useReturnCallback } from '../../util';
import { getGlobalPopupContainer } from '../../widgets';

/**
 * 文字提示
 * @param props titleDep title更新的依赖值，title为函数时有效
 * @constructor
 */
export function Tooltip(props: TooltipProps & { titleDep?: any; overflow?: boolean }) {
  const {
    defaultOpen = false,
    titleDep,
    title: propTitle,
    open: propOpen,
    onOpenChange: propOnOpenChange,
    overlayInnerStyle,
    overflow,
    color = '#fff',
    ...others
  } = props;
  const ref = useRef<HTMLElement>();
  const [open, setOpen] = useRefState(propOpen ?? defaultOpen);
  const [title, setTitle] = useRefState(zh.isFunction(propTitle) ? <LoadingOutlined /> : propTitle);

  const dep = zh.isFunction(propTitle) ? '' : propTitle;

  const getTitle = useReturnCallback(() => {
    return zh.isFunction(propTitle) ? propTitle() : propTitle;
  }, [titleDep, dep]);

  const onOpenChange = (v) => {
    if (v) {
      const targetEl = ref.current;
      if (overflow && targetEl) {
        if (targetEl.scrollWidth > targetEl.offsetWidth || targetEl.scrollHeight > targetEl.offsetHeight + 2) {
          setOpen(true);
        }
      } else {
        setOpen(true);
      }
    } else {
      setOpen(false);
    }
    propOnOpenChange?.(v);
  };

  useAsyncEffect(async () => {
    if (open) {
      let ret = getTitle();
      if (zh.isPromise(ret)) {
        setTitle(<LoadingOutlined />);
        ret = await ret;
      }
      if (ret) {
        setTitle(ret);
      } else {
        setOpen(false);
      }
    }
  }, [open, titleDep]);

  const otherProps = { open, onOpenChange };

  const getPopupContainer = (triggerNode) => {
    ref.current = triggerNode;
    return getGlobalPopupContainer(triggerNode);
  };

  return (
    <AntTooltip
      getPopupContainer={getPopupContainer}
      mouseEnterDelay={0.5}
      color={color}
      overlayInnerStyle={{
        color: ['#fff', '#FFFFFF', '#ffffff'].includes(color) ? '#333' : '#fff',
        ...overlayInnerStyle
      }}
      destroyTooltipOnHide
      {...otherProps}
      {...others}
      title={title}
    />
  );
}
