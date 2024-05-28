import { message as AntMessage } from 'antd';
import type { NotificationInstance } from 'antd/es/notification/interface';
import { getAntApp, ProgressLoading, zh } from '../../util';

AntMessage.config({
  maxCount: 6
});

declare type voidFn = () => void;

interface IProgress {
  title?: string;
  animation?: boolean;
  afterClose?: voidFn;
  duration?: number;
  autoClose?: boolean;
}

type AntMessageType = typeof AntMessage;

type MessageApi = AntMessageType & {
  progress: (options?: IProgress) => voidFn;
  warn: AntMessageType['warning'];
};

export const message = new Proxy<MessageApi>({} as MessageApi, {
  get(_, p) {
    if (p === 'progress') {
      return (options: IProgress = {}) => {
        const { title = 'loading...', animation = false, autoClose = false, afterClose, duration = 2 } = options;
        const cfg: any = {
          title: title,
          width: 260,
          zIndex: 2000,
          styles: { body: { margin: '-15px -15px -20px' } },
          content: (
            <ProgressLoading
              style={{
                marginLeft: -35,
                marginTop: 15
              }}
              duration={duration}
            />
          ),
          okButtonProps: { style: { display: 'none' } },
          afterClose: afterClose
        };
        if (!animation) {
          cfg.transitionName = '';
          cfg.maskTransitionName = '';
        }
        let modal: any = getAntApp().modal.info(cfg);
        let destroy: any = () => {
          modal?.destroy();
          modal = null;
        };
        if (autoClose) {
          setTimeout(destroy, duration * 1000);
        }
        return destroy;
      };
    }
    if (p === 'warn') {
      // 兼容 5.0 前版本
      return getAntApp().message.warning;
    }
    return getAntApp().message[p];
  }
});

zh.registerExternal({ message });

/**
 * 使用进度条
 * @param asyncFn
 * @param options
 */
export async function usingProgress(asyncFn: Function, options?: IProgress) {
  const closeProgress = message.progress(options);
  try {
    return await asyncFn();
  } catch (e) {
    console.log(e);
    return {};
  } finally {
    closeProgress();
  }
}

export const notification = new Proxy<NotificationInstance>({} as NotificationInstance, {
  get(_, p) {
    return getAntApp().notification[p];
  }
});
