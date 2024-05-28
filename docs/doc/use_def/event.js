export default function () {
  $zh.AllReady(function (page, { useBeforeClick, useClick }) {
    var tb = $zh.getCmpApi('toolbar1');

    // 监听保存按钮的点击事件
    tb.subscribe(async function ({ args }) {
      await $zh.alert(`触发了 ${args[0].text} subscribe事件！`);
    }, 'onClick');

    // 监听前置事件，返回false则取消向下执行
    tb.subscribe(async function ({ args }) {
      // 模拟异步请求
      await $zh.alert(`触发了 ${args[0].text} 二开前置事件，没有返回false，继续向下执行！`);
    }, 'onBeforeClick');

    useBeforeClick(async function ({ args }) {
      await $zh.alert('触发了 ' + args[0].text + ' 按钮的useBeforeClick事件！');
    }, 'save');

    useClick(async function ({ args }) {
      await $zh.alert('触发了 ' + args[0].text + ' 按钮的useClick事件！');
    }, 'save');
  });
}
