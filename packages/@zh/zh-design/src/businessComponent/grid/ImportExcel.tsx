import { Button, Upload } from 'antd';
import React, { ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { read, utils } from 'xlsx';
import { Select } from '../../baseComponent';
import { ModalContext, showModal, type IModalParamProps } from '../../functionalComponent';
import { compHoc, Layout, zh, useExtendRef, useRefCallback, type IObject, type PromiseType } from '../../util';
import { Grid, type GridPropsType } from './grid';

interface LabeledValue {
  value: string;
  label: React.ReactNode;
}

export interface ImportGridProps extends GridPropsType {
  /**
   * @description        表头属性
   */
  header: {
    /**
     * @description       excel列的待选数据源
     */
    source: LabeledValue[] | ((sheetIndex: number) => PromiseType<LabeledValue[]>);
    /**
     * @description       数据源选择后回调事件
     */
    onChange?: ({}) => {};
    /**
     * @description       表头所在行
     * @default           -1
     */
    index?: number;
    /**
     * @description       列宽
     * @default           100
     */
    width?: number;
    /**
     * @description       默认绑定列字段
     * @default           100
     */
    bindFields?: IObject<string>;
  };
  /**
   * @description        顶部功能区域扩展
   */
  topArea?: ReactNode;
  /**
   * @description         转换excel数据源
   */
  convertData?: (dataSource) => Array<any>;
  /**
   * @description         excel sheet页数据切换后回调事件
   */
  onSheetDataChange?: (dataSource, currentSheet) => void;
  /**
   * @description         合并单元格数据的拆分
   * @default             true
   */
  mergeSplit?: boolean | 'row' | 'column';
}

const statusText = ['选择需要导入的Excel文件', '正在读取文件内容...', '读取文件失败'];

const InternalImportGrid = compHoc<ImportGridProps>((props) => {
  const {
    header,
    outRef,
    request,
    pagination,
    subTable,
    topArea,
    onSheetDataChange,
    isTree,
    expandCfg,
    defaultExpand,
    response,
    style,
    columns,
    convertData,
    mergeSplit = true,
    ...others
  } = props;

  const headerIndex = header.index ?? -1;

  const dataIndexRef = useRef({});
  const sheetDataRef = useRef({});
  const uploadRef = useRef();
  const keyRef = useRef(new Date().valueOf());
  const [upload, setUpload] = useState<any>({ file: null, status: 0 });
  const [gridProps, setGridProps] = useState<any>({ columns, dataSource: [] });
  const [sheets, setSheets] = useState<Array<{ value: number; label: string }>>([]);
  const [sheet, setSheet] = useState<{ changed: boolean; current?: { value: number; label: string } }>({
    changed: false
  });

  const headerSourceCallback = useRefCallback((index: number) => {
    return new Promise((resolve) => {
      if (zh.isFunction(header.source)) {
        resolve(header.source(index));
      } else {
        resolve(header.source || []);
      }
    });
  });

  const convertDataCallback = useRefCallback((n) => {
    return convertData ? convertData(n) : n;
  });

  const splitCallback = useRefCallback((r, c, m) => {
    if (zh.isBoolean(mergeSplit)) {
      return mergeSplit;
    } else {
      if (mergeSplit === 'row') {
        return r === m.s.r;
      } else if (mergeSplit === 'column') {
        return c === m.s.c;
      }
    }
    return true;
  });
  const dealSheetData = useRefCallback((bindFields?) => {
    const sheetData = sheetDataRef.current[sheet.current?.label || ''];
    if (sheetData) {
      const dataArray: any[] = utils.sheet_to_json(sheetData, { header: 'A', defval: '' });

      let xlsColumns: any[] = [];
      let headerTitle: any = {};
      if (dataArray.length > 0) {
        xlsColumns = Object.keys(dataArray[0]);
        const merges = sheetData['!merges'] || [];
        const mergeCell = {};

        merges.forEach((m) => {
          const mergeValue = dataArray.find((d) => d.__rowNum__ === m.s.r)?.[xlsColumns[m.s.c]] ?? '';
          for (let r = m.s.r; r <= m.e.r; r++) {
            for (let c = m.s.c; c <= m.e.c; c++) {
              if (splitCallback(r, c, m)) {
                mergeCell[`${r}:${c}`] = mergeValue;
              }
            }
          }
        });

        dataArray.forEach((data) => {
          xlsColumns.forEach((k, i) => {
            const cell = `${data.__rowNum__}:${i}`;
            if (mergeCell.hasOwnProperty(cell)) {
              data[k] = mergeCell[cell];
            }
            // xlsx 神奇的丢失43秒精度
            if (zh.isDate(data[k])) {
              data[k] = zh.addDate(data[k], 43, 'seconds', 'YYYY-MM-DD HH:mm');
            }
          });
        });

        if (headerIndex > -1 && headerIndex < dataArray.length) {
          headerTitle = dataArray[headerIndex];
          dataArray.splice(headerIndex, 1);
        }
      }

      setGridProps((prev) => ({
        ...prev,
        columns: generateColumns({
          bindFields: bindFields ?? header.bindFields,
          defaultColumns: columns || [],
          columnArray: xlsColumns.map((k) => {
            return { dataIndex: k, title: headerTitle[k] || k, width: header.width ?? 100 };
          }),
          headerSource: headerSourceCallback(sheet.current!.value),
          onChange: header.onChange,
          key: `${keyRef.current}_${sheet.current?.value}`,
          dataIndexRef
        }),
        dataSource: convertDataCallback(dataArray)
      }));
    }
  });

  const readExcel = (file) => {
    setUpload((prev) => ({ ...prev, status: 1 }));
    const fileReader = new FileReader();
    fileReader.onload = ({ target }) => {
      const workbook = read(target?.result, { type: 'binary', cellDates: true });
      sheetDataRef.current = workbook.Sheets;
      keyRef.current = new Date().valueOf();
      const sheetOptions = workbook.SheetNames.map((label, index) => ({ value: index, label }));

      zh.batchedUpdates(() => {
        setUpload((prev) => ({ ...prev, status: 3, file }));
        setSheets(sheetOptions);
        setSheet({ changed: true, current: sheetOptions[0] });
      });
    };
    fileReader.onerror = () => {
      setUpload((prev) => ({ ...prev, status: 2 }));
    };
    fileReader.readAsBinaryString(file);
  };

  useExtendRef(outRef, {
    getImportDataIndexRef() {
      return dataIndexRef.current;
    },
    getImportBindFields() {
      const bindFields: IObject<string> = {};
      Object.keys(dataIndexRef.current).forEach((k) => {
        const tmp = dataIndexRef.current[k];
        if (tmp !== k) {
          bindFields[k] = tmp;
        }
      });
      return bindFields;
    },
    getImportData() {
      const keys = Object.keys(dataIndexRef.current);
      return outRef.current
        .getApi()
        .getRows()
        .map((r) =>
          keys.reduce((p, c) => {
            if (c !== dataIndexRef.current[c]) {
              const tmp = { ...p, [dataIndexRef.current[c]]: r[c] };
              delete tmp[c];
              return tmp;
            }
            return p;
          }, r)
        );
    },
    refreshHeaderSource(options: { bindFields?: IObject } = {}) {
      const { bindFields } = options;
      keyRef.current = new Date().valueOf();
      dealSheetData(bindFields);
    },
    importFile: readExcel,
    getUpload() {
      return uploadRef.current;
    }
  });

  useEffect(() => {
    dealSheetData();
  }, [sheet.current, columns]);

  useEffect(() => {
    if (sheet.current && sheet.changed) {
      sheet.changed = false;
      onSheetDataChange?.(gridProps.dataSource, sheet.current);
    }
  }, [gridProps]);

  const onSheetChange = useRefCallback((value) => {
    setSheet({ changed: true, current: value });
  });

  const uploadProps = {
    ref: uploadRef,
    disabled: upload.status === 1,
    maxCount: 1,
    accept:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.ms-excel.sheet.macroEnabled.12',
    beforeUpload: (file) => {
      setSheets([]);
      readExcel(file);
      return Upload.LIST_IGNORE;
    }
  };

  return (
    <Layout style={style}>
      <Layout direction="row" center style={{ padding: '6px 0' }}>
        <Upload {...uploadProps}>
          <Button
            loading={upload.status === 1}
            className="nowrap"
            title={statusText[upload.status] || upload.file.name}
            style={{ color: `${upload.status === 2 ? 'red' : ''}`, maxWidth: 300 }}
          >
            {statusText[upload.status] || upload.file.name}
          </Button>
        </Upload>
        {sheets.length > 1 && (
          <Select
            defaultValue={sheets[0]}
            options={sheets}
            style={{ minWidth: 80, marginLeft: 10 }}
            onChange={onSheetChange}
            placeholder="请选择Sheet页"
          />
        )}
        <Layout.Flex>{topArea}</Layout.Flex>
      </Layout>
      <Layout.Flex>
        <Grid bordered showRowNumber ref={outRef} {...others} {...gridProps} headerMenu={false} />
      </Layout.Flex>
    </Layout>
  );
});

type InternalImportGridType = typeof InternalImportGrid;

interface ImportGridInterface extends InternalImportGridType {
  xlsx: {
    utils: typeof utils;
    read: typeof read;
  };
  modal: (params: Partial<IModalParamProps> & { gridProps: ImportGridProps }) => Promise<[boolean, any[]]>;
}

const ImportGrid = InternalImportGrid as ImportGridInterface;

ImportGrid.xlsx = { utils, read };
ImportGrid.modal = ({ gridProps, ...others }) => {
  return new Promise((resolve) => {
    showModal({
      title: 'Excel导入',
      width: 860,
      height: 600, // 设置高度开启拖拽调整大小功能
      ...others,
      content: <Content {...gridProps} />,
      async onOk(ins) {
        const importGrid = ins.getApi().getGrid();
        if ((await others.onOk?.(ins, importGrid)) !== false) {
          const excelData = importGrid.getImportData();
          ins.destroy();
          resolve([true, excelData]);
        }
      },
      async onCancel(ins) {
        if ((await others.onCancel?.(ins, ins.getApi().getGrid())) !== false) {
          ins.destroy();
          resolve([false, []]);
        }
      }
    });
  });
};

function Content(props: ImportGridProps) {
  const ref = useRef<any>();
  const { ins } = useContext(ModalContext);

  useEffect(() => {
    ins.setApi({
      getGrid() {
        return ref.current.getApi();
      }
    });
  }, []);

  return <ImportGrid {...props} style={{ padding: '0 6px', ...props.style }} ref={ref} />;
}

export { ImportGrid };

function generateColumns({ bindFields, defaultColumns, columnArray, headerSource, onChange, dataIndexRef, key }) {
  const selectProps: any = {
    bordered: false,
    fitHeight: true,
    style: { width: '100%', height: '100%', textAlign: 'left', fontWeight: 'normal' },
    request: async () => {
      return await headerSource;
    }
  };

  const selectedMap = new Map<string, any>();

  dataIndexRef.current = {};

  const getGroupIn = (dataIndex) => () => {
    dataIndexRef.current[dataIndex] = bindFields?.[dataIndex] || dataIndex;
    const selectRef = React.createRef();

    const onSelectChange = (value) => {
      if (value === null) {
        dataIndexRef.current[dataIndex] = dataIndex;
        return;
      }
      const lastValue = dataIndexRef.current[dataIndex];
      dataIndexRef.current[dataIndex] = value;
      if (selectedMap.has(value)) {
        const [lastSelectRef, lastDataIndex] = selectedMap.get(value);
        dataIndexRef.current[lastDataIndex] = lastDataIndex;
        lastSelectRef.current.getApi().setValue(null);
      }
      selectedMap.has(lastValue) && selectedMap.delete(lastValue);
      selectedMap.set(value, [selectRef, dataIndex]);
      onChange?.({ dataIndex, value });
    };

    const defaultValue = bindFields?.[dataIndex];

    defaultValue && selectedMap.set(defaultValue, [selectRef, dataIndex]);

    return (
      <Select
        key={`${key}_${dataIndex}`}
        {...selectProps}
        defaultValue={defaultValue}
        ref={selectRef}
        labelInValue={false}
        placeholder={`选择对应字段`}
        onChange={onSelectChange}
      />
    );
  };

  return [
    ...defaultColumns,
    ...columnArray.map(({ dataIndex, title, width }) => {
      return {
        dataIndex,
        title,
        width,
        flex: 1,
        groupIn: [getGroupIn(dataIndex)]
      };
    })
  ];
}
