import { CSSProperties } from 'react';

export function getFormStyle(formConf: any, rowStyle?: CSSProperties): CSSProperties {
  return {
    justifyContent: formConf.justifyContent || 'flex-start',
    flexWrap: 'wrap',
    marginLeft: 0,
    marginRight: 0,
    ...rowStyle,
    ...formConf.style
  };
}

//获取label配置
export function Label(formConf: any, item: any, required: boolean) {
  const labeWidth = item.labelWidth || formConf.labelWidth || 120;
  const labelAlign = item.labelAlign || formConf.labelAlign || 'right';
  const style = {
    display: 'inline-block',
    width: `${labeWidth}px`,
    textAlign: labelAlign,
    marginRight: '10px',
    color: required ? 'red' : ''
  };
  return <span style={style}>{item.label}</span>;
}
