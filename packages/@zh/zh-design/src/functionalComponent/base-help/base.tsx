import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { ConfigProvider, Pagination, Spin, Tooltip } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Select } from '../../baseComponent';
import {
  getGlobalConfig,
  getRegisterComponentWithProps,
  Observer,
  zh,
  useRefCallback,
  useZhEffect,
  type IObject
} from '../../util';
import { Button } from '../antd/Button';
import { showModal } from '../modal';
import { BaseContent, Footer, Header, HelpContext, MultipleButtons } from './baseContent';
import './index.less';
import { BaseHelpComponent, IBaseHelpProps, IBaseHelpQuery } from './interface';
import { helpLocale } from './locale';

let timeout;

const iconStyle = {
  zIndex: 2,
  fontSize: 12,
  display: 'flex'
};

/**
 * 请求节流、返回值处理
 * @param request 请求
 * @param callback 回调
 * @param delay 延时
 */
function fetch(request, callback, delay = 0) {
  const asyncFn = async function () {
    const result = await request();
    callback(result.record ?? result.list ?? [], result.total ?? result.totalRows ?? 0);
  };
  if (delay > 0) {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(asyncFn, delay);
  } else {
    asyncFn().then(() => {});
  }
}

/**
 * 弹出窗工厂
 * @param request 请求相关信息 { valueField, labelField, request}
 * @param HelpContent 自定义内容组件
 * @param helpRef 弹出modal对象
 */
function contentFactory(request, HelpContent, helpRef) {
  const tmpParams = helpRef.current?.contentParams || {};
  const defaultColumns = [
    {
      dataIndex: zh.isFunction(tmpParams.valueField) ? 'code' : tmpParams.valueField,
      title: helpLocale.code
    },
    {
      dataIndex: zh.isFunction(tmpParams.labelField) ? 'name' : tmpParams.labelField,
      title: helpLocale.name
    }
  ];
  const providerValue = {
    observer: helpRef.current?.observer,
    close: () => helpRef.current?.close('cancel', null),
    ok: (result?) => {
      helpRef.current.setValue(result);
      helpRef.current?.close('ok', result);
    },
    contentParams: {
      FilterTree: null,
      columns: defaultColumns,
      getFieldValue(r, type = 'value') {
        const field = type === 'label' ? tmpParams.labelField : tmpParams.valueField;
        if (zh.isFunction(field)) {
          return field(r);
        }
        if (!r.hasOwnProperty(field)) {
          zh.debug({ msg: `当前配置的 ${type}Field 为 ${field}，数据源中未匹配到该属性！`, type: 'error' });
        }
        return r[field];
      },
      ...tmpParams
    },
    request,
    locale: helpLocale,
    randomKey: Math.random().toString(32).slice(2)
  };

  return (
    <ConfigProvider locale={zhCN}>
      <HelpContext.Provider value={providerValue}>
        {HelpContent ? zh.isReactElement(HelpContent) ? HelpContent : <HelpContent /> : <BaseContent />}
      </HelpContext.Provider>
    </ConfigProvider>
  );
}

/**
 * 初始化state状态
 */
function initState({ request, data }: IBaseHelpProps) {
  return {
    options: request ? [] : data || [],
    total: 0,
    loading: false,
    firstLoad: true,
    query: {
      keyword: '',
      pageIndex: 1,
      pageSize: 8
    }
  };
}

/**
 * 下拉面板
 * @param menu 选择项
 * @param pageChange 页码事件
 * @param state 父组件的状态
 * @constructor
 */
function DropdownRender({ menu, pageChange, state }) {
  return (
    <Spin spinning={state.loading} size="small">
      <div>{menu}</div>
      {state.total > state.options.length && (
        <Pagination
          size="small"
          total={state.total}
          current={state.query.pageIndex}
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            whiteSpace: 'nowrap',
            padding: '5px 12px',
            borderTop: '1px solid #f5f5f5'
          }}
          showSizeChanger={false}
          hideOnSinglePage
          showQuickJumper
          showLessItems
          showTotal={(totalCount) => `共${totalCount}条`}
          onChange={pageChange}
          pageSize={state.query.pageSize}
        />
      )}
    </Spin>
  );
}

