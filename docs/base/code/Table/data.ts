export const treeData = [
  {
    id: 1,
    name: '张三',
    age: 28,
    sex: 0,
    address: '北京',
    children: [
      {
        id: 2,
        name: '李四',
        sex: 1,
        age: 10,
        address: '杭州',
        children: [
          {
            id: 3,
            name: '小七',
            sex: 1,
            age: 10,
            address: '杭州1',
            children: [
              {
                id: 4,
                name: '叶子节点',
                sex: 1,
                age: 10,
                address: '杭州2'
              }
            ]
          }
        ]
      },
      {
        id: 5,
        name: '王五1',
        sex: 0,
        age: 6,
        address: '武汉'
      },
      {
        id: 51,
        name: '王五2',
        sex: 0,
        age: 6,
        address: '武汉'
      },
      {
        id: 52,
        name: '王五3',
        sex: 0,
        age: 6,
        address: '武汉'
      }
    ]
  },
  {
    id: 6,
    name: '小七',
    sex: 1,
    age: 18,
    address: '上海'
  }
];

export const taskData = [
  {
    name: 'Project#1',
    startTime: '2022-03-02',
    duration: 360,
    complete: 0.5,
    children: [
      { name: 'Task#1.1', startTime: '2022-03-03', duration: 72, complete: 0.6 },
      { name: 'Task#1.2', startTime: '2022-03-04', duration: 240, complete: 0.4 }
    ]
  },
  {
    name: 'Project#2',
    startTime: '2022-03-07',
    duration: 144,
    complete: 0.8,
    children: [
      { name: 'Task#2.1', startTime: '2022-03-08', duration: 72, complete: 0.7 },
      { name: 'Task#2.2', startTime: '2022-03-13', duration: 48, complete: 1 }
    ]
  },
  { name: 'Project#3', startTime: '2022-03-03', duration: 240, complete: 0.3 }
];

export const gridData = [
  {
    phId: '1111',
    percent: 0,
    name: '张三',
    age: 32,
    sex: 0,
    birthday: '1989-12-11',
    province: '浙江省',
    city: '杭州市',
    address: '10001',
    address_name: '杭州',
    description: 'My name is John Brown, I am 32 years old, living in New York No. 1 Lake Park.'
  },
  {
    phId: '2222',
    percent: 0,
    name: '张三',
    sex: 0,
    age: 18,
    birthday: '2003-11-11',
    province: '湖北省',
    city: '武汉市',
    address: '10002',
    address_name: '武汉市',
    description: 'My name is John Brown, I am 32 years old, living in New York No. 1 Lake Park.'
  },
  {
    phId: '3333',
    percent: 0,
    name: '小七',
    sex: 1,
    age: 18,
    birthday: '2003-02-11',
    province: '湖南省',
    city: '长沙市',
    address: '10003',
    address_name: '长沙市',
    description: 'My name is John Brown, I am 32 years old, living in New York No. 1 Lake Park.'
  },
  {
    phId: '4444',
    percent: 0,
    name: '小八',
    sex: 0,
    age: 21,
    birthday: '2000-01-11',
    province: '湖北省',
    city: '荆州市',
    address: '10004',
    address_name: '荆州市',
    description: 'My name is John Brown, I am 32 years old, living in New York No. 1 Lake Park.'
  }
];

export const generateData = (row, count) => {
  const keys = Object.keys(row);
  let i = 0;
  return new Array(count).fill(1).reduce((p, c) => {
    i++;
    return [
      ...p,
      keys.reduce((item, k) => {
        return { ...item, [k]: generateValue(row[k], i) };
      }, {})
    ];
  }, []);
};

function generateValue(value, i) {
  const dataTypeOf = typeof value;
  switch (dataTypeOf) {
    case 'string':
      return `${value}${i}`;
    case 'number':
      if (value < 2) {
        return i % 2;
      }
      return value + i;
    default:
      return value;
  }
}
