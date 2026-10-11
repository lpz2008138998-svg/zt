# -*- coding: utf-8 -*-
"""移除「租售店铺（lxj0530）.html」底部新加的「委托出租」页签。

只删这一个页签（u9001）及其样式与绑定脚本，其余一律不动。
用二进制读写，避免破坏原文件的 CRLF 换行。

用法:
    python remove_rent_tab.py
"""
import os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROTO = os.path.dirname(HERE)
ROOT = os.path.dirname(PROTO)
PAGE = os.path.join(ROOT, "租售店铺（lxj0530）.html")
CSS = os.path.join(ROOT, "files", "租售店铺（lxj0530）", "styles.css")

ANCHOR = b'<!-- \xe4\xb8\x9a\xe5\x8a\xa1\xe6\xa8\xa1\xe5\x9d\x97 (Dynamic panel) -->'   # <!-- 业务模块 (Dynamic panel) -->
CSS_START = b'/* ===== \xe6\x96\xb0\xe5\xa2\x9e\xef\xbc\x9a\xe5\xa7\x94\xe6\x89\x98\xe5\x87\xba\xe7\xa7\x9f \xe9\xa1\xb5\xe7\xad\xbe'
CSS_END = b'/* ===== \xe6\x96\xb0\xe5\xa2\x9e\xe9\xa1\xb5\xe7\xad\xbe\xe6\xa0\xb7\xe5\xbc\x8f\xe7\xbb\x93\xe6\x9d\x9f ===== */'

out = []

# ---------------- 1) HTML ----------------
html = open(PAGE, "rb").read()
before = len(html)

if b'id="u9001"' not in html:
    out.append("[跳过] HTML 里没有 u9001 页签")
else:
    # 1a) 删除页签元素（注释 + div 块，直到下一个 <!--）
    pat = re.compile(rb'<!-- \xe5\xa7\x94\xe6\x89\x98\xe5\x87\xba\xe7\xa7\x9f \(.*?-->\r?\n\s*<div id="u9001".*?</div>\r?\n(\s*)</div>\r?\n\r?\n\s*',
                     re.S)
    new, n1 = pat.subn(b'', html, count=1)
    if n1 == 0:
        out.append("[!!] 未能定位页签元素块，未改动 HTML")
    else:
        html = new
        out.append("[OK] 已删除页签元素")

    # 1b) 删除绑定脚本块
    pat2 = re.compile(rb'\r?\n<script type="text/javascript">\r?\n/\* \xe6\x96\xb0\xe5\xa2\x9e\xef\xbc\x9a.*?</script>\r?\n</body>', re.S)
    new2, n2 = pat2.subn(b'\n</body>', html, count=1)
    if n2:
        html = new2
        out.append("[OK] 已删除点击绑定脚本")
    else:
        out.append("[--] 未找到绑定脚本块（可能已删）")

    if html != open(PAGE, "rb").read():
        open(PAGE, "wb").write(html)
        out.append("     HTML: %d -> %d 字节" % (before, len(html)))
    else:
        out.append("     HTML 未变化")

# ---------------- 2) CSS ----------------
css = open(CSS, "rb").read()
i1 = css.find(CSS_START)
i2 = css.find(CSS_END)
if i1 >= 0 and i2 > i1:
    i2_end = i2 + len(CSS_END)
    # 连同前面多余的空行一起删掉
    start = i1
    while start > 0 and css[start-1:start] in (b'\n', b'\r'):
        start -= 1
    css_new = css[:start] + b'\r\n' + css[i2_end:]
    open(CSS, "wb").write(css_new)
    out.append("[OK] 已删除样式块  CSS: %d -> %d 字节" % (len(css), len(css_new)))
else:
    out.append("[跳过] CSS 里没找到样式块标记")

# ---------------- 3) 校验 ----------------
out.append("")
out.append("=== 校验 ===")
h = open(PAGE, "rb").read()
c = open(CSS, "rb").read()
out.append("  HTML 含 u9001          : %s" % ("是（未删净！）" if b'u9001' in h else "否 ✓"))
out.append("  HTML 含绑定脚本        : %s" % ("是" if b'data-bound' in h else "否 ✓"))
out.append("  CSS  含 #u9001         : %s" % ("是（未删净！）" if b'#u9001' in c else "否 ✓"))

# 原有三个页签仍在？
for name in ("销售业务", "采购业务", "出租业务"):
    b = name.encode("utf-8")
    out.append("  保留页签 %-6s     : %s" % (name, "是 ✓" if b in h else "否（出问题了！）"))

sys.stdout.buffer.write("\n".join(out).encode("utf-8", "replace") + b"\n")
