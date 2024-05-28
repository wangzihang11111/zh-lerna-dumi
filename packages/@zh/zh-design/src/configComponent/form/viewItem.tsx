import { zh } from '../../util';
import { getComp } from '../common';

const TextItem = getComp({ xtype: 'Text' }).instance;
export default function (props) {
  const { 'data-item': item, ...others } = props;
  const { src, value } = props;
  let val = value;
  let Comp = TextItem;

  //图片
  if ((src && item.xtype === 'Image') || item.xtype === 'Button') {
    Comp = getComp(item).instance;
  } else if (item.xtype === 'RangePicker') {
    val = Array.isArray(value) ? value.join('-') : value;
  } else if (Array.isArray(item.data || item.options)) {
    const dataList = item.data || item.options;
    if (Array.isArray(value)) {
      const sets = new Set(value);
      val = (item.data || item.options)
        .filter((item) => sets.has(item.value))
        .map((item) => item.label)
        .join(',');
    } else {
      val = dataList.find((item) => item.value === value)?.label;
    }
  } else if (Array.isArray(value)) {
    val = value.map((item) => item?.label).join(',');
  } else {
    val = val?.label || val?.toString();
  }

  if (zh.isNullOrEmpty(val)) {
    return null;
  }

  return <Comp {...others} value={val} />;
}
