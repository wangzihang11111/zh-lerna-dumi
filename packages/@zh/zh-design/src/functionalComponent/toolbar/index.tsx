import { DownOutlined } from '@ant-design/icons';
import { Affix, Badge, Divider, Dropdown, Tooltip } from 'antd';
import React, { CSSProperties, useLayoutEffect, useRef } from 'react';
import {
  BaseIcon,
  compHoc,
  zh,
  ZhComponent,
  useDevState,
  useRefCallback,
  useResize,
  useUpdateEffect,
  type TypeOrFn
} from '../../util';
import { Button } from '../antd/Button';
import { handleClick } from './bridge';
import { ButtonEnum } from './enums';
import { IToolBarItemProps, IToolBarProps, ToolBarItemType } from './interface';
import { getToolBarButton } from './registerButton';

import './index.less';

export { candidateButtons } from './candidate';
export type { IToolBarItemProps, ToolBarItemType, IToolBarProps };
export { ButtonEnum };

zh.registerExternal({ getRegisterButton: getToolBarButton });

const menuButtonProps: any = { type: 'text', size: 'small' };

const getSize = (size?: string) => (size ? (size === 'simple' ? 'middle' : size) : 'middle');

function SpaceFlex() {
  return <div className="space-flex" style={{ flex: 1 }} />;
}

function UserComponent({ children, uid }) {
  return (
    <div data-cid={uid} className="user-component" style={{ padding: '0 5px' }}>
      {children}
    </div>
  );
}

function createIcon(icon, props: { className?: string; style?: CSSProperties } = {}) {
  if (icon === undefined) {
    icon = 'ApiOutlined';
  }
  if (!icon) return null;
  if (zh.isString(icon)) {
    return React.createElement(BaseIcon[icon] || BaseIcon['ApiOutlined'], props);
  } else {
    return React.cloneElement(icon, { ...props, style: { ...icon.props.style, ...props.style } });
  }
}

const dropStyle: CSSProperties = {
  padding: '5px 12px',
  height: 'auto',
  minHeight: 24,
  minWidth: 90,
  width: '100%',
  textAlign: 'left'
};
const getMenuItems = (toolbar, menuArray) => {
  const items: any = [];
  menuArray.forEach((menu) => {
    const button = toolbar.format(menu.button || menu);
    if (button.type === 'divider') {
      items.push({
        key: button.id,
        label: <Divider type="horizontal" style={{ margin: '6px 0' }} />
      });
      return;
    }
    if (button.type === 'userComponent') {
      items.push({
        key: button.id,
        label: (
          <div onClick={(e) => zh.stopPropagation(e)} style={{ margin: '6px 0' }}>
            {button.text}
          </div>
        )
      });
      return;
    }
    const { hidden, text, disabled, size } = toolbar.calcButtonProps(button);
    if (hidden) {
      return;
    }
    if (button.children) {
      items.push({
        key: button.id,
        disabled,
        label: text,
        popupClassName: zh.classNames('zh-toolbar-submenu', size),
        children: getMenuItems(toolbar, button.children)
      });
    } else {
      items.push({
        key: button.id,
        disabled,
        label: <ToolBarItem style={dropStyle} key={button.id} button={button} toolbar={toolbar} isMenuItem={true} />
      });
    }
  });
  return items;
};

