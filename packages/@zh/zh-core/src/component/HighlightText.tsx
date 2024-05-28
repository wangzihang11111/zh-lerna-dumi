import React, { CSSProperties } from 'react';

/**
 * 高亮组件
 */
export const HighlightText: React.FC<IHighText> = ({ content, keyword, style }) => {
  return React.useMemo(() => {
    if (!content || !keyword) {
      return <>{content}</>;
    }
    const a = content.toLowerCase();
    const b = keyword.toLowerCase();
    if (a.indexOf(b) < 0) {
      return <>{content}</>;
    }
    const reg = new RegExp(keyword, 'gi');
    const txtArr = content.split(reg);
    const result: React.ReactNode[] = [];
    txtArr.forEach((txt, index) => {
      if (index > 0) {
        result.push(
          <span key={index} style={{ color: '#FF6600', ...style }}>
            {keyword}
          </span>
        );
      }
      if (txt) {
        result.push(txt);
      }
    });
    return <>{result}</>;
  }, [content, keyword]);
};

interface IHighText {
  /**
   * @description     文本内容
   */
  content: string;
  /**
   * @description     需要高亮显示的文本
   */
  keyword: string;
  /**
   * @description     高亮文本样式
   */
  style?: CSSProperties;
}
