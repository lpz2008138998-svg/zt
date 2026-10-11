# -*- coding: utf-8 -*-
"""打包「上线包.zip」：只装需要上传到线上站点的文件，并附一份上传说明。

用法:
    python make_deploy_zip.py
输出:
    项目根目录\\上线包.zip
"""
import io, os, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
PROTO = os.path.dirname(HERE)
ROOT = os.path.dirname(PROTO)

OUT = os.path.join(ROOT, "上线包.zip")

SKIP_DIRS = {"_build", "__pycache__", ".git"}
SKIP_EXT = {".bak", ".pyc"}

# (绝对路径, zip 内的相对路径)
items = []

# 1) 整个 委托出租原型 文件夹（排除 _build / 缓存 / 备份）
for base, dirs, files in os.walk(PROTO):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for fn in files:
        if os.path.splitext(fn)[1].lower() in SKIP_EXT:
            continue
        full = os.path.join(base, fn)
        rel = os.path.relpath(full, ROOT)
        items.append((full, rel))

# 2) 根目录下的新增 / 更新文件
for name in ("委托出租功能_Demo.html", "委托出租原型.html", "原型导航.html"):
    full = os.path.join(ROOT, name)
    if os.path.exists(full):
        items.append((full, name))

# 3) 上传说明
README = """上线包 · 上传说明
========================================

【怎么用】
解压后，把里面的文件按原有目录结构覆盖到线上站点（WorkBuddy 工作空间 / 云端工作区）的同一位置。
即：这个压缩包解压出来的东西，直接对应线上站点的根目录。

【这次包含的文件】
  委托出租原型\\            ← 新增整个文件夹（40 个页面 + app.css）
  委托出租功能_Demo.html    ← 更新（原占位版 → 已接入原型，菜单可在右侧打开原型页面）
  委托出租原型.html         ← 新增入口页
  原型导航.html             ← 新增导航页

【不要覆盖的文件（重要）】
  门户.html
    线上那份（47788 字符）比你本地的（32716 字符）多了一整套 DEMO 导航脚本：
    管理「委托业务」下拉菜单的 SUB_MAP / NAV_MAP。本地那份没有这些代码，
    如果拿本地的覆盖上去，下拉菜单会坏掉。

  租售店铺（lxj0530）.html
  该文件本地改过（在「出租业务」右侧加了「委托出租」页签），
  但如果线上那份也不同，覆盖可能丢失线上已有的改动，建议先比对再决定。

【上传后还要改 1 行（让「委托出租」菜单打开新原型）】
  线上 门户.html 里有这样一段：

      var SUB_MAP = {
          '委托出租': { label: '委托出租', frame: 'u1995_input', src: '委托出租功能_Demo.html' },
          '委托出售': { label: '委托出售', frame: 'u1996_input', src: '委托出售功能_Demo.html' }
      };

  把 '委托出租' 那一行的 src 改成：

          '委托出租': { label: '委托出租', frame: 'u1995_input', src: '委托出租原型/index.html' },

  改完保存即可。这样点门户页「委托业务 → 委托出租」，直接进新原型的总览页。

  如果想保留 Demo 外壳（左侧 6 个菜单可点开功能页），就保持 src 为
  '委托出租功能_Demo.html' —— 因为本包里的那个文件已经改好了。

【验证】
  上传后访问：
    https://consignment-sale-demo.app.workbuddy.host/委托出租原型/index.html
  能打开就说明上传成功（在此之前是 404）。

生成时间：{ts}
"""

import datetime
readme = README.replace("{ts}", datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for full, rel in items:
        z.write(full, rel)
    z.writestr("上线包说明.txt", readme.encode("utf-8"))

print("已生成:", OUT)
print("大小: %.2f MB" % (os.path.getsize(OUT) / 2**20))
print("文件数: %d" % (len(items) + 1))
print()
print("包内清单（前 20 个）:")
with zipfile.ZipFile(OUT) as z:
    names = z.namelist()
for n in sorted(names)[:20]:
    print("   ", n)
print("    ...（共 %d 项）" % len(names))
