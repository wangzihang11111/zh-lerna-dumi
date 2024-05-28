//表单或者grid的主键
export function getFieldItemMainKey(key: string) {
  switch (key) {
    case 'grid':
      return 'dataIndex';
    case 'form':
      return 'name';

    case 'tab':
      return 'tabid';
    case 'fieldset':
      return 'fieldsetid';
    default:
      return 'name';
  }
}

export const mainkeys = ['dataIndex', 'name', 'tabid', 'fieldsetid'];

// layType 枚举类型
export enum layTypeEnum {
  'form',
  'grid',
  'tabPanel',
  'fieldset'
}
