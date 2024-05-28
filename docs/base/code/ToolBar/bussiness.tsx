/**
 * title: 业务按钮组件
 * description: 执行不同的业务操作。
 */
import { BaseComponent, ButtonEnum, ToolBar, definePage } from '@zh/zh-design';
import { useMemo, useRef, useState } from 'react';
import React from 'react';

const sizeArr = ['small', 'middle', 'large', 'simple'];

function ButtonDemo() {
  const ref = useRef(1);
  const [size, setSize] = useState<any>(sizeArr[1]);
  const [showIcon, setShowIcon] = useState(false);

  const [badge, setBadge] = useState({ [ButtonEnum.Attachment]: 10 });

  const buttons = useMemo(
    () => [
      {
        id: 'test1',
        icon: 'SwitcherOutlined',
        text: '切换模式',
        onClick() {
          ref.current++;
          setSize(sizeArr[ref.current % 4]);
          setShowIcon(ref.current % 4 !== 1);
        }
      },
      {
        id: 'test2',
        icon: 'PaperClipOutlined',
        text: '附件数+1',
        onClick() {
          setBadge((p) => ({ ...p, [ButtonEnum.Attachment]: p[ButtonEnum.Attachment] + 1 }));
        }
      },
      '|',
      ...Object.values<string>(ButtonEnum),
      '|',
      {
        id: 'group_user',
        style: { display: 'inline-flex', alignItems: 'center', paddingTop: 0, paddingBottom: 0 },
        text: <div key="userButton" style={{ width: 30, height: 30, backgroundColor: '#ddd' }} />,
        children: [
          { id: 'user_pwd', text: '修改密码' },
          { id: 'user_exit', text: '退出登录' }
        ]
      }
    ],
    []
  );

  return (
    <div style={{ backgroundColor: '#f9fafb' }}>
      <ToolBar
        buttons={buttons}
        affix={{ offsetTop: 76, target: () => window }}
        id="busToolbar"
        rightName='test'
        size={size}
        showIcon={showIcon}
        badge={badge}
      />
    </div>
  );
}

export default definePage({
  busType: 'test',
  component: class extends BaseComponent {
    render(): React.ReactNode {
      return <ButtonDemo />;
    }
  }
})
