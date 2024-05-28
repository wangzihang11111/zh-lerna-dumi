import { FolderFilled, SearchOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../../../util';
import { Input } from '../../../baseComponent';

export const CategoryTree = (props) => {
  const { data = [], onSelect, style } = props;
  const [selectedKey, setSelectedKey] = useState('');
  const [searchName, setSearchName] = useState('');
  const [inputValue, setInputValue] = useState('');
  // const mockData = new Array(20).fill({
  //   title: 'aaa',
  //   icon: <FolderFilled />,
  //   count: 0
  // }).map((item, index) => ({
  //   ...item,
  //   key: index,
  // }))
  const dataList = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        title: item.typeName,
        key: item.typeId,
        icon: <FolderFilled />
      })),
    [data]
  );
  const filterDataList = useMemo(
    () => dataList.filter((item) => item.title.includes(searchName)),
    [dataList, searchName]
  );
  useEffect(() => {
    dataList?.[0]?.key != null && setSelectedKey(dataList[0].key);
  }, []);
  return (
    <Layout direction="column" className="attachment-category" style={style}>
      <div className="attachment-category-search-container">
        <Input
          className="attachment-category-search"
          bordered={false}
          value={inputValue}
          onChange={setInputValue}
          suffix={<SearchOutlined style={{ color: 'rgba(0,0,0,.45)' }} onClick={() => setSearchName(inputValue)} />}
        />
      </div>
      <div className="attachment-category-title">分类名称</div>
      <Layout.Flex className="attachment-category-content">
        {filterDataList.map((item) => (
          <div
            className={`attachment-category-item ${
              item.key === selectedKey ? 'attachment-category-item-selected' : ''
            }`}
            key={item.key}
            onClick={() => {
              setSelectedKey(item.key);
              onSelect(item.key);
            }}
          >
            {+item.mustInput === 1 ? <span style={{ color: 'red' }}>*</span> : null}
            <span>{item.title}</span>
            <span className="attachment-category-item-count">（{item.count}）</span>
          </div>
        ))}
      </Layout.Flex>
    </Layout>
  );
};
