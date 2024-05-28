import { CSSProperties } from 'react';
import { Tooltip } from '../../functionalComponent';

const ellipsisStyle: CSSProperties = {
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  padding: '4px 11px'
};

export function Text({ value, style = {}, className }) {
  return (
    <Tooltip title={value} overflow>
      <div style={{ ...ellipsisStyle, ...style }} className={className}>
        {value}
      </div>
    </Tooltip>
  );
}
