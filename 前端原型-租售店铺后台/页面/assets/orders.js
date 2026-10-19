/* ==========================================================================
   租赁订单管理 · 业务页面
   业务规则来源：流程图《商品租赁业务流程》② 租赁阶段（26 个环节，含 4 个新增环节）
   —— 列表页状态筛选 / 查询、详情页阶段进度、流程轨迹、按环节办事、状态流转
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= 一、流程环节（来自流程图） ======================= */
  var ROLE = { a: '出租方', b: '承租方', c: '平台方', n: '—' };
  var OPERATOR = { a: '张伟（出租方）', b: '李娜（承租方）', c: '平台审核员', n: '系统' };

  var STEPS = [
    { id:'order',    owner:'b', name:'采购下单', desc:'承租方选择商品并提交采购（租赁）订单',
      status:{ key:'draft', label:'待提交', tone:'gray' } },
    { id:'deposit',  owner:'a', optional:true, name:'设置押金', desc:'出租方设置商品押金（零押金商品更具有竞争优势）',
      status:{ key:'to_deposit', label:'待设置押金', tone:'orange' } },
    { id:'bargain',  owner:'b', name:'是否议价', desc:'承租方决定是否就订单价格发起议价',
      status:{ key:'to_bargain', label:'待议价', tone:'orange' } },
    { id:'reply',    owner:'a', name:'驳回或通过议价', desc:'出租方对承租方发起的议价进行审批',
      status:{ key:'bargaining', label:'议价待确认', tone:'orange' } },
    { id:'accept',   owner:'a', name:'接单（确认接单）', desc:'出租方确认接单，订单进入「已接单」状态',
      status:{ key:'to_accept', label:'待接单', tone:'orange' } },
    { id:'invoice0', owner:'a', optional:true, name:'允许先开票', desc:'接单后出租方可选择允许先开票',
      status:{ key:'accepted', label:'已接单', tone:'cyan' } },
    { id:'audit',    owner:'b', isNew:true, name:'提交审核（押金待结算）', desc:'承租方提交审核，押金待结算（流程图新增环节）',
      status:{ key:'deposit_pending', label:'押金待结算', tone:'orange' } },
    { id:'pay',      owner:'b', name:'押金缴纳', desc:'承租方缴纳押金',
      status:{ key:'to_pay_deposit', label:'待缴押金', tone:'orange' } },
    { id:'paid',     owner:'a', name:'押金到账确认', desc:'出租方确认押金到账，押金结算完成',
      status:{ key:'deposit_paid', label:'押金已到账', tone:'cyan' } },
    { id:'ship',     owner:'a', name:'新增发货单（提交发货单）', desc:'押金已结算后，出租方新增发货单并发货',
      status:{ key:'to_ship', label:'待发货', tone:'orange' } },
    { id:'sign',     owner:'b', name:'签收（提交签收）', desc:'承租方签收商品，租期开始计算',
      status:{ key:'to_sign', label:'待签收', tone:'orange' } },
    { id:'renting',  owner:'n', name:'租期中', desc:'租期进行中；租期结束后才可发起对账',
      status:{ key:'renting', label:'租期中', tone:'blue' } },
    { id:'return1',  owner:'b', name:'新增退租单', desc:'承租方发起退租',
      status:{ key:'to_return', label:'待退租', tone:'orange' } },
    { id:'crent',    owner:'a', name:'确认退租单', desc:'出租方确认退租单',
      status:{ key:'return_confirm', label:'退租待确认', tone:'orange' } },
    { id:'bill',     owner:'a', name:'创建对账单（确认）', desc:'出租方创建对账单并确认',
      status:{ key:'to_reconcile', label:'待对账', tone:'orange' } },
    { id:'check',    owner:'b', name:'复核对账单（确认）', desc:'承租方复核对账单并确认',
      status:{ key:'checking', label:'对账待复核', tone:'orange' } },
    { id:'rent',     owner:'b', name:'租金付款', desc:'承租方按对账单支付租金',
      status:{ key:'to_pay', label:'待付款', tone:'orange' } },
    { id:'receipt',  owner:'a', name:'到账确认（确认）', desc:'出租方确认租金到账',
      status:{ key:'receipt_confirm', label:'到账待确认', tone:'orange' } },
    { id:'back1',    owner:'b', name:'新增商品归还', desc:'承租方发起商品归还',
      status:{ key:'to_giveback', label:'待归还', tone:'orange' } },
    { id:'cback',    owner:'a', name:'商品归还确认', desc:'出租方确认商品归还',
      status:{ key:'giveback_confirm', label:'归还待确认', tone:'orange' } },
    { id:'damage',   owner:'a', isNew:true, optional:true, name:'货物损坏扣款', desc:'如有货物损坏进行扣款（流程图新增环节）',
      status:{ key:'damage_confirm', label:'待定损扣款', tone:'orange' } },
    { id:'refund1',  owner:'a', isNew:true, name:'新增押金退还单（押金退还付款）', desc:'出租方新增押金退还单并完成付款（新增环节）',
      status:{ key:'refund_pending', label:'押金待退还', tone:'orange' } },
    { id:'refundok', owner:'b', isNew:true, name:'押金退款到账确认', desc:'承租方确认押金退款到账（新增环节）',
      status:{ key:'refund_confirm', label:'押金退款待确认', tone:'orange' } },
    { id:'invoice',  owner:'a', name:'新增开票', desc:'出租方新增发票（开票）',
      status:{ key:'to_invoice', label:'待开票', tone:'orange' } },
    { id:'cinvoice', owner:'b', name:'确认发票（同意）', desc:'承租方确认发票（同意）',
      status:{ key:'invoice_confirm', label:'发票待确认', tone:'orange' } },
    { id:'end',      owner:'n', name:'结束订单', desc:'订单流程终态',
      status:{ key:'done', label:'已完成', tone:'green' } }
  ];

  var STEP_INDEX = {}, STATUS_INDEX = {};
  STEPS.forEach(function (s, i) {
    STEP_INDEX[s.id] = i;
    STATUS_INDEX[s.status.key] = i;
  });

  /* 阶段分组（详情页顶部进度条） */
  var PHASES = [
    { name:'下单',     steps:['order'] },
    { name:'议价',     steps:['deposit','bargain','reply'] },
    { name:'接单',     steps:['accept','invoice0'] },
    { name:'押金结算', steps:['audit','pay','paid'] },
    { name:'发货签收', steps:['ship','sign'] },
    { name:'租期',     steps:['renting'] },
    { name:'退租对账', steps:['return1','crent','bill','check'] },
    { name:'租金结算', steps:['rent','receipt'] },
    { name:'归还定损', steps:['back1','cback','damage'] },
    { name:'押金退还', steps:['refund1','refundok'] },
    { name:'开票结束', steps:['invoice','cinvoice','end'] }
  ];

  /* 每个环节可执行的待办动作（next = 执行后的下一环节） */
  var ACTIONS = {
    order:    [{ label:'提交订单', next:'deposit' }],
    deposit:  [{ label:'设置押金', next:'bargain', input:{ key:'deposit', label:'押金金额（元）', def:'deposit10' } },
               { label:'零押金，跳过', next:'bargain', ghost:true }],
    bargain:  [{ label:'发起议价', next:'reply', input:{ key:'amount', label:'议价后总额（元）', def:'amount' } },
               { label:'不议价，直接接单', next:'accept', ghost:true }],
    reply:    [{ label:'通过议价', next:'accept' },
               { label:'驳回议价', next:'bargain', warn:true, log:'驳回议价，退回承租方重新确认是否议价' }],
    accept:   [{ label:'确认接单', next:'invoice0' }],
    invoice0: [{ label:'允许先开票', next:'audit' },
               { label:'暂不开票，继续', next:'audit', ghost:true }],
    audit:    [{ label:'提交审核（押金待结算）', next:'pay' }],
    pay:      [{ label:'确认缴纳押金', next:'paid' }],
    paid:     [{ label:'确认押金到账', next:'ship' }],
    ship:     [{ label:'提交发货单', next:'sign' }],
    sign:     [{ label:'确认签收', next:'renting' }],
    renting:  [{ label:'租期结束，发起退租', next:'return1' }],
    return1:  [{ label:'提交退租单', next:'crent' }],
    crent:    [{ label:'确认退租单', next:'bill' }],
    bill:     [{ label:'创建对账单并确认', next:'check' }],
    check:    [{ label:'复核对账单', next:'rent' }],
    rent:     [{ label:'确认付款', next:'receipt' }],
    receipt:  [{ label:'确认租金到账', next:'back1' }],
    back1:    [{ label:'提交商品归还', next:'cback' }],
    cback:    [{ label:'确认商品归还', next:'damage' }],
    damage:   [{ label:'确认定损扣款', next:'refund1', input:{ key:'damage', label:'扣款金额（元）', def:'zero' } },
               { label:'无损坏，直接退还', next:'refund1', ghost:true }],
    refund1:  [{ label:'押金退还付款', next:'refundok' }],
    refundok: [{ label:'确认押金退款到账', next:'invoice' }],
    invoice:  [{ label:'新增开票', next:'cinvoice' }],
    cinvoice: [{ label:'确认发票（同意）', next:'end' }],
    end:      []
  };

  /* 列表页状态筛选项（分组） */
  var FILTERS = [
    { key:'all',        label:'全部' },
    { key:'start',      label:'待接单',       has:['draft','to_deposit','to_bargain','bargaining','to_accept'] },
    { key:'accepted',   label:'已接单',       has:['accepted','deposit_pending'] },
    { key:'deposit',    label:'押金结算',     has:['to_pay_deposit','deposit_paid'] },
    { key:'ship',       label:'待发货',       has:['to_ship'] },
    { key:'sign',       label:'待签收',       has:['to_sign'] },
    { key:'renting',    label:'租期中',       has:['renting'] },
    { key:'back',       label:'待退租',       has:['to_return','return_confirm'] },
    { key:'bill',       label:'待对账',       has:['to_reconcile','checking'] },
    { key:'pay',        label:'待付款',       has:['to_pay','receipt_confirm'] },
    { key:'giveback',   label:'待归还',       has:['to_giveback','giveback_confirm','damage_confirm'] },
    { key:'refund',     label:'押金退还',     has:['refund_pending','refund_confirm'] },
    { key:'invoice',    label:'待开票',       has:['to_invoice','invoice_confirm'] },
    { key:'done',       label:'已完成',       has:['done'] }
  ];

  /* ======================= 二、演示订单数据 ======================= */
  var SHOPS = ['河南八荒', '江苏藤源自营店铺', '总部公司'];
  var TENANTS = ['总部公司', '河南八荒', '第二工程公司', '西南分公司'];
  var GOODS = ['YJV 电缆 4×25', 'KVV 控制电缆 12×1.5', '扣件式钢管脚手架', 'H 型钢 HW200×200', '铝模板 标准板', '配电箱 XL-21'];

  var RAW = [
    { no:'DGB25182188321', type:'自主', status:'to_accept',        days:1,  amount:25000, creator:'王小明', shop:0, tenant:0, goods:0 },
    { no:'DGB25182188322', type:'委托', status:'bargaining',       days:2,  amount:43200, creator:'李文博', shop:1, tenant:1, goods:2 },
    { no:'DGB25182188323', type:'自主', status:'to_bargain',       days:2,  amount:18600, creator:'赵倩',   shop:0, tenant:2, goods:1 },
    { no:'DGB25182188324', type:'自主', status:'accepted',         days:3,  amount:25000, creator:'王小明', shop:0, tenant:0, goods:0 },
    { no:'DGB25182188325', type:'委托', status:'deposit_pending',  days:4,  amount:56800, creator:'孙鹏',   shop:1, tenant:1, goods:3 },
    { no:'DGB25182188326', type:'自主', status:'to_pay_deposit',   days:5,  amount:32900, creator:'赵倩',   shop:2, tenant:0, goods:4 },
    { no:'DGB25182188327', type:'委托', status:'to_ship',          days:6,  amount:25000, creator:'李文博', shop:0, tenant:2, goods:5 },
    { no:'DGB25182188328', type:'自主', status:'to_sign',          days:7,  amount:78400, creator:'孙鹏',   shop:1, tenant:1, goods:2 },
    { no:'DGB25182188329', type:'自主', status:'renting',          days:12, amount:25000, creator:'王小明', shop:0, tenant:0, goods:0 },
    { no:'DGB25182188330', type:'委托', status:'return_confirm',   days:26, amount:43200, creator:'赵倩',   shop:1, tenant:2, goods:3 },
    { no:'DGB25182188331', type:'自主', status:'to_reconcile',     days:31, amount:18600, creator:'李文博', shop:2, tenant:1, goods:1 },
    { no:'DGB25182188332', type:'委托', status:'checking',         days:34, amount:25000, creator:'孙鹏',   shop:0, tenant:0, goods:4 },
    { no:'DGB25182188333', type:'自主', status:'receipt_confirm',  days:38, amount:56800, creator:'王小明', shop:1, tenant:2, goods:5 },
    { no:'DGB25182188334', type:'委托', status:'to_giveback',      days:41, amount:32900, creator:'赵倩',   shop:2, tenant:0, goods:2 },
    { no:'DGB25182188335', type:'自主', status:'refund_pending',   days:45, amount:25000, creator:'李文博', shop:0, tenant:1, goods:0 },
    { no:'DGB25182188336', type:'委托', status:'to_invoice',       days:49, amount:78400, creator:'孙鹏',   shop:1, tenant:0, goods:3 },
    { no:'DGB25182188337', type:'自主', status:'done',             days:56, amount:25000, creator:'王小明', shop:0, tenant:2, goods:1 },
    { no:'DGB25182188338', type:'委托', status:'done',             days:63, amount:43200, creator:'赵倩',   shop:2, tenant:1, goods:4 }
  ];

  var ORDERS = [];
  var current = null;      // 当前查看的订单
  var page = 1, PAGE_SIZE = 10;
  var query = { status:'all', no:'', tenant:'', shop:'', type:'', creator:'', from:'', to:'' };

  /* ======================= 三、工具 ======================= */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
           ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function nowStr() { return fmt(new Date()); }
  function money(n) { return (Number(n) || 0).toFixed(2); }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function stepOf(o) { return STEPS[o.step]; }
  function statusOf(o) { return stepOf(o).status; }

  /* ======================= 四、初始化订单 ======================= */
  function seed() {
    ORDERS = RAW.map(function (r) {
      var o = {
        no: r.no, type: r.type, amount: r.amount,
        shop: SHOPS[r.shop], tenant: TENANTS[r.tenant],
        goods: GOODS[r.goods], qty: (60 + (r.amount % 7) * 20) + ' 件/米',
        creator: r.creator, deposit: Math.round(r.amount * 0.1 * 100) / 100,
        paidDeposit: 0, checked: 0, paid: 0, damage: 0, refunded: 0,
        done: {}, skipped: {}, log: []
      };
      o.step = STATUS_INDEX[r.status];
      var created = new Date(Date.now() - r.days * 86400000 - 3 * 3600000);
      o.createdAt = fmt(created);

      /* 已完成环节的时间线（按创建时间到当前时间均匀分布） */
      var span = Date.now() - created.getTime();
      var even = parseInt(r.no.slice(-1), 10) % 2 === 0;
      var i;
      for (i = 0; i < o.step; i++) {
        var st = STEPS[i];
        var t = new Date(created.getTime() + span * (i + 1) / (o.step + 1));
        var by = OPERATOR[st.owner];
        var skipIt = st.optional && even && (st.id === 'invoice0' || st.id === 'damage');
        if (skipIt) {                                 // 演示：部分可选环节被跳过
          o.skipped[st.id] = true;
          o.log.push({ time: fmt(t), who: by, text: '【' + ROLE[st.owner] + '】' + st.name + '：已跳过' });
          continue;
        }
        o.done[st.id] = { time: fmt(t), by: by };
        o.log.push({ time: fmt(t), who: by, text: '【' + ROLE[st.owner] + '】' + st.name + '：已完成' });
      }
      o.log.unshift({ time: o.createdAt, who: o.creator, text: '【承租方】创建租赁订单 ' + o.no });
      o.log.reverse();

      /* 金额随流程位置推进 */
      if (o.step > STEP_INDEX.pay) o.paidDeposit = o.deposit;
      if (o.step > STEP_INDEX.bill) o.checked = o.amount;
      if (o.step > STEP_INDEX.rent) o.paid = o.amount;
      if (o.step > STEP_INDEX.damage && o.done.damage) o.damage = Math.round(o.amount * 0.02 * 100) / 100;
      if (o.step > STEP_INDEX.refund1) o.refunded = Math.round((o.deposit - o.damage) * 100) / 100;
      return o;
    });
  }

  /* ======================= 五、列表 ======================= */
  function match(o) {
    var s = statusOf(o);
    if (query.status !== 'all') {
      var f = FILTERS.filter(function (x) { return x.key === query.status; })[0];
      if (f && f.has && f.has.indexOf(s.key) < 0) return false;
    }
    if (query.no && o.no.indexOf(query.no) < 0) return false;
    if (query.tenant && o.tenant.indexOf(query.tenant) < 0) return false;
    if (query.shop && o.shop.indexOf(query.shop) < 0) return false;
    if (query.type && o.type !== query.type) return false;
    if (query.creator && o.creator.indexOf(query.creator) < 0) return false;
    if (query.from && o.createdAt.slice(0, 10) < query.from) return false;
    if (query.to && o.createdAt.slice(0, 10) > query.to) return false;
    return true;
  }

  function renderFilters() {
    document.getElementById('statusFilter').innerHTML = FILTERS.map(function (f) {
      var n = ORDERS.filter(function (o) {
        if (f.key === 'all') return true;
        return f.has.indexOf(statusOf(o).key) >= 0;
      }).length;
      return '<button type="button" class="filter' + (query.status === f.key ? ' is-active' : '') +
        '" data-status="' + f.key + '">' + f.label + '<em>' + n + '</em></button>';
    }).join('');
  }

  function renderTable() {
    var list = ORDERS.filter(match);
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (page > pages) page = pages;
    var rows = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    var body = rows.length ? rows.map(function (o, i) {
      var s = statusOf(o), st = stepOf(o);
      var todo = st.owner === 'n' ? '—' : ROLE[st.owner] + ' · ' + (ACTIONS[st.id][0] ? ACTIONS[st.id][0].label : st.name);
      return '<tr>' +
        '<td>' + ((page - 1) * PAGE_SIZE + i + 1) + '</td>' +
        '<td>' + esc(o.type) + '</td>' +
        '<td><span class="chip t-' + s.tone + '">' + s.label + (st.isNew ? ' ★' : '') + '</span></td>' +
        '<td><span class="link" data-open="' + o.no + '">' + o.no + '</span></td>' +
        '<td>' + esc(o.shop) + '</td>' +
        '<td>' + esc(o.tenant) + '</td>' +
        '<td class="num">' + money(o.amount) + '</td>' +
        '<td class="num">' + money(o.checked) + '</td>' +
        '<td class="todo">' + esc(todo) + '</td>' +
        '<td><span class="link" data-open="' + o.no + '">详情</span></td>' +
      '</tr>';
    }).join('') : '<tr><td class="empty" colspan="10">没有符合条件的订单，请调整筛选或查询条件</td></tr>';

    document.getElementById('orderBody').innerHTML = body;

    /* 分页 */
    var pager = ['<span class="total">共 ' + list.length + ' 条订单</span>'];
    pager.push('<button type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>上一页</button>');
    for (var p = 1; p <= pages; p++) {
      pager.push('<button type="button" data-page="' + p + '" class="' + (p === page ? 'is-on' : '') + '">' + p + '</button>');
    }
    pager.push('<button type="button" data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>下一页</button>');
    document.getElementById('pager').innerHTML = pager.join('');
    document.getElementById('listCount').textContent = '当前筛选 ' + list.length + ' 条';
  }

  /* ======================= 六、详情 ======================= */
  function phaseState(startIdx, endIdx, cur) {
    if (cur > endIdx) return 'done';
    if (cur >= startIdx) return 'current';
    return 'pending';
  }

  function renderDetail() {
    var o = current;
    var s = statusOf(o), st = stepOf(o);
    var pct = Math.round(o.step / (STEPS.length - 1) * 100);

    /* 头部 */
    document.getElementById('dtTitle').textContent = '租赁订单 ' + o.no;
    var tag = document.getElementById('dtStatus');
    tag.className = 'chip t-' + s.tone;
    tag.textContent = s.label + (st.isNew ? ' ★' : '');
    document.getElementById('dtTodo').textContent = st.owner === 'n'
      ? '当前无待办' : '当前待办：' + ROLE[st.owner] + ' · ' + (ACTIONS[st.id][0] ? ACTIONS[st.id][0].label : st.name);

    /* 订单信息 */
    var info = [
      ['订单编号', o.no], ['订单类型', o.type], ['订单状态', s.label],
      ['出租店铺', o.shop], ['承租单位', o.tenant], ['下单人', o.creator],
      ['创建时间', o.createdAt], ['租赁商品', o.goods], ['数量', o.qty]
    ];
    document.getElementById('dtInfo').innerHTML = info.map(function (kv) {
      return '<div class="it"><span class="k">' + kv[0] + '</span><span class="v">' + esc(kv[1]) + '</span></div>';
    }).join('');

    /* 阶段进度 */
    document.getElementById('dtProgress').style.width = pct + '%';
    document.getElementById('dtPercent').textContent = '流程进度 ' + o.step + '/' + (STEPS.length - 1) + ' 环节 · ' + pct + '%';
    document.getElementById('dtStepper').innerHTML = PHASES.map(function (ph, i) {
      var a = STEP_INDEX[ph.steps[0]], b = STEP_INDEX[ph.steps[ph.steps.length - 1]];
      var state = phaseState(a, b, o.step);
      return '<div class="step-node is-' + state + '">' +
        '<span class="dot">' + (state === 'done' ? '✓' : (i + 1)) + '</span>' +
        '<span class="nm">' + ph.name + '</span>' +
      '</div>';
    }).join('');

    /* 流程轨迹 */
    document.getElementById('dtTimeline').innerHTML = STEPS.map(function (step, i) {
      var cls, meta = '', actions = '';
      var endDone = (step.id === 'end' && o.done.end);

      if (i === o.step && !endDone) {
        /* 当前待办环节 */
        cls = 'is-current';
        meta = '<div class="tl-meta">等待 ' + ROLE[step.owner] + ' 办理</div>';
        var acts = ACTIONS[step.id] || [];
        if (acts.length) {
          actions = '<div class="tl-actions">' + acts.map(function (a, ai) {
            var input = '';
            if (a.input) {
              var dv = a.input.def === 'amount' ? o.amount
                     : a.input.def === 'deposit10' ? Math.round(o.amount * 0.1 * 100) / 100
                     : (o[a.input.key] || 0);
              input = '<span class="hint">' + a.input.label + '</span>' +
                '<input type="text" data-input="' + a.input.key + '" value="' + money(dv) + '"/>';
            }
            var cls2 = a.warn ? 'btn-warn' : (a.ghost ? 'btn-ghost' : 'btn-cyan');
            return input + '<button type="button" class="btn ' + cls2 + ' btn-sm" data-act="' + i + ':' + ai + '">' + a.label + '</button>';
          }).join('') + '</div>';
        }
      } else if (i <= o.step || o.done[step.id]) {
        /* 已完成 / 已跳过 / 被驳回后重走的历史环节 */
        if (o.skipped[step.id]) {
          cls = 'is-skip';
          meta = '<div class="tl-meta">已跳过（可选环节）</div>';
        } else {
          cls = 'is-done';
          var d = o.done[step.id] || {};
          meta = '<div class="tl-meta">' + esc(d.time || '') + ' · ' + esc(d.by || '') + '</div>';
        }
      } else {
        cls = 'is-pending';
      }
      return '<li class="tl-item ' + cls + '">' +
        '<span class="tl-dot">' + (cls === 'is-done' ? '✓' : (i + 1)) + '</span>' +
        '<div class="tl-main">' +
          '<span class="tl-name">' + esc(step.name) + '</span>' +
          '<span class="role ' + step.owner + '">' + ROLE[step.owner] + '</span>' +
          (step.isNew ? '<span class="chip t-red">新增</span>' : '') +
          (step.optional ? '<span class="chip t-gray">可选</span>' : '') +
        '</div>' +
        '<div class="tl-desc">' + esc(step.desc) + '</div>' + meta + actions +
      '</li>';
    }).join('');

    /* 金额与单据 */
    var amts = [
      ['订单总额（元）', money(o.amount), true],
      ['押金（元）', money(o.deposit)],
      ['已缴押金（元）', money(o.paidDeposit)],
      ['已对账金额（元）', money(o.checked)],
      ['已付租金（元）', money(o.paid)],
      ['货物损坏扣款（元）', money(o.damage)],
      ['已退押金（元）', money(o.refunded)]
    ];
    document.getElementById('dtAmounts').innerHTML = amts.map(function (a) {
      return '<div class="amt-row' + (a[2] ? ' is-total' : '') + '"><span>' + a[0] + '</span><b>' + a[1] + '</b></div>';
    }).join('');

    /* 流转日志 */
    document.getElementById('dtLog').innerHTML = o.log.slice().reverse().map(function (l) {
      return '<li class="log-item"><div class="lt">' + esc(l.time) + ' · ' + esc(l.who) + '</div>' +
        '<div class="lc">' + esc(l.text) + '</div></li>';
    }).join('');
  }

  function openDetail(no) {
    var o = ORDERS.filter(function (x) { return x.no === no; })[0];
    if (!o) return;
    current = o;
    document.getElementById('viewList').hidden = true;
    document.getElementById('viewDetail').hidden = false;
    location.hash = 'detail=' + no;
    renderDetail();
    window.scrollTo(0, 0);
    document.getElementById('stage') && (document.getElementById('stage').scrollTop = 0);
  }

  function closeDetail() {
    current = null;
    document.getElementById('viewDetail').hidden = true;
    document.getElementById('viewList').hidden = false;
    location.hash = '';
    renderTable();
  }

  /* ======================= 七、状态流转 ======================= */
  function doAction(stepIdx, actIdx) {
    var o = current;
    var st = STEPS[stepIdx];
    var act = (ACTIONS[st.id] || [])[actIdx];
    if (!o || !act) return;

    /* 读取输入 */
    if (act.input) {
      var input = document.querySelector('.tl-actions input[data-input="' + act.input.key + '"]');
      var v = input ? num(input.value) : 0;
      if (v < 0) { window.uiToast('金额不能为负数'); return; }
      if (act.input.key === 'deposit' || act.input.key === 'amount') {
        if (v <= 0) { window.uiToast('请输入大于 0 的金额'); return; }
      }
      o[act.input.key] = Math.round(v * 100) / 100;
    }

    var t = nowStr();
    var by = OPERATOR[st.owner];
    var note = act.log || '';

    /* 记录完成 / 跳过 */
    if (act.ghost && st.optional) o.skipped[st.id] = true;
    else o.done[st.id] = { time: t, by: by };

    o.log.push({
      time: t, who: by,
      text: '【' + ROLE[st.owner] + '】' + st.name +
        (act.ghost && st.optional ? '：已跳过' : '：已完成' + (note ? '（' + note + '）' : ''))
    });

    /* 金额联动 */
    if (st.id === 'bill') o.checked = o.amount;
    if (st.id === 'rent') o.paid = o.amount;
    if (st.id === 'pay') o.paidDeposit = o.deposit;
    if (st.id === 'damage' && !act.ghost) o.damage = o.damage || 0;
    if (st.id === 'refund1') o.refunded = Math.round((o.deposit - o.damage) * 100) / 100;

    /* 推进到下一环节 */
    o.step = STEP_INDEX[act.next];

    if (o.step === STEP_INDEX.end) {
      var t2 = nowStr();
      o.done.end = { time: t2, by: '系统' };
      o.log.push({ time: t2, who: '系统', text: '【系统】结束订单：订单流程已完成' });
    }

    renderFilters();
    renderTable();
    renderDetail();
    var ns = statusOf(o);
    window.uiToast('已流转到「' + ns.label + '」· 待' + (stepOf(o).owner === 'n' ? '系统' : ROLE[stepOf(o).owner]) + '办理');
  }

  /* ======================= 八、事件绑定 ======================= */
  function bind() {
    /* 筛选按钮 */
    document.getElementById('statusFilter').addEventListener('click', function (ev) {
      var b = ev.target.closest('.filter');
      if (!b) return;
      query.status = b.getAttribute('data-status');
      page = 1;
      renderFilters();
      renderTable();
    });

    /* 查询 / 重置 */
    function readQuery() {
      query.no = document.getElementById('q-no').value.trim();
      query.tenant = document.getElementById('q-tenant').value.trim();
      query.shop = document.getElementById('q-shop').value.trim();
      query.type = document.getElementById('q-type').value;
      query.creator = document.getElementById('q-creator').value.trim();
      query.from = document.getElementById('q-from').value;
      query.to = document.getElementById('q-to').value;
      page = 1;
      renderTable();
    }
    document.getElementById('btn-query').addEventListener('click', readQuery);
    document.getElementById('btn-reset').addEventListener('click', function () {
      ['q-no', 'q-tenant', 'q-shop', 'q-creator', 'q-from', 'q-to'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
      document.getElementById('q-type').value = '';
      readQuery();
      window.uiToast('已重置查询条件');
    });
    document.getElementById('q-no').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') readQuery();
    });

    /* 列表：打开详情 / 分页 */
    document.getElementById('orderBody').addEventListener('click', function (ev) {
      var open = ev.target.closest('[data-open]');
      if (open) openDetail(open.getAttribute('data-open'));
    });
    document.getElementById('pager').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-page]');
      if (!b || b.disabled) return;
      page = parseInt(b.getAttribute('data-page'), 10);
      renderTable();
      window.scrollTo(0, 0);
    });

    /* 详情：返回 / 办理 */
    document.getElementById('btnBack').addEventListener('click', closeDetail);
    document.getElementById('dtTimeline').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b) return;
      var p = b.getAttribute('data-act').split(':');
      doAction(parseInt(p[0], 10), parseInt(p[1], 10));
    });

    /* 导出 */
    document.getElementById('btn-export').addEventListener('click', function () {
      window.uiToast('演示原型：导出功能未接入后端');
    });
  }

  /* ======================= 九、启动 ======================= */
  function init() {
    seed();
    renderFilters();
    renderTable();
    bind();
    var m = /detail=([A-Za-z0-9]+)/.exec(location.hash);
    if (m) openDetail(m[1]);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
