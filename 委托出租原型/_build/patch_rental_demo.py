# -*- coding: utf-8 -*-
"""把「委托出租功能_Demo.html」的 6 个菜单项接到委托出租原型的页面上。

做法：菜单点击后，在 Demo 右侧内容区用 iframe 打开对应原型页面。
原文件自动备份为 *.bak。纯前端改动，不依赖任何服务。

用法:
    python patch_rental_demo.py            # 应用
    python patch_rental_demo.py --revert   # 还原
"""
import io, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))      # ...\委托出租原型\_build
PROTO = os.path.dirname(HERE)                          # ...\委托出租原型
ROOT = os.path.dirname(PROTO)                          # 项目根目录
DEMO = os.path.join(ROOT, "委托出租功能_Demo.html")
BAK = DEMO + ".bak"

# ---------------------------------------------------------------- 追加样式
CSS_ADD = """
  /* ===== 新增：嵌入式原型容器 + 快捷入口 ===== */
  .topbar .jump{
    margin-left:16px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.4);
    color:#fff;text-decoration:none;padding:4px 12px;border-radius:13px;font-size:12px;
  }
  .topbar .jump:hover{background:rgba(255,255,255,.28);}
  .main{overflow:hidden;position:relative;}
  .embed-wrap{position:absolute;inset:0;display:flex;flex-direction:column;}
  .embed-bar{
    flex:0 0 auto;display:flex;align-items:center;gap:10px;
    padding:7px 14px;background:#fff;border-bottom:1px solid var(--border);
    font-size:12px;color:var(--text-2);
  }
  .embed-bar .path{color:var(--brand);font-weight:600;}
  .embed-bar .spacer{flex:1;}
  .embed-bar a{
    color:var(--brand);text-decoration:none;border:1px solid #BFDDF5;background:#F5F9FF;
    padding:3px 10px;border-radius:12px;
  }
  .embed-bar a:hover{background:#E8F1FE;}
  .embed-wrap iframe{flex:1;width:100%;border:0;background:#fff;display:block;}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:12px;}
  .entry{
    display:block;border:1px solid var(--border);border-radius:4px;padding:11px 13px;
    text-decoration:none;color:var(--text);background:#fff;
  }
  .entry:hover{border-color:var(--brand);background:var(--brand-light);}
  .entry .t{color:var(--brand);font-weight:600;font-size:13px;margin-bottom:3px;}
  .entry .d{font-size:12px;color:var(--text-2);line-height:1.5;}
</style>"""

# ---------------------------------------------------------------- 顶栏按钮
TOPBAR_OLD = '<div class="user">当前用户：<b>张工</b></div>\n</div>'
TOPBAR_NEW = ('<div class="user">当前用户：<b>演示用户</b></div>\n'
              '  <a class="jump" href="委托出租原型/index.html" target="_blank" rel="noopener">打开完整原型 ↗</a>\n'
              '</div>')