function FoldMenu({ toolbar }) {
  const elRef = useRef<any>();

  const initDropdown = useRefCallback(() => {
    const tbEl = elRef.current.parentElement;
    if (!tbEl) {
      return;
    }
    if (!toolbar.btnWidths) {
      toolbar.btnWidths = {}; // 缓存button的宽度
    }
    const tbOffsetWidth = tbEl.offsetWidth;
    const tbScrollWidth = tbEl.scrollWidth;
    const dropdown: any = [];
    if (tbOffsetWidth < tbScrollWidth) {
      //  左右padding + 更多按钮宽度
      let tmpWidth =
        (tbEl.querySelector('.zh-btn-more')?.offsetWidth ||
          (['text', 'link'].includes(toolbar.props.type) ? 58 : 82)) +
        (parseFloat(zh.getStyle(tbEl, 'paddingLeft')) || 0) +
        (parseFloat(zh.getStyle(tbEl, 'paddingRight')) || 0);
      tbEl.childNodes.forEach((child) => {
        const itemId = child.getAttribute?.('id') || child.getAttribute?.('data-cid');
        let childOffsetWidth = toolbar.btnWidths[itemId];
        if (zh.isNullOrEmpty(childOffsetWidth)) {
          childOffsetWidth =
            child.offsetWidth +
            (parseFloat(zh.getStyle(child, 'marginLeft')) || 0) +
            (parseFloat(zh.getStyle(child, 'marginRight')) || 0);
          itemId && (toolbar.btnWidths[itemId] = childOffsetWidth);
        }
        tmpWidth += childOffsetWidth;
        if (tmpWidth > tbOffsetWidth && itemId) {
          dropdown.push({
            button: (function () {
              if (itemId.indexOf('_divider_') === 0) {
                return { type: 'divider', id: itemId };
              }
              if (itemId.indexOf('_user_component_') === 0) {
                return { type: 'userComponent', id: itemId, text: toolbar.userComponents?.[itemId] };
              }
              return toolbar.findItem(itemId);
            })(),
            itemId,
            width: childOffsetWidth
          });
        }
      });
    }

    if (toolbar.state.dropdown.length !== dropdown.length) {
      toolbar.setState((prev) => ({ ...prev, dropdown }));
    }
  });

  useLayoutEffect(() => {
    toolbar.btnWidths = {};
    initDropdown();
  }, [toolbar.state.resize]);

  const getParentEl = useRefCallback(() => elRef.current.parentElement);

  useResize(() => {
    toolbar.setState((prev) => ({ ...prev, dropdown: [], resize: {} }));
  }, getParentEl);

  useUpdateEffect(() => {
    toolbar.setState((prev) => ({ ...prev, dropdown: [], resize: {} }));
  }, [toolbar.dev.size, toolbar.dev.type, toolbar.dev.buttons]);

  const btnProps = { ...menuButtonProps, size: getSize(toolbar.dev.size), type: toolbar.dev.type || 'default' };

  const showMore = !!toolbar.state.dropdown.length;

  return (
    <span
      ref={elRef}
      style={{ display: showMore ? 'flex' : 'none' }}
      children={
        showMore &&
        (zh.isFunction(toolbar.dev.moreIcon) ? (
          toolbar.dev.moreIcon(toolbar.state.dropdown.map(({ button }, idx) => toolbar.format(button, idx)))
        ) : (
          <Dropdown
            menu={{
              items: getMenuItems(toolbar, toolbar.state.dropdown),
              className: zh.classNames('zh-toolbar-menu', getSize(toolbar.dev.size))
            }}
            onOpenChange={toolbar.onOpenChange({})}
          >
            <Button {...btnProps} className="zh-btn-more">
              更多
              {toolbar.dev.moreIcon ||
                createIcon('DownOutlined', {
                  style: toolbar.dev.iconColor ? { color: toolbar.dev.iconColor, marginLeft: 5 } : { marginLeft: 5 }
                })}
            </Button>
          </Dropdown>
        ))
      }
    />
  );
}

function TooltipButton({ title, buttonProps, outRef, badgeText }) {
  const render = () => {
    if (badgeText) {
      return (
        <Badge count={badgeText} size="small" styles={{ root: { color: 'inherit' } }} offset={[-10, 2]}>
          <Button {...buttonProps} ref={outRef} />
        </Badge>
      );
    }
    return <Button {...buttonProps} ref={outRef} />;
  };

  return title ? <Tooltip title={title}>{render()}</Tooltip> : render();
}

class ToolBarItem extends ZhComponent {
  constructor(props) {
    super(props);
    this.state = {
      defaultBadge: undefined
    };
  }