/**
 * 打开弹窗组件
 * @param request 请求相关信息
 * @param outRef 暴露外部api
 * @param helpContent 自定义弹出窗口内容
 * @param modalProps modal的属性
 * @param selectedRequest 已选数据接口
 * @param onBeforeOpen 打开前的钩子函数，获取帮助的基本信息
 * @param style 图标样式
 * @param contentParams 组件传递过来的额外属性
 * @param buttonMode 按钮模式
 * @constructor
 */
function OpenHelpIcon({
  request,
  outRef,
  helpContent,
  modalProps,
  selectedRequest,
  onBeforeOpen,
  style,
  contentParams,
  buttonMode
}) {
  const helpId = contentParams?.helpId;
  const helpRef = useRef<any>({
    observer: new Observer(),
    contentParams,
    helpInfo: null,
    modalInstance: null,
    setValue: (value: any) => outRef.current?.getApi?.()?.setValue?.(value),
    close(type = 'cancel', result) {
      if (helpRef.current?.modalInstance) {
        helpRef.current.afterCloseParams = { type, helpId, result };
        helpRef.current.modalInstance.destroy();
        helpRef.current.modalInstance = null;
        if (type === 'cancel') {
          modalProps?.onCancel?.();
        }
      }
    }
  });

  const [loading, setLoading] = useState(false);

  const showModalEx = async () => {
    setLoading(true);
    if (onBeforeOpen) {
      helpRef.current.helpInfo = await onBeforeOpen();
      setLoading(false);
      if (helpRef.current.helpInfo === false) {
        return;
      }
    } else {
      setLoading(false);
    }

    contentParams.value = outRef.current.getApi?.()?.getValue?.();
    if (contentParams.multiple) {
      const origin = outRef.current.getApi()?.getOrigin?.();
      if (origin?.length) {
        contentParams.selectedArray = origin;
      } else if (contentParams.value?.length && zh.isFunction(selectedRequest)) {
        try {
          contentParams.selectedArray = await selectedRequest({ codes: contentParams.value.join() });
        } catch (e) {
          contentParams.selectedArray = [];
        }
      } else {
        contentParams.selectedArray = [];
      }
    } else {
      contentParams.selectedArray = undefined;
    }

    helpRef.current.contentParams = { ...contentParams, ...helpRef.current.helpInfo };
    const { width, height } = getGlobalConfig().default.helpConfig;
    helpRef.current.modalInstance = showModal({
      width,
      height,
      ...modalProps,
      className: 'help-container',
      icon: null,
      footer: false,
      content: contentFactory(helpRef.current.helpInfo?.request || request, helpContent, helpRef),
      afterClose() {
        buttonMode?.onResult?.(helpRef.current.afterCloseParams);
        helpRef.current.observer.notify(helpRef.current.afterCloseParams, 'afterClose').then();
        helpRef.current.afterCloseParams = null;
        modalProps?.afterClose?.();
      }
    });
    helpRef.current.modalInstance.subscribe(() => {
      helpRef.current.observer.notify(helpRef.current.afterCloseParams, 'beforeDestroy').then();
    }, 'beforeDestroy');
    await helpRef.current.observer.notify({ helpId }, 'afterOpen');
  };

  const open = async function (e?) {
    if (loading) {
      return;
    }
    zh.stopPropagation(e);
    if (!helpRef.current.modalInstance) {
      await showModalEx();
    }
  };

  useZhEffect(
    () => {
      helpRef.current.helpInfo = null;
      helpRef.current?.close('cancel');
    },
    [onBeforeOpen, request, helpId],
    false
  );

  useZhEffect(() => {
    outRef.current.openHelp = open;
    outRef.current.closeHelp = () => {
      helpRef.current?.close('cancel', null);
    };
    outRef.current.getHelper = () => {
      return helpRef.current;
    };
  });

  if (buttonMode) {
    const { text, onResult, children, ...btnProps } = buttonMode;
    return (
      <Button onClick={open} {...btnProps}>
        {text || children}
      </Button>
    );
  }

  return <span style={style}>{loading ? <LoadingOutlined /> : <SearchOutlined onClick={open} />}</span>;
}

