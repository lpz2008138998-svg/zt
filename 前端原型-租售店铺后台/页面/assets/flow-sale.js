/* ==========================================================================
   flow-sale.js —— 商品销售业务流程（依据《商品销售业务流程》泳道图）
   泳道：卖家 / 买家 / 平台力　阶段：① 开店及商品上架　② 销售
   ========================================================================== */
window.FLOW = {
  title: '商品销售业务流程',
  lanes: [
    { key: 'a', name: '卖家', w: 470 },
    { key: 'b', name: '买家', w: 390 },
    { key: 'c', name: '平台力', w: 320 }
  ],
  cols: { a: 112, b: 520, c: 880 },
  bands: [
    { key: 'p1', title: '① 开店及商品上架' },
    { key: 'p2', title: '② 销售' }
  ],
  rows: {
    p1: [100, 176, 250, 350, 424, 512],
    p2: [90, 210, 340, 430, 530, 620, 700, 800, 880]
  },
  nodes: [
    /* ---------- ① 开店及商品上架 ---------- */
    { b:'p1', lane:'a', row:0, id:'start', type:'terminator', label:'开始' },
    { b:'p1', lane:'a', row:1, id:'shop', label:'开通新店铺',
      note:'卖家在平台开通店铺并提交主体资料。' },
    { b:'p1', lane:'a', row:2, id:'sub1', label:'提交审核',
      note:'店铺资料提交平台审核；驳回后修改重新提交。' },
    { b:'p1', lane:'a', row:3, id:'goods', label:'新增商品',
      note:'店铺审核通过后新增要销售的商品，维护价格、库存等信息。' },
    { b:'p1', lane:'a', row:4, id:'sub2', label:'提交审核',
      note:'商品资料提交平台审核；驳回后修改重新提交。' },
    { b:'p1', lane:'a', row:5, id:'shelf', label:'商品上架',
      note:'审核通过后商品上架，买家可浏览下单。' },
    { b:'p1', lane:'c', row:2, id:'audit1', type:'decision', label:'审核',
      note:'平台方审核店铺开通：驳回退回提交审核，通过进入新增商品。' },
    { b:'p1', lane:'c', row:4, id:'audit2', type:'decision', label:'审核',
      note:'平台方审核商品信息：驳回退回提交审核，通过后商品上架。' },

    /* ---------- ② 销售 ---------- */
    { b:'p2', lane:'a', row:0, id:'allow', type:'decision', label:'是否允许议价', dx:-7,
      note:'卖家设置该商品是否允许议价。' },
    { b:'p2', lane:'b', row:0, id:'order', label:'采购下单',
      note:'买家选择商品提交采购订单。' },
    { b:'p2', lane:'a', row:1, id:'reply', label:'驳回或通过议价',
      note:'卖家审批买家的议价：驳回退回重新确认，通过进入发货。' },
    { b:'p2', lane:'b', row:1, id:'bargain', type:'decision', label:'是否议价', dx:-7,
      note:'买家决定是否发起议价。' },
    { b:'p2', lane:'a', row:2, id:'rej', label:'驳回', w:90, dx:-60,
      note:'议价被驳回，回到「是否允许议价」重新确认。' },
    { b:'p2', lane:'a', row:2, id:'pass', label:'通过', w:90, dx:60,
      note:'议价通过（或买家无需议价），进入发货。' },
    { b:'p2', lane:'a', row:3, id:'ship', label:'发货', sub:'分多批次发货', h:64,
      note:'卖家发货，支持分单、多批次发货。' },
    { b:'p2', lane:'a', row:3, id:'inv0', label:'先开票', w:130, x:310,
      note:'发货前也可先开票。' },
    { b:'p2', lane:'b', row:3, id:'contract', label:'合同',
      note:'下单后签订合同，合同与议价并行。' },
    { b:'p2', lane:'a', row:4, id:'accept', label:'接单', sub:'确认接单', h:56,
      note:'接单并确认接单（按卖家原图顺序置于发货之后）。' },
    { b:'p2', lane:'b', row:4, id:'sign', label:'签收', sub:['提交签收', '复核对账单', '确认'], h:76,
      note:'买家签收并提交签收单，同时复核对账单并确认。' },
    { b:'p2', lane:'b', row:4, id:'ret', label:'新增退货单', w:110, x:730, isNew:true,
      note:'买家可发起退货（原图红色标注的新增环节）。' },
    { b:'p2', lane:'a', row:5, id:'ship2', label:'新增发货单', sub:'提交发货单', h:56,
      note:'卖家按批次新增发货单并提交。' },
    { b:'p2', lane:'b', row:5, id:'pay', label:'商品付款', sub:'付款', h:56,
      note:'买家支付货款。' },
    { b:'p2', lane:'a', row:6, id:'bill', label:'创建对账单', sub:'允许多次对账确认', h:64,
      note:'卖家创建对账单，支持多次对账确认。' },
    { b:'p2', lane:'b', row:6, id:'end', type:'terminator', label:'结束订单', kind:'end', h:52,
      note:'订单流程结束（付款完成或退货完成）。' },
    { b:'p2', lane:'a', row:7, id:'receipt', label:'到账确认', sub:'确认', h:56,
      note:'卖家确认货款到账。' },
    { b:'p2', lane:'a', row:8, id:'inv', label:'新增开票', sub:'确认发票', h:56,
      note:'卖家新增发票。' },
    { b:'p2', lane:'b', row:8, id:'cinv', label:'确认发票', sub:'同意', h:56,
      note:'买家确认发票（同意）。' }
  ],
  edges: [
    /* ① */
    { b:'p1', from:'start', to:'shop' },
    { b:'p1', from:'shop', to:'sub1' },
    { b:'p1', from:'sub1', to:'audit1' },
    { b:'p1', from:'goods', to:'sub2' },
    { b:'p1', from:'sub2', to:'audit2' },
    { b:'p1', from:'audit1', to:'sub1', kind:'back', label:'驳回', fs:'right', ts:'left',
      via:[[1120,250],[1120,130],[74,130],[74,250]] },
    { b:'p1', from:'audit1', to:'goods', label:'通过', fs:'bottom', ts:'right', via:[[975,350]] },
    { b:'p1', from:'audit2', to:'sub2', kind:'back', label:'驳回', fs:'right', ts:'left',
      via:[[1120,424],[1120,390],[48,390],[48,424]] },
    { b:'p1', from:'audit2', to:'shelf', label:'通过', fs:'bottom', ts:'right', via:[[975,512]] },
    { b:'p1', from:'shelf', to:'__p2', stub:[[200,535],[200,578]], label:'进入②销售' },

    /* ② */
    { b:'p2', from:'allow', to:'order' },
    { b:'p2', from:'order', to:'bargain' },
    { b:'p2', from:'bargain', to:'reply', label:'是' },
    { b:'p2', from:'reply', to:'rej', fs:'bottom', ts:'top', via:[[200,282],[141,282]] },
    { b:'p2', from:'reply', to:'pass', fs:'bottom', ts:'top', via:[[200,282],[259,282]] },
    { b:'p2', from:'rej', to:'allow', kind:'back', label:'驳回', fs:'left', ts:'left',
      via:[[52,340],[52,90]] },
    { b:'p2', from:'bargain', to:'pass', label:'否', fs:'bottom', ts:'bottom',
      via:[[608,392],[259,392]] },
    { b:'p2', from:'pass', to:'ship', fs:'bottom', ts:'top', via:[[259,378],[200,378]] },
    { b:'p2', from:'pass', to:'inv0', fs:'right', ts:'top', tOff:25, via:[[400,340]] },
    { b:'p2', from:'inv0', to:'ship', fs:'left', ts:'right' },
    { b:'p2', from:'ship', to:'accept' },
    { b:'p2', from:'accept', to:'ship2' },
    { b:'p2', from:'ship2', to:'bill' },
    { b:'p2', from:'bill', to:'receipt' },
    { b:'p2', from:'receipt', to:'inv' },
    { b:'p2', from:'inv', to:'cinv' },
    { b:'p2', from:'order', to:'contract', fs:'right', ts:'right', via:[[760,90],[760,430]] },
    { b:'p2', from:'contract', to:'sign' },
    { b:'p2', from:'sign', to:'pay' },
    { b:'p2', from:'pay', to:'end' },
    { b:'p2', from:'sign', to:'ret', fs:'right', ts:'left' },
    { b:'p2', from:'ret', to:'end', fs:'bottom', ts:'right', via:[[785,700]] },
    { b:'p2', from:'bill', to:'sign', fs:'right', ts:'left', via:[[460,700],[460,530]],
      label:'对账单送签收' },
    { b:'p2', from:'cinv', to:'end', fs:'left', ts:'bottom', via:[[470,880],[470,780],[608,780]] }
  ],
  groups: [
    { b:'p2', x:716, y:492, w:142, h:88, label:'新增' }
  ]
};
