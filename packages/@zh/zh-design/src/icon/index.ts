import { BaseIcon, zh } from '../util';
import React from 'react';

export const ZhIcon = BaseIcon;

zh.registerExternal({
    createIcon(iconType, props) {
        return ZhIcon[iconType] ? React.createElement(ZhIcon[iconType], props) : null;
    }
});
