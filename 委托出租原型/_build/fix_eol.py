# -*- coding: utf-8 -*-
"""把改动后的文件换行符从 LF 转回 CRLF，与原导出文件保持一致。"""
import os

FILES = [
    r"C:\Users\ASUS\Desktop\中铁项目\租售店铺询价原型10.5.原\租售店铺（lxj0530）.html",
    r"C:\Users\ASUS\Desktop\中铁项目\租售店铺询价原型10.5.原\files\租售店铺（lxj0530）\styles.css",
]

for f in FILES:
    b = open(f, "rb").read()
    before_crlf = b.count(b"\r\n")
    lone_lf = b.count(b"\n") - before_crlf
    if lone_lf == 0:
        print("%-30s 已是 CRLF，无需转换" % os.path.basename(f))
        continue
    # 先把已有 CRLF 临时标记，避免重复转换
    tmp = b.replace(b"\r\n", b"\x00")
    tmp = tmp.replace(b"\n", b"\r\n")
    tmp = tmp.replace(b"\x00", b"\r\n")
    open(f, "wb").write(tmp)
    nb = open(f, "rb").read()
    print("%-30s %d -> %d 字节；CRLF=%d，独立LF=%d"
          % (os.path.basename(f), len(b), len(nb),
             nb.count(b"\r\n"), nb.count(b"\n") - nb.count(b"\r\n")))
