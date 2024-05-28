---
order: 30
title: Table 表格
---

## Table 表格

展示结构化的行列数据，进行分页、自定义操作等复杂行为。

<code src="./code/Table/pagination1.tsx"></code>

<code src="./code/Table/pagination2.tsx"></code>

<code src="./code/Table/edit.tsx"></code>

<code src="./code/Table/edit1.tsx"></code>

<code src="./code/Table/editColumn.tsx"></code>

<code src="./code/Table/expandGrid.tsx"></code>

<code src="./code/Table/aggregate.tsx"></code>

<code src="./code/Table/groupHeader.tsx"></code>

<code src="./code/Table/treeGrid.tsx"></code>

<code src="./code/Table/draggableGrid.tsx"></code>

<code src="./code/Table/exprFormat.tsx"></code>

<code src="./code/Table/gantt.tsx"></code>

<code src="./code/Table/virtualScroll.tsx"></code>

## API

### TableProps

<API id="Table"></API>

### ColumnProps

<API id="TableColumn"></API>

### TextEditor

<API id="TextEditor"></API>

### SelectEditor

<API id="SelectEditor"></API>

### CheckBoxEditor

<API id="CheckBoxEditor"></API>

### DatePickerEditor

<API id="DatePickerEditor"></API>

### HelpEditor

<API id="HelpEditor"></API>

### CustomizedEditor

<API id="CustomizedEditor"></API>

### 其他 interface

```jsx | pure
declare type optionType = {
  value: any,
  label:  React.ReactNode
};

interface IBaseFormat {
  nullValue?: string;
}

// 日期格式化
interface IDateFormat extends IBaseFormat {
  type: 'date';
  formatter: 'YYYY-MM-DD' | 'YYYY-MM-DD HH:mm' | 'HH:mm' | String;
}

// 选项格式化（状态转换）
interface IOptionFormat extends IBaseFormat {
  type: 'option';
  formatter?: optionType[];
}

// icon列格式化（不同状态显示不同icon）
interface IIconFormat extends IBaseFormat {
  type: 'icon';
  formatter?: optionType[];
}

// 数字格式化
interface INumberFormat extends IBaseFormat {
  type: 'number';
  prefix?: string; // 前缀字符
  suffix?: string; // 后缀字符
  formatter?: ',' | String; // 千分位格式化分隔符, 默认','
}

// 表达式计算
// $D:table数据、$R:单行数据源、$V:当前数据、$DI:当前dataIndex
interface IExprFormat extends IBaseFormat {
  type: 'expr';
  formatter: string; // 例子：$R.type===1?$R.orgName:$R.projectName
}

// string 同 IExprFormat 的 formatter
declare type IExpr = String | (($R, $D, $V, $DI) => any);
```
