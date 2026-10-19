/* ==========================================================================
   orders-page.js —— 订单管理页：外壳注入 + 通用「订单状态机」渲染引擎
   页面写到：<body data-flow="sale"><script src="assets/orders-page.js">
   数据写到：assets/orders-sale.js 等（window.ORDERS_FLOW）
   ========================================================================== */
(function () {
  'use strict';

  var F = window.ORDERS_FLOW;
  if (!F) { return; }

  /* ============================== 一、外壳 ============================== */
  var ORDERS = [
    { k: 'rent', n: '租赁订单', h: 'index.html' },
    { k: 'sale', n: '销售订单', h: 'orders-sale.html' },
    { k: 'esale', n: '委托出售订单', h: 'orders-entrust-sale.html' },
    { k: 'erent', n: '委托出租订单', h: 'orders-entrust-rent.html' }
  ];
  var FLOWS = [
    { k: 'rent', n: '租赁业务流程', h: 'flow.html' },
    { k: 'sale', n: '商品销售流程', h: 'flow-sale.html' },
    { k: 'esale', n: '委托出售流程', h: 'flow-entrust-sale.html' },
    { k: 'erent', n: '委托出租流程', h: 'flow-entrust-rent.html' }
  ];
  var IC = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    tag: '<path d="M11 3H4v7l10 10 7-7L11 3Z"/><circle cx="7.5" cy="6.5" r="1.3"/>',
    rent: '<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v6M12 7.6v.6"/>',
    shop: '<path d="M4 10v9h16v-9"/><path d="M3.5 10 5 4.5h14L20.5 10"/><path d="M10 19v-5h4v5"/>',
    fee: '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l3 3.2L15 9M12 12.2V17"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>',
    caret: '<path d="M6 9l6 6 6-6"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    export: '<path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M5 18.5h14"/>'
  };
  function ic(n, cls) {
    return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      IC[n] + '</g></svg>';
  }
  var NAVS = [['sale', '销售业务', 'tag'], ['rent', '租赁业务', 'rent'], ['info', '信息中心', 'info'],
              ['shop', '店铺管理', 'shop'], ['fee', '佣金管理', 'fee'], ['sys', '系统管理', 'gear']];

  var shell =
'<div class="console">' +
 '<header class="topbar"><div class="brand-col">' +
   '<div class="brand"><span class="brand-mark">TEST</span><span class="brand-name">租售店铺</span></div>' +
   '<label class="menu-search">' + ic('search') + '<input type="text" placeholder="菜单查询"/></label>' +
 '</div><nav class="topnav" id="topnav">' +
   NAVS.map(function (x) {
     return '<button type="button" class="nav-item' + (x[0] === 'rent' ? ' is-active' : '') +
       '" data-module="' + x[0] + '"><span class="nav-tile">' + ic(x[2]) + '</span>' + x[1] + '</button>';
   }).join('') +
 '</nav></header>' +
 '<div class="body"><aside class="sidebar">' +
   '<div class="side-parent"><span>租赁订单</span>' + ic('caret') + '</div>' +
   '<nav class="side-list">' +
     '<a class="side-item' + (F.key === 'rent' ? ' is-active' : '') + '" href="index.html">订单管理</a>' +
     '<a class="side-item" href="#" data-todo>发货单管理</a>' +
     '<a class="side-item" href="#" data-todo>收货单管理</a>' +
     '<a class="side-item" href="#" data-todo>退货/租单管理</a>' +
   '</nav>' +
   '<div class="side-parent"><span>销售与委托</span>' + ic('caret') + '</div>' +
   '<nav class="side-list">' +
     ORDERS.filter(function (o) { return o.k !== 'rent'; }).map(function (o) {
       return '<a class="side-item' + (F.key === o.k ? ' is-active' : '') + '" href="' + o.h + '">' + o.n + '</a>';
     }).join('') +
   '</nav>' +
   '<div class="side-parent"><span>业务流程</span>' + ic('caret') + '</div>' +
   '<nav class="side-list">' + FLOWS.map(function (o) {
     return '<a class="side-item" href="' + o.h + '">' + o.n + '</a>';
   }).join('') + '</nav>' +
 '</aside><main class="main">' +
   '<div class="tabbar"><span class="tab-back" title="返回">' + ic('left') + '</span>' +
     '<a class="tab" href="#" data-todo>首页</a>' +
     ORDERS.map(function (o) {
       return '<a class="tab' + (F.key === o.k ? ' is-active' : '') + '" href="' + o.h + '">' +
         o.n + '<i class="x">×</i></a>';
     }).join('') +
   '</div><div class="content">' +
     '<div id="viewList"><div class="filters" id="statusFilter"></div>' +
       '<section class="card search-card"><div class="form-row">' +
         '<label class="field"><span class="lb">订单编号</span><input type="text" id="q-no" placeholder="订单编号"/></label>' +
         '<label class="field"><span class="lb">' + F.cols[5] + '</span><input type="text" id="q-tenant" placeholder="' + F.cols[5] + '"/></label>' +
         '<label class="field"><span class="lb">' + F.cols[4] + '</span><input type="text" id="q-shop" placeholder="' + F.cols[4] + '"/></label>' +
         '<label class="field"><span class="lb">订单类型</span><select id="q-type"><option value="">全部</option>' +
           F.types.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
         '</select></label>' +
         '<label class="field"><span class="lb">下单人</span><input type="text" id="q-creator" placeholder="下单人"/></label>' +
         '<label class="field"><span class="lb">创建时间</span><span class="date-range">' +
           '<input type="date" id="q-from"/><i>—</i><input type="date" id="q-to"/></span></label>' +
         '<div class="field field-actions">' +
           '<button type="button" class="btn btn-cyan" id="btn-query">查 询</button>' +
           '<button type="button" class="btn btn-ghost" id="btn-reset">重 置</button></div>' +
       '</div></section>' +
       '<section class="card"><div class="card-toolbar">' +
         '<h2 class="card-title">' + F.title + '</h2>' +
         '<div class="tool-group"><button type="button" class="btn btn-cyan" id="btn-export">' + ic('export') + '导出</button></div>' +
         '<div class="legend"><span id="listCount">—</span></div>' +
       '</div><div class="table-wrap"><table class="data-table"><thead><tr>' +
         '<th>序号</th><th>订单类型</th><th>订单状态</th><th>订单编号</th>' +
         F.cols.slice(4).map(function (c) { return '<th>' + c + '</th>'; }).join('') +
         '<th>订单总额(元)</th><th>已对账金额(元)</th><th>当前待办</th><th>操作</th>' +
       '</tr></thead><tbody id="orderBody"></tbody></table></div>' +
       '<div class="pager" id="pager"></div></section></div>' +
     '<div id="viewDetail" hidden><div class="detail-bar">' +
       '<button type="button" class="btn btn-ghost btn-sm" id="btnBack">← 返回订单列表</button>' +
       '<span class="detail-title" id="dtTitle">订单</span>' +
       '<span class="chip t-gray" id="dtStatus">—</span>' +
       '<span class="head-extra" id="dtTodo"></span>' +
     '</div><div class="detail-grid"><div class="detail-col">' +
       '<section class="card"><div class="card-head"><h3>订单信息</h3></div>' +
         '<div class="card-body"><div class="info-grid" id="dtInfo"></div></div></section>' +
       '<section class="card"><div class="card-head"><h3>流程进度</h3>' +
         '<span class="head-extra" id="dtPercent">—</span></div>' +
         '<div class="card-body"><div class="progress"><i id="dtProgress" style="width:0"></i></div>' +
         '<div class="stepper" id="dtStepper"></div></div></section>' +
       '<section class="card"><div class="card-head"><h3>流程轨迹</h3>' +
         '<span class="head-extra">点击当前环节的按钮即可办理并流转</span></div>' +
         '<div class="card-body"><ul class="tl" id="dtTimeline"></ul></div></section>' +
     '</div><div class="detail-col">' +
       '<section class="card"><div class="card-head"><h3>金额与单据</h3></div>' +
         '<div class="card-body"><div class="amt-list" id="dtAmounts"></div></div></section>' +
       '<section class="card"><div class="card-head"><h3>流转日志</h3></div>' +
         '<div class="card-body"><ul class="log-list" id="dtLog"></ul></div></section>' +
     '</div></div></div>' +
   '</div></main></div></div>' +
'<div class="toast" id="toast"></div>';
  document.body.insertAdjacentHTML('afterbegin', shell);

  /* ============================== 二、状态机 ============================== */
  var ROLE = F.roles, OP = F.operators;
  var STEPS = F.steps;
  var IDX = {}, SIDX = {};
  STEPS.forEach(function (s, i) { IDX[s.id] = i; SIDX[s.status.key] = i; });
  var ACT = F.actions;

  var ORDS = [], cur = null, page = 1, PS = 10;
  var Q = { status: 'all', no: '', tenant: '', shop: '', type: '', creator: '', from: '', to: '' };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
      ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function now() { return fmt(new Date()); }
  function money(n) { return (Number(n) || 0).toFixed(2); }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function stepOf(o) { return STEPS[o.step]; }
  function statusOf(o) { return stepOf(o).status; }

  function seed() {
    ORDS = F.raw.map(function (r) {
      var o = {
        no: r.no, type: r.type, amount: r.amount, shop: r.shop, tenant: r.tenant,
        goods: r.goods, qty: r.qty, creator: r.creator,
        deposit: Math.round(r.amount * 0.1 * 100) / 100,
        paidDeposit: 0, checked: 0, paid: 0, damage: 0, refunded: 0,
        done: {}, skipped: {}, log: []
      };
      o.step = SIDX[r.status];
      var created = new Date(Date.now() - r.days * 86400000 - 3 * 3600000);
      o.createdAt = fmt(created);
      var span = Date.now() - created.getTime(), i;
      for (i = 0; i < o.step; i++) {
        var st = STEPS[i];
        var t = fmt(new Date(created.getTime() + span * (i + 1) / (o.step + 1)));
        var by = OP[st.role];
        if (st.opt && (i % 3 === 1)) {
          o.skipped[st.id] = true;
          o.log.push({ time: t, who: by, text: '【' + ROLE[st.role] + '】' + st.name + '：已跳过' });
          continue;
        }
        o.done[st.id] = { time: t, by: by };
        o.log.push({ time: t, who: by, text: '【' + ROLE[st.role] + '】' + st.name + '：已完成' });
      }
      o.log.unshift({ time: o.createdAt, who: o.creator, text: '创建订单 ' + o.no });
      o.log.reverse();
      if (o.step > IDX.pay) { o.paidDeposit = o.deposit; }
      if (o.step > IDX.bill) { o.checked = o.amount; }
      if (o.step > IDX.rent) { o.paid = o.amount; }
      if (o.step > IDX.refund1) { o.refunded = Math.round((o.deposit - o.damage) * 100) / 100; }
      return o;
    });
  }

  /* ============================== 三、列表 ============================== */
  function match(o) {
    var s = statusOf(o);
    if (Q.status !== 'all') {
      var f = F.filters.filter(function (x) { return x.key === Q.status; })[0];
      if (f && f.has.indexOf(s.key) < 0) { return false; }
    }
    if (Q.no && o.no.indexOf(Q.no) < 0) { return false; }
    if (Q.tenant && o.tenant.indexOf(Q.tenant) < 0) { return false; }
    if (Q.shop && o.shop.indexOf(Q.shop) < 0) { return false; }
    if (Q.type && o.type !== Q.type) { return false; }
    if (Q.creator && o.creator.indexOf(Q.creator) < 0) { return false; }
    if (Q.from && o.createdAt.slice(0, 10) < Q.from) { return false; }
    if (Q.to && o.createdAt.slice(0, 10) > Q.to) { return false; }
    return true;
  }

  function renderFilters() {
    document.getElementById('statusFilter').innerHTML = F.filters.map(function (f) {
      var n = ORDS.filter(function (o) {
        return f.key === 'all' || f.has.indexOf(statusOf(o).key) >= 0;
      }).length;
      return '<button type="button" class="filter' + (Q.status === f.key ? ' is-active' : '') +
        '" data-status="' + f.key + '">' + f.label + '<em>' + n + '</em></button>';
    }).join('');
  }

  function renderTable() {
    var list = ORDS.filter(match);
    var pages = Math.max(1, Math.ceil(list.length / PS));
    if (page > pages) { page = pages; }
    var rows = list.slice((page - 1) * PS, page * PS);
    document.getElementById('orderBody').innerHTML = rows.length ? rows.map(function (o, i) {
      var s = statusOf(o), st = stepOf(o);
      var todo = st.role === 'n' ? '—' : ROLE[st.role] + ' · ' + (ACT[st.id][0] ? ACT[st.id][0].label : st.name);
      return '<tr><td>' + ((page - 1) * PS + i + 1) + '</td><td>' + esc(o.type) + '</td>' +
        '<td><span class="chip t-' + s.tone + '">' + s.label + (st.kind === 'new' ? ' ★' : '') + '</span></td>' +
        '<td><span class="link" data-open="' + o.no + '">' + o.no + '</span></td>' +
        '<td>' + esc(o.shop) + '</td><td>' + esc(o.tenant) + '</td>' +
        '<td class="num">' + money(o.amount) + '</td><td class="num">' + money(o.checked) + '</td>' +
        '<td class="todo">' + esc(todo) + '</td>' +
        '<td><span class="link" data-open="' + o.no + '">详情</span></td></tr>';
    }).join('') : '<tr><td class="empty" colspan="10">没有符合条件的订单，请调整筛选或查询条件</td></tr>';

    var p = ['<span class="total">共 ' + list.length + ' 条订单</span>'];
    p.push('<button type="button" data-page="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>上一页</button>');
    for (var i = 1; i <= pages; i++) {
      p.push('<button type="button" data-page="' + i + '" class="' + (i === page ? 'is-on' : '') + '">' + i + '</button>');
    }
    p.push('<button type="button" data-page="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>下一页</button>');
    document.getElementById('pager').innerHTML = p.join('');
    document.getElementById('listCount').textContent = '当前筛选 ' + list.length + ' 条';
  }

  /* ============================== 四、详情 ============================== */
  function renderDetail() {
    var o = cur, s = statusOf(o), st = stepOf(o);
    var pct = Math.round(o.step / (STEPS.length - 1) * 100);

    document.getElementById('dtTitle').textContent = '订单 ' + o.no;
    var tag = document.getElementById('dtStatus');
    tag.className = 'chip t-' + s.tone;
    tag.textContent = s.label + (st.kind === 'new' ? ' ★' : '');
    document.getElementById('dtTodo').textContent = st.role === 'n'
      ? '当前无待办' : '当前待办：' + ROLE[st.role] + ' · ' + (ACT[st.id][0] ? ACT[st.id][0].label : st.name);

    document.getElementById('dtInfo').innerHTML = [
      ['订单编号', o.no], ['订单类型', o.type], ['订单状态', s.label],
      [F.cols[4], o.shop], [F.cols[5], o.tenant], ['下单人', o.creator],
      ['创建时间', o.createdAt], ['商品', o.goods], ['数量', o.qty]
    ].map(function (kv) {
      return '<div class="it"><span class="k">' + kv[0] + '</span><span class="v">' + esc(kv[1]) + '</span></div>';
    }).join('');

    document.getElementById('dtProgress').style.width = pct + '%';
    document.getElementById('dtPercent').textContent = '流程进度 ' + o.step + '/' + (STEPS.length - 1) + ' 环节 · ' + pct + '%';
    document.getElementById('dtStepper').innerHTML = F.phases.map(function (ph, i) {
      var a = IDX[ph.steps[0]], b = IDX[ph.steps[ph.steps.length - 1]];
      var state = o.step > b ? 'done' : (o.step >= a ? 'current' : 'pending');
      return '<div class="step-node is-' + state + '"><span class="dot">' +
        (state === 'done' ? '✓' : (i + 1)) + '</span><span class="nm">' + ph.name + '</span></div>';
    }).join('');

    document.getElementById('dtTimeline').innerHTML = STEPS.map(function (step, i) {
      var cls, meta = '', acts = '';
      var endDone = (step.id === 'end' && o.done.end);
      if (i === o.step && !endDone) {
        cls = 'is-current';
        meta = '<div class="tl-meta">等待 ' + ROLE[step.role] + ' 办理</div>';
        var list = ACT[step.id] || [];
        if (list.length) {
          acts = '<div class="tl-actions">' + list.map(function (a, ai) {
            var input = '';
            if (a.input) {
              var dv = a.input.def === 'amount' ? o.amount
                : a.input.def === 'deposit10' ? Math.round(o.amount * 0.1 * 100) / 100
                : (o[a.input.key] || 0);
              input = '<span class="hint">' + a.input.label + '</span>' +
                '<input type="text" data-input="' + a.input.key + '" value="' + money(dv) + '"/>';
            }
            var c2 = a.warn ? 'btn-warn' : (a.ghost ? 'btn-ghost' : 'btn-cyan');
            return input + '<button type="button" class="btn ' + c2 + ' btn-sm" data-act="' + i + ':' + ai + '">' +
              a.label + '</button>';
          }).join('') + '</div>';
        }
      } else if (i <= o.step || o.done[step.id]) {
        if (o.skipped[step.id]) {
          cls = 'is-skip';
          meta = '<div class="tl-meta">已跳过（可选环节）</div>';
        } else {
          cls = 'is-done';
          var d = o.done[step.id] || {};
          meta = '<div class="tl-meta">' + esc(d.time || '') + ' · ' + esc(d.by || '') + '</div>';
        }
      } else { cls = 'is-pending'; }
      return '<li class="tl-item ' + cls + '"><span class="tl-dot">' +
        (cls === 'is-done' ? '✓' : (i + 1)) + '</span><div class="tl-main">' +
        '<span class="tl-name">' + esc(step.name) + '</span>' +
        '<span class="role ' + step.role + '">' + ROLE[step.role] + '</span>' +
        (step.kind === 'new' ? '<span class="chip t-red">新增</span>' : '') +
        (step.opt ? '<span class="chip t-gray">可选</span>' : '') +
        '</div><div class="tl-desc">' + esc(step.desc) + '</div>' + meta + acts + '</li>';
    }).join('');

    document.getElementById('dtAmounts').innerHTML = [
      [F.amt.total, money(o.amount), true],
      [F.amt.deposit, money(o.deposit)],
      [F.amt.paidDeposit, money(o.paidDeposit)],
      [F.amt.checked, money(o.checked)],
      [F.amt.paid, money(o.paid)],
      [F.amt.damage, money(o.damage)],
      [F.amt.refunded, money(o.refunded)]
    ].map(function (a) {
      return '<div class="amt-row' + (a[2] ? ' is-total' : '') + '"><span>' + a[0] + '</span><b>' + a[1] + '</b></div>';
    }).join('');

    document.getElementById('dtLog').innerHTML = o.log.slice().reverse().map(function (l) {
      return '<li class="log-item"><div class="lt">' + esc(l.time) + ' · ' + esc(l.who) + '</div>' +
        '<div class="lc">' + esc(l.text) + '</div></li>';
    }).join('');
  }

  function open(no) {
    var o = ORDS.filter(function (x) { return x.no === no; })[0];
    if (!o) { return; }
    cur = o;
    document.getElementById('viewList').hidden = true;
    document.getElementById('viewDetail').hidden = false;
    location.hash = 'detail=' + no;
    renderDetail();
    window.scrollTo(0, 0);
  }
  function close() {
    cur = null;
    document.getElementById('viewDetail').hidden = true;
    document.getElementById('viewList').hidden = false;
    location.hash = '';
    renderTable();
  }

  /* ============================== 五、流转 ============================== */
  function doAct(si, ai) {
    var o = cur, st = STEPS[si], a = (ACT[st.id] || [])[ai];
    if (!o || !a) { return; }
    if (a.input) {
      var input = document.querySelector('.tl-actions input[data-input="' + a.input.key + '"]');
      var v = input ? num(input.value) : 0;
      if (v < 0) { uiToast('金额不能为负数'); return; }
      if ((a.input.key === 'deposit' || a.input.key === 'amount') && v <= 0) { uiToast('请输入大于 0 的金额'); return; }
      o[a.input.key] = Math.round(v * 100) / 100;
    }
    var t = now(), by = OP[st.role], note = a.log || '';
    if (a.ghost && st.opt) { o.skipped[st.id] = true; } else { o.done[st.id] = { time: t, by: by }; }
    o.log.push({
      time: t, who: by,
      text: '【' + ROLE[st.role] + '】' + st.name +
        (a.ghost && st.opt ? '：已跳过' : '：已完成' + (note ? '（' + note + '）' : ''))
    });
    if (st.id === 'bill') { o.checked = o.amount; }
    if (st.id === 'pay') { o.paidDeposit = o.deposit; }
    if (st.id === 'rent' || st.id === 'bpay') { o.paid = o.amount; }
    if (st.id === 'refund1') { o.refunded = Math.round((o.deposit - o.damage) * 100) / 100; }
    o.step = IDX[a.next];
    if (o.step === IDX.end) {
      var t2 = now();
      o.done.end = { time: t2, by: '系统' };
      o.log.push({ time: t2, who: '系统', text: '【系统】结束订单：流程已完成' });
    }
    renderFilters();
    renderTable();
    renderDetail();
    uiToast('已流转到「' + statusOf(o).label + '」');
  }

  /* ============================== 六、绑定 ============================== */
  function uiToast(m) {
    var el = document.getElementById('toast');
    el.textContent = m;
    el.classList.add('is-on');
    clearTimeout(uiToast._t);
    uiToast._t = setTimeout(function () { el.classList.remove('is-on'); }, 1800);
  }

  function init() {
    seed();
    renderFilters();
    renderTable();

    document.getElementById('statusFilter').addEventListener('click', function (ev) {
      var b = ev.target.closest('.filter');
      if (!b) { return; }
      Q.status = b.getAttribute('data-status');
      page = 1;
      renderFilters();
      renderTable();
    });
    function readQ() {
      Q.no = document.getElementById('q-no').value.trim();
      Q.tenant = document.getElementById('q-tenant').value.trim();
      Q.shop = document.getElementById('q-shop').value.trim();
      Q.type = document.getElementById('q-type').value;
      Q.creator = document.getElementById('q-creator').value.trim();
      Q.from = document.getElementById('q-from').value;
      Q.to = document.getElementById('q-to').value;
      page = 1;
      renderTable();
    }
    document.getElementById('btn-query').addEventListener('click', readQ);
    document.getElementById('btn-reset').addEventListener('click', function () {
      ['q-no', 'q-tenant', 'q-shop', 'q-creator', 'q-from', 'q-to'].forEach(function (id) {
        document.getElementById(id).value = '';
      });
      document.getElementById('q-type').value = '';
      readQ();
      uiToast('已重置查询条件');
    });
    document.getElementById('orderBody').addEventListener('click', function (ev) {
      var el = ev.target.closest('[data-open]');
      if (el) { open(el.getAttribute('data-open')); }
    });
    document.getElementById('pager').addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-page]');
      if (!b || b.disabled) { return; }
      page = parseInt(b.getAttribute('data-page'), 10);
      renderTable();
      window.scrollTo(0, 0);
    });
    document.getElementById('btnBack').addEventListener('click', close);
    document.getElementById('dtTimeline').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b) { return; }
      var p = b.getAttribute('data-act').split(':');
      doAct(parseInt(p[0], 10), parseInt(p[1], 10));
    });
    document.getElementById('btn-export').addEventListener('click', function () {
      uiToast('演示原型：导出功能未接入后端');
    });

    /* 顶栏 / 侧栏 / 页签 */
    document.addEventListener('click', function (ev) {
      var nav = ev.target.closest ? ev.target.closest('.nav-item') : null;
      if (nav) {
        Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (b) {
          b.classList.remove('is-active');
        });
        nav.classList.add('is-active');
        if (nav.getAttribute('data-module') !== 'rent' && nav.getAttribute('data-module') !== 'sale') {
          uiToast('演示原型：' + nav.textContent.trim() + ' 模块未实现');
        }
        return;
      }
      var back = ev.target.closest ? ev.target.closest('.tab-back') : null;
      if (back) { if (window.self === window.top && history.length > 1) { history.back(); } return; }
      var todo = ev.target.closest ? ev.target.closest('[data-todo]') : null;
      if (todo) {
        ev.preventDefault();
        uiToast('演示原型：' + todo.textContent.replace('×', '').trim() + ' 页面未实现');
      }
    });

    var m = /detail=([A-Za-z0-9]+)/.exec(location.hash);
    if (m) { open(m[1]); }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }

  /* 全局业务切换条 */
  var _bz = document.createElement('script');
  _bz.src = 'assets/biz-bar.js';
  document.body.appendChild(_bz);
})();
