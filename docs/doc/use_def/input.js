export default function () {
  $zh.AllReady(function () {
    var input = $zh.getCmpApi('input1');

    input.setValue('我是二开代码设置的' + Date.now());

    input.subscribe(({ args }) => {
      console.log(args);
    }, 'onChange');
  });
}
