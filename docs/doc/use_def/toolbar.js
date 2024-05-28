export default function () {
  $zh.AllReady(function (page, { useClick }) {
    var isSaveClick = false;

    // 监听保存按钮的点击事件
    useClick(function ({ toolbar }) {
      if (isSaveClick) {
        // 显示帮助按钮
        toolbar.showButton('help');
        // 取消禁用返回按钮
        toolbar.setReadOnly('back', false);
      } else {
        // 隐藏帮助按钮
        toolbar.hideButton('help');
        // 禁用返回按钮
        toolbar.setReadOnly('back', true);
      }
      isSaveClick = !isSaveClick;
    }, 'toolbar.save');
  });
}
