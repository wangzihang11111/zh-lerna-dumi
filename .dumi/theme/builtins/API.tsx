import { useAtomAssets } from 'dumi';
import DefaultAPI from 'dumi/theme-default/builtins/API';
import React, { useMemo, type FC } from 'react';

const Api: FC<{ id?: string }> = ({ id }) => {
  const { components } = useAtomAssets();

  if (id) {
    const identifier = id.replace(/\./g, '_').toLowerCase();
    const definition = components?.[identifier];
    if (Object.prototype.toString.call(definition) === '[object Array]' && definition.length > 0) {
      return <ApiTable definition={definition} />;
    }
    return <DefaultAPI id={id} />;
  }
  return <>暂无</>;
};

function ApiTable({ definition }) {
  const items = useMemo(() => {
    return definition.slice().sort((a, b) => (a.identifier > b.identifier ? 1 : -1));
  }, [definition]);

  return (
    <div className="markdown">
      <div className="dumi-default-table">
        <div className="dumi-default-table-content">
          <table>
            <thead>
              <tr>
                <th key={1}>属性名</th>
                <th key={2}>描述</th>
                <th key={3}>类型</th>
                <th key={4}>默认值</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.identifier}>
                  <td key={1}>{r.identifier}</td>
                  <td key={2}>{r.description}</td>
                  <td key={3}>
                    <code>{r.type}</code>
                  </td>
                  <td key={4}>
                    <code>{r.default ?? '--'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Api;
