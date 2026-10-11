# -*- coding: utf-8 -*-
"""校验生成的页面：链接是否有落点、div/table 标签是否平衡、是否有占位残留。"""
import os, io, re, glob, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
files = sorted(glob.glob(os.path.join(ROOT, "*.html")))
ids = {os.path.basename(f)[:-5] for f in files}

bad_links, bad_tags, leftovers = [], [], []
for f in files:
    name = os.path.basename(f)
    s = io.open(f, encoding="utf-8").read()
    for m in re.finditer(r'href="([^"#]+)\.html"', s):
        if m.group(1) not in ids:
            bad_links.append("%s -> %s.html" % (name, m.group(1)))
    # 参与统计的标签
    for t in ("div", "table", "section", "span", "tr", "td"):
        o = len(re.findall(r"<%s[\s>]" % t, s))
        c = len(re.findall(r"</%s>" % t, s))
        if o != c:
            bad_tags.append("%s: <%s> %d vs </%s> %d" % (name, t, o, t, c))
    for pat in ("<!--SEC-->", "%s", "None", "{", "}"):
        if pat in s:
            leftovers.append("%s 含 %r" % (name, pat))

print("页面数：%d" % len(files))
print("存在页面：%s" % ", ".join(sorted(ids)))
print("\n-- 断链 --")
print("\n".join(bad_links) if bad_links else "无")
print("\n-- 标签不平衡 --")
print("\n".join(bad_tags) if bad_tags else "无")
print("\n-- 占位/模板残留 --")
print("\n".join(leftovers) if leftovers else "无")
# 顺手统计各页面体积，找出异常小的页面
print("\n-- 体积最小的 5 个 --")
for f in sorted(files, key=os.path.getsize)[:5]:
    print("  %-28s %6d bytes" % (os.path.basename(f), os.path.getsize(f)))
