import React, { ComponentClass, FunctionComponent, useLayoutEffect, useRef, useState } from 'react';
import { compHoc, pageHoc } from './baseHoc';
import { layoutModel } from './baseModel';
import { IComponentOptions, IModelType, IPageOptions } from './interface';
import { getConnect, getDvaApp, getHistory } from './umiExports';
import { getCurrentWindow } from './util/core';
import { util } from './util/tool';

/**
 * 根据路由生成命名空间
 * @param model 需要注册的model对象，没有命名空间则按照路由规则生成
 */
const _createNameSpace = (model: IModelType) => {
  if (!model.namespace) {
    const pathname = util.uniqueId(getHistory().location.pathname);
    model.namespace = 'model_' + pathname.replace(/\//g, '');
  }
  return model.namespace;
};

/**
 * 注册model
 * @param model 需要注册的model对象
 * @private
 */
const _registerModel = (model: IModelType) => {
  const app = getDvaApp();
  if (!app) {
    console.warn('getDvaApp()还没有初始化完成，请使用dynamicImport动态加载组件');
    return;
  }
  app._global = app._global || app._models.find((m) => m.namespace === 'model_global');
  if (!app._global) {
    app._global = layoutModel({
      namespace: 'model_global',
      subscriptions: {}
    });
    app.model(app._global);
  }
  if (!app._initState) {
    // 复制初始状态，用于状态还原
    app._initState = {};
  }
  const isGlobal = !!model.global;
  const namespace = _createNameSpace(model);
  if (!app._initState.hasOwnProperty(namespace) && !app._models.find((m) => m.namespace === namespace)) {
    const newModel = layoutModel(model);
    const initState = newModel.state;
    newModel.state = util.deepCopy(initState, false);
    // 全局共享状态，路由切换不会自动还原初始状态
    if (isGlobal) {
      app._initState[namespace] = null;
    } else {
      app._initState[namespace] = initState;
    }
    app.model(newModel);
  }
  getCurrentWindow()['dva_app'] = app;
};

/**
 * 调用connect高阶函数，链接model，返回新的组件
 * @param model 数据源model
 * @param Comp 当前组件
 */
function _connectComponent(model: IModelType | IModelType[], Comp: any) {
  if (!util.isArray(model)) {
    model = [model];
  }
  model.forEach((m) => _registerModel(m));

  const namespace = model[0].namespace || '';

  return getConnect()((models: any) => {
    return {
      loading: models.loading,
      getDvaState: (ns?: string) => {
        return models[ns || namespace] || {};
      },
      getDvaName: () => namespace,
      history: getHistory()
    };
  })(Comp);
}

function wrapHoc(bindNewModel, model, hoc) {
  if (!model || model.length === 0) return hoc;

  const arrModel = util.isArray(model) ? model : [model];
  return (props) => {
    const [A, setA] = useState<any>({ Comp: null });
    const namespaceRef = useRef<string[]>([]);
    useLayoutEffect(() => {
      setA(() => {
        if (bindNewModel) {
          arrModel.forEach((m) => {
            if (!m.hasOwnProperty('namespaceKey')) {
              m.namespaceKey = m.namespace || getHistory().location.pathname;
            }
            m.global = true;
            m.namespace = util.uniqueId(m.namespaceKey);
            namespaceRef.current.push(m.namespace);
          });
        }
        const tmp = _connectComponent(model, hoc);
        return { Comp: tmp };
      });

      return () => {
        const app = getDvaApp();
        namespaceRef.current.forEach((ns) => {
          delete app._initState[ns];
          app.unmodel(ns);
        });
      };
    }, []);
    return A.Comp ? React.createElement(A.Comp, props) : null;
  };
}

/**
 * 将组件和数据源绑定
 * @param options {model, component} 或者 函数、类组件
 * @param bindNewModel 按需动态绑定一个新的model
 */
function defineComponent<T = { id?: string }>(
  options: IComponentOptions | FunctionComponent<any> | ComponentClass<any>,
  bindNewModel = false
) {
  if (!options.hasOwnProperty('component')) {
    options = { component: options } as IComponentOptions;
  }
  const { model, component }: any = options as IComponentOptions;

  return wrapHoc(bindNewModel, model, compHoc<T>(component));
}

/**
 * 将路由页面和数据源绑定
 * @param options {model, component} 或者类组件
 * @param bindNewModel 按需动态绑定一个新的model
 */
function definePage(options: IPageOptions | ComponentClass<any>, bindNewModel = false) {
  if (!options.hasOwnProperty('component')) {
    options = { component: options } as IPageOptions;
  }
  const {
    model,
    component,
    injectSrc,
    customFormType,
    injectCss,
    busType,
    injectProps,
    uiConfig,
    initLoad = {}
  }: any = options as IPageOptions;
  injectCss && (component['injectCss'] = injectCss);
  uiConfig && (component['uiConfig'] = uiConfig);
  injectSrc && (component['injectSrc'] = injectSrc);
  component['busType'] = busType || model?.state?.busType;
  customFormType && (component['customFormType'] = customFormType);
  injectProps && (component['injectProps'] = injectProps);
  if (uiConfig) {
    component['initLoad'] = { script: true, language: true, buttonRights: true, ui: false, ...initLoad };
  } else {
    component['initLoad'] = { script: true, language: true, buttonRights: true, ui: true, ...initLoad };
  }

  return wrapHoc(bindNewModel, model, pageHoc(component));
}

export { definePage, defineComponent };
