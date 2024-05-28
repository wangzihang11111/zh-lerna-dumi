/**
 * 模拟二开脚本执行
 */
export default function () {
  $zh.AllReady(function (page, { useDataIndexChange, useUpdateRow, useUpdateRows }) {
    var table = $zh.getCmpApi('table1');

    // 增加默认行
    table.addRows({ cno: '0002', cname: '二开新增1' });

    // 更新列头header信息
    $zh.updateUI((updater) => {
      updater.grid.editList.mobile.setProps({
        header: '手机号码11'
      });
    });

    // 订阅数据行更新
    useUpdateRow(({ args, instance }) => {
      const record = args[0];
      console.log('更新数据行', record);
    }, 'table1');

     // 订阅整表数据更新，包括增行、删行、数据源直接变更等操作时
     useUpdateRows(({ args, table }) => {
      const rows = args[0];
      console.log('更新数据', rows);
    }, 'table1');

    // 订阅编辑字段更新
    useDataIndexChange(({ args, instance }) => {
      args[0].price = args[0].applyCount;
      instance.updateRow(args[0]);
    }, 'table1.applyCount');
  });
}
