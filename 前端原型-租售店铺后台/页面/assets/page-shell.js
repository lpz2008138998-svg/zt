/* ==========================================================================
   page-shell.js —— 流程页公共外壳（顶栏 / 侧栏 / 页签 / 检索卡片 / 画布容器）
   页面只需：<body data-flow="sale" data-title="商品销售业务流程">
   ========================================================================== */
(function () {
  'use strict';

  var body = document.body;
  var cur = body.getAttribute('data-flow') || '';
  var title = body.getAttribute('data-title') || '业务流程';

  var MENU = [
    { key: 'rent', name: '租赁业务流程', href: 'flow.html' },
    { key: 'sale', name: '商品销售流程', href: 'flow-sale.html' },
    { key: 'esale', name: '委托出售流程', href: 'flow-entrust-sale.html' },
    { key: 'erent', name: '委托出租流程', href: 'flow-entrust-rent.html' }
  ];

  var ICONS = {
    search: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></g>',
    tag: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 3H4v7l10 10 7-7L11 3Z"/><circle cx="7.5" cy="6.5" r="1.3"/></g>',
    rent: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M4 8.5 12 13l8-4.5M12 13v7"/></g>',
    info: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v6M12 7.6v.6"/></g>',
    shop: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v9h16v-9"/><path d="M3.5 10 5 4.5h14L20.5 10"/><path d="M3.5 10a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/><path d="M10 19v-5h4v5"/></g>',
    fee: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M9 9l3 3.2L15 9M12 12.2V17M9.5 13.6h5M9.5 15.6h5"/></g>',
    gear: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></g>',
    caret: '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    left: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    export: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="M8 10.5l4 4 4-4"/><path d="M5 18.5h14"/></g>',
    print: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="1.5"/><path d="M7 14h10v6H7z"/></g>'
  };

  function svg(name, cls) {
    return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  var NAVS = [
    { k: 'sale', n: '销售业务', i: 'tag' },
    { k: 'rent', n: '租赁业务', i: 'rent' },
    { k: 'info', n: '信息中心', i: 'info' },
    { k: 'shop', n: '店铺管理', i: 'shop' },
    { k: 'fee', n: '佣金管理', i: 'fee' },
    { k: 'sys', n: '系统管理', i: 'gear' }
  ];

  var tabs = MENU.map(function (m) {
    return '<a class="tab' + (m.key === cur ? ' is-active' : '') + '" href="' + m.href + '">' +
      m.name + '<i class="x">×</i></a>';
  }).join('');

  var flowLinks = MENU.map(function (m) {
    return '<a class="side-item' + (m.key === cur ? ' is-active' : '') + '" href="' + m.href + '">' +
      m.name + '</a>';
  }).join('');

  var html =
'<div class="console">' +
  '<header class="topbar">' +
    '<div class="brand-col">' +
      '<div class="brand"><span class="brand-mark">TEST</span><span class="brand-name">租售店铺</span></div>' +
      '<label class="menu-search">' + svg('search') +
        '<input type="text" placeholder="菜单查询" aria-label="菜单查询"/></label>' +
    '</div>' +
    '<nav class="topnav" id="topnav" aria-label="业务模块">' +
      NAVS.map(function (x) {
        return '<button type="button" class="nav-item' + (x.k === 'rent' ? ' is-active' : '') + '" data-module="' + x.k + '">' +
          '<span class="nav-tile">' + svg(x.i) + '</span>' + x.n + '</button>';
      }).join('') +
    '</nav>' +
  '</header>' +
  '<div class="body">' +
    '<aside class="sidebar">' +
      '<div class="side-parent"><span>出租订单</span>' + svg('caret') + '</div>' +
      '<nav class="side-list">' +
        '<a class="side-item" href="index.html">订单管理</a>' +
        '<a class="side-item" href="#" data-todo>发货单管理</a>' +
        '<a class="side-item" href="#" data-todo>收货单管理</a>' +
        '<a class="side-item" href="#" data-todo>退货/租单管理</a>' +
        '<a class="side-item" href="#" data-todo>订单信息查询</a>' +
      '</nav>' +
      '<div class="side-parent"><span>业务流程</span>' + svg('caret') + '</div>' +
      '<nav class="side-list">' + flowLinks + '</nav>' +
    '</aside>' +
    '<main class="main">' +
      '<div class="tabbar">' +
        '<span class="tab-back" title="返回">' + svg('left') + '</span>' +
        '<a class="tab" href="#" data-todo>首页</a>' +
        '<a class="tab" href="index.html">订单管理<i class="x">×</i></a>' +
        tabs +
      '</div>' +
      '<div class="content">' +
        '<div class="filters" id="phaseFilter"></div>' +
        '<section class="card search-card"><div class="form-row">' +
          '<label class="field"><span class="lb">节点名称</span>' +
            '<input type="text" id="q-name" placeholder="请输入节点名称，如：押金"/></label>' +
          '<label class="field"><span class="lb">办理方</span>' +
            '<select id="q-lane"><option value="">全部</option></select></label>' +
          '<label class="field"><span class="lb">节点类型</span>' +
            '<select id="q-type">' +
              '<option value="">全部</option>' +
              '<option value="task">操作节点</option>' +
              '<option value="decision">判断节点</option>' +
              '<option value="terminator">开始 / 结束</option>' +
              '<option value="new">新增节点</option>' +
            '</select></label>' +
          '<div class="field field-actions">' +
            '<button type="button" class="btn btn-cyan" id="btn-query">查 询</button>' +
            '<button type="button" class="btn btn-ghost" id="btn-reset">重 置</button>' +
          '</div>' +
        '</div></section>' +
        '<section class="card flow-card">' +
          '<div class="card-toolbar">' +
            '<h2 class="card-title" id="flowTitle">' + title + '</h2>' +
            '<div class="tool-group">' +
              '<button type="button" class="btn btn-cyan" id="btn-export">' + svg('export') + '导出</button>' +
              '<button type="button" class="btn btn-ghost" id="btn-print">' + svg('print') + '打印</button>' +
            '</div>' +
            '<div class="zoom-group">' +
              '<button type="button" class="btn btn-ghost btn-sm" data-zoom="out">－</button>' +
              '<span class="zoom-val" id="zoomVal">100%</span>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-zoom="in">＋</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-zoom="fit">适应宽度</button>' +
              '<button type="button" class="btn btn-ghost btn-sm" data-zoom="reset">100%</button>' +
            '</div>' +
            '<div class="legend">' +
              '<span><i></i>操作节点</span>' +
              '<span><i class="lg-dec"></i>判断节点</span>' +
              '<span><i class="lg-new"></i>新增节点</span>' +
              '<span><i class="lg-term"></i>开始 / 结束</span>' +
              '<span><i class="lg-back"></i>驳回 / 回退</span>' +
              '<span><i class="lg-dash"></i>垫资 / 回款（虚线）</span>' +
            '</div>' +
          '</div>' +
          '<div class="stage" id="stage"><div id="stageInner"></div></div>' +
          '<aside class="node-detail" id="nodeDetail" hidden>' +
            '<div class="nd-head">' +
              '<span class="nd-lane lane-a">—</span>' +
              '<h4>节点名称</h4>' +
              '<button type="button" class="nd-close" aria-label="关闭">×</button>' +
            '</div>' +
            '<div class="nd-body">' +
              '<p class="nd-note"></p>' +
              '<dl class="nd-meta">' +
                '<div><dt>节点类型</dt><dd data-meta="type">—</dd></div>' +
                '<div><dt>办理方</dt><dd data-meta="lane">—</dd></div>' +
                '<div><dt>上游节点</dt><dd data-meta="up">—</dd></div>' +
                '<div><dt>下游节点</dt><dd data-meta="down">—</dd></div>' +
              '</dl>' +
            '</div>' +
          '</aside>' +
        '</section>' +
      '</div>' +
    '</main>' +
  '</div>' +
'</div>' +
'<div class="toast" id="toast" role="status" aria-live="polite"></div>';

  body.insertAdjacentHTML('afterbegin', html);

  /* ---------- 外链图标 defs（供 marker 使用） ---------- */
  body.insertAdjacentHTML('beforeend',
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<marker id="arr" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.6 L10,5 L0,9.4 z" fill="#8B98B8"/></marker>' +
    '<marker id="arrBack" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.6 L10,5 L0,9.4 z" fill="#E0922A"/></marker>' +
    '<marker id="arrDash" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0.6 L10,5 L0,9.4 z" fill="#4C8DE0"/></marker>' +
    '</defs></svg>');

  /* ---------- 轻提示 + 导航行为 ---------- */
  var toastEl = document.getElementById('toast');
  window.uiToast = function (msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(window.uiToast._t);
    window.uiToast._t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1800);
  };

  document.addEventListener('click', function (ev) {
    var nav = ev.target.closest ? ev.target.closest('.nav-item') : null;
    if (nav) {
      Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (b) {
        b.classList.remove('is-active');
      });
      nav.classList.add('is-active');
      if (nav.getAttribute('data-module') !== 'rent') {
        window.uiToast('演示原型：' + nav.textContent.trim() + ' 模块未实现');
      }
      return;
    }
    var back = ev.target.closest ? ev.target.closest('.tab-back') : null;
    if (back) { if (window.self === window.top && history.length > 1) history.back(); return; }
    var todo = ev.target.closest ? ev.target.closest('[data-todo]') : null;
    if (todo) {
      ev.preventDefault();
      window.uiToast('演示原型：' + todo.textContent.replace('×', '').trim() + ' 页面未实现');
    }
  });

  /* 全局业务切换条 */
  var bz = document.createElement('script');
  bz.src = 'assets/biz-bar.js';
  document.body.appendChild(bz);
})();
