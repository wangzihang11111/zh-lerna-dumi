import React, { useEffect, useLayoutEffect } from 'react';
import { BaseComponent, LinkCss, loadScriptContent, PageLoading, Script } from '../component';
import { useAllReady, useAsyncEffect, usePagePrint } from '../hook';
import { doFetchDesignConfig, doFetchLangConfig, doFetchScriptContent } from '../uiLayout/layoutMapping';
import { core, Observer } from '../util';
import { PageState, setPageInstance } from '../util/base';

function Page({ instance, children }) {
  useAsyncEffect(() => {
    return instance.compRef.current?.componentAsyncMount?.();
  }, []);

  useLayoutEffect(() => {
    setPageInstance(instance, PageState.PageReady);
  }, []);

  useEffect(() => {
    return () => {
      setPageInstance(instance, PageState.Destroy);
    };
  }, []);

  useAllReady((...args) => {
    instance.compRef.current?.componentAllReady?.(...args);
  });

  usePagePrint(() => {
    return instance.compRef.current?.pagePrint?.();
  });

  return children;
}

/**
 * page页面高阶函数，返回page实例
 * @param Comp 页面组件
 */
export function pageHoc<P = any>(Comp: any) {
  const {
    injectSrc = [],
    injectCss = [],
    uiConfig,
    busType: compBusType,
    customFormType,
    injectProps,
    initLoad
  } = Comp;
  return class extends React.Component<P & { id?: string }, any> {
    _script?: () => void;
    unmount: boolean = false;
    asyncEffectCount: number = 0; // 记录函数子组件的useAsyncEffect异步副作用数量，用于判断页面初始化完成（为0表示初始化完成）
    compRef = React.createRef<BaseComponent>();
    _observer: Observer = new Observer();
    href: string;

    get busState() {
      return (this.props as any)?.getDvaState?.();
    }

    // 自定义表单类型 app or pc
    get customFormType(): 'app' | 'pc' {
      return customFormType || 'pc';
    }

    // 业务类型
    get busType() {
      return compBusType || this.busState?.busType || core.getQueryValue('busType');
    }

    get observer() {
      return this._observer;
    }

    constructor(props: P & { id?: string }) {
      super(props);
      this.state = {
        loaded: !(this.busType || injectProps),
        language: {},
        extraProps: {},
        buttonRights: { disableBtn: [], hideBtn: [] }
      };
      this.href = location.href;
      setPageInstance(this, PageState.Init);
    }

    getLang(key?, dv?) {
      if (!key && !dv) {
        return this.state.language || {};
      }
      return this.state.language?.[key] || dv || key;
    }

    $CloseCheck = async () => {
      const closeCheck = this.compRef.current?.closeCheck;
      if (core.isFunction(closeCheck)) {
        const checkReturn: any = await closeCheck();
        if (core.isObject(checkReturn)) {
          const confirmReturn = await core.confirm('当前单据未保存，您确定要关闭吗？', {
            title: '提示',
            ...checkReturn
          });
          return confirmReturn;
        }
        return checkReturn !== false;
      }
      return true;
    };

    /**
     * 刷新按钮权限
     */
    async refreshButtonRights({ orgId, rightName }: { orgId?: string; rightName?: string } = {}) {
      const pageRightName = rightName || (core.isString(initLoad.buttonRights) ? initLoad.buttonRights : this.busType);
      try {
        const { code, data } = await core.request.body({
          url: 'auth/resolve/getNoGrantButtons',
          skipError: true,
          data: orgId ? { orgId, pageRightName } : { pageRightName }
        });
        if (code === 0 && data) {
          const arr = core.split(data, '||');
          const tmp =
            arr.length > 1
              ? { disableBtn: arr[0].split(','), hideBtn: arr[1].split(',') }
              : { disableBtn: [], hideBtn: [] };
          this.observer.prevNotify(tmp, `buttonRight_${pageRightName}`);
          return tmp;
        }
      } catch (e) {
        console.log(e);
      }
      return this.state.buttonRights;
    }

    /**
     * 初始化页面的layout信息（自定义界面元数据信息）
     * 保证页面组件加载时页面布局文件已经加载完成
     */
    async componentDidMount() {
      const qiankun = core.external.getQianKun?.();
      if (core.isFunction(qiankun?.getMasterInfo)) {
        qiankun
          .getMasterInfo()
          ?.subscribeTabCloseCheck?.(this.$CloseCheck, `${qiankun.basePath}${qiankun.history.initialEntries[0]}`);
      }

      try {
        let language: any = {};
        let buttonRights: any = {};
        if (this.busType && initLoad) {
          if (initLoad.language) {
            // 同步加载页面多语言
            language = await doFetchLangConfig(this.busType);
          }
          if (initLoad.buttonRights) {
            buttonRights = await this.refreshButtonRights({ orgId: '' });
          }

          let scriptCount = 0;
          const onLoad = () => {
            scriptCount === 0 && this.observer.prevNotify(null, 'onScriptLoad');
          };

          if (initLoad.ui || uiConfig) {
            // 同步加载页面布局
            await doFetchDesignConfig(this.busType, this.customFormType, uiConfig);
          }
          if (initLoad.script) {
            // 异步加载二开脚本
            doFetchScriptContent(this.busType).then((content) => {
              if (!this.unmount && content) {
                this._script = loadScriptContent(content, onLoad);
              }
            });
          }
        }
        // 同步加载业务点注入的属性
        const extraProps = await injectProps?.(this.busState);

        if (!this.unmount && !this.state.loaded) {
          this.setState({
            loaded: true,
            language,
            buttonRights,
            extraProps: extraProps || {}
          });
        }
      } catch (e) {
        console.warn('busType error', e);
      }
    }

    destroyPage() {
      this.observer.clear();
    }

    componentWillUnmount(): void {
      this.destroyPage();
      this.unmount = true;
      this.asyncEffectCount = 0;
      this._script?.();
    }

    render() {
      const { loaded, language, extraProps } = this.state;
      if (loaded) {
        const srcArr = core.isArray(injectSrc) ? injectSrc : [injectSrc]; //注入的脚本
        const cssArr = core.isArray(injectCss) ? injectCss : [injectCss]; //注入的样式
        const { id, ...others } = this.props;
        return (
          <Page instance={this}>
            {cssArr.map((src: string) => (
              <LinkCss key={src} src={src} />
            ))}
            {srcArr.map((src: string) => (
              <Script key={src} src={src} async={false} />
            ))}
            <Comp ref={this.compRef} {...others} __parent__={this} language={language} {...extraProps} />
          </Page>
        );
      }
      return <PageLoading />;
    }
  };
}
