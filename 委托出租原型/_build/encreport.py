# -*- coding: utf-8 -*-
"""把 index.html 的顶栏片段以 unicode 转义输出，避开控制台编码问题。"""
import io, os, re, json, glob

ROOT = r"C:\Users\ASUS\Desktop\中铁项目\租售店铺询价原型10.5\委托出租原型"
out = []

# 1) 全部页面能否按 UTF-8 解码
bad = []
for f in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
    raw = open(f, "rb").read()
    try:
        s = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        bad.append([os.path.basename(f), "decode-error", str(e)])
        continue
    if "\ufffd" in s:
        bad.append([os.path.basename(f), "replacement-char", s.count("\ufffd")])
out.append(["utf8_bad_pages", len(bad)])
out.extend(bad)

# 2) logo 片段（转义）
s = io.open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
m = re.search(r'<div class="logo">.*?</div>', s, re.S)
out.append(["logo_snippet", m.group(0).encode("unicode_escape").decode("ascii") if m else None])

# 3) 顶栏 span 数量
m2 = re.search(r'<header class="app-top">.*?</header>', s, re.S)
hdr = m2.group(0) if m2 else ""
out.append(["header_span_open", hdr.count("<span")])
out.append(["header_span_close", hdr.count("</span>")])
out.append(["header_len", len(hdr)])

# 4) index 页面里的中文是否正常（取样）
out.append(["has_brand_cn", "委托出租" in s])
out.append(["has_logo_text", "租售店铺" in s])
out.append(["has_mark", '<span class="mark">租</span>' in s])

import sys
sys.stdout.buffer.write(json.dumps(out, ensure_ascii=True, indent=1).encode("ascii"))
sys.stdout.buffer.write(b"\n")
