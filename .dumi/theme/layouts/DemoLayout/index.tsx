/*
 * @Author: hc
 * @Date: 2023-10-13 20:08:50
 * @LastEditTime: 2023-10-16 17:49:07
 * @LastEditors: hc
 * @Description: 
 */
import DemoLayout from 'dumi-theme-mobile/dist/layouts/DemoLayout';
import { zh, RootContainer as PcRoot } from '@zh/zh-design';
import React from 'react';
import { useLocation } from 'umi';
import { initEnv } from '../../common';
import './index.less';

export default function (props) {
  const { pathname } = useLocation();
  const Root = React.useMemo(() => {
    initEnv(zh, 'pc');
    return PcRoot;
  }, [pathname]);
  return (
    <Root waterMark>
      <DemoLayout {...props} />
    </Root>
  );
}