  async componentDidMount() {
    this.props.toolbar?.addItemMap(this);
    // if (this.props.button.originid === ButtonEnum.Attachment) {
    //   const getData = this.props.button.getData || this.props.toolbar.dev.getData;
    //   let params = { phid: '', tablename: '' };
    //   if (getData) {
    //     params = (await getData({ id: ButtonEnum.Attachment })) || params;
    //   }
    //   if (!params.phid) {
    //     params.phid = zh.getQueryValue('id');
    //   }
    //   if (!params.tablename) {
    //     const dvaState = zh.getPageInstance()?.getDvaState?.() || {};
    //     params.tablename = dvaState.tableName || zh.getQueryValue('tableName');
    //   }
    //   if (params.phid && params.tablename) {
    //     zh.request
    //       .get({
    //         url: 'SUP/Attachment/GetAttachCount',
    //         data: { tablename: params.tablename, phid: params.phid }
    //       })
    //       .then(({ code, data, message }) => {
    //         if (code === 0) {
    //           data > 0 && this.setState({ defaultBadge: data });
    //         } else {
    //           console.log('附件取数失败', message);
    //         }
    //       });
    //   }
    // }
  }

  componentWillUnmount(): void {
    this.props.toolbar?.deleteItemMap(this);
  }

  isSimpleButton() {
    const { toolbar, button, isMenuItem = false } = this.props;
    return !isMenuItem && (toolbar.dev.size === 'simple' || button.simple);
  }

  getApi() {
    return {
      ...this.outRef.current?.getApi(),
      setState: (...args) => this.setState(args[0], args[1]),
      setDisabled: (disabled = true) => this.setDisabled(disabled),
      setHidden: (hidden = true) => this.setHidden(hidden),
      isSimpleButton: () => this.isSimpleButton(),
      isVisible: () => {
        const { button, toolbar } = this.props;
        const { hidden } = toolbar.calcButtonProps(button);
        return !hidden;
      }
    };
  }

  setStateProps(stateKey, stateValue) {
    const { toolbar, button } = this.props;
    toolbar.setItemProps(button.originid, { [stateKey]: stateValue });
  }

  setDisabled(disabled = true) {
    this.setStateProps('disabled', disabled);
  }

  setHidden(hidden = true) {
    this.setStateProps('hidden', hidden);
  }

  render() {
    const { button, toolbar, isMenuItem, style } = this.props;
    const { originid, children, onClick, getClickParams } = button;
    const { iconColor, badge } = toolbar.dev;
    const { defaultBadge } = this.state;
    const { icon, text, hidden, disabled, type: buttonType, size, buttonStyle } = toolbar.calcButtonProps(button);
    if (hidden) {
      return null;
    }
    const type = isMenuItem ? 'text' : buttonType;
    const btnProps = {
      ...menuButtonProps,
      getClickParams,
      type,
      className: 'zh-toolbar-button',
      style: { margin: `${['text', 'link'].includes(type) ? 0 : '0 4px'}`, ...style, ...buttonStyle },
      originid,
      id: button.id,
      containerId: '',
      disabled,
      size
    };
    if (size === 'small' && ['link'].includes(type) && !btnProps.style.padding) {
      btnProps.style.padding = 0;
      btnProps.style.marginRight = 8;
    }
    let badgeText = (zh.isFunction(badge) ? badge(originid) : badge?.[originid]) ?? defaultBadge;
    if (children) {
      const innerText = [
        text,
        <DownOutlined
          key="DownOutlined"
          className="zh-btn-icon"
          style={{
            marginLeft: 5,
            ...(iconColor ? { color: iconColor } : {})
          }}
        />
      ];
      return (
        <Dropdown
          menu={{ items: getMenuItems(toolbar, children), className: zh.classNames('zh-toolbar-menu', size) }}
          disabled={disabled}
          onOpenChange={toolbar.onOpenChange(this)}
          children={
            this.isSimpleButton() ? (
              <TooltipButton title={innerText} badgeText={badgeText} buttonProps={btnProps} outRef={this.outRef} />
            ) : (
              <Button {...btnProps} children={innerText} />
            )
          }
        />
      );
    } else if (zh.isString(text) || icon) {
      btnProps.icon = createIcon(icon, {
        className: 'zh-btn-icon',
        style: {
          ...(iconColor ? { color: iconColor } : {})
        }
      });
    }
    if (this.isSimpleButton()) {
      return (
        <TooltipButton
          title={text}
          badgeText={badgeText}
          outRef={this.outRef}
          buttonProps={{ ...btnProps, onClick, style: { ...btnProps.style, minWidth: 30 } }}
        />
      );
    }
    if (zh.isReactElement(text)) {
      return <div style={{ margin: 0, ...style, ...buttonStyle }}>{React.cloneElement(text, { disabled })}</div>;
    }

    badgeText = badgeText ? (
      <Badge
        count={badgeText}
        size="small"
        styles={{ root: { color: 'inherit' } }}
        offset={[isMenuItem ? 5 : size === 'small' ? 3 : 5, size === 'small' ? -2 : -6]}
      >
        {text}
      </Badge>
    ) : (
      text
    );
    return <Button ref={this.outRef} {...btnProps} onClick={onClick} children={badgeText} />;
  }
}

