# -*- coding: utf-8 -*-
"""逐行检查 gen.py 的括号平衡（跳过字符串与注释），定位未闭合的行。"""
import sys, io, os

path = r"C:\Users\ASUS\Desktop\中铁项目\租售店铺询价原型10.5\委托出租原型\_build\gen.py"
src = io.open(path, encoding="utf-8").read()
lines = src.split("\n")

i = 0
n = len(lines)
depth = 0
in_str = None
start_line = 1
top_level_starts = []

for ln, line in enumerate(lines, 1):
    j = 0
    while j < len(line):
        ch = line[j]
        if in_str:
            if ch == "\\":
                j += 2
                continue
            if ch == in_str:
                in_str = None
            j += 1
            continue
        if ch == "#":
            break
        if ch in "\"'":
            # 三引号
            if line[j:j + 3] == ch * 3:
                in_str = ch * 3
                j += 3
                continue
            in_str = ch
            j += 1
            continue
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        j += 1
    if in_str and in_str not in ('"""', "'''"):
        print("!! 第 %d 行字符串未闭合: %s" % (ln, line.strip()[:70]))
        in_str = None
    if line.strip().startswith(("P[", "# ---", "# ===")) and depth != 0 and line.strip().startswith("P["):
        print("!! 第 %d 行开始新的页面定义，但上一个块仍差 %d 个闭括号" % (ln, depth))
        depth = 0

print("扫描结束，最终深度 = %d （0 表示全部平衡）" % depth)
