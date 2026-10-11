# -*- coding: utf-8 -*-
"""
委托出租原型生成器
读取 _build/nav.json + app.css，生成 45 个页面到上级目录（委托出租原型/）。

用法：
    python gen.py            # 生成全部
    python gen.py b01 s03    # 只生成指定页面

设计系统与「租售店铺询价原型10.5」原有页面保持一致（令牌见 app.css 注释）。
"""
import os, sys, json, html, re

SEC_SEP = "<!--SEC-->"

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
NAV = json.load(open(os.path.join(HERE, "nav.json"), encoding="utf-8"))

# ---------------------------------------------------------------- 导航 / 外壳
def flat_pages():
    out = []
    for g in NAV["groups"]:
        for p in g["pages"]:
            out.append((g, p))
    return out

ALL = flat_pages()
BY_ID = {p["id"]: (g, p) for g, p in ALL}

def sidebar(active):
    parts = ['<nav class="sidebar">']
    parts.append('<div class="grp"><a class="item%s" href="index.html">'
                 '<span>原型总览</span></a>'
                 '<a class="item%s" href="spec.html"><span>页面级需求 / 交互说明</span></a>'
                 '</div>'
                 % (' on' if active == 'index' else '', ' on' if active == 'spec' else ''))
    for g in NAV["groups"]:
        parts.append('<div class="grp"><div class="hd">%s</div><div class="items">' % g["name"])
        for p in g["pages"]:
            on = ' on' if p["id"] == active else ''
            parts.append('<a class="item%s" href="%s.html"><span>%s</span>'
                         '<span class="role">%s</span></a>'
                         % (on, p["id"], p["title"], g["role"]))
        parts.append('</div></div>')
    parts.append('</nav>')
    return "\n".join(parts)

def topbar(sub_extra=""):
    return f'''<header class="app-top">
  <div class="logo">
    <div class="mark">LOGO</div>
    <div class="t">循环物资<small>租售店铺 · 委托出租</small></div>
  </div>
  <div class="sys">
    <span>销售系统</span>
    <span class="on">出租系统</span>
    <span>信息中心</span>
    <span>店铺管理</span>
    <span>佣金管理</span>
  </div>
  <div class="spacer"></div>
  <div class="user"><span>{NAV["org"]}</span><span class="avatar">{NAV["user"][0]}</span><span>{NAV["user"]}</span></div>
</header>'''

def crumb(parts):
    s = '<span>委托出租</span>'
    for p in parts:
        s += '<span class="sep">/</span><b>%s</b>' % p
    return '<div class="crumb">%s</div>' % s

