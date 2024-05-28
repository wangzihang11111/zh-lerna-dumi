/**
 * 模拟二开脚本执行
 */
export default function () {
  $zh.AllReady(function (page, { useValuesChange }) {
    var form = $zh.getCmpApi('form1');

    // 二开代码初始化表单值
    form.setFieldsValue({ input3: 1 });
    form.setConfig({
      input4: { clientSqlFilter: { type: 1 }, placeholder: `按type=1过滤` }
    });

    // 订阅文本和日期输入字段change
    useValuesChange(({ args }) => {
      var num = args[0].group.input1;
      if (num) {
        form.setFieldsValue({
          group: { input2: `输入的数字为${num}` }
        });
      }
      form.setReadOnly('group.input2', !!num);
    }, 'group.input1');

    form.subscribe(
      ({ args }) => {
        var type = args[0].input3.value;

        // 设置通用帮助的过滤条件
        form.setConfig({
          input4: {
            clientSqlFilter: { type: type },
            placeholder: `按type=${type}过滤`
          }
        });
      },
      'onValuesChange',
      ['input3']
    );
  });
}
