import { useMemo } from 'react';
import { compHoc, getRegisterComponentWithProps, registerComponent, zh, useExtendRef } from '../../util';
import { LayConfWrap, parseFunction } from '../common';
import { formConfProps } from '../config/interface';
import { CompHocProps } from '../props.dt';
import { GridViewInfo } from './interface';

export type { GridViewInfo } from './interface';

function GridViewComp({ outRef, ...props }) {
  const { formConf, columns, showRowNumber, dataSource, defaultValue, ...others } = props;

  useExtendRef(outRef, () => ({
    getConfig() {
      return formConf;
    }
  }));

  const memoProps = useMemo<any>(() => {
    let indexCol = showRowNumber;
    let cols = (Array.isArray(formConf) ? formConf : formConf?.children || []).filter((item: any) => {
      isNaN(item.width) && delete item.width;
      const render = parseFunction(item['render']);
      render && (item['render'] = render);
      if (item.xtype !== 'rownumberer') {
        return item;
      } else {
        indexCol = {
          title: item.label
        };
        item.width && (indexCol['with'] = item.width);
        return false;
      }
    });
    if (columns) {
      cols = zh.isFunction(columns) ? columns(cols) : [...columns, ...cols];
    }
    return { indexCol, cols };
  }, [formConf, showRowNumber, columns]);
  const Grid = getRegisterComponentWithProps('Grid')[0];
  return (
    <Grid
      {...others}
      ref={outRef}
      columns={memoProps.cols}
      dataSource={dataSource || defaultValue}
      showRowNumber={memoProps.indexCol}
    />
  );
}

export const GridView = compHoc<CompHocProps<formConfProps.GridView, GridViewInfo>>(LayConfWrap(GridViewComp));

registerComponent({ GridView });
