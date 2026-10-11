# -*- coding: utf-8 -*-
"""把 app.css 中的 var(--x) 全部展开为字面值，并移除 :root 块。

这样样式表不再依赖 CSS 自定义属性的解析，兼容性最好。
用法：python flatten.py <输入.css> <输出.css>
"""
import io, re, sys, os

VARS = {
    "--brand": "#1E98D7",
    "--brand-dark": "#0A54BA",
    "--brand-hover": "#40A9E0",
    "--brand-tint": "#EBF2FB",
    "--brand-tint2": "#F5F9FF",
    "--brand-edge": "#BFDDF5",
    "--text": "#333333",
    "--text-sub": "#666666",
    "--text-weak": "#999999",
    "--line": "#E5E6EB",
    "--line-soft": "#D9D9D9",
    "--line-hard": "#BFBFBF",
    "--danger": "#F5222D",
    "--danger2": "#E1251B",
    "--success": "#52C41A",
    "--warn": "#FAAD14",
    "--bg": "#F2F2F2",
    "--bg-cell": "#F7F8FA",
    "--bg-row": "#FAFAFA",
    "--white": "#FFFFFF",
    "--radius": "2px",
    "--sidebar": "208px",
}

def flatten(text):
    # 先处理带 fallback 的 var()，如 var(--x, #fff)
    def repl(m):
        name = m.group(1).strip()
        return VARS.get(name, m.group(0))
    # var(--name) 或 var(--name, fallback)
    text = re.sub(r"var\(\s*(--[A-Za-z0-9-]+)\s*(?:,[^()]*)?\)", repl, text)
    # 移除 :root{...} 块
    text = re.sub(r":root\s*\{[^{}]*\}\s*", "", text, count=1)
    return text

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else \
        r"C:\Users\ASUS\Desktop\中铁项目\租售店铺询价原型10.5\委托出租原型\_build\app.css"
    dst = sys.argv[2] if len(sys.argv) > 2 else src
    text = io.open(src, encoding="utf-8").read()
    left_before = text.count("var(")
    # 保留文件顶部说明注释，但改成纯 ASCII，避免任何编码风险
    text = re.sub(r"/\*.*?\*/", "", text, count=1, flags=re.S)
    out = flatten(text)
    left_after = out.count("var(")
    header = ("/* 委托出租原型 · 设计系统（已展开变量，无 :root 依赖）\n"
              "   主色 #246DD3  深蓝 #0A54BA  浅蓝底 #EBF2FB  文字 #3F3F46/#7E8693/#999999\n"
              "   危险 #F00000  成功 #16D585  页面底 #F2F2F2  字体 PingFang SC  圆角 4px */\n")
    out = header + out.lstrip()
    io.open(dst, "w", encoding="utf-8", newline="\n").write(out)
    print("var() 出现次数：%d -> %d ；:root 剩余：%d ；输出 %d 字节"
          % (left_before, left_after, out.count(":root"), len(out.encode("utf-8"))))
    print("输出文件：", dst)

if __name__ == "__main__":
    main()
