import { useState } from 'react';
const defaultBreakPairs = {
  480: 1,
  576: 1,
  768: 2,
  992: 3,
  1200: 3,
  1600: 4,
  1900: 4
};

const defaultBreakPoints = [480, 576, 768, 992, 1200, 1600, 1900];

export default function useColspan(id: string, customColspan?: any) {
  const [k, o] = handleBreakPairs(customColspan, { ...defaultBreakPairs }, [...defaultBreakPoints]);
  const [breakPairs, setBreakPairs]: any = useState(() => o);
  const [breakPoints, setBreakPoints] = useState(() => k);

  //数组当作colspan处理
  function handleBreakPairs(breakPairs: any, dPairs: any, dPoints: any) {
    if (!breakPairs) return [dPoints, dPairs];
    if (typeof breakPairs === 'number') {
      Object.keys(dPairs).forEach((b) => {
        dPairs[b] = breakPairs;
      });
    } else {
      if (Array.isArray(breakPairs)) {
        dPairs = (breakPoints || defaultBreakPoints).reduce((acc: any, point: number, index: number) => {
          acc[point] = customColspan[index] || breakPairs[point];
          return acc;
        }, {});
      } else {
        dPoints = Object.keys(breakPairs)
          .map((item) => Number(item))
          .sort((a, b) => a - b);
        dPairs = breakPairs;
      }
    }
    return [dPoints, dPairs];
  }

  function setBreakPairsOrPoints(breakPairs: any) {
    const [k, o] = handleBreakPairs(breakPairs, breakPairs, breakPoints);
    setBreakPairs(o);
    setBreakPoints(k);
  }

  return { breakPairs, breakPoints, setBreakPairs: setBreakPairsOrPoints };
}
