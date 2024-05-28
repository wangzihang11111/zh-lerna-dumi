/**
 * inline: true
 */

import { ZhIcon, Search, zh } from '@zh/zh-design';
import React from 'react';
import { iconGroup } from './group';
import './index.less';

export default function () {
    const [keyword, setKeyword] = React.useState('');

    const value = keyword.replace('<', '').replace('>', '').replace('/', '').toLowerCase().trim();

    const copyText = text => () => {
        zh.copyText(text);
        zh.message(`${text} copied`, "success");
    };

    return (
        <div>
            <div style={{ textAlign: 'right', marginBottom: 10 }}><Search size="large" onSearch={setKeyword} style={{ width: 320, maxWidth: '100%' }} /></div>
            {iconGroup.map(({ group, items }) => {
                const showItems = items.filter(itm => {
                    return ZhIcon.hasOwnProperty(itm.id) && (itm.id.toLowerCase().indexOf(value) > -1 || itm.title.indexOf(value) > -1);
                });
                return !!showItems.length && (
                    <div key={group}>
                        <h2>{group}</h2>
                        <ul className="icon_ul">
                            {
                                showItems.map(({ id, title }) => {
                                    return (
                                        <li title={title} key={id} onClick={copyText(id)}>
                                            <div style={{ fontSize: 36, marginBottom: 5 }}>{React.createElement(ZhIcon[id])}</div>
                                            <div>{id}</div>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </div>
                )
            })}
        </div>
    )
}