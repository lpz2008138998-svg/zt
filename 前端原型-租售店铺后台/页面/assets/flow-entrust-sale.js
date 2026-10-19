/* ==========================================================================
   flow-entrust-sale.js —— 委托出售业务流程（依据《委托出售业务流程》泳道图）
   泳道：委托方（卖方）/ 服务方（华商公司）· 受托卖方 / 买方
   说明：本页按原图还原「主链路 + 已标注分支」；原图中若干跨泳道细线在图片上无法确定起止，
        已在 README 列为本项目待确认项。
   ========================================================================== */
window.FLOW = {
  title: '委托出售业务流程',
  lanes: [
    { key: 'a', name: '委托方（卖方）', w: 400 },
    { key: 'b', name: '服务方（华商公司）· 受托卖方', w: 520 },
    { key: 'c', name: '买方', w: 260 }
  ],
  cols: { a: 40, b: 430, c: 940 },
  bands: [
    { key: 'p1', title: '① 委托商品上架' },
    { key: 'p2', title: '② 委托销售' }
  ],
  rows: {
    p1: [100, 190, 290],
    p2: [420, 500, 580, 660, 740, 820, 900, 980, 1060, 1140]
  },
  nodes: [
    /* ---------- ① 委托商品上架 ---------- */
    { b:'p1', lane:'a', row:0, id:'start', type:'terminator', w:120, label:'开始' },
    { b:'p1', lane:'a', row:1, id:'goods', w:120, label:'新增商品',
      note:'委托方新增要委托出售的商品。' },
    { b:'p1', lane:'a', row:1, id:'trust', x:190, w:150, label:'是否委托', sub:'委托设置',
      note:'设置是否委托、委托给哪个店铺组（华南公司下每个店铺都可受理委托）。' },
    { b:'p1', lane:'b', row:1, id:'audit', type:'decision', w:160, label:'审核',
      note:'服务方审核委托：不通过退回新增商品，通过后商品上架。' },
    { b:'p1', lane:'b', row:2, id:'shelf', w:160, label:'商品上架',
      note:'委托成功后上架：按订单成交（执行中）的优先级扣减库存，直至委托库存消耗完，商品变成已售罄。' },

    /* ---------- ② 委托销售 ---------- */
    { b:'p2', lane:'c', row:0, id:'order', w:170, label:'采购下单',
      note:'买方在受理委托的店铺下单。' },
    { b:'p2', lane:'c', row:1, id:'needbargain', type:'decision', w:180, dx:-5, label:'是否需要议价',
      note:'买方决定是否议价。' },
    { b:'p2', lane:'b', row:1, id:'audit2', type:'decision', w:160, label:'审核',
      note:'议价由服务方审核：不通过退回重新确认，通过进入接单。' },
    { b:'p2', lane:'b', row:0, id:'take2', x:660, w:230, isNew:true, label:'接单', sub:'华南公司店铺组（东南组 / 西部组 / 北部组 / 系统外组）',
      note:'华南公司下各店铺组承接订单（原图红色标注）。' },
    { b:'p2', lane:'b', row:0, id:'take1', x:430, w:200, isNew:true, label:'接单', sub:'其他公司店铺',
      note:'其他公司店铺承接订单（原图红色标注）。' },
    { b:'p2', lane:'b', row:2, id:'inv0', x:430, w:170, label:'允许先开票',
      note:'接单后服务方可允许先开票。' },
    { b:'p2', lane:'b', row:2, id:'advance', x:660, w:200, label:'服务方垫资',
      note:'服务方为委托方垫资（原图蓝色虚线回款路径的起点）。' },
    { b:'p2', lane:'b', row:3, id:'sync', x:430, w:300, h:64, label:'同步发货单',
      sub:'双方沟通后由服务方新增发货单，实际发货由卖方按发货单详情进行',
      note:'服务方新增发货单，实际发货由委托方（卖方）按发货单详情执行。' },
    { b:'p2', lane:'b', row:4, id:'settle', x:430, w:300, h:64, label:'依据已卖出数量做委托结算',
      sub:'直至服务方不再接单，即可取消委托',
      note:'按已卖出数量结算，不再接单后可取消委托。' },
    { b:'p2', lane:'b', row:5, id:'bill2', x:660, w:200, h:76, label:'新增发货单 / 创建销售对账单', sub:'确认',
      note:'执行中锁定库存，创建销售对账单并确认。' },
    { b:'p2', lane:'c', row:3, id:'submit', w:170, h:56, label:'提交审核',
      note:'买方提交审核（已接单后进入）。' },
    { b:'p2', lane:'c', row:4, id:'sign', w:170, h:86, label:'签收', sub:['提交签收', '复核对账单', '确认'],
      note:'买方签收、提交签收单、复核对账单并确认。' },
    { b:'p2', lane:'c', row:5, id:'ret', w:170, isNew:true, label:'新增退货单',
      note:'买方发起退货（原图红色标注的新增环节）。' },
    { b:'p2', lane:'c', row:6, id:'bpay', w:170, h:56, label:'商品付款', sub:'付款',
      note:'买方支付货款。' },
    { b:'p2', lane:'c', row:7, id:'end', type:'terminator', w:170, kind:'end', label:'结束订单',
      note:'订单流程结束。' },
    { b:'p2', lane:'c', row:8, id:'cinv', w:170, h:56, label:'确认发票', sub:'同意',
      note:'买方确认发票（同意）。' },
    { b:'p2', lane:'a', row:2, id:'deliver', x:40, w:170, h:56, kind:'yellow', label:'发货单',
      sub:'卖方按发货单详情发货',
      note:'委托方（卖方）按服务方新增的发货单详情实际发货。' },
    { b:'p2', lane:'a', row:5, id:'bill3', x:40, w:170, h:56, kind:'orange', label:'创建委托的对账单', sub:'确认',
      note:'委托方创建委托服务的对账单并确认。' },
    { b:'p2', lane:'a', row:6, id:'receipt', x:40, w:170, label:'到账确认',
      note:'委托方确认委托货款到账。' }
  ],
  edges: [
    { b:'p1', from:'start', to:'goods' },
    { b:'p1', from:'goods', to:'trust' },
    { b:'p1', from:'trust', to:'audit' },
    { b:'p1', from:'audit', to:'goods', kind:'back', label:'不通过', fs:'top', ts:'top', tOff:40,
      via:[[510,60],[140,60]] },
    { b:'p1', from:'audit', to:'shelf', label:'通过' },
    { b:'p1', from:'shelf', to:'__x', stub:[[510,313],[510,360]], label:'进入②委托销售' },

    { b:'p2', from:'order', to:'needbargain' },
    { b:'p2', from:'needbargain', to:'audit2', label:'是' },
    { b:'p2', from:'audit2', to:'take2', label:'通过', fs:'top', ts:'left', via:[[510,390],[660,390]] },
    { b:'p2', from:'audit2', to:'needbargain', kind:'back', label:'不通过', fs:'right', ts:'bottom',
      via:[[620,500],[1025,500]] },
    { b:'p2', from:'needbargain', to:'take1', label:'否', fs:'bottom', ts:'right',
      via:[[1025,420],[530,420]] },
    { b:'p2', from:'take1', to:'inv0' },
    { b:'p2', from:'take2', to:'submit', label:'已接单', fs:'right', ts:'right', via:[[910,420],[1120,420]] },
    { b:'p2', from:'inv0', to:'submit', label:'已接单', fs:'right', ts:'left', via:[[620,500],[940,500]] },
    { b:'p2', from:'inv0', to:'advance', fs:'right', ts:'left' },
    { b:'p2', from:'advance', to:'deliver', dash:true, label:'垫资 / 回款', fs:'left', ts:'right',
      via:[[350,580],[210,580]] },
    { b:'p2', from:'take2', to:'sync', fs:'bottom', ts:'top', via:[[775,620],[580,620]] },
    { b:'p2', from:'sync', to:'settle' },
    { b:'p2', from:'settle', to:'bill3', fs:'left', ts:'right' },
    { b:'p2', from:'bill3', to:'receipt' },
    { b:'p2', from:'submit', to:'sign' },
    { b:'p2', from:'sign', to:'ret' },
    { b:'p2', from:'sign', to:'bpay' },
    { b:'p2', from:'bpay', to:'end' },
    { b:'p2', from:'end', to:'cinv', fs:'bottom', ts:'top', via:[[1025,1190]] },
    { b:'p2', from:'bpay', to:'receipt', fs:'left', ts:'right', via:[[380,1060]] },
    { b:'p2', from:'receipt', to:'bill2', fs:'right', ts:'bottom', via:[[300,1140]] },
    { b:'p2', from:'bill2', to:'bpay', fs:'right', ts:'bottom', via:[[880,860],[1025,1060]] }
  ],
  groups: [
    { b:'p2', x:418, y:390, w:496, h:76, label:'接单（新增）' }
  ]
};
