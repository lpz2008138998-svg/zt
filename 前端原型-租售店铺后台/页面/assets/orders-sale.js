/* orders-sale.js —— 商品销售订单（卖家 / 买家 / 平台力）状态机数据 */
window.ORDERS_FLOW = {
  key: 'sale',
  title: '销售订单列表',
  roles: { a: '卖家', b: '买家', c: '平台力', n: '—' },
  operators: { a: '张伟（卖家）', b: '李娜（买家）', c: '平台审核员', n: '系统' },
  cols: ['序号', '订单类型', '订单状态', '订单编号', '卖家店铺', '买家单位'],
  types: ['自主', '委托'],
  amt: { total: '订单总额（元）', deposit: '保证金（元）', paidDeposit: '已缴保证金（元）',
         checked: '已对账金额（元）', paid: '已付货款（元）', damage: '退货/扣款（元）', refunded: '已退保证金（元）' },
  steps: [
    { id:'order', role:'b', name:'采购下单', desc:'买家选择商品并提交采购订单', status:{ key:'draft', label:'待提交', tone:'gray' } },
    { id:'accept', role:'a', name:'接单（确认接单）', desc:'卖家确认接单，订单进入已接单', status:{ key:'to_accept', label:'待接单', tone:'orange' } },
    { id:'contract', role:'b', name:'合同', desc:'签订合同（可与后续环节并行）', opt:true, status:{ key:'to_contract', label:'待签合同', tone:'orange' } },
    { id:'invoice0', role:'a', name:'允许先开票', desc:'卖家可允许先开票', opt:true, status:{ key:'to_inv0', label:'待开票确认', tone:'cyan' } },
    { id:'ship', role:'a', name:'发货（分多批次发货）', desc:'卖家按批次发货', status:{ key:'to_ship', label:'待发货', tone:'orange' } },
    { id:'ship2', role:'a', name:'新增发货单（提交发货单）', desc:'新增发货单并提交', status:{ key:'to_ship2', label:'待提交发货单', tone:'orange' } },
    { id:'sign', role:'b', name:'签收（提交签收 / 复核对账单）', desc:'买家签收并复核对账单', status:{ key:'to_sign', label:'待签收', tone:'orange' } },
    { id:'ret', role:'b', name:'新增退货单', desc:'买家发起退货（新增环节）', opt:true, kind:'new', status:{ key:'to_ret', label:'待退货', tone:'red' } },
    { id:'bill', role:'a', name:'创建对账单（允许多次对账）', desc:'卖家创建对账单并确认', status:{ key:'to_bill', label:'待对账', tone:'orange' } },
    { id:'rent', role:'b', name:'商品付款（付款）', desc:'买家支付货款', status:{ key:'to_pay', label:'待付款', tone:'orange' } },
    { id:'receipt', role:'a', name:'到账确认（确认）', desc:'卖家确认货款到账', status:{ key:'to_receipt', label:'到账待确认', tone:'orange' } },
    { id:'inv', role:'a', name:'新增开票（确认发票）', desc:'卖家新增发票', status:{ key:'to_inv', label:'待开票', tone:'orange' } },
    { id:'cinv', role:'b', name:'确认发票（同意）', desc:'买家确认发票', status:{ key:'to_cinv', label:'发票待确认', tone:'orange' } },
    { id:'end', role:'n', name:'结束订单', desc:'订单流程终态', status:{ key:'done', label:'已完成', tone:'green' } }
  ],
  actions: {
    order:    [{ label:'提交订单', next:'accept' }],
    accept:   [{ label:'确认接单', next:'contract' }],
    contract: [{ label:'签订合同', next:'invoice0' }, { label:'暂不签，继续', next:'invoice0', ghost:true }],
    invoice0: [{ label:'允许先开票', next:'ship' }, { label:'暂不开票', next:'ship', ghost:true }],
    ship:     [{ label:'提交发货', next:'ship2' }],
    ship2:    [{ label:'提交发货单', next:'sign' }],
    sign:     [{ label:'确认签收', next:'ret' }],
    ret:      [{ label:'发起退货', next:'bill', warn:true }, { label:'无退货，继续', next:'bill', ghost:true }],
    bill:     [{ label:'创建对账单', next:'rent' }],
    rent:     [{ label:'确认付款', next:'receipt' }],
    receipt:  [{ label:'确认到账', next:'inv' }],
    inv:      [{ label:'新增开票', next:'cinv' }],
    cinv:     [{ label:'确认发票', next:'end' }],
    end:      []
  },
  phases: [
    { name:'下单', steps:['order'] },
    { name:'接单签合同', steps:['accept','contract'] },
    { name:'发货', steps:['invoice0','ship','ship2'] },
    { name:'签收退货', steps:['sign','ret'] },
    { name:'对账收款', steps:['bill','rent','receipt'] },
    { name:'开票结束', steps:['inv','cinv','end'] }
  ],
  filters: [
    { key:'all', label:'全部' },
    { key:'to_accept', label:'待接单', has:['draft','to_accept'] },
    { key:'accepted', label:'待发货', has:['to_contract','to_inv0','to_ship','to_ship2'] },
    { key:'sign', label:'待签收', has:['to_sign'] },
    { key:'ret', label:'退货', has:['to_ret'] },
    { key:'bill', label:'待对账', has:['to_bill'] },
    { key:'pay', label:'待付款', has:['to_pay','to_receipt'] },
    { key:'invoice', label:'待开票', has:['to_inv','to_cinv'] },
    { key:'done', label:'已完成', has:['done'] }
  ],
  raw: [
    { no:'XS2601001', type:'自主', status:'to_accept', days:1, amount:28600, shop:'江苏藤源自营店铺', tenant:'总部公司', creator:'王小明', goods:'YJV 电缆 4×25', qty:'120 米' },
    { no:'XS2601002', type:'自主', status:'to_ship', days:3, amount:43200, shop:'河南八荒', tenant:'第二工程公司', creator:'李文博', goods:'扣件式钢管脚手架', qty:'800 套' },
    { no:'XS2601003', type:'委托', status:'to_sign', days:5, amount:56800, shop:'华商公司·华南店铺组', tenant:'西南分公司', creator:'赵倩', goods:'H 型钢 HW200×200', qty:'60 吨' },
    { no:'XS2601004', type:'自主', status:'to_pay', days:9, amount:18600, shop:'江苏藤源自营店铺', tenant:'总部公司', creator:'孙鹏', goods:'铝模板 标准板', qty:'300 张' },
    { no:'XS2601005', type:'委托', status:'to_ret', days:12, amount:32900, shop:'华商公司·东部店铺组', tenant:'河南八荒', creator:'王小明', goods:'配电箱 XL-21', qty:'45 台' },
    { no:'XS2601006', type:'自主', status:'to_cinv', days:15, amount:25000, shop:'河南八荒', tenant:'第二工程公司', creator:'李文博', goods:'KVV 控制电缆', qty:'200 米' },
    { no:'XS2601007', type:'自主', status:'done', days:21, amount:78400, shop:'江苏藤源自营店铺', tenant:'总部公司', creator:'赵倩', goods:'YJV 电缆 4×70', qty:'260 米' },
    { no:'XS2601008', type:'委托', status:'to_bill', days:25, amount:25000, shop:'华商公司·华南店铺组', tenant:'西南分公司', creator:'孙鹏', goods:'扣件式钢管脚手架', qty:'520 套' }
  ]
};
