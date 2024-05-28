import { CSSProperties, useState } from 'react';
import { useObjectEffect } from '../hook';

export interface IWaterMarkProps {
  imageWidth?: number;
  imageHeight?: number;
  textColor?: string;
  fontStyle?: string;
  fontSize?: number;
  angle?: number;
  text?: string;
  style?: CSSProperties;
}

export function createWaterMark(props: IWaterMarkProps) {
  const {
    imageWidth = 300,
    imageHeight = 250,
    fontSize = 14,
    fontStyle = 'Microsoft JhengHei',
    angle = -20,
    text = '中国建筑',
    textColor = 'rgba(180, 180, 180, 0.5)'
  } = props;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', `${imageWidth}px`);
  canvas.setAttribute('height', `${imageHeight}px`);
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, imageWidth, imageHeight);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillStyle = textColor;
  ctx.font = `${fontSize}px ${fontStyle}`;
  ctx.rotate((Math.PI / 180) * angle);
  ctx.fillText(text, fontSize, imageHeight - fontSize);

  const innerStyle: CSSProperties = {
    pointerEvents: 'none',
    backgroundImage: `url(${canvas.toDataURL('image/png')})`
  };

  return innerStyle;
}

/**
 * 水印组件
 * @param style
 * @param props
 * @constructor
 */
export function WaterMark({ style, ...props }: IWaterMarkProps) {
  const [innerStyle, setInnerStyle] = useState<CSSProperties>({
    width: '100%',
    height: '100%',
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 99999999,
    ...style
  });

  useObjectEffect(() => {
    setInnerStyle((prev) => ({ ...prev, ...createWaterMark(props) }));
  }, props);

  return <div style={innerStyle} />;
}
