import { useRouteMeta } from 'dumi';
import PcLayout from 'dumi/theme-default/layouts/DocLayout';
import { zh, RootContainer } from '@zh/zh-design';
import React, { useMemo } from 'react';
import { useLocation } from 'umi';
import { initEnv } from '../../common';
import './index.less';

export default (props) => {
  let { frontmatter } = useRouteMeta();
  const { pathname } = useLocation();
  frontmatter.toc = 'content';
  useMemo(() => {
    initEnv(zh, 'pc');
  }, []);

  return (
    <RootContainer waterMark>
      <PcLayout {...props} />
    </RootContainer>
  );
};
