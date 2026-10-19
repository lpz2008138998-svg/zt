/* ==========================================================================
   商品租赁业务流程 · 泳道图（数据 + 渲染 + 交互）
   数据来源：流程图《商品租赁业务流程》四段截图（出租方 / 承租方 / 平台方 三方泳道）
   坐标体系：画布 1180 × N，单位为画布像素；y=0 为阶段条顶部，泳道表头占 0~40
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------ 基础配置 ------------------------------ */
  var W = 1180;   // 画布宽度
  var HEAD = 40;  // 泳道表头高度

  var LANES = [
    { key: 'a', name: '出租方', x: 0,   w: 520 },
    { key: 'b', name: '承租方', x: 520, w: 380 },
    { key: 'c', name: '平台方', x: 900, w: 280 }
  ];
  var LANE_NAME = { a: '出租方', b: '承租方', c: '平台方' };
  var TYPE_NAME = { task: '操作节点', decision: '判断节点', terminator: '开始 / 结束' };

  var BANDS = [
    { key: 'p1', title: '① 开店及商品上架', h: 660 },
    { key: 'p2', title: '② 租赁阶段',       h: 1970 }
  ];

  /* ------------------------------ 节点 ------------------------------ */
  var NODES = [
    /* ============ ① 开店及商品上架 ============ */
    { b:'p1', id:'p1_start', lane:'a', x:112, y:76,  w:176, h:42, type:'terminator', label:'开始',
      note:'流程起点：出租方开通店铺、上架商品，承租方下单后进入租赁阶段。' },
    { b:'p1', id:'p1_shop',  lane:'a', x:112, y:156, w:176, h:46, type:'task', label:'开通新店铺',
      note:'出租方在平台开通店铺，提交主体资料等待平台审核。' },
    { b:'p1', id:'p1_sub1',  lane:'a', x:112, y:240, w:176, h:46, type:'task', label:'提交审核',
      note:'店铺资料提交平台审核；被驳回后可修改资料后重新提交。' },
    { b:'p1', id:'p1_goods', lane:'a', x:112, y:370, w:176, h:46, type:'task', label:'新增商品',
      note:'店铺审核通过后，出租方新增要出租的商品，维护品类、租金、押金等信息。' },
    { b:'p1', id:'p1_sub2',  lane:'a', x:112, y:454, w:176, h:46, type:'task', label:'提交审核',
      note:'商品资料提交平台审核；被驳回后可修改资料后重新提交。' },
    { b:'p1', id:'p1_shelf', lane:'a', x:112, y:566, w:176, h:46, type:'task', label:'商品上架',
      note:'商品审核通过后上架，承租方可浏览并下单，进入租赁阶段。' },
    { b:'p1', id:'p1_audit1', lane:'c', x:923, y:208, w:190, h:110, type:'decision', label:'审核',
      note:'平台方审核店铺开通申请：驳回则退回出租方修改；通过则进入新增商品。' },
    { b:'p1', id:'p1_audit2', lane:'c', x:923, y:422, w:190, h:110, type:'decision', label:'审核',
      note:'平台方审核商品信息：驳回则退回出租方修改；通过则商品上架。' },

    /* ============ ② 租赁阶段 ============ */
    { b:'p2', id:'p2_allow', lane:'a', x:105, y:68,  w:190, h:110, type:'decision', label:'是否允许议价',
      note:'出租方决定该商品是否允许议价；允许则先设置押金，不允许则直接进入采购下单。' },
    { b:'p2', id:'p2_deposit', lane:'a', x:340, y:92, w:176, h:62, type:'task', label:'设置押金', sub:'零押金商品更具有竞争优势',
      note:'出租方设置商品押金金额；零押金商品更具有竞争优势。' },
    { b:'p2', id:'p2_order', lane:'b', x:612, y:100, w:176, h:46, type:'task', label:'采购下单',
      note:'承租方选择商品并提交采购（租赁）订单。' },
    { b:'p2', id:'p2_bargain', lane:'b', x:605, y:228, w:190, h:110, type:'decision', label:'是否议价',
      note:'承租方决定是否就订单价格发起议价：是则提交出租方审批；否则直接进入接单。' },
    { b:'p2', id:'p2_reply', lane:'a', x:112, y:260, w:176, h:46, type:'task', label:'驳回或通过议价',
      note:'出租方对承租方发起的议价进行审批，可选择驳回或通过。' },
    { b:'p2', id:'p2_reject', lane:'a', x:96,  y:344, w:90,  h:38, type:'task', label:'驳回',
      note:'议价被驳回，退回「是否允许议价」重新确认。' },
    { b:'p2', id:'p2_pass',   lane:'a', x:214, y:344, w:90,  h:38, type:'task', label:'通过',
      note:'议价通过，进入接单环节。' },
    { b:'p2', id:'p2_accept', lane:'a', x:112, y:445, w:176, h:56, type:'task', label:'接单', sub:'确认接单',
      note:'出租方确认接单，订单进入「已接单」状态。' },
    { b:'p2', id:'p2_invoice1', lane:'a', x:352, y:450, w:176, h:46, type:'task', label:'允许先开票',
      note:'接单后，出租方可选择允许先开票。' },
    { b:'p2', id:'p2_sub3', lane:'b', x:612, y:445, w:176, h:56, type:'task', label:'提交审核', sub:'押金待结算', isNew:true,
      note:'承租方提交审核，押金待结算 —— 流程图中红色标注的新增环节。' },
    { b:'p2', id:'p2_pay', lane:'b', x:612, y:573, w:176, h:46, type:'task', label:'押金缴纳',
      note:'承租方缴纳押金，押金待结算、不直接计入出租方账户。' },
    { b:'p2', id:'p2_paid', lane:'a', x:112, y:568, w:176, h:56, type:'task', label:'押金到账确认', sub:'确认',
      note:'出租方确认押金到账，押金结算完成。' },
    { b:'p2', id:'p2_ship', lane:'a', x:112, y:698, w:176, h:56, type:'task', label:'新增发货单', sub:'提交发货单',
      note:'押金已结算后，出租方新增发货单并提交发货。' },
    { b:'p2', id:'p2_sign', lane:'b', x:612, y:698, w:176, h:56, type:'task', label:'签收', sub:'提交签收',
      note:'承租方签收商品，租期开始计算。' },
    { b:'p2', id:'p2_return1', lane:'b', x:612, y:813, w:176, h:46, type:'task', label:'新增退租单',
      note:'承租方发起退租单。' },
    { b:'p2', id:'p2_crent', lane:'a', x:112, y:813, w:176, h:46, type:'task', label:'确认退租单',
      note:'出租方确认退租单；后续商品归还走流程末段的归还分支。' },
    { b:'p2', id:'p2_bill', lane:'a', x:112, y:938, w:176, h:56, type:'task', label:'创建对账单', sub:'确认',
      note:'租期结束后，出租方创建对账单并确认（条件：租期结束后才可对账）。' },
    { b:'p2', id:'p2_check', lane:'b', x:612, y:938, w:176, h:56, type:'task', label:'复核对账单', sub:'确认',
      note:'承租方复核对账单并确认。' },
    { b:'p2', id:'p2_rent', lane:'b', x:612, y:1043, w:176, h:46, type:'task', label:'租金付款',
      note:'承租方按对账单支付租金。' },
    { b:'p2', id:'p2_receipt', lane:'a', x:112, y:1038, w:176, h:56, type:'task', label:'到账确认', sub:'确认',
      note:'出租方确认租金到账。' },
    { b:'p2', id:'p2_return2', lane:'b', x:612, y:1163, w:176, h:46, type:'task', label:'新增商品归还',
      note:'承租方发起商品归还。' },
    { b:'p2', id:'p2_cback', lane:'a', x:112, y:1273, w:176, h:46, type:'task', label:'商品归还确认',
      note:'出租方确认商品归还，并据此发起开票与押金退还。' },
    { b:'p2', id:'p2_damage', lane:'a', x:112, y:1363, w:176, h:46, type:'task', label:'货物损坏扣款', isNew:true,
      note:'如货物存在损坏，进行扣款处理 —— 流程图中红色标注的新增环节。' },
    { b:'p2', id:'p2_refund1', lane:'a', x:112, y:1448, w:176, h:56, type:'task', label:'新增押金退还单', sub:'押金退还付款', isNew:true,
      note:'出租方新增押金退还单并完成押金退还付款 —— 新增环节。' },
    { b:'p2', id:'p2_refundok', lane:'b', x:612, y:1453, w:176, h:46, type:'task', label:'押金退款到账确认', isNew:true,
      note:'承租方确认押金退款到账 —— 新增环节，本段押金退还流程到此结束。' },
    { b:'p2', id:'p2_invoice2', lane:'a', x:112, y:1569, w:176, h:46, type:'task', label:'新增开票',
      note:'出租方新增发票（开票）。' },
    { b:'p2', id:'p2_cinvoice', lane:'b', x:612, y:1564, w:176, h:56, type:'task', label:'确认发票', sub:'同意',
      note:'承租方确认发票（同意）。' },
    { b:'p2', id:'p2_return3', lane:'b', x:612, y:1657, w:176, h:46, type:'task', label:'新增商品归还',
      note:'剩余商品归还（承接「确认退租单」的归还分支）。' },
    { b:'p2', id:'p2_end', lane:'b', x:612, y:1744, w:176, h:52, type:'terminator', label:'结束订单', end:true,
      note:'流程终态：发票确认与押金退还单确认后，订单结束。' },
    { b:'p2', id:'p2_cret2', lane:'a', x:112, y:1779, w:176, h:46, type:'task', label:'确认商品归还',
      note:'出租方确认商品归还。' },
    { b:'p2', id:'p2_refund2', lane:'a', x:112, y:1879, w:176, h:46, type:'task', label:'新增押金退还单',
      note:'出租方新增押金退还单（末次）。' },
    { b:'p2', id:'p2_crefund', lane:'b', x:612, y:1879, w:176, h:46, type:'task', label:'确认押金退还单',
      note:'承租方确认押金退还单，流程结束。' }
  ];

  /* ------------------------------ 连线 ------------------------------
     fs / ts：起点、终点所在边（top / bottom / left / right）
     fOff / tOff：在所在边上的偏移量
     via：中间折点
     kind:'back' → 驳回 / 回退（橙色虚线）
  ------------------------------------------------------------------ */
  var EDGES = [
    /* ---- ① 开店及商品上架 ---- */
    { b:'p1', from:'p1_start', to:'p1_shop',  fs:'bottom', ts:'top' },
    { b:'p1', from:'p1_shop',  to:'p1_sub1',  fs:'bottom', ts:'top' },
    { b:'p1', from:'p1_sub1',  to:'p1_audit1',fs:'right',  ts:'left' },
    { b:'p1', from:'p1_goods', to:'p1_sub2',  fs:'bottom', ts:'top' },
    { b:'p1', from:'p1_sub2',  to:'p1_audit2',fs:'right',  ts:'left' },
    { b:'p1', from:'p1_audit1', to:'p1_goods', fs:'bottom', ts:'right', via:[[1018,393]],
      label:'通过', labelAt:[600,384] },
    { b:'p1', from:'p1_audit1', to:'p1_shop',  fs:'right', ts:'left', kind:'back',
      via:[[1150,263],[1150,140],[74,140],[74,179]], label:'驳回', labelAt:[560,131] },
    { b:'p1', from:'p1_audit2', to:'p1_shelf', fs:'bottom', ts:'right', via:[[1018,589]],
      label:'通过', labelAt:[600,580] },
    { b:'p1', from:'p1_audit2', to:'p1_goods', fs:'right', ts:'left', kind:'back',
      via:[[1150,477],[1150,340],[48,340],[48,393]], label:'驳回', labelAt:[560,331] },

    /* ---- ② 租赁阶段：议价与下单 ---- */
    { b:'p2', from:'p2_allow', to:'p2_deposit', fs:'right', ts:'left', label:'是', labelAt:[317,113] },
    { b:'p2', from:'p2_allow', to:'p2_order', fs:'bottom', ts:'bottom', via:[[200,203],[700,203]],
      label:'否', labelAt:[232,196], ta:'start' },
    { b:'p2', from:'p2_deposit', to:'p2_order', fs:'right', ts:'left' },
    { b:'p2', from:'p2_order', to:'p2_bargain', fs:'bottom', ts:'top' },
    { b:'p2', from:'p2_bargain', to:'p2_reply', fs:'left', ts:'right', label:'是', labelAt:[446,274] },
    { b:'p2', from:'p2_reply', to:'p2_reject', fs:'bottom', ts:'top', via:[[200,330],[141,330]] },
    { b:'p2', from:'p2_reply', to:'p2_pass',   fs:'bottom', ts:'top', via:[[200,330],[259,330]] },
    { b:'p2', from:'p2_reject', to:'p2_allow', fs:'left', ts:'left', kind:'back',
      via:[[52,363],[52,123]], label:'驳回', labelAt:[60,246], ta:'start' },
    { b:'p2', from:'p2_pass', to:'p2_accept', fs:'bottom', ts:'top', tOff:59,
      label:'通过', labelAt:[268,420], ta:'start' },
    { b:'p2', from:'p2_bargain', to:'p2_accept', fs:'bottom', ts:'top', tOff:-50, via:[[700,425],[150,425]],
      label:'否', labelAt:[714,356], ta:'start' },

    /* ---- ② 租赁阶段：接单 → 押金 → 发货签收 ---- */
    { b:'p2', from:'p2_accept', to:'p2_invoice1', fs:'right', ts:'left', label:'已接单', labelAt:[320,463] },
    { b:'p2', from:'p2_invoice1', to:'p2_sub3',   fs:'right', ts:'left', label:'已接单', labelAt:[570,463] },
    { b:'p2', from:'p2_accept', to:'p2_sub3', fs:'bottom', ts:'bottom', tOff:-55, via:[[200,536],[645,536]],
      label:'已接单', labelAt:[420,528] },
    { b:'p2', from:'p2_sub3', to:'p2_pay', fs:'bottom', fOff:55, ts:'top', tOff:55,
      label:'押金待结算', labelAt:[766,545], ta:'start' },
    { b:'p2', from:'p2_pay', to:'p2_paid', fs:'left', ts:'right' },
    { b:'p2', from:'p2_paid', to:'p2_ship', fs:'bottom', ts:'top',
      label:'押金已结算', labelAt:[212,664], ta:'start' },
    { b:'p2', from:'p2_ship', to:'p2_sign', fs:'right', ts:'left' },
    { b:'p2', from:'p2_sign', to:'p2_return1', fs:'bottom', ts:'top' },
    { b:'p2', from:'p2_return1', to:'p2_crent', fs:'left', ts:'right' },

    /* ---- ② 租赁阶段：归还 / 对账 / 结算 ---- */
    { b:'p2', from:'p2_crent', to:'p2_return3', fs:'left', ts:'left', via:[[30,836],[30,1680]] },
    { b:'p2', from:'p2_sign', to:'p2_bill', fs:'right', ts:'top', via:[[830,726],[830,900],[200,900]],
      label:'租期结束后，才可对账', labelAt:[500,889] },
    { b:'p2', from:'p2_bill', to:'p2_check', fs:'right', ts:'left' },
    { b:'p2', from:'p2_check', to:'p2_rent', fs:'bottom', ts:'top' },
    { b:'p2', from:'p2_rent', to:'p2_receipt', fs:'left', ts:'right' },
    { b:'p2', from:'p2_receipt', to:'p2_return2', fs:'bottom', ts:'top', via:[[200,1130],[700,1130]] },
    { b:'p2', from:'p2_return2', to:'p2_cback', fs:'left', ts:'right', via:[[560,1186],[560,1296]] },

    /* ---- ② 租赁阶段：押金退还（新增分支） ---- */
    { b:'p2', from:'p2_cback', to:'p2_damage',  fs:'bottom', ts:'top' },
    { b:'p2', from:'p2_damage', to:'p2_refund1', fs:'bottom', ts:'top' },
    { b:'p2', from:'p2_refund1', to:'p2_refundok', fs:'right', ts:'left' },

    /* ---- ② 租赁阶段：开票 → 结束 ---- */
    { b:'p2', from:'p2_cback', to:'p2_invoice2', fs:'left', ts:'left', via:[[60,1296],[60,1592]] },
    { b:'p2', from:'p2_invoice2', to:'p2_cinvoice', fs:'right', ts:'left' },
    { b:'p2', from:'p2_cinvoice', to:'p2_end', fs:'right', ts:'right', via:[[830,1592],[830,1770]] },
    { b:'p2', from:'p2_return3', to:'p2_cret2', fs:'bottom', ts:'top', via:[[700,1730],[200,1730]] },
    { b:'p2', from:'p2_cret2', to:'p2_refund2', fs:'bottom', ts:'top' },
    { b:'p2', from:'p2_refund2', to:'p2_crefund', fs:'right', ts:'left' },
    { b:'p2', from:'p2_crefund', to:'p2_end', fs:'left', ts:'left', via:[[560,1902],[560,1770]] }
  ];

  /* --------------------------- 红色高亮分组（新增流程） --------------------------- */
  var GROUPS = [
    { b:'p2', x:588, y:421,  w:224, h:104, label:'押金待结算（新增）' },
    { b:'p2', x:80,  y:1345, w:760, h:180, label:'押金退还（新增）' }
  ];

  /* --------------------------- 跨阶段衔接短线 --------------------------- */
  var STUBS = [
    { b:'p1', pts:[[200,612],[200,652]], label:'进入②租赁阶段', labelAt:[212,646], ta:'start' },
    { b:'p2', pts:[[200,40],[200,68]],   label:'承接①商品上架', labelAt:[212,60],  ta:'start' }
  ];

  /* ============================== 渲染 ============================== */
  var byId = {};
  NODES.forEach(function (n) { byId[n.id] = n; });

  function anchorOf(n, side, off) {
    off = off || 0;
    if (side === 'top')    return [n.x + n.w / 2 + off, n.y];
    if (side === 'bottom') return [n.x + n.w / 2 + off, n.y + n.h];
    if (side === 'left')   return [n.x, n.y + n.h / 2 + off];
    return [n.x + n.w, n.y + n.h / 2 + off];   // right
  }

  function pointsOf(e) {
    var pts = [anchorOf(byId[e.from], e.fs || 'bottom', e.fOff)];
    (e.via || []).forEach(function (p) { pts.push(p); });
    pts.push(anchorOf(byId[e.to], e.ts || 'top', e.tOff));
    return pts;
  }

  function dOf(pts) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ',' + p[1]; }).join(' ');
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function bandSvg(band) {
    var out = [];
    var nodes = NODES.filter(function (n) { return n.b === band.key; });
    var edges = EDGES.filter(function (e) { return e.b === band.key; });
    var stubs = STUBS.filter(function (s) { return s.b === band.key; });

    /* 泳道表头 + 分隔线 */
    LANES.forEach(function (L) {
      out.push('<rect class="lh-cell" x="' + L.x + '" y="0" width="' + L.w + '" height="' + HEAD + '"/>');
      out.push('<text class="lh-text" x="' + (L.x + L.w / 2) + '" y="' + (HEAD / 2 + 5) + '">' + L.name + '</text>');
    });
    LANES.slice(1).forEach(function (L) {
      out.push('<line class="lane-sep" x1="' + L.x + '" y1="' + HEAD + '" x2="' + L.x + '" y2="' + band.h + '"/>');
    });

    /* 新增分组高亮 */
    GROUPS.filter(function (g) { return g.b === band.key; }).forEach(function (g) {
      out.push('<rect class="grp" x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="6"/>');
      out.push('<text class="grp-label" x="' + (g.x + 8) + '" y="' + (g.y + g.h - 8) + '">' + esc(g.label) + '</text>');
    });

    /* 连线：每条线先画白色描边再画彩色线，形成交叉处"立交"效果 */
    var draws = [];
    edges.forEach(function (e) { draws.push({ e: e, pts: pointsOf(e) }); });
    stubs.forEach(function (s) { draws.push({ e: s, pts: s.pts, stub: true }); });

    var pair = function (it) {
      return it.stub ? '' : ' data-a="' + it.e.from + '" data-b="' + it.e.to + '"';
    };

    draws.forEach(function (it) {
      var back = it.e.kind === 'back';
      out.push('<path class="wire-halo" d="' + dOf(it.pts) + '"' + pair(it) + '/>');
      var attrs = 'class="wire' + (back ? ' is-back' : '') + '" d="' + dOf(it.pts) + '"' + pair(it);
      if (!it.stub) attrs += ' marker-end="url(#' + (back ? 'arrBack' : 'arr') + ')"';
      out.push('<path ' + attrs + '/>');
    });
    draws.forEach(function (it) {
      var e = it.e;
      if (!e.label) return;
      out.push('<text class="wire-label' + (e.kind === 'back' ? ' is-back' : '') +
        (e.ta === 'start' ? ' is-start' : '') + '"' + pair(it) +
        ' x="' + e.labelAt[0] + '" y="' + e.labelAt[1] + '">' + esc(e.label) + '</text>');
    });

    /* 判断节点（菱形） */
    nodes.filter(function (n) { return n.type === 'decision'; }).forEach(function (n) {
      var cx = n.x + n.w / 2, cy = n.y + n.h / 2;
      out.push('<polygon class="dia node-svg" data-node="' + n.id + '" points="' +
        cx + ',' + n.y + ' ' + (n.x + n.w) + ',' + cy + ' ' + cx + ',' + (n.y + n.h) + ' ' + n.x + ',' + cy + '"/>');
      out.push('<text class="dia-text node-svg" data-node="' + n.id + '" x="' + cx + '" y="' + (cy + 4.5) + '">' + esc(n.label) + '</text>');
    });

    return '<svg class="band-svg" width="' + W + '" height="' + band.h + '" viewBox="0 0 ' + W + ' ' + band.h + '">' + out.join('') + '</svg>';
  }

  function bandHtml(band) {
    var nodes = NODES.filter(function (n) { return n.b === band.key && n.type !== 'decision'; });
    var html = nodes.map(function (n) {
      var cls = ['node', 't-' + n.type];
      if (n.isNew) cls.push('is-new');
      if (n.end) cls.push('t-end');
      return '<div class="' + cls.join(' ') + '" data-node="' + n.id + '" title="' + esc(n.label) + '"' +
        ' style="left:' + n.x + 'px;top:' + n.y + 'px;width:' + n.w + 'px;height:' + n.h + 'px">' +
        '<span class="n-main">' + esc(n.label) + '</span>' +
        (n.sub ? '<span class="n-sub">' + esc(n.sub) + '</span>' : '') +
        (n.isNew ? '<i class="n-flag">新增</i>' : '') +
        '</div>';
    }).join('');

    return '<div class="band" data-band="' + band.key + '" data-h="' + band.h + '">' +
      '<div class="band-scale">' +
        bandSvg(band) +
        '<div class="band-chip" style="left:10px;top:9px">' + band.title + '</div>' +
        html +
      '</div>' +
    '</div>';
  }

  /* ============================== 状态与交互 ============================== */
  var stage, inner, zoomVal, detail, toastEl;
  var state = { zoom: 1, phase: 'all' };

  function nodeEl(id) { return document.querySelectorAll('[data-node="' + id + '"]'); }

  function applyZoom(k) {
    state.zoom = Math.min(1.6, Math.max(0.45, k));
    Array.prototype.forEach.call(document.querySelectorAll('.band'), function (el) {
      var h = parseFloat(el.getAttribute('data-h'));
      el.style.width = (W * state.zoom) + 'px';
      el.style.height = (h * state.zoom) + 'px';
    });
    Array.prototype.forEach.call(document.querySelectorAll('.band-scale'), function (el) {
      el.style.transform = 'scale(' + state.zoom + ')';
    });
    zoomVal.textContent = Math.round(state.zoom * 100) + '%';
  }

  function applyPhase(p) {
    state.phase = p;
    Array.prototype.forEach.call(document.querySelectorAll('.band'), function (el) {
      var on = (p === 'all' || el.getAttribute('data-band') === p);
      el.hidden = !on;
    });
    Array.prototype.forEach.call(document.querySelectorAll('#phaseFilter .filter'), function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-phase') === p);
    });
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  }

  function showDetail(id) {
    var n = byId[id];
    if (!n) return;
    var ups = EDGES.filter(function (e) { return e.to === id; })
      .map(function (e) { return byId[e.from] ? byId[e.from].label : ''; }).filter(Boolean);
    var downs = EDGES.filter(function (e) { return e.from === id; })
      .map(function (e) { return byId[e.to] ? byId[e.to].label : ''; }).filter(Boolean);
    var uniq = function (arr) { return arr.filter(function (v, i) { return arr.indexOf(v) === i; }); };

    detail.querySelector('.nd-lane').className = 'nd-lane lane-' + n.lane;
    detail.querySelector('.nd-lane').textContent = LANE_NAME[n.lane] +
      (n.isNew ? ' · 新增环节' : '');
    detail.querySelector('.nd-head h4').textContent = n.label + (n.sub ? '（' + n.sub + '）' : '');
    detail.querySelector('.nd-note').textContent = n.note || '';
    detail.querySelector('[data-meta="type"]').textContent = TYPE_NAME[n.type] || n.type;
    detail.querySelector('[data-meta="lane"]').textContent = LANE_NAME[n.lane];
    detail.querySelector('[data-meta="up"]').innerHTML = uniq(ups).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') || '—';
    detail.querySelector('[data-meta="down"]').innerHTML = uniq(downs).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') || '—';
    detail.hidden = false;

    Array.prototype.forEach.call(document.querySelectorAll('.node'), function (el) {
      el.classList.toggle('is-sel', el.getAttribute('data-node') === id);
    });
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1800);
  }

  /* 节点检索：命中高亮，未命中淡化 */
  function runQuery() {
    var kw = document.getElementById('q-name').value.trim();
    var lane = document.getElementById('q-lane').value;
    var type = document.getElementById('q-type').value;
    var active = !!(kw || lane || type);
    var hits = {};

    NODES.forEach(function (n) {
      var ok = true;
      if (kw && (n.label + (n.sub || '')).indexOf(kw) < 0) ok = false;
      if (lane && n.lane !== lane) ok = false;
      if (type === 'new' && !n.isNew) ok = false;
      if (type && type !== 'new' && n.type !== type) ok = false;
      hits[n.id] = active ? ok : false;
      Array.prototype.forEach.call(nodeEl(n.id), function (el) {
        el.classList.toggle('is-hit', active && ok);
        el.classList.toggle('is-dim', active && !ok);
      });
    });

    Array.prototype.forEach.call(
      document.querySelectorAll('.wire[data-a], .wire-halo[data-a], .wire-label[data-a]'),
      function (p) {
        var show = hits[p.getAttribute('data-a')] || hits[p.getAttribute('data-b')];
        p.classList.toggle('is-dim', active && !show);
      }
    );

    if (!active) { toast('已重置检索条件'); return; }
    var count = NODES.filter(function (n) { return hits[n.id]; }).length;
    var first = NODES.filter(function (n) { return hits[n.id] && n.b === state.phase; })[0] ||
                NODES.filter(function (n) { return hits[n.id]; })[0];
    if (!count) { toast('没有匹配的流程节点'); return; }
    if (first && first.b !== state.phase && state.phase !== 'all') applyPhase(first.b);
    toast('命中 ' + count + ' 个节点');
    if (first) {
      var el = nodeEl(first.id)[0];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    }
  }

  function resetQuery() {
    document.getElementById('q-name').value = '';
    document.getElementById('q-lane').value = '';
    document.getElementById('q-type').value = '';
    runQuery();
  }

  function fitWidth() {
    var k = (stage.clientWidth - 40) / W;
    applyZoom(k);
  }

  /* ============================== 初始化 ============================== */
  function init() {
    stage = document.getElementById('stage');
    inner = document.getElementById('stageInner');
    zoomVal = document.getElementById('zoomVal');
    detail = document.getElementById('nodeDetail');
    toastEl = document.getElementById('toast');

    inner.innerHTML = BANDS.map(bandHtml).join('');
    applyZoom(1);
    applyPhase('all');
    if (stage.clientWidth < W + 40) fitWidth();   // 窄屏默认适应宽度

    /* 点击节点 → 详情 */
    inner.addEventListener('click', function (ev) {
      var el = ev.target.closest ? ev.target.closest('[data-node]') : null;
      if (el) { showDetail(el.getAttribute('data-node')); }
    });
    document.querySelector('.nd-close').addEventListener('click', function () {
      detail.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.node'), function (el) { el.classList.remove('is-sel'); });
    });

    /* 阶段筛选 */
    document.getElementById('phaseFilter').addEventListener('click', function (ev) {
      var btn = ev.target.closest('.filter');
      if (btn) applyPhase(btn.getAttribute('data-phase'));
    });

    /* 缩放 */
    document.querySelector('.zoom-group').addEventListener('click', function (ev) {
      var btn = ev.target.closest('[data-zoom]');
      if (!btn) return;
      var z = btn.getAttribute('data-zoom');
      if (z === 'in') applyZoom(state.zoom + 0.1);
      else if (z === 'out') applyZoom(state.zoom - 0.1);
      else if (z === 'fit') fitWidth();
      else applyZoom(1);
    });

    /* 查询 / 重置 */
    document.getElementById('btn-query').addEventListener('click', runQuery);
    document.getElementById('btn-reset').addEventListener('click', resetQuery);
    document.getElementById('q-name').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') runQuery();
    });

    /* 导出 / 打印 */
    document.getElementById('btn-export').addEventListener('click', function () {
      toast('演示原型：导出功能未接入后端');
    });
    document.getElementById('btn-print').addEventListener('click', function () { window.print(); });

    window.addEventListener('resize', function () { applyZoom(state.zoom); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
