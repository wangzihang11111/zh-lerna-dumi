import { useEffect, useRef } from 'react';

export function useAutoScroll({ table, scrollbar }) {
  const _ref = useRef<{ raf: any; iT: any }>({ raf: null, iT: null });
  const { autoScroll } = table.props;

  useEffect(() => {
    const container = table.outRef.current._outerRef;
    if (autoScroll && scrollbar.vertical) {
      const rIc = window.requestIdleCallback || window.setTimeout;
      const [clear, exec, delayExec] = [
        () => {
          if (_ref.current.iT) {
            clearTimeout(_ref.current.iT);
            _ref.current.iT = null;
          }
          if (_ref.current.raf) {
            cancelAnimationFrame(_ref.current.raf);
            _ref.current.raf = null;
          }
        },
        () => {
          _ref.current.raf = requestAnimationFrame(() => {
            rIc(() => {
              table.outRef.current?.scrollLeftAndTop({ top: 1 }, ({ top }) => {
                top && table.outRef.current?.scrollTo({ scrollTop: 0 });
                _ref.current.raf && exec();
              });
            });
          });
        },
        () => {
          clear();
          _ref.current.iT = setTimeout(exec, 1000);
        }
      ];
      delayExec();
      container.addEventListener('mouseenter', clear);
      container.addEventListener('mouseleave', delayExec);
      return () => {
        clear();
        container.addEventListener('mouseenter', clear);
        container.addEventListener('mouseleave', delayExec);
      };
    }
  }, [scrollbar.vertical, autoScroll]);
}