export const ToolBar = compHoc<IToolBarProps>(
  class extends ZhComponent<IToolBarProps> {
    private _itemMap = new Map<string, ToolBarItem>();
    randomKey = '';
    private mountButtons: any[] = [];
    private divRef = React.createRef<HTMLDivElement>();
    private userComponents: any = {};
    dev: any = {};

    constructor(props) {
      super(props);
      this.randomKey = props.id || Math.random().toString(36).slice(2);
      this.state = {
        affixed: false,
        dropdown: [],
        rights: { disableBtn: [], hideBtn: [] }
      };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      const newState = ZhComponent.propsToState(nextProps, prevState, ['buttons']);
      if (newState?.hasOwnProperty('buttons')) {
        return { ...newState, dropdown: [] };
      }
      return newState;
    }

    async componentDidMount() {
      this.mountButtons = [...this.props.buttons];
      if (this.props.rightName) {
        zh.getPageInstance()?.observer?.subscribe((rights) => {
          this.setState((prev) => ({ ...prev, rights }));
        }, `buttonRight_${this.props.rightName}`);
      }
    }

    componentWillUnmount(): void {
      this.props.buttons.splice(0, this.props.buttons.length, ...this.mountButtons);
    }

    /**
     * 计算按钮属性
     * @param button
     */
    calcButtonProps(button) {
      const {
        hidden,
        text,
        disabled,
        icon,
        type = this.dev.type || 'default',
        size = this.dev.size || 'middle',
        style = {}
      } = button;
      const rightKey = button.rightKey || button.originid;
      const { disabledKeys = [], hiddenKeys = [], showIcon = true } = this.dev;
      const { rights } = this.state;
      return {
        hidden: hidden || hiddenKeys.includes(button.originid) || rights.hideBtn.includes(rightKey),
        text,
        icon: showIcon ? icon : null,
        type,
        size: getSize(size),
        buttonStyle: style,
        disabled: disabled || disabledKeys.includes(button.originid) || rights.disableBtn.includes(rightKey)
      };
    }

    async refreshRight(orgId: string) {
      const { rightName } = this.props;
      if (rightName) {
        return zh.getPageInstance()?.refreshButtonRights?.({ orgId, rightName });
      }
    }

    /**
     * 原始button数据转换成标准的button格式
     * @param button 候选key或者自定义button
     */
    format(button: any, idx) {
      let tmpButton: any = null;
      if (zh.isReactElement(button)) {
        return button;
      }
      const isObject = zh.isObject(button);
      const itemId = isObject ? button['id'] : button;
      const find = getToolBarButton(itemId);
      if (find) {
        tmpButton = isObject ? { ...find, ...button } : { ...find, id: itemId };
      } else {
        tmpButton = isObject ? { ...button } : null;
      }
      if (tmpButton && tmpButton.id) {
        const btnId = tmpButton.originId || tmpButton.id;
        const langKey = tmpButton.langKey || btnId;
        const onClickCallback = tmpButton.onClick;
        // 先取业务组定义的多语言，再取toolbar定义的多语言
        tmpButton.text = zh.getPageLang()?.[langKey] || zh.getUser()?.toolbarLang?.[langKey] || tmpButton.text;
        const getData = tmpButton.getData || this.props.getData;
        const params = {
          id: btnId,
          key: btnId,
          containerId: this.props.containerId || this.getId(),
          text: tmpButton.text,
          toolbar: this,
          getData,
          origin: {
            icon: tmpButton.icon,
            text: tmpButton.text,
            hidden: !!tmpButton.hidden
          }
        };
        tmpButton.onClick = async () => {
          return await handleClick({
            ...params,
            onClick: onClickCallback || this.props.onClick,
            button: tmpButton
          });
        };
        if (onClickCallback) {
          tmpButton.getClickParams = () => {
            return { ...params };
          };
        }
        tmpButton.id = idx === undefined ? btnId : this.randomKey + '$' + btnId + idx;
        tmpButton.originid = btnId;
        if (!tmpButton.type && this.props.type) {
          tmpButton.type = this.props.type;
        }
      }

      return tmpButton;
    }

    /**
     * 查找原始props.button对象
     * @param originId 定义的id
     */
    findOriginItem(originId) {
      return this.dev.buttons.find((btn: any) => btn.id === originId || btn === originId);
    }

    findItem(itemId) {
      const item = this.dev.buttons.find((btn: any, idx) => {
        const id = this.randomKey + '$' + (zh.isString(btn) ? btn : btn.id) + idx;
        return id === itemId;
      });
      return item;
    }

    /**
     * 保存button实例的映射，方便查找button
     * @param item button实例
     */
    addItemMap(item: ToolBarItem) {
      this._itemMap.set(item.props.button.originid, item);
    }

    /**
     * 删除button实例的映射，button销毁时调用
     * @param item button实例
     */
    deleteItemMap(item) {
      this._itemMap.delete(item.props.button.originid);
    }

    /**
     * 获取button实例
     * @param itemId button的id
     */
    getItem(itemId) {
      return this._itemMap.get(itemId)?.getApi();
    }

    /**
     * 获取toolbar的按钮权限数据（服务端返回）
     */
    getRights() {
      return this.state.rights;
    }

    /**
     * 动态设置button的属性
     * @param itemId  button的id
     * @param props {icon, text, hidden}
     */
    setItemProps(
      itemId,
      props: { icon?: string; text?: string; hidden?: boolean; disabled?: boolean; style?: CSSProperties }
    ) {
      zh.fastDp.toolbar.updateItems({ id: this.getId(), items: [{ id: itemId, ...props }] });
    }

    /**
     * 设置button可见
     * @param itemId button的id
     */
    showButton(itemId) {
      this.setItemProps(itemId, { hidden: false });
    }

    /**
     * 设置button不可见
     * @param itemId button的id
     */
    hideButton(itemId) {
      this.setItemProps(itemId, { hidden: true });
    }

    setHidden(itemId, hidden = true) {
      this.setItemProps(itemId, { hidden });
    }

    setReadOnly(itemId, disabled = true) {
      this.setItemProps(itemId, { disabled });
    }

    /**
     * 获取当前的buttons
     */
    getButtons() {
      return this.dev.buttons;
    }

    /**
     * 动态添加button
     * @param button
     * @param index
     */
    insert(button, index = -1) {
      if (!zh.isArray(button)) {
        button = [button];
      }
      zh.fastDp.toolbar.addItems({ id: this.getId(), items: button, insertIndex: index });
    }

    /**
     * 删除button
     * @param ids buttonItem的id集合
     */
    delete(ids) {
      if (!zh.isArray(ids)) {
        ids = [ids];
      }
      zh.fastDp.toolbar.deleteItems({ id: this.getId(), items: ids });
    }

    /**
     * 设置buttons
     * @param handler 处理事件
     */
    setButtons(handler: TypeOrFn<ToolBarItemType, ToolBarItemType>) {
      zh.fastDp.toolbar.setItems({ id: this.getId(), items: handler });
    }

    subscribe(fn: Function, type, buttonId?: string | string[]) {
      if (buttonId && buttonId.length > 0) {
        const arr = zh.isArray(buttonId) ? buttonId : [buttonId];
        return this.innerSubscribe(fn, type, ({ args }) => arr.includes(args[0].id));
      } else {
        return this.innerSubscribe(fn, type);
      }
    }

    onOpenChange(btn) {
      return (open) => {
        this.dev.onOpenChange?.(open, btn);
      };
    }

    direction = { left: 'left', right: 'left' }; //  justifyContent right 滚动条宽度有问题

    getAffixTarget = () => {
      return (
        zh.closest(
          this.divRef.current?.parentNode,
          (el) => el.scrollWidth > el.offsetWidth || el.scrollHeight > el.offsetHeight
        ) || window
      );
    };

    render() {
      return <InnerToolbar ins={this} />;
    }
  },
  'ToolBar'
);