def shell(pid, title, body, crumbs=None, extra_head=""):
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · 委托出租原型</title>
<link rel="stylesheet" href="app.css">
{extra_head}</head>
<body>
{topbar()}
<div class="app-body">
{sidebar(pid)}
<main class="main">
{crumb(crumbs or [title])}
{body}
</main>
</div>
</body>
</html>
'''

# ---------------------------------------------------------------- 组件
def card(title, inner=None, sub="", right=""):
    """card(标题, 内容, 副标题, 右侧)；也支持 card(小节标题 + 内容) 的简写形式。"""
    if inner is None:
        head, sep, rest = title.partition(SEC_SEP)
        if sep:
            inner = rest
            title = re.sub(r"<[^>]+>", "", head)
        else:
            inner = ""
    hd = ''
    if title:
        hd = '<div class="card-hd">%s' % title
        if sub:
            hd += '<span class="sub">%s</span>' % sub
        if right:
            hd += '<span class="right">%s</span>' % right
        hd += '</div>'
    return '<section class="card">%s%s</section>' % (hd, inner)

def steps(items, current):
    """items: [名称...]，current: 0基索引"""
    out = ['<div class="steps">']
    for i, it in enumerate(items):
        cls = 'done' if i < current else ('now' if i == current else '')
        out.append('<span class="st %s"><span class="n">%d</span>%s</span>' % (cls, i + 1, it))
        if i < len(items) - 1:
            out.append('<span class="arrow">→</span>')
    out.append('</div>')
    return "".join(out)

def party(kind, text):
    return '<div class="party-bar %s">%s</div>' % (kind, text)

def note(text, kind=""):
    return '<div class="note %s">%s</div>' % (kind, text)

def tbl(headers, rows, widths=None, align=None, cls=""):
    """headers: [str]，rows: [[cell...]]，cell 可为 str 或 ('html', s)"""
    th = []
    for i, h in enumerate(headers):
        c = ''
        if align and align[i]:
            c = ' class="%s"' % align[i]
        th.append('<th%s>%s</th>' % (c, h))
    body = []
    for r in rows:
        tds = []
        for i, cell in enumerate(r):
            c = ''
            if align and align[i]:
                c = ' class="%s"' % align[i]
            tds.append('<td%s>%s</td>' % (c, cell))
        body.append('<tr>%s</tr>' % "".join(tds))
    return ('<div class="tbl-wrap"><table class="tbl %s"><thead><tr>%s</tr></thead>'
            '<tbody>%s</tbody></table></div>' % (cls, "".join(th), "".join(body)))

def kv(pairs, grid="g3"):
    out = ['<div class="grid %s">' % grid]
    for k, v in pairs:
        cls = ""
        if isinstance(v, tuple):
            v, cls = v
        out.append('<div class="kv"><span class="k">%s</span><span class="v %s">%s</span></div>' % (k, cls, v))
    out.append('</div>')
    return "".join(out)

def frow(label, ctl, req=False, hint=""):
    r = '<span class="req">*</span>' if req else ''
    h = '<span class="hint">%s</span>' % hint if hint else ''
    return ('<div class="form-row"><label>%s%s</label><div class="ctl">%s%s</div></div>'
            % (r, label, ctl, h))

def btn(text, kind="", href="", js=""):
    cls = "btn %s" % kind
    if href:
        return '<a class="%s" href="%s">%s</a>' % (cls, href, text)
    if js:
        return '<a class="%s" href="javascript:;" onclick="%s">%s</a>' % (cls, js, text)
    return '<button class="%s">%s</button>' % (cls, text)

def btnrow(buttons, align="right"):
    return '<div class="btn-row %s pad">%s</div>' % (align, "".join(buttons))

def inputs(*items):
    return "".join(items)

def sel(options, width="", selected=0, disabled=False):
    opts = "".join('<option%s>%s</option>' % (' selected' if i == selected else '', o)
                   for i, o in enumerate(options))
    return '<select class="%s"%s>%s</select>' % (width, ' disabled' if disabled else '', opts)

def inp(value="", width="", disabled=False, ph=""):
    return '<input type="text" class="%s" value="%s" placeholder="%s"%s>' % (
        width, value, ph, ' disabled' if disabled else '')

def fsec(text, tip=""):
    t = '<span class="tip">%s</span>' % tip if tip else ''
    return '<div class="form-sec">%s%s</div>%s' % (text, t, SEC_SEP)

def tag(text, kind="grey"):
    return '<span class="tag %s">%s</span>' % (kind, text)

def pager(total="共 128 条", pages=5, cur=1):
    out = ['<div class="pager"><span class="total">%s</span>' % total]
    out.append('<span class="pg">‹</span>')
    for i in range(1, pages + 1):
        out.append('<span class="pg%s">%d</span>' % (' on' if i == cur else '', i))
    out.append('<span class="pg">›</span></div>')
    return "".join(out)

def pick_grid(items, on=0):
    out = ['<div class="pick-grid">']
    for i, (t, d) in enumerate(items):
        out.append('<div class="pick%s"><div>%s</div><div class="d">%s</div></div>'
                   % (' on' if i == on else '', t, d))
    out.append('</div>')
    return "".join(out)

# ================================================================ 页面内容
P = {}

# ---------------------------------------------------------------- 承租方
DEPOSIT_ROWS = [
    ["1", "钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "吨", "12", "180", "30", "64,800.00", "3,000.00", "39,000.00"],
    ["2", "钢便桥贝雷片 · 321型", "片", "8", "95", "30", "22,800.00", "1,200.00", "12,400.00"],
    ["3", "盘扣式脚手架 · 48系", "套", "20", "60", "30", "12,000.00", "800.00", "17,600.00"],
]

def rent_order_tbl(ops, state="待审核"):
    rows = []
    for i, o in enumerate(ops):
        rows.append([
            '<a href="b06.html">%s</a>' % o[0], o[1], o[2], o[3],
            tag(o[4], o[5]), o[6],
            '<span class="ops">%s</span>' % o[7],
        ])
    return tbl(["出租订单号", "商品名称", "承租方", "出租方", "订单状态", "创建时间", "操作"],
               rows)

# b01 委托商品列表（承租方视角）
P["b01"] = dict(
    title="委托商品列表（承租方视角）",
    crumbs=["承租方侧（租客）", "委托商品列表"],
    body=lambda: (
        card("", '<div class="filters">'
             '<div class="f"><label>商品名称</label>%s</div>'
             '<div class="f"><label>出租方</label>%s</div>'
             '<div class="f"><label>所属店铺</label>%s</div>'
             '<div class="f"><label>出租单价</label>%s<span style="color:#7E8693">—</span>%s</div>'
             '<div class="acts">%s%s</div></div>'
             % (inp("", "w-md", ph="请输入商品名称"),
                sel([v for v in ["全部", "华南公司", "中铁建华东公司", "中铁建西南公司"]]),
                sel(["全部", "东南组店铺", "西部组店铺", "北部组店铺", "系统外组店铺", "华南公司店铺"]),
                inp("", "w-sm", ph="最低"), inp("", "w-sm", ph="最高"),
                btn("重置", ""), btn("查询", "primary")), "tight") +
        card("可承租的委托商品", "共 36 件 · 均由委托方委托服务方上架",
             tbl(["商品名称", "规格", "出租方（委托方）", "所属店铺", "可租数量", "出租单价（含税）",
                  "押金单价", "起租期", "操作"],
                 [['<a href="b02.html">钢板桩租赁 · SP-Ⅳ 拉森钢板桩</a>', "SP-Ⅳ 12m", "中铁建华东公司",
                   "华南公司店铺", "240 吨", "180.00 元/吨/天", "3,000.00 元/吨", "30 天",
                   '<span class="ops"><a href="b02.html">查看</a><a href="b03.html">立即承租</a></span>'],
                  ['<a href="b02.html">钢便桥贝雷片 · 321型</a>', "321型 3m", "中铁建华东公司",
                   "东南组店铺", "860 片", "95.00 元/片/天", "1,200.00 元/片", "15 天",
                   '<span class="ops"><a href="b02.html">查看</a><a href="b03.html">立即承租</a></span>'],
                  ['<a href="b02.html">盘扣式脚手架 · 48系</a>', "48×3.0", "中铁建西南公司",
                   "西部组店铺", "1,200 套", "60.00 元/套/天", "800.00 元/套", "30 天",
                   '<span class="ops"><a href="b02.html">查看</a><a href="b03.html">立即承租</a></span>'],
                  ['<a href="b02.html">液压振动锤 · DZ90</a>', "DZ90", "中铁建华南公司",
                   "华南公司店铺", "6 台", "1,500.00 元/台/天", "20,000.00 元/台", "7 天",
                   '<span class="ops"><a href="b02.html">查看</a><a href="b03.html">立即承租</a></span>']],
                 align=["", "", "", "", "ctr", "num", "num", "ctr", ""]) +
             pager("共 36 条"))))

# b02 出租商品详情
P["b02"] = dict(
    title="出租商品详情",
    crumbs=["承租方侧（租客）", "委托商品列表", "出租商品详情"],
    body=lambda: (
        card("商品信息", kv([
            ("商品名称", ("钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "strong")),
            ("规格型号", "SP-Ⅳ 12m"),
            ("出租方（委托方）", "中铁建华东公司"),
            ("服务方 / 所属店铺", "华南公司 · 华南公司店铺"),
            ("内部/外部委托", tag("内部委托资源", "blue")),
            ("出租单价（含税）", ("180.00 元/吨/天", "money")),
            ("出租单价（不含税）", "159.29 元/吨/天"),
            ("押金单价", ("3,000.00 元/吨", "money")),
            ("押金收取方式", "按承租数量收取"),
            ("可租数量", "240 吨"),
            ("起租期", "30 天"),
            ("税率", "13%"),
        ]) + note("该商品由 <b>中铁建华东公司</b> 委托 <b>华南公司</b> 上架出租；"
                  "承租方下单后，服务方接单并新增发货单，<b>实际发货由出租方（委托方）按发货单详情进行</b>。", "blue")) +
        card("押金与费用试算", '<div class="form-row"><label>承租数量</label><div class="ctl">'
             + inp("12", "w-sm") + '<span class="hint">吨</span>'
             + '<label style="color:#7E8693;font-size:13px;padding-top:7px">承租天数</label>'
             + inp("30", "w-sm") + '<span class="hint">天</span>'
             + '<span class="hint">（租期以实际签收日到归还日计算）</span></div></div>'
             + kv([("商品押金", ("3,000.00 × 12 = 36,000.00 元", "money")),
                   ("租金预估", ("180.00 × 12 × 30 = 64,800.00 元", "money")),
                   ("押金合计", ("36,000.00 元", "money")),
                   ("服务费", "由平台按费率向指定收费对象收取")], "g4")) +
        btnrow([btn("返回列表", "", href="b01.html"),
                btn("加入承租清单", "ghost"),
                btn("立即承租", "primary", href="b03.html")])))

# b03 提交订单（是否议价）
P["b03"] = dict(
    title="提交订单",
    crumbs=["承租方侧（租客）", "提交订单"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 0) +
        card("订单信息", kv([
            ("出租订单号", "ZLCZ-20260301-0007"),
            ("商品名称", "钢板桩租赁 · SP-Ⅳ 拉森钢板桩"),
            ("出租方（委托方）", "中铁建华东公司"),
            ("服务方（店铺）", "华南公司店铺"),
            ("下单时间", "2026-03-01 15:42"),
            ("承租方", "张三 / 中铁建华南项目部"),
        ], "g2")) +
        card(fsec("承租明细（含税）", "单价取自商品详情，可在议价环节调整") +
             tbl(["商品名称", "规格", "数量", "单位", "承租天数", "出租单价（含税）", "金额（含税）", "押金单价", "押金金额"],
                 [["钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "SP-Ⅳ 12m", "12", "吨", "30",
                   "180.00 元/吨/天", "64,800.00", "3,000.00", "36,000.00"],
                  ["钢便桥贝雷片 · 321型", "321型 3m", "8", "片", "30",
                   "95.00 元/片/天", "22,800.00", "1,200.00", "9,600.00"]],
                 align=["", "", "ctr", "ctr", "ctr", "num", "num", "num", "num"]) +
             '<div class="sum-bar"><span>商品押金合计 <b>45,600.00</b> 元</span>'
             '<span>租金合计 <b>87,600.00</b> 元</span>'
             '<span class="amt">应付合计 <b>133,200.00</b> 元</span></div>') +
        card(fsec("议价") + frow("是否需要议价", '<div class="radios">'
             '<label class="chk"><input type="radio" name="nego" checked>否 · 直接提交审核</label>'
             '<label class="chk"><input type="radio" name="nego">是 · 提交议价申请</label></div>', True)
             + frow("期望单价", inp("", "w-md", ph="选择“是”时必填") + '<span class="hint">元/吨/天</span>')
             + frow("议价说明", '<textarea class="full" style="max-width:560px" placeholder="请说明议价原因、期望承租期限等"></textarea>')
             + note("选择 <b>否</b>：订单直接进入服务方 <b>审核</b>；选择 <b>是</b>：先进入 <b>议价</b> 环节，"
                    "服务方【驳回收回 / 通过】，通过后再进入审核。", "warn")) +
        card(fsec("收货与联系人") +
             frow("收货地址", inp("广东省广州市南沙区中铁建华南项目部料场", "w-lg"), True) +
             frow("收货联系人", inp("张三", "w-sm"), True) + frow("联系电话", inp("138****0000", "w-sm"), True) +
             frow("承租日期", inp("2026-03-05", "w-md") + '<span class="hint">至</span>' + inp("2026-04-04", "w-md"), True) +
             frow("备注", '<textarea class="full" style="max-width:560px" placeholder="选填"></textarea>')) +
        btnrow([btn("取消", "", href="b01.html"), btn("保存草稿", "ghost"),
                btn("提交订单", "primary", href="b04.html")])))

# b04 提交审核 / 审核结果
P["b04"] = dict(
    title="提交审核 / 审核结果",
    crumbs=["承租方侧（租客）", "提交审核 / 审核结果"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 1) +
        party("a", '<b>当前环节：</b>承租方提交审核 → 服务方（华南公司）审核') +
        card("审核进度", tbl(["环节", "处理方", "处理人", "处理时间", "结果", "意见"],
            [["提交订单", "承租方", "张三", "2026-03-01 15:42", tag("已提交", "blue"), "—"],
             ["订单审核", "服务方", "王审核", "2026-03-01 16:05", tag("不通过", "red"),
              "承租数量超出可租库存（12 吨 > 当前可租 8 吨），请调整后重新提交"],
             ["议价", "服务方", "—", "—", tag("未触发", "grey"), "—"]],
            align=["", "", "", "", "ctr", ""])) +
        card("审核结果", '<div class="grid g2">' + kv([
            ("出租订单号", "ZLCZ-20260301-0007"),
            ("审核结果", (tag("不通过", "red"), "strong")),
            ("审核人", "王审核"),
            ("审核时间", "2026-03-01 16:05"),
            ("不通过原因", "承租数量超出可租库存"),
            ("下一步", "修改订单后重新提交"),
        ]) + '</div>' +
        note('<b>审核通过后：</b>订单进入承租方【押金付款】，付款完成由服务方【押金到账确认】，'
             '随后服务方【接单】。<br><b>审核不通过：</b>退回承租方修改，可重新提交。', "warn")) +
        btnrow([btn("查看订单", "", href="b06.html"),
                btn("修改并重新提交", "primary", href="b03.html")])))

# b05 押金付款
P["b05"] = dict(
    title="押金付款",
    crumbs=["承租方侧（租客）", "押金付款"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 2) +
        card("应付押金明细", kv([
            ("出租订单号", "ZLCZ-20260301-0007"),
            ("商品名称", "钢板桩租赁 · SP-Ⅳ 拉森钢板桩"),
            ("出租方（委托方）", "中铁建华东公司"),
            ("服务方（店铺）", "华南公司店铺"),
            ("押金收取方式", "按承租数量收取"),
            ("应缴押金", ("45,600.00 元", "money")),
            ("已缴押金", ("0.00 元", "money")),
            ("待缴押金", ("45,600.00 元", "money")),
        ], "g2")) +
        card(fsec("付款信息") +
             frow("付款方式", sel(["银行转账", "在线支付", "承兑汇票", "内部划转"]), True) +
             frow("付款账号", sel(["中铁建华南项目部基本户 · 尾号 6688", "中铁建华南项目部一般户 · 尾号 0012"]), True) +
             frow("收款方", inp("华南公司（委托出租收款专户）", "w-lg", disabled=True)) +
             frow("付款金额", inp("45,600.00", "w-md") + '<span class="hint">元（不可修改）</span>', True) +
             frow("付款凭证", '<div class="upload"><span class="plus">+</span><span>上传凭证</span></div>'
                  '<span class="hint">支持 jpg / png / pdf，单个不超过 5MB</span>') +
             frow("付款备注", inp("", "w-lg", ph="选填"))) +
        card("", note("<b>提示：</b>押金付款完成后，服务方需在【押金到账确认】中确认到账，"
                      "订单才会进入【接单】环节。押金将在租期结束、商品归还后通过【押金结算 → 押金退还】退回。", "blue")) +
        btnrow([btn("稍后付款", "", href="b06.html"), btn("确认付款", "primary", href="s05.html")])))

# b06 我的订单（出租）
P["b06"] = dict(
    title="我的订单（出租）",
    crumbs=["承租方侧（租客）", "我的订单（出租）"],
    body=lambda: (
        card("", '<div class="filters">'
             '<div class="f"><label>出租订单号</label>%s</div>'
             '<div class="f"><label>订单状态</label>%s</div>'
             '<div class="f"><label>下单时间</label>%s<span style="color:#7E8693">—</span>%s</div>'
             '<div class="acts">%s%s</div></div>'
             % (inp("", "w-md"), sel(["全部", "待审核", "待付押金", "待接单", "待发货", "待签收",
                                      "租期中", "待对账", "待归还", "押金退还中", "已完成"]),
                inp("", "w-md"), inp("", "w-md"), btn("重置"), btn("查询", "primary")), "tight") +
        card("订单列表", "共 12 笔", tbl(
            ["出租订单号", "商品名称", "承租数量", "出租方", "订单状态", "应缴押金", "创建时间", "操作"],
            [['<a href="b07.html">ZLCZ-20260301-0007</a>', "钢板桩租赁 · SP-Ⅳ", "12 吨", "中铁建华东公司",
              tag("待签收", "blue"), "36,000.00", "2026-03-01 15:42",
              '<span class="ops"><a href="b07.html">签收</a><a href="b08.html">退租</a></span>'],
             ['<a href="b09.html">ZLCZ-20260220-0003</a>', "盘扣式脚手架 · 48系", "20 套", "中铁建西南公司",
              tag("待对账", "orange"), "16,000.00", "2026-02-20 09:10",
              '<span class="ops"><a href="b09.html">复核对账单</a><a href="b10.html">租金付款</a></span>'],
             ['<a href="b11.html">ZLCZ-20260205-0011</a>', "钢便桥贝雷片 · 321型", "8 片", "中铁建华东公司",
              tag("租期中", "green"), "9,600.00", "2026-02-05 14:20",
              '<span class="ops"><a href="b11.html">归还</a></span>'],
             ['<a href="b12.html">ZLCZ-20260112-0002</a>', "液压振动锤 · DZ90", "2 台", "中铁建华南公司",
              tag("押金退还中", "orange"), "40,000.00", "2026-01-12 10:05",
              '<span class="ops"><a href="b12.html">确认押金退还</a></span>'],
             ['<a href="b14.html">ZLCZ-20251201-0009</a>', "钢板桩租赁 · SP-Ⅱ", "30 吨", "中铁建华东公司",
              tag("待确认发票", "orange"), "90,000.00", "2025-12-01 08:30",
              '<span class="ops"><a href="b14.html">确认发票</a></span>']],
            align=["", "", "ctr", "", "ctr", "num", "", ""]) + pager("共 12 条", 3)) +
        note("订单状态与流程图的对应关系：提交订单 → 审核 → 押金付款 → 接单 → 发货 → 签收 → "
             "创建对账单 → 复核对账单 → 租金付款 → 到账确认 → 新增商品归还 → 商品归还确认 → "
             "押金结算 → 押金退还付款 → 确认押金退还 → 新增开票 → 确认发票 → 结束订单。", "blue")))

# b07 签收 / 提交签收
P["b07"] = dict(
    title="签收 / 提交签收",
    crumbs=["承租方侧（租客）", "我的订单", "签收"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 4) +
        card("发货单信息（服务方开具）", kv([
            ("发货单号", "FHD-20260305-0031"),
            ("关联出租订单号", "ZLCZ-20260301-0007"),
            ("服务方", "华南公司店铺"),
            ("委托方（出租方）", "中铁建华东公司"),
            ("发货方式", "委托方自送"),
            ("预计到达", "2026-03-05"),
            ("承运人 / 车牌", "张师傅 / 粤A·8F236"),
            ("发货单状态", tag("已发货，待签收", "blue")),
        ], "g2") +
        note("虚线说明：<b>发货单由服务方新增并提交，但实际发货由出租方（委托方）按发货单详情进行。</b>"
             "承租方签收后，服务方【签收提交签收】节点完成，租期开始计算。", "warn")) +
        card("签收明细", tbl(["商品名称", "规格", "发货数量", "单位", "本次签收数量", "单位", "差异说明"],
            [["钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "SP-Ⅳ 12m", "12", "吨", "12", "吨", "—"],
             ["钢便桥贝雷片 · 321型", "321型 3m", "8", "片", "7", "片", "缺 1 片，承运方破损"],
             ["盘扣式脚手架 · 48系", "48×3.0", "20", "套", "20", "套", "—"]],
            align=["", "", "ctr", "ctr", "ctr", "ctr", ""])) +
        card(fsec("签收信息") +
             frow("签收方式", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="sign" checked>按发货单全量签收</label>'
                  '<label class="chk"><input type="radio" name="sign">按实际到货数量签收</label></div>', True) +
             frow("签收人", inp("张三", "w-sm"), True) +
             frow("签收时间", inp("2026-03-05", "w-md"), True) +
             frow("签收凭证", '<div class="upload"><span class="plus">+</span><span>上传签收单</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>上传现场照片</span></div>') +
             frow("租期起算", inp("2026-03-05", "w-md", disabled=True) + '<span class="hint">签收确认后自动起算</span>') +
             frow("备注", '<textarea class="full" style="max-width:560px">贝雷片少 1 片，已与承运方确认，'
                  '请服务方在结算时扣减。</textarea>') +
             note("<b>提示：</b>签收确认后即进入租期。租期内如需要提前终止，需发起 <b>新增退租单</b>；"
                  "<b>需租期结束后才可发起对账</b>。", "blue")) +
        btnrow([btn("稍后签收", "", href="b06.html"), btn("提交签收", "primary", href="b08.html")])))

# b08 新增退租单
P["b08"] = dict(
    title="新增退租单",
    crumbs=["承租方侧（租客）", "我的订单", "新增退租单"],
    body=lambda: (
        party("a", '<b>新增退租单：</b>承租方发起 → 服务方确认 → 进入【新增商品归还】流程') +
        card("退租单信息", kv([
            ("退租单号", "TZD-20260328-0002"),
            ("关联出租订单号", "ZLCZ-20260301-0007"),
            ("出租方（委托方）", "中铁建华东公司"),
            ("服务方", "华南公司店铺"),
            ("租期", "2026-03-05 至 2026-04-04"),
            ("已租天数", "23 天"),
            ("退租类型", tag("提前退租", "red")),
            ("制单人", "张三 / 2026-03-28 11:20"),
        ], "g2")) +
        card(fsec("退租明细") +
             tbl(["商品名称", "规格", "已承租数量", "本次退租数量", "单位", "已租天数", "退租原因"],
                 [["钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "SP-Ⅳ 12m", "12", "12", "吨", "23", "项目提前完工"],
                  ["钢便桥贝雷片 · 321型", "321型 3m", "7", "7", "片", "23", "项目提前完工"]],
                 align=["", "", "ctr", "ctr", "ctr", "ctr", ""]) +
             frow("退租说明", '<textarea class="full" style="max-width:720px">项目提前完工，剩余租赁物全部退回料场，'
                  "请服务方安排归还验收。</textarea>")) +
        card("", note("<b>规则（来自流程图）：</b><br>"
                      "· 租期内可发起退租，退租后进入归还与验收；<br>"
                      "· <b>需租期结束后才可发起对账</b>，提前退租的按实际租期与实际使用数量结算；<br>"
                      "· 押金在商品归还确认后进入【押金结算 → 新增押金退还单】。", "warn")) +
        btnrow([btn("取消", "", href="b06.html"), btn("保存草稿", "ghost"),
                btn("提交退租单", "primary", href="s04.html")])))

# b09 复核对账单 / 确认
P["b09"] = dict(
    title="复核对账单 / 确认",
    crumbs=["承租方侧（租客）", "复核对账单"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 5) +
        party("a", '<b>当前环节：</b>服务方创建对账单并确认 → <b>承租方复核对账单并确认</b> → 承租方租金付款') +
        card("对账单信息", kv([
            ("对账单号", "DZD-20260405-0012"),
            ("对账单类型", "租金对账单"),
            ("关联出租订单号", "ZLCZ-20260220-0003"),
            ("承租方", "张三 / 中铁建华南项目部"),
            ("出租方（委托方）", "中铁建西南公司"),
            ("服务方", "西部组店铺"),
            ("对账周期", "2026-02-20 至 2026-03-21"),
            ("出单时间", "2026-04-05 09:00"),
            ("服务方确认", tag("已确认", "green")),
            ("承租方确认", tag("待确认", "orange")),
        ], "g3")) +
        card(fsec("对账明细") +
             tbl(["序号", "商品名称", "规格", "承租数量", "单位", "已租天数", "出租单价（含税）",
                  "租金金额", "超期天数", "超期金额", "小计"],
                 [["1", "盘扣式脚手架 · 48系", "48×3.0", "20", "套", "30", "60.00", "36,000.00", "0", "0.00", "36,000.00"],
                  ["2", "盘扣式脚手架 · 48系", "48×3.0", "5", "套", "5", "60.00", "1,500.00", "0", "0.00", "1,500.00"]],
                 align=["ctr", "", "", "ctr", "ctr", "ctr", "num", "num", "ctr", "num", "num"]) +
             '<div class="sum-bar"><span>对账周期 <b>30</b> 天</span>'
             '<span>租金合计 <b>37,500.00</b> 元</span>'
             '<span class="amt">本次应付 <b>37,500.00</b> 元</span></div>') +
        card(fsec("复核意见") +
             frow("复核结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="chk" checked>确认无误，同意付款</label>'
                  '<label class="chk"><input type="radio" name="chk">有异议，退回服务方</label></div>', True) +
             frow("异议说明", '<textarea class="full" style="max-width:720px" placeholder="选择“有异议”时必填"></textarea>') +
             note("承租方确认后，流程进入 <b>租金付款</b>；服务方确认到账后双方对账单状态变为“已结清”。", "blue")) +
        btnrow([btn("下载对账单", "ghost"), btn("退回并说明异议", "danger"),
                btn("确认对账单", "primary", href="b10.html")])))

# b10 租金付款
P["b10"] = dict(
    title="租金付款",
    crumbs=["承租方侧（租客）", "租金付款"],
    body=lambda: (
        card("应付租金", kv([
            ("对账单号", "DZD-20260405-0012"),
            ("关联出租订单号", "ZLCZ-20260220-0003"),
            ("收款方", "华南公司（委托出租收款专户）"),
            ("出租方（委托方）", "中铁建西南公司"),
            ("应付租金", ("37,500.00 元", "money")),
            ("已付金额", ("0.00 元", "money")),
            ("待付金额", ("37,500.00 元", "money")),
            ("账期", "对账单确认后 15 日内"),
        ], "g2")) +
        card(fsec("付款信息") +
             frow("付款方式", sel(["银行转账", "在线支付", "承兑汇票", "内部划转"]), True) +
             frow("付款账号", sel(["中铁建华南项目部基本户 · 尾号 6688"]), True) +
             frow("付款金额", inp("37,500.00", "w-md") + '<span class="hint">元</span>', True) +
             frow("付款日期", inp("2026-04-08", "w-md"), True) +
             frow("付款凭证", '<div class="upload"><span class="plus">+</span><span>上传凭证</span></div>') +
             frow("付款备注", inp("", "w-lg", ph="选填"))) +
        btnrow([btn("返回列表", "", href="b06.html"), btn("提交付款", "primary", href="s07.html")])))

# b11 新增商品归还
P["b11"] = dict(
    title="新增商品归还",
    crumbs=["承租方侧（租客）", "我的订单", "新增商品归还"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 6) +
        party("a", '<b>商品归还：</b>承租方发起归还 → 委托方【商品归还确认】→ 服务方【押金结算】') +
        card("归还单信息", kv([
            ("归还单号", "GHD-20260406-0005"),
            ("关联出租订单号", "ZLCZ-20260205-0011"),
            ("出租方（委托方）", "中铁建华东公司"),
            ("服务方", "东南组店铺"),
            ("归还方式", "承租方送回料场"),
            ("归还地点", "广东省广州市南沙区中铁建华东公司料场"),
            ("预计归还时间", "2026-04-07"),
            ("制单人", "张三 / 2026-04-06 16:30"),
        ], "g2")) +
        card(fsec("归还明细") +
             tbl(["商品名称", "规格", "承租数量", "单位", "本次归还数量", "外观状况", "损坏/缺失说明"],
                 [["钢便桥贝雷片 · 321型", "321型 3m", "8", "片", "7", "良好", "1 片签收时缺失，已在对账单扣减"],
                  ["钢便桥贝雷片销轴", "φ50", "32", "个", "32", "良好", "—"]],
                 align=["", "", "ctr", "ctr", "ctr", "ctr", ""]) +
             frow("归还凭证", '<div class="upload"><span class="plus">+</span><span>上传过磅单</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>上传归还照片</span></div>') +
             frow("归还说明", '<textarea class="full" style="max-width:720px" placeholder="选填"></textarea>') +
             note("<b>提示：</b>提交后由委托方在【商品归还确认】中确认，委托方确认后系统把"
                  "<b>“商品已归还”状态同步给服务方</b>，服务方据此发起押金结算。", "blue")) +
        btnrow([btn("取消", "", href="b06.html"), btn("提交归还", "primary", href="a09.html")])))

# b12 确认押金退还
P["b12"] = dict(
    title="确认押金退还",
    crumbs=["承租方侧（租客）", "确认押金退还"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 7) +
        party("a", '<b>当前环节：</b>服务方【押金结算 / 新增押金退还单】 → 服务方【押金退还付款】 → '
                   '<b>承租方确认押金退还</b> → 承租方【押金到账确认】') +
        card("押金退还单", kv([
            ("押金退还单号", "YJT-20260410-0003"),
            ("关联出租订单号", "ZLCZ-20260112-0002"),
            ("商品名称", "液压振动锤 · DZ90"),
            ("出租方（委托方）", "中铁建华南公司"),
            ("服务方", "华南公司店铺"),
            ("应收押金", ("40,000.00 元", "money")),
            ("扣减金额", ("2,000.00 元", "money")),
            ("退还金额", ("38,000.00 元", "money")),
            ("服务方付款状态", tag("已付款", "green")),
            ("承租方确认状态", tag("待确认", "orange")),
        ], "g3")) +
        card(fsec("扣减明细", "依据委托费用与实际损耗核算") +
             tbl(["序号", "扣减项目", "计算说明", "金额"],
                 [["1", "设备维修费", "1 台振动锤液压管更换，据实结算", "1,400.00"],
                  ["2", "清洁费", "2 台 × 300 元", "600.00"]],
                 align=["ctr", "", "", "num"]) +
             '<div class="sum-bar"><span>押金合计 <b>40,000.00</b> 元</span>'
             '<span>扣减合计 <b>2,000.00</b> 元</span>'
             '<span class="amt">应退承租方 <b>38,000.00</b> 元</span></div>') +
        card(fsec("确认") +
             frow("确认结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="ok" checked>确认，退还金额无误</label>'
                  '<label class="chk"><input type="radio" name="ok">有异议，退回服务方</label></div>', True) +
             frow("退款账户", inp("中铁建华南项目部基本户 · 尾号 6688", "w-lg", disabled=True)) +
             frow("经办人 / 时间", inp("张三 / 2026-04-10 14:00", "w-lg", disabled=True))) +
        btnrow([btn("下载押金退还单", "ghost"), btn("确认押金退还", "primary", href="b13.html")])))

# b13 押金到账确认
P["b13"] = dict(
    title="押金到账确认",
    crumbs=["承租方侧（租客）", "押金到账确认"],
    body=lambda: (
        card("到账信息", kv([
            ("押金退还单号", "YJT-20260410-0003"),
            ("关联出租订单号", "ZLCZ-20260112-0002"),
            ("应退金额", ("38,000.00 元", "money")),
            ("实际到账", ("38,000.00 元", "money")),
            ("到账账户", "中铁建华南项目部基本户 · 尾号 6688"),
            ("到账日期", "2026-04-11"),
            ("到账状态", tag("已到账", "green")),
        ], "g2")) +
        card(fsec("确认操作") +
             frow("到账凭证", '<div class="upload"><span class="plus">+</span><span>上传银行回单</span></div>') +
             frow("备注", '<textarea class="full" style="max-width:720px" placeholder="选填"></textarea>') +
             note("押金到账确认后，本笔出租订单的押金环节全部完成；剩余待办为 <b>新增开票 → 确认发票 → 结束订单</b>。", "blue")) +
        btnrow([btn("返回订单", "", href="b06.html"), btn("确认到账", "primary", href="b14.html")])))

# b14 确认发票
P["b14"] = dict(
    title="确认发票",
    crumbs=["承租方侧（租客）", "确认发票"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 8) +
        party("a", '<b>开票双方：</b>委托方（出租方）按委托价格开票给承租方；服务方就委托费用开票。') +
        card("发票信息", kv([
            ("发票单号", "FP-20260415-0006"),
            ("关联出租订单号", "ZLCZ-20251201-0009"),
            ("开票方", "中铁建华东公司（委托方 / 出租方）"),
            ("受票方", "张三 / 中铁建华南项目部"),
            ("发票类型", "增值税专用发票"),
            ("发票号码", "04412026 00318866"),
            ("开票金额", ("109,620.00 元", "money")),
            ("税率 / 税额", "13% / 12,610.62 元"),
            ("开票日期", "2026-04-15"),
            ("发票状态", tag("待承租方确认", "orange")),
        ], "g3")) +
        card(fsec("发票明细") +
             tbl(["序号", "项目", "对应单号", "金额（含税）", "税率", "税额"],
                 [["1", "钢板桩租金", "DZD-20260102-0007", "106,200.00", "13%", "12,212.39"],
                  ["2", "超期租金", "DZD-20260102-0007", "3,420.00", "13%", "398.23"]],
                 align=["ctr", "", "", "num", "ctr", "num"]) +
             '<div class="sum-bar"><span>价税合计 <b>109,620.00</b> 元</span>'
             '<span class="amt">其中税额 <b>12,610.62</b> 元</span></div>') +
        card(fsec("确认操作") +
             frow("发票文件", '<div class="upload"><span class="plus">+</span><span>查看 PDF</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>查看 OFD</span></div>') +
             frow("确认结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="fp" checked>确认收票，信息无误</label>'
                  '<label class="chk"><input type="radio" name="fp">信息有误，退回重开</label></div>', True) +
             frow("备注", '<textarea class="full" style="max-width:720px" placeholder="选填"></textarea>')) +
        btnrow([btn("稍后确认", "", href="b06.html"), btn("确认发票", "primary", href="b15.html")])))

# b15 结束订单
P["b15"] = dict(
    title="结束订单",
    crumbs=["承租方侧（租客）", "结束订单"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 9) +
        card("订单已结束", '<div class="grid g2">' + kv([
            ("出租订单号", "ZLCZ-20251201-0009"),
            ("商品名称", "钢板桩租赁 · SP-Ⅱ"),
            ("出租方（委托方）", "中铁建华东公司"),
            ("服务方", "华南公司店铺"),
            ("承租方", "张三 / 中铁建华南项目部"),
            ("订单状态", (tag("已结束", "green"), "strong")),
            ("租期", "2025-12-05 至 2026-01-04"),
            ("结束时间", "2026-04-16 10:20"),
        ]) + '</div>' +
        note("全流程闭环：<b>提交订单 → 审核 → 押金付款 → 接单 → 发货 → 签收 → 创建对账单 → "
             "复核对账单 → 租金付款 → 到账确认 → 商品归还 → 商品归还确认 → 押金结算 → 押金退还付款 → "
             "确认押金退还 → 押金到账确认 → 新增开票 → 确认发票 → 结束订单</b>。", "blue")) +
        card("本单归档文件", tbl(["文件类型", "文件名称", "生成方", "生成时间", "操作"],
            [["出租订单", "ZLCZ-20251201-0009 出租订单.pdf", "服务方", "2025-12-01 08:31",
              '<span class="ops"><a href="javascript:;">下载</a></span>'],
             ["发货单", "FHD-20251205-0021.pdf", "服务方", "2025-12-04 17:00",
              '<span class="ops"><a href="javascript:;">下载</a></span>'],
             ["签收单", "QSD-20251205-0021.pdf", "承租方", "2025-12-05 10:12",
              '<span class="ops"><a href="javascript:;">下载</a></span>'],
             ["租金对账单", "DZD-20260102-0007.pdf", "服务方", "2026-01-02 09:00",
              '<span class="ops"><a href="javascript:;">下载</a></span>'],
             ["押金退还单", "YJT-20260106-0004.pdf", "服务方", "2026-01-06 15:30",
              '<span class="ops"><a href="javascript:;">下载</a></span>'],
             ["发票", "FP-20260415-0006.pdf", "委托方", "2026-04-15 11:00",
              '<span class="ops"><a href="javascript:;">下载</a></span>']])) +
        btnrow([btn("返回订单列表", "", href="b06.html"), btn("再次承租", "primary", href="b01.html")])))

# ---------------------------------------------------------------- 服务方
P["s01"] = dict(
    title="委托接单工作台",
    crumbs=["服务方侧（华南公司）", "委托接单工作台"],
    body=lambda: (
        card("", '<div class="grid g4">'
             + kv([("待审核委托订单", ("6", "strong")), ("待接单", ("11", "strong")),
                   ("待发货 / 待提交发货单", ("8", "strong")), ("待押金到账确认", ("4", "strong"))], "g4")
             + '</div>' +
             '<div class="grid g4" style="margin-top:8px">'
             + kv([("待创建对账单", ("9", "strong")), ("待到账确认", ("5", "strong")),
                   ("待押金结算", ("3", "strong")), ("待新增开票", ("7", "strong"))], "g4")
             + '</div>', "tight") +
        card("待办列表", "按流程图节点归集",
             tbl(["待办事项", "对应流程节点", "数量", "最早超时", "操作"],
                 [["承租方订单审核", "审核", "6", "2 小时前",
                   '<span class="ops"><a href="s02.html">去审核</a></span>'],
                  ["承租方已过审，等待接单", "接单", "11", "—",
                   '<span class="ops"><a href="s03.html">去接单</a></span>'],
                  ["已接单，等待新增发货单", "新增发货单 / 提交发货单", "8", "—",
                   '<span class="ops"><a href="s04.html">去发货</a></span>'],
                  ["承租方已付押金，等待确认到账", "押金到账确认", "4", "1 天前",
                   '<span class="ops"><a href="s05.html">去确认</a></span>'],
                  ["已签收，等待创建对账单", "创建对账单 / 确认", "9", "—",
                   '<span class="ops"><a href="s06.html">去对账</a></span>'],
                  ["承租方已付租金，等待到账确认", "到账确认", "5", "3 天前",
                   '<span class="ops"><a href="s07.html">去确认</a></span>'],
                  ["商品已归还，等待押金结算", "押金结算 / 新增押金退还单", "3", "—",
                   '<span class="ops"><a href="s09.html">去结算</a></span>'],
                  ["出租方已开票，等待确认", "新增开票 / 确认发票", "7", "—",
                   '<span class="ops"><a href="s11.html">去开票</a></span>']],
                 align=["", "", "ctr", "", ""])) +
        card("接单店铺组", "流程图中的接单范围，按组分配承租订单量",
             pick_grid([("东南组店铺", "在租 42 单"), ("西部组店铺", "在租 28 单"),
                        ("北部组店铺", "在租 31 单"), ("系统外组店铺", "在租 6 单"),
                        ("华南公司店铺", "在租 55 单")], 4))))

P["s02"] = dict(
    title="订单审核",
    crumbs=["服务方侧（华南公司）", "订单审核"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 1) +
        card("待审核订单", "共 6 笔", tbl(
            ["出租订单号", "商品名称", "承租方", "承租数量", "可租库存", "出租方（委托方）", "提交时间", "操作"],
            [['<a href="s02.html">ZLCZ-20260301-0007</a>', "钢板桩租赁 · SP-Ⅳ", "张三", "12 吨", "8 吨",
              "中铁建华东公司", "2026-03-01 15:42",
              '<span class="ops"><a href="javascript:;">通过</a><a href="javascript:;" class="danger">不通过</a></span>'],
             ['<a href="s02.html">ZLCZ-20260301-0008</a>', "盘扣式脚手架 · 48系", "陈工", "60 套", "1,200 套",
              "中铁建西南公司", "2026-03-01 14:10",
              '<span class="ops"><a href="javascript:;">通过</a><a href="javascript:;" class="danger">不通过</a></span>']],
            align=["", "", "", "ctr", "ctr", "", "", ""])) +
        card(fsec("审核单据 · ZLCZ-20260301-0007") +
             kv([("出租订单号", "ZLCZ-20260301-0007"), ("承租方", "张三 / 中铁建华南项目部"),
                 ("出租方（委托方）", "中铁建华东公司"), ("商品名称", "钢板桩租赁 · SP-Ⅳ 拉森钢板桩"),
                 ("承租数量", "12 吨"), ("当前可租库存", ("8 吨", "money")),
                 ("承租天数", "30 天"), ("租金 / 押金", "64,800.00 / 36,000.00 元"),
                 ("是否议价", "否"), ("提交时间", "2026-03-01 15:42")], "g2") +
             frow("审核结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="r">通过</label>'
                  '<label class="chk"><input type="radio" name="r" checked>不通过</label>'
                  '<label class="chk"><input type="radio" name="r">转议价</label></div>', True) +
             frow("审核意见", '<textarea class="full" style="max-width:720px">承租数量超出可租库存'
                  "（12 吨 > 当前可租 8 吨），请调整后重新提交。</textarea>", True) +
             note("<b>审核通过</b> → 承租方【押金付款】；<b>审核不通过</b> → 回到承租方修改订单；"
                  "<b>转议价</b> → 进入议价流程，由服务方【驳回收回 / 通过】。", "warn")) +
        btnrow([btn("重置", ""), btn("提交审核结果", "primary", href="s03.html")])))

P["s03"] = dict(
    title="接单（分店铺组）",
    crumbs=["服务方侧（华南公司）", "接单"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 3) +
        card("待接单委托订单", "承租方已付押金且服务方已确认到账", tbl(
            ["出租订单号", "商品名称", "承租方", "承租数量", "委托方", "押金", "押金到账", "操作"],
            [['<a href="s03.html">ZLCZ-20260301-0007</a>', "钢板桩租赁 · SP-Ⅳ", "张三", "12 吨",
              "中铁建华东公司", "36,000.00", tag("已到账", "green"),
              '<span class="ops"><a href="javascript:;">接单</a></span>'],
             ['<a href="s03.html">ZLCZ-20260301-0009</a>', "液压振动锤 · DZ90", "王工", "2 台",
              "中铁建华南公司", "40,000.00", tag("已到账", "green"),
              '<span class="ops"><a href="javascript:;">接单</a></span>']],
            align=["", "", "", "ctr", "", "num", "ctr", ""])) +
        card(fsec("接单处理 · ZLCZ-20260301-0007") +
             frow("分配到店铺组", pick_grid([("东南组店铺", "在租 42 单"), ("西部组店铺", "在租 28 单"),
                                            ("北部组店铺", "在租 31 单"), ("系统外组店铺", "在租 6 单"),
                                            ("华南公司店铺", "在租 55 单")], 4), True) +
             frow("接单人", inp("王接单", "w-sm", disabled=True)) +
             frow("接单时间", inp("2026-03-02 09:15", "w-md", disabled=True)) +
             frow("接单说明", '<textarea class="full" style="max-width:720px" placeholder="选填"></textarea>') +
             note("接单后：服务方【新增发货单 / 提交发货单】，<b>实际发货由委托方按发货单详情进行</b>；"
                  "承租方签收后进入对账环节。", "blue")) +
        btnrow([btn("批量接单", "ghost"), btn("确认接单", "primary", href="s04.html")])))

P["s04"] = dict(
    title="新增发货单 / 提交发货单",
    crumbs=["服务方侧（华南公司）", "新增发货单"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 3) +
        party("b", '<b>发货单由服务方新增提交，实际发货由委托方（出租方）按发货单详情进行</b>'
                   '（流程图中虚线部分）') +
        card("发货单信息", kv([
            ("发货单号", "FHD-20260305-0031"),
            ("关联出租订单号", "ZLCZ-20260301-0007"),
            ("承租方", "张三 / 中铁建华南项目部"),
            ("委托方（实际发货方）", "中铁建华东公司"),
            ("接单店铺组", "华南公司店铺"),
            ("收货地址", "广东省广州市南沙区中铁建华南项目部料场"),
            ("发货方式", "委托方自送"),
            ("制单时间", "2026-03-04 17:00"),
        ], "g2")) +
        card(fsec("发货明细", "提交后同步给委托方，委托方按此详情发货") +
             tbl(["序号", "商品名称", "规格", "承租数量", "本次发货数量", "单位", "发货仓库", "备注"],
                 [["1", "钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "SP-Ⅳ 12m", "12", "12", "吨", "华东公司南沙仓", "—"],
                  ["2", "钢便桥贝雷片 · 321型", "321型 3m", "8", "8", "片", "华东公司南沙仓", "—"]],
                 align=["ctr", "", "", "ctr", "ctr", "ctr", "", ""]) +
             frow("承运信息", inp("张师傅", "w-sm") + inp("粤A·8F236", "w-sm")
                  + '<span class="hint">承运人 / 车牌，委托方自送时填自送车辆</span>') +
             frow("预计到达", inp("2026-03-05", "w-md"), True) +
             frow("发货说明", '<textarea class="full" style="max-width:720px">请委托方按此发货单在 3 月 5 日前'
                  "送达项目部料场，随车带过磅单与材质证明。</textarea>")) +
        card("", note("<b>提示：</b>提交发货单后，委托方侧【我的出租订单】会出现对应的发货任务；"
                      "承租方签收后，服务方在【签收提交签收】节点确认。", "blue")) +
        btnrow([btn("保存草稿", "ghost"), btn("提交发货单", "primary", href="a05.html")])))

P["s05"] = dict(
    title="押金到账确认",
    crumbs=["服务方侧（华南公司）", "押金到账确认"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 2) +
        card("待确认押金", "共 4 笔", tbl(
            ["出租订单号", "商品名称", "承租方", "应缴押金", "已缴押金", "付款时间", "付款凭证", "操作"],
            [['<a href="s05.html">ZLCZ-20260301-0007</a>', "钢板桩租赁 · SP-Ⅳ", "张三",
              "36,000.00", "36,000.00", "2026-03-02 08:50", tag("已上传", "blue"),
              '<span class="ops"><a href="javascript:;">确认到账</a></span>'],
             ['<a href="s05.html">ZLCZ-20260301-0009</a>', "液压振动锤 · DZ90", "王工",
              "40,000.00", "40,000.00", "2026-03-02 09:30", tag("已上传", "blue"),
              '<span class="ops"><a href="javascript:;">确认到账</a></span>']],
            align=["", "", "", "num", "num", "", "ctr", ""])) +
        card(fsec("到账确认 · ZLCZ-20260301-0007") +
             kv([("出租订单号", "ZLCZ-20260301-0007"), ("承租方", "张三"),
                 ("应缴押金", ("36,000.00 元", "money")), ("实收押金", ("36,000.00 元", "money")),
                 ("收款账户", "华南公司（委托出租收款专户）"), ("到账日期", "2026-03-02")], "g2") +
             frow("到账结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="dz" checked>已到账，全额收到</label>'
                  '<label class="chk"><input type="radio" name="dz">金额不符 / 未收到</label></div>', True) +
             frow("银行回单", '<div class="upload"><span class="plus">+</span><span>上传回单</span></div>') +
             frow("确认人 / 时间", inp("赵财务 / 2026-03-02 10:00", "w-lg", disabled=True)) +
             note("押金到账确认后，服务方即可对该订单 <b>接单</b>。", "blue")) +
        btnrow([btn("返回", "", href="s01.html"), btn("确认到账", "primary", href="s03.html")])))

P["s06"] = dict(
    title="创建对账单 / 确认",
    crumbs=["服务方侧（华南公司）", "创建对账单"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 5) +
        card("可对账订单", "依据已出租的商品数量及租期，需租期结束后才可发起对账", tbl(
            ["出租订单号", "商品名称", "承租方", "承租数量", "租期", "已租天数", "对账状态", "操作"],
            [['<a href="s06.html">ZLCZ-20260220-0003</a>', "盘扣式脚手架 · 48系", "张三", "25 套",
              "2026-02-20 ~ 2026-03-21", "30", tag("待创建", "orange"),
              '<span class="ops"><a href="javascript:;">创建对账单</a></span>'],
             ['<a href="s06.html">ZLCZ-20260210-0005</a>', "钢板桩租赁 · SP-Ⅱ", "陈工", "40 吨",
              "2026-02-10 ~ 2026-03-11", "30", tag("已创建待确认", "blue"),
              '<span class="ops"><a href="javascript:;">查看</a></span>']],
            align=["", "", "", "ctr", "", "ctr", "ctr", ""])) +
        card(fsec("创建对账单 · ZLCZ-20260220-0003") +
             frow("对账周期", inp("2026-02-20", "w-md") + '<span class="hint">至</span>' + inp("2026-03-21", "w-md")
                  + '<span class="hint">系统按签收日至归还日自动带出</span>', True) +
             tbl(["序号", "商品名称", "规格", "承租数量", "单位", "已租天数", "出租单价（含税）",
                  "租金金额", "超期天数", "超期单价", "超期金额", "小计"],
                 [["1", "盘扣式脚手架 · 48系", "48×3.0", "20", "套", "30", "60.00", "36,000.00", "0", "—", "0.00", "36,000.00"],
                  ["2", "盘扣式脚手架 · 48系", "48×3.0", "5", "套", "5", "60.00", "1,500.00", "0", "—", "0.00", "1,500.00"]],
                 align=["ctr", "", "", "ctr", "ctr", "ctr", "num", "num", "ctr", "num", "num", "num"], cls="compact") +
             '<div class="sum-bar"><span>租金合计 <b>37,500.00</b> 元</span>'
             '<span>服务费 <b>按费率向指定收费对象收取</b></span>'
             '<span class="amt">对账总额 <b>37,500.00</b> 元</span></div>' +
             frow("对账说明", '<textarea class="full" style="max-width:720px">本次对账周期 2026-02-20 至 2026-03-21，'
                  "共 30 天，无超期。</textarea>") +
             note("<b>规则：</b>服务方创建对账单并确认后 → 承租方【复核对账单 / 确认】→ 承租方【租金付款】→ "
                  "服务方【到账确认】。委托方侧同步生成 <b>销售对账单</b>，用于委托结算。", "blue")) +
        btnrow([btn("暂存", "ghost"), btn("创建并确认", "primary", href="b09.html")])))

P["s07"] = dict(
    title="到账确认",
    crumbs=["服务方侧（华南公司）", "到账确认"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 5) +
        card("待确认租金到账", "共 5 笔", tbl(
            ["对账单号", "出租订单号", "承租方", "应付租金", "付款时间", "付款凭证", "操作"],
            [['<a href="s07.html">DZD-20260405-0012</a>', "ZLCZ-20260220-0003", "张三",
              "37,500.00", "2026-04-08 10:20", tag("已上传", "blue"),
              '<span class="ops"><a href="javascript:;">确认到账</a></span>'],
             ['<a href="s07.html">DZD-20260406-0015</a>', "ZLCZ-20260210-0005", "陈工",
              "128,400.00", "2026-04-08 11:05", tag("已上传", "blue"),
              '<span class="ops"><a href="javascript:;">确认到账</a></span>']],
            align=["", "", "", "num", "", "ctr", ""])) +
        card(fsec("到账确认 · DZD-20260405-0012") +
             kv([("对账单号", "DZD-20260405-0012"), ("关联出租订单号", "ZLCZ-20260220-0003"),
                 ("应收租金", ("37,500.00 元", "money")), ("实收租金", ("37,500.00 元", "money")),
                 ("收款账户", "华南公司（委托出租收款专户）"), ("到账日期", "2026-04-09")], "g2") +
             frow("到账结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="d2" checked>已到账，全额收到</label>'
                  '<label class="chk"><input type="radio" name="d2">部分到账 / 未收到</label></div>', True) +
             frow("银行回单", '<div class="upload"><span class="plus">+</span><span>上传回单</span></div>') +
             note("到账确认后：承租方进入【新增商品归还】；委托方对该笔租金的 <b>销售对账单</b> 同步变为可结算状态。", "blue")) +
        btnrow([btn("返回", "", href="s01.html"), btn("确认到账", "primary", href="s08.html")])))

P["s08"] = dict(
    title="委托结算",
    crumbs=["服务方侧（华南公司）", "委托结算"],
    body=lambda: (
        card("委托结算规则", '<div class="grid g2">' + kv([
            ("结算依据", "已出租的商品数量及租期"),
            ("结算时点", "租期结束后做委托结算"),
            ("终止条件", "直至服务商下架商品、不再接单，即可取消委托"),
            ("服务费", "按费率设置中的委托租赁费率，向指定收费对象收取"),
            ("参与方", "服务方（华南公司）↔ 委托方（出租方）"),
            ("本期结算周期", "2026-03-01 至 2026-03-31"),
        ]) + '</div>' +
        note("流程图说明：<b>依据已出租的商品数量及租期结束后做委托结算</b>；"
             "<b>直至服务商下架商品，不再接单，即可取消委托</b>。已出租部分按实际租期结算，"
             "未出租库存退回委托方。", "blue")) +
        card("结算单列表", tbl(["结算单号", "委托方", "结算周期", "已出租商品数", "租金合计",
                                "服务费", "应付委托方", "状态", "操作"],
            [['<a href="s08.html">WJJS-20260331-0002</a>', "中铁建华东公司", "2026-03-01 ~ 03-31", "18",
              "268,400.00", "8,052.00", "260,348.00", tag("待确认", "orange"),
              '<span class="ops"><a href="javascript:;">查看</a><a href="javascript:;">确认结算</a></span>'],
             ['<a href="s08.html">WJJS-20260331-0003</a>', "中铁建西南公司", "2026-03-01 ~ 03-31", "12",
              "142,600.00", "4,278.00", "138,322.00", tag("已确认", "green"),
              '<span class="ops"><a href="javascript:;">查看</a></span>']],
            align=["", "", "", "ctr", "num", "num", "num", "ctr", ""])) +
        card(fsec("结算明细 · WJJS-20260331-0002") +
             tbl(["序号", "商品名称", "已出租数量", "单位", "租期", "出租单价（含税）", "租金金额",
                  "服务费率", "服务费", "应付委托方"],
                 [["1", "钢板桩租赁 · SP-Ⅳ", "12", "吨", "30 天", "180.00", "64,800.00", "3%", "1,944.00", "62,856.00"],
                  ["2", "钢便桥贝雷片 · 321型", "8", "片", "30 天", "95.00", "22,800.00", "3%", "684.00", "22,116.00"],
                  ["3", "盘扣式脚手架 · 48系", "25", "套", "30 天", "60.00", "45,000.00", "3%", "1,350.00", "43,650.00"]],
                 align=["ctr", "", "ctr", "ctr", "ctr", "num", "num", "ctr", "num", "num"], cls="compact") +
             '<div class="sum-bar"><span>租金合计 <b>268,400.00</b> 元</span>'
             '<span>服务费合计 <b>8,052.00</b> 元</span>'
             '<span class="amt">应付委托方 <b>260,348.00</b> 元</span></div>') +
        btnrow([btn("导出结算单", "ghost"), btn("确认委托结算", "primary", href="a06.html")])))

P["s09"] = dict(
    title="押金结算 / 新增押金退还单",
    crumbs=["服务方侧（华南公司）", "押金结算"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 7) +
        party("b", '<b>触发条件：</b>委托方完成【商品归还确认】后，系统把“商品已归还”状态同步给服务方，'
                   '服务方据此发起押金结算。') +
        card("待押金结算订单", tbl(
            ["出租订单号", "商品名称", "承租方", "委托方", "应收押金", "扣减金额", "应退金额",
             "商品已归还", "操作"],
            [['<a href="s09.html">ZLCZ-20260301-0007</a>', "钢板桩租赁 · SP-Ⅳ", "张三", "中铁建华东公司",
              "36,000.00", "0.00", "36,000.00", tag("已归还", "green"),
              '<span class="ops"><a href="javascript:;">新增押金退还单</a></span>'],
             ['<a href="s09.html">ZLCZ-20260112-0002</a>', "液压振动锤 · DZ90", "张三", "中铁建华南公司",
              "40,000.00", "2,000.00", "38,000.00", tag("已归还", "green"),
              '<span class="ops"><a href="javascript:;">查看退还单</a></span>']],
            align=["", "", "", "", "num", "num", "num", "ctr", ""])) +
        card(fsec("新增押金退还单 · ZLCZ-20260301-0007") +
             kv([("押金退还单号", "YJT-20260408-0006"), ("关联出租订单号", "ZLCZ-20260301-0007"),
                 ("承租方", "张三"), ("委托方", "中铁建华东公司"),
                 ("应收押金", ("36,000.00 元", "money")), ("应退金额", ("36,000.00 元", "money"))], "g3") +
             frow("扣减项目", '<div class="upload"><span class="plus">+</span><span>新增扣减项</span></div>'
                  '<span class="hint">无扣减时可不填，全额退还</span>') +
             frow("退款账户", inp("中铁建华南项目部基本户 · 尾号 6688", "w-lg", disabled=True)) +
             frow("退还说明", '<textarea class="full" style="max-width:720px">商品已全部归还并验收合格，'
                  "无损坏缺失，押金全额退还。</textarea>") +
             note("押金退还单提交后进入 <b>押金退还付款</b>，付款完成后由承租方 <b>确认押金退还</b> 并 "
                  "<b>押金到账确认</b>。", "blue")) +
        btnrow([btn("暂存", "ghost"), btn("提交押金退还单", "primary", href="s10.html")])))

P["s10"] = dict(
    title="押金退还付款",
    crumbs=["服务方侧（华南公司）", "押金退还付款"],
    body=lambda: (
        card("待付款押金退还单", tbl(["押金退还单号", "出租订单号", "承租方", "应退金额", "已付金额",
                                      "退款账户", "状态", "操作"],
            [['<a href="s10.html">YJT-20260408-0006</a>', "ZLCZ-20260301-0007", "张三", "36,000.00",
              "0.00", "尾号 6688", tag("待付款", "orange"),
              '<span class="ops"><a href="javascript:;">付款</a></span>'],
             ['<a href="s10.html">YJT-20260410-0003</a>', "ZLCZ-20260112-0002", "张三", "38,000.00",
              "38,000.00", "尾号 6688", tag("已付款", "green"),
              '<span class="ops"><a href="javascript:;">查看</a></span>']],
            align=["", "", "", "num", "num", "", "ctr", ""])) +
        card(fsec("付款 · YJT-20260408-0006") +
             kv([("押金退还单号", "YJT-20260408-0006"), ("关联出租订单号", "ZLCZ-20260301-0007"),
                 ("收款方", "张三 / 中铁建华南项目部"), ("应退金额", ("36,000.00 元", "money")),
                 ("收款账户", "中铁建华南项目部基本户 · 尾号 6688"), ("付款期限", "3 个工作日")], "g2") +
             frow("付款方式", sel(["银行转账", "在线支付", "内部划转"]), True) +
             frow("付款金额", inp("36,000.00", "w-md") + '<span class="hint">元</span>', True) +
             frow("付款日期", inp("2026-04-09", "w-md"), True) +
             frow("付款凭证", '<div class="upload"><span class="plus">+</span><span>上传回单</span></div>') +
             note("付款完成后，承租方侧出现 <b>确认押金退还</b> 待办。", "blue")) +
        btnrow([btn("返回", "", href="s01.html"), btn("提交付款", "primary", href="b12.html")])))

P["s11"] = dict(
    title="新增开票",
    crumbs=["服务方侧（华南公司）", "新增开票"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 8) +
        party("b", '<b>开票说明：</b>服务方就其 <b>委托费用（服务费）</b> 向委托方开票；'
                   '委托方按 <b>委托价格</b> 向承租方开票。') +
        card("可开票记录", "依据已出租的商品及租期开票", tbl(
            ["来源单号", "开票对象", "开票方", "受票方", "含税金额", "税率", "开票状态", "操作"],
            [['<a href="s11.html">WJJS-20260331-0002</a>', "委托服务费", "华南公司", "中铁建华东公司",
              "8,052.00", "6%", tag("待开票", "orange"),
              '<span class="ops"><a href="javascript:;">新增开票</a></span>'],
             ['<a href="s11.html">DZD-20260405-0012</a>', "租金（代收）", "华南公司", "张三",
              "37,500.00", "13%", tag("已开票", "green"),
              '<span class="ops"><a href="javascript:;">查看</a></span>']],
            align=["", "", "", "", "num", "ctr", "ctr", ""])) +
        card(fsec("新增开票 · WJJS-20260331-0002") +
             frow("开票类型", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="kt" checked>增值税专用发票</label>'
                  '<label class="chk"><input type="radio" name="kt">增值税普通发票</label>'
                  '<label class="chk"><input type="radio" name="kt">电子发票</label></div>', True) +
             frow("开票方", inp("华南公司", "w-lg", disabled=True)) +
             frow("受票方", inp("中铁建华东公司", "w-lg", disabled=True)) +
             frow("开票项目", inp("委托出租服务费", "w-lg"), True) +
             tbl(["序号", "费用项目", "计算依据", "含税金额", "税率", "税额"],
                 [["1", "委托出租服务费", "268,400.00 × 3%", "8,052.00", "6%", "455.77"]],
                 align=["ctr", "", "", "num", "ctr", "num"], cls="compact") +
             frow("发票号码", inp("", "w-md", ph="开票后回填")) +
             frow("开票日期", inp("2026-04-16", "w-md"), True) +
             frow("发票附件", '<div class="upload"><span class="plus">+</span><span>上传 PDF</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>上传 OFD</span></div>') +
             note("开票后由受票方 <b>确认发票</b>，委托方与承租方各自完成确认后订单结束。", "blue")) +
        btnrow([btn("暂存", "ghost"), btn("确认开票", "primary", href="a10.html")])))

# ---------------------------------------------------------------- 委托方
P["a01"] = dict(
    title="新增出租商品",
    crumbs=["委托方侧（出租方）", "新增出租商品"],
    body=lambda: (
        steps(["新增出租商品", "自动委托 → 审核", "上架", "接单", "发货", "委托结算", "开票"], 0) +
        party("c", '<b>委托方侧起点：</b>新增出租商品 → 自动委托给服务方 → 服务方【审核】'
                   '（不通过 → 驳回；通过 → 上架）') +
        card(fsec("基本信息") +
             frow("商品名称", inp("钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "w-lg"), True) +
             frow("规格型号", inp("SP-Ⅳ 12m", "w-md"), True) +
             frow("商品分类", sel(["周转材料 / 钢板桩", "周转材料 / 脚手架", "周转材料 / 贝雷片", "机械设备 / 桩工机械"]), True) +
             frow("计量单位", sel(["吨", "片", "套", "台", "个", "米"]), True) +
             frow("内部 / 外部委托", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="wt" checked>内部委托资源</label>'
                  '<label class="chk"><input type="radio" name="wt">外部委托资源</label></div>', True) +
             frow("商品图片", '<div class="upload"><span class="plus">+</span><span>上传主图</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>上传附图</span></div>'
                  '<span class="hint">支持 jpg / png，建议 800×800</span>')) +
        card(fsec("出租与押金", "价格口径与原型的询价/报价页保持一致") +
             frow("出租单价（含税）", inp("180.00", "w-sm") + '<span class="hint">元/吨/天</span>', True) +
             frow("出租单价（不含税）", inp("159.29", "w-sm") + '<span class="hint">元/吨/天，按 13% 反算</span>') +
             frow("押金单价", inp("3,000.00", "w-sm") + '<span class="hint">元/吨</span>', True) +
             frow("押金收取方式", sel(["按承租数量收取", "按订单固定金额收取", "免押金"]), True) +
             frow("最少起租期", inp("30", "w-sm") + '<span class="hint">天</span>', True) +
             frow("超期单价", inp("1.5", "w-sm") + '<span class="hint">倍，超期按出租单价 × 倍数计费</span>') +
             frow("可租数量", inp("240", "w-sm") + '<span class="hint">吨</span>', True) +
             frow("税率", sel(["13%", "9%", "6%", "3%"]), True)) +
        card(fsec("委托信息", "保存后自动委托给服务方并进入审核") +
             frow("委托服务方", inp("华南公司", "w-lg", disabled=True)) +
             frow("委托店铺组", sel(["华南公司店铺", "东南组店铺", "西部组店铺", "北部组店铺", "系统外组店铺"]), True) +
             frow("委托有效期", inp("2026-03-01", "w-md") + '<span class="hint">至</span>' + inp("2026-12-31", "w-md")) +
             frow("委托费用率", inp("3%", "w-sm", disabled=True) + '<span class="hint">取自费率设置中的「委托租赁」</span>') +
             frow("结算方式", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="js" checked>租期结束后委托结算</label>'
                  '<label class="chk"><input type="radio" name="js">按月结算</label></div>') +
             note("流程图：<b>新增出租商品 → 自动委托 → 审核</b>（不通过退回修改；通过 → <b>上架</b>）。"
                  "上架后承租方即可在【委托商品列表】看到并承租。", "blue")) +
        btnrow([btn("取消", "", href="a02.html"), btn("保存草稿", "ghost"),
                btn("保存并提交审核", "primary", href="a03.html")])))

P["a02"] = dict(
    title="委托商品管理",
    crumbs=["委托方侧（出租方）", "委托商品管理"],
    body=lambda: (
        card("", '<div class="filters">'
             '<div class="f"><label>商品名称</label>%s</div>'
             '<div class="f"><label>上架状态</label>%s</div>'
             '<div class="f"><label>委托状态</label>%s</div>'
             '<div class="acts">%s%s%s</div></div>'
             % (inp("", "w-md"),
                sel(["全部", "已上架", "未上架", "已下架", "审核中", "审核不通过"]),
                sel(["全部", "委托中", "已取消委托"]),
                btn("重置"), btn("查询", "primary"), btn("+ 新增出租商品", "primary", href="a01.html")), "tight") +
        card("委托商品列表", "共 24 件 · 已上架 18 件、审核中 2 件、未通过 1 件、已下架 3 件", tbl(
            ["商品名称", "规格", "可租数量", "已出租", "出租单价（含税）", "押金单价", "委托店铺组",
             "上架状态", "操作"],
            [['<a href="a04.html">钢板桩租赁 · SP-Ⅳ 拉森钢板桩</a>', "SP-Ⅳ 12m", "240 吨", "12 吨",
              "180.00 元/吨/天", "3,000.00", "华南公司店铺", tag("已上架", "green"),
              '<span class="ops"><a href="a04.html">下架</a><a href="a01.html">编辑</a></span>'],
             ['<a href="a03.html">钢便桥贝雷片 · 321型</a>', "321型 3m", "860 片", "8 片",
              "95.00 元/片/天", "1,200.00", "东南组店铺", tag("审核中", "orange"),
              '<span class="ops"><a href="a03.html">查看审核</a><a href="a01.html">编辑</a></span>'],
             ['<a href="a01.html">盘扣式脚手架 · 48系</a>', "48×3.0", "1,200 套", "25 套",
              "60.00 元/套/天", "800.00", "西部组店铺", tag("已上架", "green"),
              '<span class="ops"><a href="a04.html">下架</a><a href="a01.html">编辑</a></span>'],
             ['<a href="a03.html">液压振动锤 · DZ90</a>', "DZ90", "6 台", "2 台",
              "1,500.00 元/台/天", "20,000.00", "华南公司店铺", tag("审核不通过", "red"),
              '<span class="ops"><a href="a03.html">查看原因</a><a href="a01.html">修改重提</a></span>'],
             ['<a href="a04.html">钢板桩租赁 · SP-Ⅱ</a>', "SP-Ⅱ 9m", "600 吨", "70 吨",
              "150.00 元/吨/天", "2,400.00", "北部组店铺", tag("已下架", "grey"),
              '<span class="ops"><a href="a04.html">重新上架</a></span>']],
            align=["", "", "ctr", "ctr", "num", "num", "", "ctr", ""]) + pager("共 24 条", 3)) +
        note("<b>取消委托：</b>直至服务商下架商品、不再接单，即可取消委托。下架后不再产生新的承租订单，"
             "已出租部分按实际租期继续结算。", "warn")))

P["a03"] = dict(
    title="提交审核 / 审核结果",
    crumbs=["委托方侧（出租方）", "提交审核 / 审核结果"],
    body=lambda: (
        steps(["新增出租商品", "自动委托 → 审核", "上架", "接单", "发货", "委托结算", "开票"], 1) +
        card("审核进度", tbl(["环节", "处理方", "处理人", "处理时间", "结果", "意见"],
            [["新增出租商品", "委托方", "张三", "2026-03-01 09:10", tag("已提交", "blue"), "—"],
             ["自动委托", "系统", "—", "2026-03-01 09:10", tag("已委托", "blue"),
              "自动委托给华南公司 · 华南公司店铺"],
             ["商品审核", "服务方", "王审核", "2026-03-01 11:20", tag("不通过", "red"),
              "商品图片不清晰，且未提供材质证明，请补充后重新提交"],
             ["上架", "服务方", "—", "—", tag("未触发", "grey"), "—"]],
            align=["", "", "", "", "ctr", ""])) +
        card("当前状态", '<div class="grid g2">' + kv([
            ("商品名称", "液压振动锤 · DZ90"),
            ("审核结果", (tag("不通过", "red"), "strong")),
            ("审核人 / 时间", "王审核 / 2026-03-01 11:20"),
            ("不通过原因", "商品图片不清晰，未提供材质证明"),
            ("下一步", "修改商品信息后重新提交审核"),
        ]) + '</div>' +
        note("审核通过后由服务方执行 <b>上架</b>，商品即出现在承租方的【委托商品列表】。", "blue")) +
        btnrow([btn("返回商品管理", "", href="a02.html"), btn("修改并重新提交", "primary", href="a01.html")])))

P["a04"] = dict(
    title="上架",
    crumbs=["委托方侧（出租方）", "上架"],
    body=lambda: (
        steps(["新增出租商品", "自动委托 → 审核", "上架", "接单", "发货", "委托结算", "开票"], 2) +
        party("c", '<b>上架：</b>服务方审核通过后上架，商品对外可承租；下架后不再接单，可取消委托。') +
        card("商品上架信息", kv([
            ("商品名称", ("钢板桩租赁 · SP-Ⅳ 拉森钢板桩", "strong")),
            ("规格型号", "SP-Ⅳ 12m"),
            ("委托方", "中铁建华东公司"),
            ("服务方 / 店铺组", "华南公司 · 华南公司店铺"),
            ("可租数量", "240 吨"),
            ("出租单价（含税）", ("180.00 元/吨/天", "money")),
            ("押金单价", ("3,000.00 元/吨", "money")),
            ("最少起租期", "30 天"),
            ("委托费用率", "3%"),
            ("上架状态", tag("已上架", "green")),
            ("上架时间", "2026-03-01 11:25"),
            ("上架操作人", "王审核（服务方）"),
        ], "g3")) +
        card("上架 / 下架操作", frow("当前状态",
             '<div class="radios"><label class="chk"><input type="radio" name="sj" checked>已上架（可承租）</label>'
             '<label class="chk"><input type="radio" name="sj">下架（不再接单）</label></div>') +
             frow("下架原因", '<textarea class="full" style="max-width:720px" '
                  'placeholder="选择下架时必填，如：项目结束、设备检修"></textarea>') +
             note("<b>下架影响：</b>不再产生新的承租订单；已出租部分仍按实际租期结算，"
                  "直至租期结束后完成委托结算，即可取消委托。", "warn")) +
        btnrow([btn("返回商品管理", "", href="a02.html"), btn("保存", "primary", href="a02.html")])))

P["a05"] = dict(
    title="我的出租订单",
    crumbs=["委托方侧（出租方）", "我的出租订单"],
    body=lambda: (
        card("", '<div class="filters">'
             '<div class="f"><label>出租订单号</label>%s</div>'
             '<div class="f"><label>发货单号</label>%s</div>'
             '<div class="f"><label>订单状态</label>%s</div>'
             '<div class="acts">%s%s</div></div>'
             % (inp("", "w-md"), inp("", "w-md"),
                sel(["全部", "已接单", "待发货", "已发货", "已签收", "待对账", "已结算", "已开票"]),
                btn("重置"), btn("查询", "primary")), "tight") +
        card("出租订单列表", "共 16 笔 · 委托方视角：同一笔承租订单，服务方开单、委托方实际发货", tbl(
            ["出租订单号", "商品名称", "承租方", "承租数量", "服务方店铺组", "发货单号", "订单状态", "操作"],
            [['<a href="s04.html">ZLCZ-20260301-0007</a>', "钢板桩租赁 · SP-Ⅳ", "张三", "12 吨",
              "华南公司店铺", '<a href="s04.html">FHD-20260305-0031</a>', tag("待发货", "orange"),
              '<span class="ops"><a href="s04.html">查看发货单</a><a href="javascript:;">确认发货</a></span>'],
             ['<a href="a06.html">ZLCZ-20260220-0003</a>', "盘扣式脚手架 · 48系", "张三", "25 套",
              "西部组店铺", "FHD-20260222-0018", tag("待对账", "blue"),
              '<span class="ops"><a href="a06.html">创建销售对账单</a></span>'],
             ['<a href="a07.html">ZLCZ-20260210-0005</a>', "钢板桩租赁 · SP-Ⅱ", "陈工", "40 吨",
              "北部组店铺", "FHD-20260212-0009", tag("对账中", "blue"),
              '<span class="ops"><a href="a07.html">复核对账单</a></span>'],
             ['<a href="a09.html">ZLCZ-20260112-0002</a>', "液压振动锤 · DZ90", "张三", "2 台",
              "华南公司店铺", "FHD-20260114-0003", tag("待归还确认", "orange"),
              '<span class="ops"><a href="a09.html">商品归还确认</a></span>'],
             ['<a href="a10.html">ZLCZ-20251201-0009</a>', "钢板桩租赁 · SP-Ⅱ", "张三", "30 吨",
              "华南公司店铺", "FHD-20251203-0021", tag("待开票", "orange"),
              '<span class="ops"><a href="a10.html">新增开票</a></span>']],
            align=["", "", "", "ctr", "", "", "ctr", ""]) + pager("共 16 条", 4)) +
        note("发货说明：<b>发货单由服务方新增并提交，实际发货由委托方（出租方）按发货单详情进行</b>。"
             "委托方在发货单中确认发货后，承租方侧可进行签收。", "warn")))

P["a06"] = dict(
    title="创建销售对账单 / 确认",
    crumbs=["委托方侧（出租方）", "创建销售对账单"],
    body=lambda: (
        steps(["新增出租商品", "审核", "上架", "接单", "发货", "委托结算", "开票"], 5) +
        party("c", '<b>销售对账单（委托方视角）</b>：服务方创建租金对账单 → 委托方对应生成销售对账单，'
                   '用于与服务方做委托结算。') +
        card("销售对账单信息", kv([
            ("销售对账单号", "XSDZ-20260331-0011"),
            ("关联服务方租金对账单", "DZD-20260405-0012"),
            ("关联出租订单号", "ZLCZ-20260220-0003"),
            ("承租方", "张三 / 中铁建华南项目部"),
            ("服务方", "华南公司 · 西部组店铺"),
            ("对账周期", "2026-02-20 至 2026-03-21"),
            ("租金合计（含税）", ("37,500.00 元", "money")),
            ("委托费用率 / 服务费", "3% / 1,125.00 元"),
            ("应付委托方", ("36,375.00 元", "money")),
            ("确认状态", tag("待委托方确认", "orange")),
        ], "g3")) +
        card(fsec("对账明细") +
             tbl(["序号", "商品名称", "规格", "已出租数量", "单位", "租期", "出租单价（含税）",
                  "租金金额", "服务费率", "服务费", "应付委托方"],
                 [["1", "盘扣式脚手架 · 48系", "48×3.0", "20", "套", "30 天", "60.00", "36,000.00",
                   "3%", "1,080.00", "34,920.00"],
                  ["2", "盘扣式脚手架 · 48系", "48×3.0", "5", "套", "5 天", "60.00", "1,500.00",
                   "3%", "45.00", "1,455.00"]],
                 align=["ctr", "", "", "ctr", "ctr", "ctr", "num", "num", "ctr", "num", "num"], cls="compact") +
             '<div class="sum-bar"><span>租金合计 <b>37,500.00</b> 元</span>'
             '<span>服务费合计 <b>1,125.00</b> 元</span>'
             '<span class="amt">应付委托方 <b>36,375.00</b> 元</span></div>' +
             frow("确认结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="c6" checked>确认，金额无误</label>'
                  '<label class="chk"><input type="radio" name="c6">有异议，退回服务方</label></div>', True) +
             frow("说明", '<textarea class="full" style="max-width:720px" placeholder="选填"></textarea>')) +
        btnrow([btn("导出", "ghost"), btn("确认销售对账单", "primary", href="a07.html")])))

P["a07"] = dict(
    title="复核对账单 / 确认",
    crumbs=["委托方侧（出租方）", "复核对账单"],
    body=lambda: (
        card("复核对账单", "服务方已确认，等待委托方复核", tbl(
            ["销售对账单号", "关联租金对账单", "承租方", "对账周期", "租金合计", "服务费",
             "应付委托方", "状态", "操作"],
            [['<a href="a07.html">XSDZ-20260331-0011</a>', "DZD-20260405-0012", "张三",
              "2026-02-20 ~ 03-21", "37,500.00", "1,125.00", "36,375.00", tag("待复核", "orange"),
              '<span class="ops"><a href="javascript:;">复核确认</a></span>'],
             ['<a href="a07.html">XSDZ-20260331-0013</a>', "DZD-20260406-0015", "陈工",
              "2026-02-10 ~ 03-11", "128,400.00", "3,852.00", "124,548.00", tag("已复核", "green"),
              '<span class="ops"><a href="javascript:;">查看</a></span>']],
            align=["", "", "", "", "num", "num", "num", "ctr", ""])) +
        card(fsec("复核意见 · XSDZ-20260331-0011") +
             frow("复核结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="fh" checked>确认无误</label>'
                  '<label class="chk"><input type="radio" name="fh">有异议，退回服务方</label></div>', True) +
             frow("复核人 / 时间", inp("张三 / 2026-04-05 16:40", "w-lg", disabled=True)) +
             frow("异议说明", '<textarea class="full" style="max-width:720px" placeholder="选择“有异议”时必填"></textarea>') +
             note("复核确认后进入 <b>到账确认</b>：服务方按委托结算结果付款给委托方，委托方确认到账。", "blue")) +
        btnrow([btn("下载对账单", "ghost"), btn("确认对账单", "primary", href="a08.html")])))

P["a08"] = dict(
    title="到账确认",
    crumbs=["委托方侧（出租方）", "到账确认"],
    body=lambda: (
        card("到账信息", kv([
            ("销售对账单号", "XSDZ-20260331-0011"),
            ("关联出租订单号", "ZLCZ-20260220-0003"),
            ("服务方", "华南公司"),
            ("应付委托方", ("36,375.00 元", "money")),
            ("实际到账", ("36,375.00 元", "money")),
            ("到账账户", "中铁建华东公司基本户 · 尾号 3021"),
            ("到账日期", "2026-04-10"),
            ("到账状态", tag("已到账", "green")),
        ], "g2")) +
        card(fsec("确认操作") +
             frow("到账凭证", '<div class="upload"><span class="plus">+</span><span>上传银行回单</span></div>') +
             frow("备注", '<textarea class="full" style="max-width:720px" placeholder="选填"></textarea>') +
             note("到账确认后，委托方对该笔租金的结算完成；后续按租期结束的商品进行 <b>新增开票</b>。", "blue")) +
        btnrow([btn("返回", "", href="a05.html"), btn("确认到账", "primary", href="a09.html")])))

P["a09"] = dict(
    title="商品归还确认",
    crumbs=["委托方侧（出租方）", "商品归还确认"],
    body=lambda: (
        steps(["提交订单", "审核", "押金付款", "接单发货", "签收", "对账付款", "归还", "押金退还", "开票", "结束"], 6) +
        party("c", '<b>商品归还确认：</b>委托方确认后，系统把 <b>“商品已归还”状态同步给服务方</b>，'
                   '服务方据此进行押金结算。') +
        card("待归还确认", tbl(
            ["归还单号", "出租订单号", "商品名称", "承租方", "归还数量", "归还方式", "归还时间", "操作"],
            [['<a href="a09.html">GHD-20260406-0005</a>', "ZLCZ-20260205-0011", "钢便桥贝雷片 · 321型",
              "张三", "7 片", "承租方送回", "2026-04-07",
              '<span class="ops"><a href="javascript:;">确认归还</a></span>'],
             ['<a href="a09.html">GHD-20260226-0002</a>', "ZLCZ-20260112-0002", "液压振动锤 · DZ90",
              "张三", "2 台", "承租方送回", "2026-02-26", tag("已确认", "green")]],
            align=["", "", "", "", "ctr", "", "", ""])) +
        card(fsec("归还验收 · GHD-20260406-0005") +
             tbl(["序号", "商品名称", "规格", "归还数量", "单位", "外观状况", "验收结论", "损耗说明"],
                 [["1", "钢便桥贝雷片 · 321型", "321型 3m", "7", "片", "良好", "验收合格", "—"],
                  ["2", "钢便桥贝雷片销轴", "φ50", "32", "个", "良好", "验收合格", "—"]],
                 align=["ctr", "", "", "ctr", "ctr", "", "", ""]) +
             frow("验收结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="ys" checked>全部验收合格，同意入库</label>'
                  '<label class="chk"><input type="radio" name="ys">部分损坏，需扣减押金</label></div>', True) +
             frow("验收人 / 时间", inp("张三 / 2026-04-07 15:20", "w-lg", disabled=True)) +
             frow("验收凭证", '<div class="upload"><span class="plus">+</span><span>上传过磅单</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>上传入库单</span></div>') +
             note("<b>确认后自动同步：</b>服务方侧该订单状态变为“商品已归还”，"
                  "服务方【押金结算 / 新增押金退还单】节点被激活。", "blue")) +
        btnrow([btn("返回", "", href="a05.html"), btn("确认商品已归还", "primary", href="s09.html")])))

P["a10"] = dict(
    title="新增开票",
    crumbs=["委托方侧（出租方）", "新增开票"],
    body=lambda: (
        steps(["新增出租商品", "审核", "上架", "接单", "发货", "委托结算", "开票"], 6) +
        party("c", '<b>开票说明（流程图）：</b>根据已出租的商品，按委托费用进行开票；'
                   '租期已结束的商品按委托价格进行开票。') +
        card("开票依据", kv([
            ("开票方", "中铁建华东公司（委托方 / 出租方）"),
            ("开票对象", "承租方 / 服务方"),
            ("开票依据", "已出租的商品 + 实际租期 + 委托价格"),
            ("本期可开票租金", ("106,200.00 元", "money")),
            ("其中超期租金", ("3,420.00 元", "money")),
            ("价税合计", ("109,620.00 元", "money")),
            ("税率 / 税额", "13% / 12,610.62 元"),
            ("对应结算单", "WJJS-20260331-0002"),
        ], "g3")) +
        card(fsec("新增开票") +
             frow("开票类型", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="k10" checked>增值税专用发票</label>'
                  '<label class="chk"><input type="radio" name="k10">增值税普通发票</label>'
                  '<label class="chk"><input type="radio" name="k10">电子发票</label></div>', True) +
             frow("受票方", inp("张三 / 中铁建华南项目部", "w-lg", disabled=True)) +
             frow("开票项目", inp("周转材料租赁费", "w-lg"), True) +
             tbl(["序号", "项目", "来源单号", "含税金额", "税率", "税额"],
                 [["1", "钢板桩租金", "DZD-20260102-0007", "106,200.00", "13%", "12,212.39"],
                  ["2", "超期租金", "DZD-20260102-0007", "3,420.00", "13%", "398.23"]],
                 align=["ctr", "", "", "num", "ctr", "num"], cls="compact") +
             '<div class="sum-bar"><span>价税合计 <b>109,620.00</b> 元</span>'
             '<span class="amt">税额 <b>12,610.62</b> 元</span></div>' +
             frow("发票号码", inp("04412026 00318866", "w-md"), True) +
             frow("开票日期", inp("2026-04-15", "w-md"), True) +
             frow("发票附件", '<div class="upload"><span class="plus">+</span><span>上传 PDF</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>上传 OFD</span></div>')) +
        btnrow([btn("暂存", "ghost"), btn("确认开票", "primary", href="a11.html")])))

P["a11"] = dict(
    title="确认发票",
    crumbs=["委托方侧（出租方）", "确认发票"],
    body=lambda: (
        steps(["新增出租商品", "审核", "上架", "接单", "发货", "委托结算", "开票"], 6) +
        card("待确认发票", tbl(["发票单号", "开票方", "受票方", "开票项目", "含税金额", "税率",
                                "开票日期", "状态", "操作"],
            [['<a href="a11.html">FP-20260416-0008</a>', "华南公司", "中铁建华东公司", "委托出租服务费",
              "8,052.00", "6%", "2026-04-16", tag("待确认", "orange"),
              '<span class="ops"><a href="javascript:;">确认发票</a></span>'],
             ['<a href="a11.html">FP-20260415-0006</a>', "中铁建华东公司", "张三", "周转材料租赁费",
              "109,620.00", "13%", "2026-04-15", tag("已确认", "green"),
              '<span class="ops"><a href="javascript:;">查看</a></span>']],
            align=["", "", "", "", "num", "ctr", "", "ctr", ""])) +
        card(fsec("确认操作 · FP-20260416-0008") +
             kv([("发票单号", "FP-20260416-0008"), ("开票方", "华南公司"),
                 ("受票方", "中铁建华东公司"), ("开票项目", "委托出租服务费"),
                 ("价税合计", ("8,052.00 元", "money")), ("税率 / 税额", "6% / 455.77 元")], "g3") +
             frow("发票文件", '<div class="upload"><span class="plus">+</span><span>查看 PDF</span></div>'
                  '<div class="upload"><span class="plus">+</span><span>查看 OFD</span></div>') +
             frow("确认结果", '<div class="radios">'
                  '<label class="chk"><input type="radio" name="k11" checked>确认收票，信息无误</label>'
                  '<label class="chk"><input type="radio" name="k11">信息有误，退回重开</label></div>', True) +
             note("双方发票确认完成后，该笔委托出租业务全流程结束。", "blue")) +
        btnrow([btn("返回", "", href="a05.html"), btn("确认发票", "primary", href="b15.html")])))

# ---------------------------------------------------------------- 索引
def index_body():
    cols = []
    dots = ["", "b", "c"]
    for i, g in enumerate(NAV["groups"]):
        items = []
        for j, p in enumerate(g["pages"]):
            items.append('<li><a href="%s.html"><span class="no">%d</span>'
                         '<span>%s</span></a></li>' % (p["id"], j + 1, p["title"]))
        cols.append(
            '<section class="card"><div class="col-hd"><span class="dot %s"></span>%s'
            '<span class="n">%d 页</span></div><ul class="flow-list">%s</ul></section>'
            % (dots[i], g["name"], len(g["pages"]), "".join(items)))
    total = sum(len(g["pages"]) for g in NAV["groups"])
    hero = ('<div class="hero"><h1>委托出租 · 原型</h1>'
            '<p>依据《委托出租业务流程》流程图制作，覆盖 <b>委托方（出租方）</b>、'
            '<b>服务方（华南公司）</b>、<b>承租方</b> 三方全流程，共 %d 个页面。<br>'
            '视觉风格、色彩令牌与交互口径沿用「租售店铺询价原型10.5」原有页面。</p>'
            '<div class="meta"><span><b>%d</b>页面</span><span><b>3</b>参与方</span>'
            '<span><b>2</b>套单据（服务方 / 委托方）</span><span><b>11</b>流程节点</span></div></div>'
            % (total, total))
    mapping = card("流程 → 页面 对照", tbl(
        ["流程图节点", "承租方页面", "服务方页面", "委托方页面"],
        [["开始 · 新增出租商品 · 自动委托", "—", "—", '<a href="a01.html">a01 新增出租商品</a>'],
         ["审核（不通过 / 通过）", "—", '<a href="s02.html">s02 订单审核</a>', '<a href="a03.html">a03 提交审核/结果</a>'],
         ["上架", "—", "—", '<a href="a04.html">a04 上架</a>'],
         ["开始 · 下单 · 是否需要议价", '<a href="b03.html">b03 提交订单</a>', "—", "—"],
         ["接单（分店铺组）", "—", '<a href="s03.html">s03 接单</a>', "—"],
         ["提交审核 · 押金付款", '<a href="b04.html">b04 审核结果</a> / <a href="b05.html">b05 押金付款</a>', "—", "—"],
         ["押金到账确认", "—", '<a href="s05.html">s05 押金到账确认</a>', "—"],
         ["新增发货单 · 提交发货单", "—", '<a href="s04.html">s04 新增发货单</a>', '<a href="a05.html">a05 我的出租订单</a>'],
         ["签收 · 提交签收", '<a href="b07.html">b07 签收</a>', "—", "—"],
         ["新增退租单", '<a href="b08.html">b08 新增退租单</a>', "—", "—"],
         ["创建对账单 · 确认", "—", '<a href="s06.html">s06 创建对账单</a>', '<a href="a06.html">a06 创建销售对账单</a>'],
         ["复核对账单 · 确认", '<a href="b09.html">b09 复核对账单</a>', "—", '<a href="a07.html">a07 复核对账单</a>'],
         ["租金付款 · 到账确认", '<a href="b10.html">b10 租金付款</a>', '<a href="s07.html">s07 到账确认</a>', '<a href="a08.html">a08 到账确认</a>'],
         ["委托结算（依据已出租数量及租期）", "—", '<a href="s08.html">s08 委托结算</a>', "—"],
         ["新增商品归还 · 商品已归还", '<a href="b11.html">b11 新增商品归还</a>', "—", '<a href="a09.html">a09 商品归还确认</a>'],
         ["押金结算 · 新增押金退还单", "—", '<a href="s09.html">s09 押金结算</a>', "—"],
         ["押金退还付款 · 确认押金退还", '<a href="b12.html">b12 确认押金退还</a>', '<a href="s10.html">s10 押金退还付款</a>', "—"],
         ["押金到账确认", '<a href="b13.html">b13 押金到账确认</a>', "—", "—"],
         ["新增开票 · 确认发票", '<a href="b14.html">b14 确认发票</a>', '<a href="s11.html">s11 新增开票</a>', '<a href="a10.html">a10 新增开票</a> / <a href="a11.html">a11 确认发票</a>'],
         ["结束订单", '<a href="b15.html">b15 结束订单</a>', "—", "—"]],
        align=["", "", "", ""], cls="compact"))
    rules = card("关键业务规则（来自流程图）", '<div class="grid g2">' + kv([
        ("发货主体", "发货单由服务方新增提交，实际发货由委托方按发货单详情进行"),
        ("接单范围", "东南组 / 西部组 / 北部组 / 系统外组 / 华南公司店铺"),
        ("押金流", "押金付款 → 到账确认 → 押金结算 → 押金退还付款 → 确认退还 → 到账确认"),
        ("对账时点", "需租期结束后才可发起对账"),
        ("委托结算", "依据已出租的商品数量及租期结束后做委托结算"),
        ("取消委托", "直至服务商下架商品、不再接单，即可取消委托"),
        ("开票口径", "根据已出租商品、按委托费用开票；租期结束商品按委托价格开票"),
        ("单据体系", "服务方一套（租金对账单 / 押金退还单），委托方一套（销售对账单 / 开票）"),
    ], "g2") + '</div>')
    return hero + '<div class="cols">%s</div>' % "".join(cols) + '<div style="height:14px"></div>' + mapping + rules

P["index"] = dict(title="原型总览", crumbs=["原型总览"], body=index_body, is_index=True)

# ================================================================ 输出
def main():
    # 样式表必须位于原型根目录；写出前把 var(--x) 展开为字面值
    src_css = os.path.join(HERE, "app.css")
    dst_css = os.path.join(ROOT, "app.css")
    if os.path.exists(src_css):
        import flatten
        text = io.open(src_css, encoding="utf-8").read() if False else open(
            src_css, encoding="utf-8").read()
        text = re.sub(r"/\*.*?\*/", "", text, count=1, flags=re.S)
        out = flatten.flatten(text)
        header = ("/* 委托出租原型 · 样式表（颜色字面值，无 CSS 变量依赖）\n"
                  "   主色/链接 #1E98D7  深蓝按钮 #0A54BA  浅蓝底 #EBF2FB\n"
                  "   文字 #333333/#666666/#999999  金额 #E1251B  成功 #52C41A  警告 #FAAD14\n"
                  "   边框 #E5E6EB  表头底 #F7F8FA  页面底 #F2F2F2  字体 微软雅黑  圆角 2px */\n")
        with open(dst_css, "w", encoding="utf-8", newline="\n") as f:
            f.write(header + out.lstrip())
        left = (header + out).count("var(")
        if left:
            print("!! 样式表仍有 %d 处 var() 未展开" % left)
    args = [a for a in sys.argv[1:]]
    if args:
        targets = [k for k in args if k in P]
    else:
        targets = list(P.keys())
    # 保证 index 与 nav 中所有页面都存在
    missing = [pid for pid in BY_ID if pid not in P]
    if missing and not args:
        print("!! 以下导航页面缺少内容定义：", ", ".join(missing))
    n = 0
    for pid in targets:
        page = P[pid]
        if pid == "index":
            body = page["body"]()
            hd = ''
        else:
            body = page["body"]()
            hd = ''
        out = shell("index" if pid == "index" else pid, page["title"], body, page["crumbs"])
        with open(os.path.join(ROOT, pid + ".html"), "w", encoding="utf-8") as f:
            f.write(out)
        n += 1
    print("已生成 %d 个页面 -> %s" % (n, ROOT))
    if missing:
        print("缺失：", ", ".join(missing))

    # 入口页：双击 start.html 即可打开原型
    start = ('<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n'
             '<title>委托出租原型</title>\n'
             '<meta http-equiv="refresh" content="0; url=index.html">\n'
             '<style>body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;'
             'display:flex;align-items:center;justify-content:center;height:100vh;margin:0;'
             'background:#F2F2F2;color:#3F3F46}a{color:#246DD3}</style>\n</head>\n<body>\n'
             '<p>正在打开委托出租原型… 如果没有自动跳转，请点击 '
             '<a href="index.html">原型总览</a>。</p>\n'
             '</body>\n</html>\n')
    with open(os.path.join(ROOT, "start.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(start)
    print("入口页：start.html")

if __name__ == "__main__":
    main()
