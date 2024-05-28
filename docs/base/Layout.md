---
title: Layout 布局
order: 1
toc: content
---

# Layout 布局

原理：利用 display: flex 实现弹性布局。

## 代码演示

<code src="./code/Layout/index.tsx"></code>

## API

```html

<Layout direction="column">
    <div>顶部区域</div>
    <Layout.Flex direction="row">
        <Layout.Slider size={180} bordered>侧边栏</Layout.Slider>
        <Layout.Flex>内容区</Layout.Flex>
    </Layout.Flex>
</Layout>

```

### Layout
<API id="Layout"></API>

### Layout.Flex
<API id="Layout.Flex"></API>

### Layout.Slider
<API id="Layout.Slider"></API>