function InnerToolbar({ ins }) {
  const { dropdown, buttons: items, affixed } = ins.state;
  const [props, buttons] = useDevState({ type: 'toolbar', id: ins.getId(), props: ins.props, items, itemKey: 'id' });
  const { style, affix = false, direction = 'left', type = 'button', className = '', stopPropagation = true } = props;
  ins.dev = { ...props, buttons };

  const tb = (
    <div
      id={ins.getId()}
      className={`zh-toolbar ${type} ${className}`}
      ref={ins.divRef}
      onClick={(e) => (stopPropagation ? zh.stopPropagation(e) : void 0)}
      style={{
        display: 'flex',
        width: '100%',
        maxWidth: '100%',
        minHeight: 24,
        padding: 'var(--inner-padding, 8px) 4px',
        alignItems: 'center',
        justifyContent: ins.direction[direction] || direction,
        boxShadow: affix && affixed ? '0 10px 8px -8px #e0e0e0' : 'none',
        overflow: 'hidden',
        ...style
      }}
    >
      {direction === 'right' && <SpaceFlex key="right_1" />}
      {buttons.map((btn, index) => {
        const tmp = ins.format(btn, index);
        const itemId = tmp?.id ?? tmp?.originid ?? '';
        if (index === 0 && tmp && !zh.isReactElement(tmp) && !tmp.type) {
          tmp.type = 'primary';
        }
        if (
          !tmp ||
          dropdown.some(
            (d) => d.itemId === itemId || [`_divider_${index}`, `_user_component_${index}`].includes(d.button?.id)
          )
        ) {
          return null;
        }
        if (zh.isReactElement(tmp)) {
          const uid = `_user_component_${index}`;
          ins.userComponents[uid] = tmp;
          return <UserComponent uid={uid} key={uid} children={tmp} />;
        }
        if (tmp.type === 'flex') {
          return <SpaceFlex key={tmp.id || index} />;
        }
        if (tmp.type === 'divider') {
          return <Divider type="vertical" key={`_divider_${index}`} data-cid={`_divider_${index}`} />;
        }
        return <ToolBarItem key={tmp.id || index} button={tmp} toolbar={ins} />;
      })}
      <FoldMenu toolbar={ins} />
    </div>
  );

  if (affix) {
    const affixConfig = zh.isObject(affix) ? affix : {};
    return (
      <Affix target={ins.getAffixTarget} {...affixConfig} onChange={(affixed) => ins.setState({ affixed })}>
        {tb}
      </Affix>
    );
  }
  return tb;
}
