import React, { useLayoutEffect } from 'react';

interface ILinkCss {
  src: string;
}

/**
 * 动态注入外部样式文件
 * @param src 脚本地址
 * @constructor
 */
export const LinkCss: React.FC<ILinkCss> = ({ src }) => {
  useLayoutEffect(() => {
    let link: any = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = src;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
      link = null;
    };
  }, []);

  return null;
};
