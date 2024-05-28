---
order: 49
---

## TableAttachment 审批流组件拉

```tsx
import React, { useRef, useMemo } from 'react';
import { WorkFlowPanel,Button,$WorkFlow,definePage,BaseComponent,ToolBar } from '@zh/zh-design';
const appCode='0100';
const bizCode='dmtestworkflow';
const dataId='1737440671823126530';
const cuId='';
const orgId='1';
const buttons=[{id:'check',onClick(){ $WorkFlow.startFlow({appCode,bizCode,dataId,cuId,orgId})}}]

function UILayout(){
   const apiRef = useRef({});
   const asrSessionGuid = useMemo(() => Math.random().toString(36).slice(2), []);
  return (
    <>
        <ToolBar id='tb' buttons={buttons} />
          <WorkFlowPanel
            toolbar='tb'
            showToolBarItems={true}
      />
    </>
  )
}
export default definePage({
  component: class extends BaseComponent {
    render() {
      return <UILayout />;
    }
  }
});
```