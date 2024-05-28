import { CSSProperties } from 'react';
import { zh } from '../../util';

export default function renderLabel(props) {
  const { width, label: originLabel, langKey, labelAlign } = props;
  const label = zh.getPageLang()[langKey] ?? originLabel;
  const labelStyle: CSSProperties = {
    width: width,
    display: 'inline-block',
    textAlign: labelAlign || 'right',
    wordBreak: 'break-all',
    whiteSpace: 'normal',
    maxHeight: '35px',
    lineHeight: 1.25
  };

  return <span style={labelStyle}>{label}</span>;
}
