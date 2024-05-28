import { App, ConfigProvider, Spin } from 'antd';
import { ConfigProviderProps } from 'antd/es/config-provider';
import zhCN from 'antd/es/locale/zh_CN';
import { SpinProps } from 'antd/es/spin';
import 'dayjs/locale/zh-cn';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { InjectModalCtx } from '../functionalComponent';
import {
  AppEntry,
  defaultTheme,
  getCurrentWindow,
  initCustomThemeColor,
  IWaterMarkProps,
  zh,
  useQkState,
  WaterMark
} from '../util';
import './base.less';

interface IRootProps {
  children: React.ReactNode;
  componentSize?: 'small' | 'middle' | 'large';
  spinProps?: SpinProps;
  waterMark?: IWaterMarkProps | boolean;
  configProvider?: ConfigProviderProps;
}

export function getGlobalPopupContainer(triggerNode?: HTMLElement) {
  const name = zh.external.getQianKun?.().name;
  return (name ? document.body.querySelector(`div[data-qiankun="${name}"]`) || document.body : document.body) as any;
}

/**
 * 初始化默认主题
 */
function useDefaultTheme() {
  const themeRef = useRef<any>();
  getCurrentWindow()['__env__'] = 'pc';

  useLayoutEffect(() => {
    if (!themeRef.current) {
      themeRef.current = { primaryColor: defaultTheme.antdTheme.token?.colorPrimary || '#008EE0' };
      initCustomThemeColor(themeRef.current.primaryColor, { env: 'pc', theme: defaultTheme });
    }
  }, []);
}

/**
 * 根组件
 * @param children
 * @param componentSize
 * @param spinProps
 * @param waterMark 水印
 * @constructor
 */
export function RootContainer({ children, componentSize, spinProps, waterMark, configProvider }: IRootProps) {
  const [loadingState, setLoadingState] = useState<any>({ spinning: false });
  const waterMarkProps = waterMark === true ? {} : { ...waterMark };

  const qkInfo = useQkState();

  useDefaultTheme();

  // useMemo 注入属性同步进行，保证子组件能够正常拿到接口数据
  useMemo(() => {
    // qiankun 子应用子应用内 HTMLElement 对象被代理了, 导致 DOM对象 instanceof HTMLElement 返回了false。
    HTMLElement = new Function('return this')().HTMLElement;
    zh.registerExternal({
      getQianKun() {
        return qkInfo;
      }
    });
  }, [qkInfo]);

  useEffect(() => {
    zh.registerExternal({
      maskLoading(parmas: any = {}) {
        setLoadingState((p) => (parmas ? { ...p, spinning: true, ...parmas } : { ...p, spinning: false }));
      },
      getWaterMark(options: IWaterMarkProps = {}) {
        return waterMark && <WaterMark {...(waterMark === true ? {} : waterMark)} {...options} />;
      }
    });
  }, [waterMark]);

  return (
    <ConfigProvider
      getPopupContainer={getGlobalPopupContainer}
      locale={zhCN}
      componentSize={componentSize}
      theme={defaultTheme.antdTheme}
      {...configProvider}
    >
      <App style={{ height: '100%' }}>
        {children}
        <InjectModalCtx />
        <AppEntry />
        <div key="loading">
          {loadingState.spinning && (
            <Spin
              {...spinProps}
              {...loadingState}
              spinning
              className={zh.classNames('zh-body-loading', loadingState.className)}
            />
          )}
        </div>
        {waterMark && <WaterMark {...waterMarkProps} />}
      </App>
    </ConfigProvider>
  );
}
