/*
 * @Author: hc
 * @Date: 2023-10-17 10:47:30
 * @LastEditTime: 2023-10-17 14:07:20
 * @LastEditors: hc
 * @Description: 
 */
import MobilePreviewer from 'dumi-theme-mobile/dist/builtins/Previewer';
import PcPreviewer from 'dumi/theme-default/builtins/Previewer';
import React from 'react';

/**
 * 重写预览组件的demoUrl，兼容hash路由
 * @param props
 * @returns
 */
export default function (props) {
  const Previewer = React.useMemo(() => {
    const isMobile = props.asset.id.indexOf('mobile') > -1;
    return isMobile ? MobilePreviewer : PcPreviewer;
  }, [props.asset.id]);
  return <Previewer {...props} demoUrl={props.demoUrl} />;
}
