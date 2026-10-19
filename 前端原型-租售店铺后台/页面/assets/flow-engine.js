/* ==========================================================================
   flow-engine.js —— 泳道流程图渲染引擎（数据驱动，供三个流程页共用）
   数据格式见 assets/flow-sale.js：window.FLOW = { lanes, cols, bands, rows, nodes, edges, groups }
   节点坐标：y 由 rows[band][row] 给（行=中心线），x 由 cols[lane] + dx 给
   ========================================================================== */
(function () {
  'use strict';

  var F = window.FLOW;
  if (!F) { return; }
  if (!document.getElementById('stage')) { return; }

  var HEAD = 40;
  var TYPE_NAME = { task: '操作节点', decision: '判断节点', terminator: '开始 / 结束', note: '业务说明' };

  /* ---------- 泳道横坐标 ---------- */
  var LANE = {}, W = 0;
  F.lanes.forEach(function (l) {
    LANE[l.key] = { name: l.name, x: W, w: l.w };
    W += l.w;
  });

  /* ---------- 节点尺寸与坐标 ---------- */
  var DEF = {
    task: { w: 176, h: 46 },
    decision: { w: 190, h: 110 },
    terminator: { w: 176, h: 46 },
    note: { w: 250, h: 106 }
  };
  var NODES = F.nodes.map(function (n) {
    var d = DEF[n.type || 'task'];
    var node = {
      id: n.id, b: n.b, lane: n.lane, type: n.type || 'task',
      label: n.label || '', sub: n.sub || '', note: n.note || '',
      w: n.w || d.w, h: n.h || d.h,
      kind: n.kind || '', isNew: !!n.isNew,
      x: n.x !== undefined ? n.x : (F.cols[n.lane] + (n.dx || 0))
    };
    node.y = F.rows[n.b][n.row] - node.h / 2;
    return node;
  });
  var BYID = {};
  NODES.forEach(function (n) { BYID[n.id] = n; });

  /* ---------- 阶段高度 ---------- */
  var BANDS = F.bands.map(function (b) {
    var bottom = HEAD + 60;
    NODES.forEach(function (n) {
      if (n.b === b.key) { bottom = Math.max(bottom, n.y + n.h); }
    });
    return { key: b.key, title: b.title, h: bottom + 46 };
  });
  var BAND_BY_ID = {};
  BANDS.forEach(function (b) { BAND_BY_ID[b.key] = b; });

  /* ---------- 连线路径 ---------- */
  function anchor(n, side, off) {
    off = off || 0;
    if (side === 'top') { return [n.x + n.w / 2 + off, n.y]; }
    if (side === 'bottom') { return [n.x + n.w / 2 + off, n.y + n.h]; }
    if (side === 'left') { return [n.x, n.y + n.h / 2 + off]; }
    return [n.x + n.w, n.y + n.h / 2 + off];
  }
  function autoSides(a, b) {
    var ax = a.x + a.w / 2, ay = a.y + a.h / 2;
    var bx = b.x + b.w / 2, by = b.y + b.h / 2;
    if (Math.abs(ay - by) < 14) { return bx >= ax ? ['right', 'left'] : ['left', 'right']; }
    if (Math.abs(ax - bx) < 14) { return by >= ay ? ['bottom', 'top'] : ['top', 'bottom']; }
    return ['bottom', 'top'];
  }
  function pathOf(e) {
    var a = BYID[e.from], b = BYID[e.to];
    if (!a || !b) { return null; }
    var s = (e.fs && e.ts) ? [e.fs, e.ts] : autoSides(a, b);
    var pts = [anchor(a, s[0], e.fOff)];
    (e.via || []).forEach(function (p) { pts.push(p); });
    pts.push(anchor(b, s[1], e.tOff));
    return pts;
  }
  function dOf(pts) {
    return pts.map(function (p, i) { return (i ? 'L' : 'M') + Math.round(p[0]) + ',' + Math.round(p[1]); }).join(' ');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- 单个阶段条 ---------- */
  function bandSvg(band) {
    var out = [];
    F.lanes.forEach(function (l) {
      var L = LANE[l.key];
      out.push('<rect class="lh-cell" x="' + L.x + '" y="0" width="' + L.w + '" height="' + HEAD + '"/>');
      out.push('<text class="lh-text" x="' + (L.x + L.w / 2) + '" y="' + (HEAD / 2 + 5) + '">' + esc(l.name) + '</text>');
    });
    F.lanes.slice(1).forEach(function (l) {
      out.push('<line class="lane-sep" x1="' + LANE[l.key].x + '" y1="' + HEAD + '" x2="' + LANE[l.key].x + '" y2="' + band.h + '"/>');
    });

    (F.groups || []).filter(function (g) { return g.b === band.key; }).forEach(function (g) {
      out.push('<rect class="grp" x="' + g.x + '" y="' + g.y + '" width="' + g.w + '" height="' + g.h + '" rx="6"/>');
      if (g.label) {
        out.push('<text class="grp-label" x="' + (g.x + 8) + '" y="' + (g.y + 16) + '">' + esc(g.label) + '</text>');
      }
    });

    var draws = [];
    (F.edges || []).forEach(function (e) {
      if (e.b !== band.key) { return; }
      if (e.stub) { draws.push({ e: e, pts: e.stub, stub: true }); return; }
      var pts = pathOf(e);
      if (pts) { draws.push({ e: e, pts: pts }); }
    });

    draws.forEach(function (it) {
      var dash = it.e.dash ? ' arrDash' : (it.e.kind === 'back' ? ' arrBack' : ' arr');
      var cls = 'wire' + (it.e.kind === 'back' ? ' is-back' : '') + (it.e.dash ? ' is-dash' : '');
      out.push('<path class="wire-halo" d="' + dOf(it.pts) + '"/>');
      out.push('<path class="' + cls + '" d="' + dOf(it.pts) + '" marker-end="url(#' + dash.trim() + ')"/>');
    });

    draws.forEach(function (it) {
      var e = it.e;
      if (!e.label) { return; }
      var p1 = it.pts[it.pts.length - 2], p2 = it.pts[it.pts.length - 1];
      var at, ta;
      if (!e.labelAt) {
        if (Math.abs(p1[1] - p2[1]) < 1) { at = [(p1[0] + p2[0]) / 2, p2[1] - 9]; ta = 'middle'; }
        else { at = [Math.max(p1[0], p2[0]) + 10, (p1[1] + p2[1]) / 2 + 4]; ta = 'start'; }
      } else { at = e.labelAt; ta = e.ta || 'middle'; }
      var cls = 'wire-label' + (e.kind === 'back' ? ' is-back' : '') +
                (e.dash ? ' is-dash' : '') + (ta === 'start' ? ' is-start' : '');
      out.push('<text class="' + cls + '" x="' + at[0] + '" y="' + at[1] + '">' + esc(e.label) + '</text>');
    });

    /* 判断菱形 */
    NODES.filter(function (n) { return n.b === band.key && n.type === 'decision'; }).forEach(function (n) {
      var cx = n.x + n.w / 2, cy = n.y + n.h / 2;
      out.push('<polygon class="dia node-svg" data-node="' + n.id + '" points="' +
        cx + ',' + Math.round(n.y) + ' ' + (n.x + n.w) + ',' + cy + ' ' + cx + ',' + Math.round(n.y + n.h) + ' ' + n.x + ',' + cy + '"/>');
      out.push('<text class="dia-text node-svg" data-node="' + n.id + '" x="' + cx + '" y="' + (cy + 4.5) + '">' + esc(n.label) + '</text>');
    });

    return '<svg class="band-svg" width="' + W + '" height="' + band.h + '" viewBox="0 0 ' + W + ' ' + band.h + '">' +
      out.join('') + '</svg>';
  }

  function bandHtml(band) {
    var html = NODES.filter(function (n) {
      return n.b === band.key && n.type !== 'decision';
    }).map(function (n) {
      var cls = ['node', 't-' + n.type];
      if (n.isNew) { cls.push('is-new'); }
      if (n.kind === 'end') { cls.push('t-end'); }
      if (n.kind) { cls.push('k-' + n.kind); }
      var sub = Array.isArray(n.sub) ? n.sub.join('<br>') : n.sub;
      return '<div class="' + cls.join(' ') + '" data-node="' + n.id + '" title="' + esc(n.label) + '"' +
        ' style="left:' + n.x + 'px;top:' + Math.round(n.y) + 'px;width:' + n.w + 'px;height:' + n.h + 'px">' +
        '<span class="n-main">' + esc(n.label) + '</span>' +
        (sub ? '<span class="n-sub">' + sub + '</span>' : '') +
        (n.isNew ? '<i class="n-flag">新增</i>' : '') +
        '</div>';
    }).join('');

    return '<div class="band" data-band="' + band.key + '" data-h="' + band.h + '">' +
      '<div class="band-scale">' + bandSvg(band) +
        '<div class="band-chip" style="left:10px;top:9px">' + esc(band.title) + '</div>' +
        html +
      '</div></div>';
  }

  /* ============================== 交互 ============================== */
  var stage = document.getElementById('stage');
  var inner = document.getElementById('stageInner');
  var zoomVal = document.getElementById('zoomVal');
  var detail = document.getElementById('nodeDetail');
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
      el.hidden = !(p === 'all' || el.getAttribute('data-band') === p);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#phaseFilter .filter'), function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-phase') === p);
    });
    stage.scrollTop = 0;
    stage.scrollLeft = 0;
  }

  function showDetail(id) {
    var n = BYID[id];
    if (!n) { return; }
    var ups = [], downs = [];
    (F.edges || []).forEach(function (e) {
      if (e.to === id && BYID[e.from]) { ups.push(BYID[e.from].label); }
      if (e.from === id && BYID[e.to]) { downs.push(BYID[e.to].label); }
    });
    function tags(list) {
      var uniq = list.filter(function (v, i) { return list.indexOf(v) === i; });
      return uniq.length ? uniq.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') : '—';
    }
    detail.querySelector('.nd-lane').className = 'nd-lane lane-' + (n.lane || 'a');
    detail.querySelector('.nd-lane').textContent = LANE[n.lane].name + (n.isNew ? ' · 新增环节' : '');
    detail.querySelector('.nd-head h4').textContent = n.label;
    detail.querySelector('.nd-note').textContent = n.note || (Array.isArray(n.sub) ? n.sub.join(' / ') : n.sub) || '—';
    detail.querySelector('[data-meta="type"]').textContent = TYPE_NAME[n.type] || n.type;
    detail.querySelector('[data-meta="lane"]').textContent = LANE[n.lane].name;
    detail.querySelector('[data-meta="up"]').innerHTML = tags(ups);
    detail.querySelector('[data-meta="down"]').innerHTML = tags(downs);
    detail.hidden = false;
    Array.prototype.forEach.call(document.querySelectorAll('.node'), function (el) {
      el.classList.toggle('is-sel', el.getAttribute('data-node') === id);
    });
  }

  function runQuery() {
    var kw = document.getElementById('q-name').value.trim();
    var lane = document.getElementById('q-lane').value;
    var type = document.getElementById('q-type').value;
    var active = !!(kw || lane || type);
    var hits = {};
    NODES.forEach(function (n) {
      var ok = true;
      if (kw && (n.label + (n.note || '') + (Array.isArray(n.sub) ? n.sub.join('') : (n.sub || ''))).indexOf(kw) < 0) { ok = false; }
      if (lane && n.lane !== lane) { ok = false; }
      if (type === 'new' && !n.isNew) { ok = false; }
      if (type && type !== 'new' && n.type !== type) { ok = false; }
      hits[n.id] = active && ok;
      Array.prototype.forEach.call(nodeEl(n.id), function (el) {
        el.classList.toggle('is-hit', active && ok);
        el.classList.toggle('is-dim', active && !ok);
      });
    });
    if (!active) { window.uiToast('已重置检索条件'); return; }
    var hit = NODES.filter(function (n) { return hits[n.id]; });
    if (!hit.length) { window.uiToast('没有匹配的流程节点'); return; }
    window.uiToast('命中 ' + hit.length + ' 个节点');
    var first = hit.filter(function (n) { return n.b === state.phase; })[0] || hit[0];
    if (state.phase !== 'all' && first.b !== state.phase) { applyPhase(first.b); }
    var el = nodeEl(first.id)[0];
    if (el && el.scrollIntoView) { el.scrollIntoView({ block: 'center', inline: 'center' }); }
  }

  function fitWidth() { applyZoom((stage.clientWidth - 40) / W); }

  /* ============================== 启动 ============================== */
  function init() {
    /* 阶段筛选按钮 */
    var btns = ['<button type="button" class="filter is-active" data-phase="all">全部</button>'];
    BANDS.forEach(function (b) {
      btns.push('<button type="button" class="filter" data-phase="' + b.key + '">' + esc(b.title) + '</button>');
    });
    document.getElementById('phaseFilter').innerHTML = btns.join('');

    /* 办理方下拉 */
    var sel = document.getElementById('q-lane');
    F.lanes.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l.key;
      o.textContent = l.name;
      sel.appendChild(o);
    });

    inner.innerHTML = BANDS.map(bandHtml).join('');
    applyZoom(1);
    applyPhase('all');
    if (stage.clientWidth < W + 40) { fitWidth(); }

    inner.addEventListener('click', function (ev) {
      var el = ev.target.closest ? ev.target.closest('[data-node]') : null;
      if (el) { showDetail(el.getAttribute('data-node')); }
    });
    document.querySelector('.nd-close').addEventListener('click', function () {
      detail.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.node'), function (el) {
        el.classList.remove('is-sel');
      });
    });
    document.getElementById('phaseFilter').addEventListener('click', function (ev) {
      var b = ev.target.closest('.filter');
      if (b) { applyPhase(b.getAttribute('data-phase')); }
    });
    document.querySelector('.zoom-group').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-zoom]');
      if (!b) { return; }
      var z = b.getAttribute('data-zoom');
      if (z === 'in') { applyZoom(state.zoom + 0.1); }
      else if (z === 'out') { applyZoom(state.zoom - 0.1); }
      else if (z === 'fit') { fitWidth(); }
      else { applyZoom(1); }
    });
    document.getElementById('btn-query').addEventListener('click', runQuery);
    document.getElementById('btn-reset').addEventListener('click', function () {
      document.getElementById('q-name').value = '';
      document.getElementById('q-lane').value = '';
      document.getElementById('q-type').value = '';
      runQuery();
    });
    document.getElementById('q-name').addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { runQuery(); }
    });
    document.getElementById('btn-export').addEventListener('click', function () {
      window.uiToast('演示原型：导出功能未接入后端');
    });
    document.getElementById('btn-print').addEventListener('click', function () { window.print(); });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
