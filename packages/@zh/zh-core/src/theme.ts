import type { ThemeConfig } from 'antd/es/config-provider';

const BaseColor = '#008EE0';
const colorText = 'rgba(0, 0, 0, 0.88)';
const colorTextDisabled = '#C0C0C0';

export const defaultTheme: DefaultThemeType = {
  antdTheme: {
    token: {
      borderRadius: 4,
      colorPrimary: BaseColor,
      fontSize: 14,
      colorText: colorText,
      colorInfo: BaseColor,
      controlHeight: 32,
      colorTextDisabled: 'rgba(0, 0, 0, 0.85)'
    },
    components: {
      Select: { colorTextDisabled: 'rgba(0, 0, 0, 0.35)' },
      Layout: {
        siderBg: BaseColor,
        headerBg: '#ffffff',
        headerColor: colorText
      },
      Form: {
        itemMarginBottom: 20
      },
      Menu: {
        darkItemBg: BaseColor,
        darkSubMenuItemBg: BaseColor,
        darkItemSelectedBg: 'var(--primary-8-5)',
        darkDangerItemSelectedBg: BaseColor,
        subMenuItemBorderRadius: 0,
        itemBorderRadius: 0,
        itemMarginInline: 0
      },
      Tree: {
        directoryNodeSelectedColor: BaseColor,
        directoryNodeSelectedBg: 'rgba(0, 129, 204, 0.1)',
        nodeHoverBg: 'rgba(0, 162, 255, 0.1)',
        nodeSelectedBg: 'rgba(0, 129, 204, 0.1)',
        titleHeight: 32
      },
      Checkbox: {
        borderRadius: 2,
        borderRadiusSM: 2
      },
      Button: {
        textHoverBg: 'transparent',
        paddingInlineSM: 6,
        colorTextDisabled
      },
      Alert: {},
      Modal: {
        headerBg: '#ffffff',
        titleColor: colorText,
        margin: 0
      },
      Tabs: {
        horizontalMargin: '0 0 0 0'
      }
    }
  },
  customCssVar: {
    global: {
      '--text-color': colorText,
      '--primary-color': BaseColor,
      '--adm-color-primary': BaseColor,
      '--disabled-color': colorTextDisabled
    },
    pc: {
      '--border-radius': '4px',
      '--outer-margin': '16px',
      '--inner-margin': '16px',
      '--inner-padding': '8px',
      '--form-label-width': '98px',
      '--component-background': '#ffffff',
      '--border-color-split': '#ECECEC',
      '--table-row-hover-bg': '#fafafa',
      '--table-selected-row-bg': 'var(--primary-1)',
      '--font-size-base': '14px',
      '--modal-header-height': '40px',
      '--modal-header-padding-horizontal': '12px',
      '--modal-header-bg': '#ffffff',
      '--modal-header-color': colorText,
      '--modal-close-color': 'rgba(0, 0, 0, .45)'
    },
    mobile: {
      '--adm-button-border-radius': '8px',
      '--adm-button-border-width': '1px',
      '--adm-button-border-style': 'solid'
    }
  }
};

export type DefaultThemeType = {
  antdTheme: ThemeConfig;
  customCssVar: { pc: Record<string, any>; mobile: Record<string, any>; global: Record<string, any> };
};
