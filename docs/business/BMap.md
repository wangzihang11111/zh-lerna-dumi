---
order: 50
title: BMap 百度地图
---

## 点击按钮打开百度地图

```tsx
import { message, Button, openBMap, initBMapSource } from '@zh/zh-design';

export default function () {
  return <div>
    <Button onClick={() => initBMapSource('78kduZQFzVd5OQR3dWWVXzpgolfoXkyH', () => {
      message.success('初始化完成')
    })}>初始化百度地图资源</Button>
    <Button onClick={async () => {
      const res = await openBMap({ position: { point: {lat: 39.87903901449352, lng: 116.25183243420865} } });
      console.log(res);
    }}>打开百度地图</Button>
  </div>
}
```