import './index.less';

export const PageLoading = () => {
  return (
    <div className="zh-progress-loading">
      <span />
    </div>
  );
};

export const ProgressLoading = ({ style = {}, duration = 2 }) => {
  return (
    <div className="zh-progress-loading-max" style={style}>
      <span style={{ animationDuration: `${duration}s` }} />
    </div>
  );
};