/**
 * 通用帮助基础组件
 * @param props 属性
 * @constructor
 */
export const BaseHelp: BaseHelpComponent<IBaseHelpProps> = (props: IBaseHelpProps) => {
  const {
    buttonMode,
    acceptInput = false,
    nowrap = false,
    input = true,
    modal = false,
    multiple = false,
    tooltip,
    disabled = false,
    helpContent = null,
    valueField,
    labelField,
    getHelpInfo,
    userCodeFieldWithLabel = true,
    userCodeField: defaultUserCodeField,
    outRef,
    onBeforeOpen,
    placeholder,
    onChange,
    modalProps,
    selectedRequest,
    data,
    request,
    contentParams,
    id,
    loadByFocus,
    style,
    onDoubleClick,
    onDropdownVisibleChange,
    onOpenChange,
    ...others
  } = props;
  const getValue = (r, type = 'value') => {
    const { valueField: vf, labelField: lf } = { valueField, labelField, ...getHelpInfo?.() };
    const v = type === 'label' ? lf : vf;
    return zh.isFunction(v) ? v(r) : r[v || 'code'];
  };
  const innerRef = useRef({ lockOpen: false, open: others.open, tmpOpen: undefined, lastInput: '', focus: false });
  const ref = useMemo(() => outRef ?? React.createRef<any>(), [outRef]);
  const [state, setState] = useState<any>(initState(props));
  const dataRequest = useMemo(() => {
    const req = request
      ? request
      : data
      ? ({ keyword }: any) => {
          return keyword
            ? data.filter(
                (d: any) =>
                  (getValue(d) + '').indexOf(keyword) > -1 || (getValue(d, 'label') + '').indexOf(keyword) > -1
              )
            : data;
        }
      : () => [];

    state.options = []; // 很关键，同步清除上一次的状态，减少多余的渲染

    return async (query: IBaseHelpQuery) => {
      const result = await req(query);
      if (zh.isArray(result)) {
        return { total: result.length, record: result };
      } else if (zh.isObject(result)) {
        return result;
      } else {
        return { total: 0, record: [] };
      }
    };
  }, [data, request]);

  useLayoutEffect(() => {
    if (!buttonMode) {
      // 提供关键字检索外部接口，有些业务场景只有名称，需要通过名称去反向检索编码
      ref.current.searchKeyWord = (params) => dataRequest({ pageSize: 8, pageIndex: 1, ...params });

      setState(initState(props));
    }
  }, [dataRequest]);

  const openChangeCallback = useRefCallback((open, type = 'modal') => {
    onOpenChange?.(open, type);
  });

  useEffect(() => {
    if (ref.current?.getHelper) {
      const un1 = ref.current.getHelper().observer.subscribe(() => {
        innerRef.current.lockOpen = true;
        openChangeCallback(true);
      }, 'afterOpen');
      const un2 = ref.current.getHelper().observer.subscribe(() => {
        innerRef.current.lockOpen = false;
        openChangeCallback(false);
      }, 'afterClose');

      return () => {
        un1();
        un2();
      };
    }
  }, [openChangeCallback]);

  useEffect(() => {
    if (!innerRef.current.lockOpen && innerRef.current.tmpOpen !== undefined) {
      openChangeCallback(innerRef.current.tmpOpen, 'dropdown');
      innerRef.current.tmpOpen = undefined;
    }
  }, [openChangeCallback, state.options]);

  const newProps: any = {
    allowClear: true,
    ...others,
    showSearch: input,
    filterOption: false,
    ref,
    placeholder,
    disabled: disabled,
    optionLabelProp: 'label',
    style: { width: '100%', maxHeight: '100%', ...style },
    onChange: function (value, opt) {
      if (onChange) {
        if (value && opt && opt['data-origin']) {
          onChange({ origin: opt['data-origin'], ...value });
        } else {
          onChange(value);
        }
      }
      if (multiple && newProps.maxTagCount === 'responsive') {
        // ant-design bug，响应式模式下，仅一项选择或取消时，焦点会丢失；（后期版本验证）
        Promise.resolve().then(() => {
          ref.current?.getApi()?.focus?.();
        });
      }
    },
    onDropdownVisibleChange: (open) => {
      innerRef.current.open = open;
      onDropdownVisibleChange?.(open);
      if (!innerRef.current.lockOpen) {
        if (state.options.length > 0) {
          openChangeCallback(open, 'dropdown');
        } else {
          innerRef.current.tmpOpen = open;
        }
      }
    }
  };

  if (!buttonMode) {
    const loadData = async function ({ keyword, pageIndex, pageSize }: any, delay, check = false) {
      if (check && onBeforeOpen) {
        if ((await onBeforeOpen(true)) === false) {
          return;
        }
      }
      const query: IBaseHelpQuery = {
        keyword: keyword ?? state.query.keyword,
        pageIndex: pageIndex ?? state.query.pageIndex,
        pageSize: pageSize ?? state.query.pageSize,
        isInputSearch: true
      };
      setState((prevState) => ({ ...prevState, loading: true, firstLoad: false, query }));
      fetch(
        () => dataRequest(query),
        (options, total) => {
          setState((prevState) => ({
            ...prevState,
            options,
            loading: false,
            total
          }));
        },
        delay
      );
    };

    if (onDoubleClick) {
      newProps.onDoubleClick = (e) => {
        onDoubleClick(e, ref.current);
      };
    }
    if (loadByFocus) {
      newProps.onFocus = async (e) => {
        if (state.firstLoad) {
          loadData({ keyword: '', pageIndex: 1 }, 0, true);
        }
      };
    }
    if (input) {
      newProps.onSearch = function (keyword) {
        const inputValue = innerRef.current.lastInput;
        keyword = keyword.replace(/'/g, '');
        innerRef.current.lastInput = keyword;
        if (!keyword || !innerRef.current.open) {
          if (!keyword && acceptInput) {
            Promise.resolve().then(() => {
              ref.current?.getApi()?.setValue?.({ value: inputValue, label: inputValue });
            });
          }
          return;
        }
        loadData({ keyword, pageIndex: 1 }, 200, true);
      };
    }
    if (input || loadByFocus) {
      newProps.dropdownRender = (menu) => (
        <DropdownRender
          pageChange={(pageIndex: number, pageSize: number) => loadData({ pageIndex, pageSize }, 0)}
          state={state}
          menu={menu}
        />
      );
    }
    if (multiple) {
      newProps.mode = 'multiple';
      newProps.maxTagCount = newProps.hasOwnProperty('maxTagCount') ? newProps.maxTagCount : 'responsive';
      if (!tooltip) {
        newProps.maxTagPlaceholder = (omittedValues) => {
          const len = omittedValues?.length;
          if (len) {
            const tipTitle = (
              <div
                style={{ padding: '6px 8px', wordBreak: 'break-all' }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {omittedValues.map((v) => v.label).join()}
              </div>
            );
            return (
              <Tooltip
                overlayInnerStyle={{ padding: 0 }}
                getTooltipContainer={(target) => target.offsetParent?.parentElement || document.body}
                title={tipTitle}
                mouseEnterDelay={0.2}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', maxWidth: '100%' }}>
                  <span className="nowrap" style={{ flex: 1 }}>
                    {omittedValues[0].label}
                  </span>
                  {len > 1 ? `,  + ${len - 1} ...` : ``}
                </span>
              </Tooltip>
            );
          }
          return null;
        };
      }
    }

    if (newProps.maxTagCount === 'responsive') {
      newProps.className = zh.classNames(newProps.className, 'help-responsive');
    }

    if (!newProps.hasOwnProperty('popupMatchSelectWidth')) {
      newProps.popupMatchSelectWidth = false;
    }
    newProps.dropdownStyle = { maxWidth: '50vw', ...newProps.dropdownStyle };

    if (modal && !disabled) {
      if (!input) {
        newProps.onClick = function () {
          ref.current.openHelp();
        };
      } else {
        newProps.onDoubleClick = (e) => {
          if (onDoubleClick?.(e, ref.current) !== false) {
            ref.current.openHelp();
          }
        };
      }
      newProps.suffixIcon = (
        <OpenHelpIcon
          buttonMode={undefined}
          request={dataRequest}
          contentParams={{ ...props, ...contentParams }}
          modalProps={modalProps}
          selectedRequest={selectedRequest}
          onBeforeOpen={onBeforeOpen}
          outRef={ref}
          helpContent={helpContent}
          style={iconStyle}
        />
      );
      newProps.className = 'help-with-icon';
    }

    const getDropColumns = () => {
      const {
        userCodeField,
        valueField: vf,
        labelField: lf
      } = getHelpInfo?.() || { userCodeField: defaultUserCodeField, valueField, labelField };
      const dropColumns: any[] = userCodeField?.split(',').map((f) => {
        const [key, width] = f.trim().split(':');
        return { dataIndex: key, width };
      }) || [{ dataIndex: vf }, { dataIndex: lf }];

      if (userCodeFieldWithLabel && !dropColumns.find(({ dataIndex }) => dataIndex === lf)) {
        dropColumns.push({ dataIndex: lf });
      }

      return dropColumns;
    };

    return (
      <Select
        tooltip={tooltip}
        notFoundContent={state.loading ? <div style={{ minHeight: 28 }} /> : null}
        {...newProps}
      >
        {state.options.map((d: any) => {
          const [value, label] = [getValue(d), getValue(d, 'label')];
          const [title, cls, whiteSpace] = nowrap ? [label, 'nowrap', 'nowrap'] : ['', '', 'normal'];
          return (
            <Select.Option key={value} value={value} label={label} data-origin={d.origin || d}>
              <div style={{ display: 'flex', alignItems: 'center', minHeight: 22 }} title={title}>
                {getDropColumns().map(({ dataIndex: c, width }: any, index) => {
                  let s: any = { flex: 1 },
                    key: any = c,
                    content = '';
                  if (zh.isFunction(c)) {
                    key = index;
                    content = c(d);
                  } else {
                    s = width ? { width } : s;
                    content = d[c] ?? content;
                  }
                  return (
                    <div
                      key={key}
                      className={cls}
                      style={{ ...s, marginRight: 5, whiteSpace, wordBreak: 'break-all', lineHeight: 1 }}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </Select.Option>
          );
        })}
      </Select>
    );
  }

  return (
    <OpenHelpIcon
      buttonMode={buttonMode}
      request={dataRequest}
      contentParams={{ ...props, ...contentParams }}
      modalProps={modalProps}
      selectedRequest={selectedRequest}
      onBeforeOpen={onBeforeOpen}
      outRef={ref}
      helpContent={helpContent}
      style={iconStyle}
    />
  );
};

BaseHelp.Header = Header;
BaseHelp.Footer = Footer;
BaseHelp.MultipleButtons = MultipleButtons;

export { HelpContext };

function Help({ type = 'MultipleHelp', closeReturn, ...props }) {
  const [Tmp, defaultProps] = getRegisterComponentWithProps(type);
  const tmpRef = useRef<any>();
  useEffect(() => {
    const api = tmpRef.current.getApi();
    api.openHelp?.();
    return api.getHelper().observer.subscribe((param) => {
      closeReturn(param || {});
    }, 'afterClose');
  }, []);
  return <Tmp {...defaultProps} {...props} ref={tmpRef} style={{ display: 'none', width: 0, height: 0 }} />;
}

function openHelp(
  config: IObject & {
    helpId?: string;
    type?: string;
  } & IBaseHelpProps
) {
  return new Promise((resolve) => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    const helpProps = {
      ...config,
      closeReturn({ result }) {
        resolve(result);
      },
      modalProps: {
        ...config.modalProps,
        afterClose() {
          setTimeout(() => {
            root.unmount();
            if (div.parentNode) {
              div.parentNode.removeChild(div);
            }
          });
        }
      }
    };
    root.render(<Help {...helpProps} />);
  });
}

zh.registerExternal({ openHelp });
