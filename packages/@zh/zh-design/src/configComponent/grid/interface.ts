import { GridPropsType } from '../../businessComponent/grid';
import { formConfProps } from '../config/interface';
import { CompDefaultPropsInfo } from '../props.dt';

export interface grid_col {
  text: string;
  datafield: string;
  langKey: string;
  width: number;
  sortable: boolean;
  editor: { allowBlank: true };
}

type columnsType = GridPropsType['columns'] | ((configColumns: GridPropsType['columns']) => GridPropsType['columns']);

export type GridViewInfo = Omit<GridPropsType, 'columns'> & {
  busKey?: string;
  busFields?: Array<string>;
  columns?: columnsType;
};

export type GridViewPropsInfo = GridViewInfo & CompDefaultPropsInfo<formConfProps.GridView>;
