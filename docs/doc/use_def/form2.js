/**
 * 模拟二开脚本执行
 */
export default function () {
  $zh.AllReady(function (page, { useValuesChange }) {
    // 更新state数据状态
    $zh.updateState((updater) => {
      updater.form.setProps((prev) => {
        return { ...prev, value: { ...prev.value, remark: '我是二开脚本设置的' } };
      });
    });

    // 更新UI元数据状态
    $zh.updateUI((updater) => {
      updater.form.mainForm.remark.setProps({ disabled: true, label: '二开修改' });
    });

    // 订阅dt字段change
    useValuesChange(({ args }) => {
      // 更新UI元数据状态
      $zh.updateUI((updater) => {
        updater.form.mainForm.dt.setProps({ label: args[0].dt });
      });

      // 更新state数据状态
      $zh.updateState((updater) => {
        updater.form.value.setProps({ remark: args[0].dt });
      });
    }, 'form2.dt');

    useValuesChange(({ args }) => {
      // 更新UI元数据状态
      $zh.updateUI((updater) => {
        // 精准更新
        updater.fieldSetForm.PaymentBill.baseInfo.BillName.setProps({ label: args[0].BillNo || '单据名称' });
        // 模糊更新
        updater.fieldSetForm.PaymentBill.PhidPc.setProps({ required: !!args[0].BillNo });
      });
      // 更新state数据状态
      $zh.updateState((updater) => {
        updater.fieldSetForm.value.setProps({ BillName: args[0].BillNo });
      });
    }, 'formset2.BillNo');
  });
}
