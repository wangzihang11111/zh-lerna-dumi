/**
 * title: 布局组合
 * description: 布局组合展现
 */

import { UpCircleFilled } from '@ant-design/icons';
import { cssVar, Layout } from '@zh/zh-design';
import React from 'react';
import { CSSProperties, ReactNode, useState } from 'react';

const { Slider, Flex } = Layout;

const commonStyle = {
  border: `1px solid ${cssVar.borderColorSplit}`
};

function Comp(props: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        width: '100%',
        height: '100%'
      }}
    >
      {props.children}
    </div>
  );
}

interface IIconBar {
  collapsed: boolean;
  style?: CSSProperties;
  onChange: () => void;
  className?: string;
}

function IconBar({ collapsed, onChange, style, className }: IIconBar) {
  return (
    <div className={className} onClick={onChange} style={style}>
      <span
        style={{
          transform: `rotate(${collapsed ? 0 : 180}deg)`,
          borderLeft: '4px solid #fff',
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent'
        }}
      />
    </div>
  );
}

export default function () {
  const [collapsed, setCollapsed] = useState(false);

  const switchCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout height={400} direction="column">
      <Slider
        size={64}
        bordered
        draggable={true}
        collapseOptions={{
          icon: (collapsed) => (
            <UpCircleFilled
              style={{
                fontSize: 22,
                color: cssVar.primaryColor,
                transform: 'translateY(-50%)'
              }}
              rotate={collapsed ? 180 : 0}
            />
          ),
          style: { height: 22 }
        }}
      >
        <Comp>
          Layout.Slider1
          <br />
          height:64
        </Comp>
      </Slider>
      <Flex direction="row">
        <Slider size={80}
          bordered>
          <Comp>
            Layout.Slider2
            <br />
            width:80
          </Comp>
        </Slider>
        <Slider
          size={80}
          bordered
          collapsed={collapsed}
          draggable={false}
          icon={<IconBar collapsed={collapsed} onChange={switchCollapsed} />}
        >
          <Comp>
            Layout.Slider3
            <br />
            width:80
          </Comp>
        </Slider>
        <Slider
          bordered
          size={120}
          defaultCollapsed={false}
          collapseOptions={{ style: { height: 26 }, title: (collapsed) => (collapsed ? '展开详情' : '收起详情') }}
        >
          <Comp>
            Layout.Slider3-1
            <br />
            width:120
          </Comp>
        </Slider>
        <Flex direction="column" style={{ overflow: 'hidden' }}>
          <Flex style={commonStyle}>
            <Comp>
              Layout.Flex
              <br />
              flex:1
            </Comp>
          </Flex>
          <Slider
            bordered
            size={120}
            draggable={false}
            collapseOptions={{ title: (collapsed) => (collapsed ? '展开详情' : '收起详情') }}
          >
            <Comp>
              Layout.Slider6
              <br />
              height:120
            </Comp>
          </Slider>
        </Flex>
        <Slider bordered size={120} collapseOptions={{ title: (collapsed) => (collapsed ? '展开详情' : '收起详情') }}>
          <Comp>
            Layout.Slider4
            <br />
            width:120
          </Comp>
        </Slider>
        <Slider bordered size={120} resizeOption={{ minSize: 60, maxSize: 300 }}>
          <Comp>
            Layout.Slider5
            <br />
            width:120
          </Comp>
        </Slider>
      </Flex>
    </Layout>
  );
}