# ---------------------------------------------------------------- 新脚本
JS_NEW = """<script>
const $ = s => document.querySelector(s);

/* =====================================================================
   菜单 → 委托出租原型页面 映射
   url = 要嵌入的原型页面；点击菜单在右侧 iframe 打开。
   ===================================================================== */
const NAV = [
  {group:'委托出租', items:[
    {key:'manage',  label:'出租委托管理', url:'委托出租原型/index.html', note:'原型总览'},
    {key:'publish', label:'发布出租房源', url:'委托出租原型/a01.html',   note:'委托方 · 新增出租商品'},
    {key:'query',   label:'出租委托查询', url:'委托出租原型/a02.html',   note:'委托方 · 委托商品管理'}
  ]},
  {group:'运营管理', items:[
    {key:'audit',     label:'委托审核', url:'委托出租原型/s02.html',     note:'服务方 · 订单审核'},
    {key:'negotiate', label:'议价审核', url:'委托出租原型/s03.html',     note:'服务方 · 接单（含议价出口）'}
  ]},
  {group:'商城前台', items:[
    {key:'mall', label:'出租专区', url:'委托出租原型/b01.html',          note:'承租方 · 委托商品列表'}
  ]}
];

/* 保留原 Demo 的 5 环节骨架，用于首屏说明 */
const STEPS = [
  {t:'提交出租委托', d:'填写店铺信息、期望租金、可租周期等'},
  {t:'平台审核',     d:'核对产权资料与店铺情况'},
  {t:'挂牌展示',     d:'进入出租专区对外展示'},
  {t:'意向洽谈',     d:'承租方咨询、在线议价'},
  {t:'签约成交',     d:'生成租赁合同并归档'}
];

/* 快捷入口 */
const ENTRIES = [
  ['原型的全流程（推荐）','委托出租原型/index.html','37 个页面：承租方 → 服务方 → 委托方'],
  ['页面级需求说明',      '委托出租原型/spec.html', '每页字段、关键规则、出口跳转'],
  ['承租方侧 15 页',      '委托出租原型/b01.html',  '下单 → 审核 → 押金 → 签收 → 对账 → 归还 → 押金退还 → 开票'],
  ['服务方侧 11 页',      '委托出租原型/s01.html',  '接单工作台 → 审核 → 接单 → 发货 → 对账 → 委托结算 → 开票'],
  ['委托方侧 11 页',      '委托出租原型/a01.html',  '新增出租商品 → 自动委托 → 上架 → 发货 → 结算 → 开票'],
  ['门户页入口',          '租售店铺（lxj0530）.html','「出租业务」页签右侧已新增「委托出租」']
];

let currentView = 'manage';

function renderSidebar(){
  $('#sidebar').innerHTML = NAV.map(g => `
    <div class="nav-group">
      <div class="nav-group-title">${g.group}</div>
      ${g.items.map(it => `
        <div class="nav-item ${currentView===it.key?'active':''}" onclick="switchView('${it.key}')">
          <span class="dot"></span>${it.label}
        </div>`).join('')}
    </div>`).join('');
}

function stepsHtml(){
  return `<div class="steps">${STEPS.map((s,i) => `
    <div class="step">
      <div class="idx">${i+1}</div>
      <div class="t">${s.t}</div>
      <div class="d">${s.d}</div>
    </div>`).join('')}</div>`;
}

/* ---------- 首屏 ---------- */
function viewManage(){
  return `
    <div class="page-head">
      <h2>出租委托管理</h2>
      <span class="sub">委托出租 · 全流程</span>
      <div class="spacer"></div>
      <button class="btn primary" onclick="switchView('publish')">+ 新建出租委托</button>
    </div>
    <div class="notice">
      <b>本 Demo 已接入「委托出租原型」。</b>点击左侧菜单，即可在右侧打开对应的业务页面。
      请注意：本页的 5 环节是<b>店铺出租</b>的简化骨架，而「委托出租原型」实现的是
      <b>委托出租全流程</b>（提交订单 → 审核 → 押金付款 → 接单 → 发货 → 签收 → 对账付款 →
      商品归还 → 押金退还 → 开票 → 结束订单），两者口径不同，按需取用。
    </div>
    <div class="card">
      <h3>快捷入口</h3>
      <p>直接进入原型的关键页面（新标签页打开）：</p>
      <div class="grid">
        ${ENTRIES.map(e => `
          <a class="entry" href="${e[1]}" target="_blank" rel="noopener">
            <div class="t">${e[0]} ↗</div>
            <div class="d">${e[2]}</div>
          </a>`).join('')}
      </div>
    </div>
    <div class="card">
      <h3>业务流程（本 Demo 骨架，仅作参考）</h3>
      <p>店铺出租从提交到成交，共 5 个环节：</p>
      ${stepsHtml()}
    </div>`;
}

/* ---------- 嵌入式原型页 ---------- */
function viewEmbed(item){
  return `
    <div class="embed-wrap">
      <div class="embed-bar">
        <span class="path">${item.label}</span>
        <span>· ${item.note}</span>
        <span class="spacer"></span>
        <a href="${item.url}" target="_blank" rel="noopener">新标签页打开 ↗</a>
      </div>
      <iframe src="${item.url}" title="${item.label}" loading="lazy"></iframe>
    </div>`;
}

function switchView(key){
  currentView = key;
  renderSidebar();
  const item = NAV.reduce((a,g)=>a.concat(g.items),[]).find(i => i.key === key);
  $('#main').innerHTML = (item && item.url) ? viewEmbed(item) : viewManage();
  $('#main').scrollTop = 0;
}

/* 支持 URL hash 直接定位，如 委托出租功能_Demo.html#audit */
(function init(){
  const h = (location.hash || '').replace('#','');
  const hit = NAV.reduce((a,g)=>a.concat(g.items),[]).some(i => i.key === h);
  switchView(hit ? h : 'manage');
})();
</script>
</body>
</html>
"""


def apply():
    if not os.path.exists(BAK):
        shutil.copyfile(DEMO, BAK)
        print("已备份 ->", os.path.basename(BAK))
    src = io.open(DEMO, encoding="utf-8").read()

    # 1) 追加样式（在最后一个 </style> 前插入）
    if ".embed-wrap" in src:
        print("样式已存在，跳过。")
    else:
        idx = src.rindex("</style>")
        src = src[:idx] + CSS_ADD + src[idx + len("</style>"):]
        print("已追加嵌入式样式")

    # 2) 顶栏加跳转按钮
    if 'class="jump"' in src:
        print("顶栏按钮已存在，跳过。")
    elif TOPBAR_OLD in src:
        src = src.replace(TOPBAR_OLD, TOPBAR_NEW, 1)
        print("已加入「打开完整原型」按钮")
    else:
        print("!! 未找到顶栏锚点，跳过按钮")

    # 3) 替换整段脚本
    a = src.find("<script>")
    b = src.rfind("</body>")
    if a < 0 or b < 0 or b < a:
        print("!! 找不到脚本区间，未改动。")
        return
    src = src[:a] + JS_NEW + src[b + len("</body>"):]
    print("已替换脚本（菜单映射 + iframe 加载）")

    io.open(DEMO, "w", encoding="utf-8", newline="\n").write(src)
    print("写入完成：", DEMO)


def revert():
    if os.path.exists(BAK):
        shutil.copyfile(BAK, DEMO)
        os.remove(BAK)
        print("已还原原文件，并删除备份。")
    else:
        print("没有找到 .bak，无法还原。")


if __name__ == "__main__":
    if "--revert" in sys.argv:
        revert()
    else:
        apply()
