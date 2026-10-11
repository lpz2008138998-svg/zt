# -*- coding: utf-8 -*-
"""在「门户」页加第四个页签「委托出租」，点击进入委托出租原型。

改动对象（先自动备份为 *.bak）：
  1) 租售店铺（lxj0530）.html  —— 插入页签元素
  2) files/租售店铺（lxj0530）/styles.css —— 追加页签样式

设计：纯新增，不改动原有三个页签的任何代码；页签以新窗口方式打开原型，
      避免与 Axure 播放器内嵌冲突。
用法：
  python add_rent_tab.py            # 安装
  python add_rent_tab.py --revert   # 还原
"""
import io, os, re, shutil, sys

# 按脚本位置自动定位：_build -> 委托出租原型 -> 项目根目录
HERE = os.path.dirname(os.path.abspath(__file__))
PROTO = os.path.dirname(HERE)
ROOT = os.path.dirname(PROTO)
PAGE = os.path.join(ROOT, "租售店铺（lxj0530）.html")
CSS = os.path.join(ROOT, "files", "租售店铺（lxj0530）", "styles.css")

ANCHOR = '<!-- 业务模块 (Dynamic panel) -->'
MARK = 'id="u9001"'

TAB_HTML = '''<!-- 委托出租 (矩形·新增页签，点击进入委托出租原型) -->
      <div id="u9001" class="ax_default _文本段落 transition notrs" data-label="委托出租" title="点击进入委托出租原型">
        <div id="u9001_div"></div>
        <div id="u9001_text" class="text ">
          <p><span>委托出租</span></p>
        </div>
      </div>

      '''

TAB_CSS = '''

/* ===== 新增：委托出租 页签（点击进入委托出租原型） ===== */
#u9001 {
  border-width:0px;
  position:absolute;
  left:1110px;
  top:623px;
  width:145px;
  height:51px;
  display:flex;
  transition:none;
  transform-origin:50% 50%;
  font-family:"PingFangSC-Regular", "PingFang SC", sans-serif;
  font-weight:400;
  font-style:normal;
  font-size:30px;
  cursor:pointer;
}
#u9001_div {
  border-width:0px;
  position:absolute;
  left:0px;
  top:0px;
  width:145px;
  height:51px;
  background:inherit;
  background-color:rgba(255, 255, 255, 0);
  border-left:0px;
  border-top:0px;
  border-right:0px;
  border-radius:0px;
  filter:drop-shadow(none);
  transition:none;
  box-sizing:border-box;
  border-bottom:4px solid rgba(255, 255, 255, 0);
}
#u9001 .text {
  position:absolute;
  align-self:flex-start;
  padding:0px 0px 0px 0px;
  box-sizing:border-box;
  width:100%;
}
#u9001_text {
  border-width:0px;
  white-space:nowrap;
  text-transform:none;
}
/* 悬停：变蓝并加下划线，提示可点击 */
#u9001:hover #u9001_div {
  border-bottom-color:rgba(11, 87, 190, 1);
}
#u9001:hover #u9001_text p span {
  color:rgba(11, 87, 190, 1);
  font-weight:650;
}
#u9001:hover {
  cursor:pointer;
}
#u9001:active #u9001_text p span {
  color:rgba(11, 87, 190, 1);
}
/* ===== 新增页签样式结束 ===== */
'''

TAB_JS = '''
<script type="text/javascript">
/* 新增：委托出租 页签点击跳转（不改动原有交互） */
(function () {
  function bind() {
    var el = document.getElementById('u9001');
    if (!el || el.getAttribute('data-bound') === '1') { return; }
    el.setAttribute('data-bound', '1');
    el.style.cursor = 'pointer';
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      window.open('委托出租原型/index.html', '_blank');
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
  // Axure 可能在初始化后重建节点，兜底再绑一次
  window.setTimeout(bind, 1500);
})();
</script>
</body>'''


def backup(path):
    bak = path + ".bak"
    if not os.path.exists(bak):
        shutil.copyfile(path, bak)
        print("  已备份 ->", os.path.basename(bak))
    else:
        print("  备份已存在，跳过 ->", os.path.basename(bak))


def install():
    # ---------- 1) 页面 ----------
    s = io.open(PAGE, encoding="utf-8").read()
    if MARK in s:
        print("页面里已存在页签，跳过插入。")
    else:
        if ANCHOR not in s:
            print("!! 找不到插入锚点，未改动页面。")
            return
        backup(PAGE)
        s = s.replace(ANCHOR, TAB_HTML + ANCHOR, 1)
        print("  已插入页签元素（在 出租业务 之后、业务模块 之前）")

    # ---------- 2) 绑定脚本 ----------
    if "data-bound" not in s:
        s = s.replace("</body>", TAB_JS, 1)
        print("  已插入点击绑定脚本")
    else:
        print("  绑定脚本已存在，跳过。")

    io.open(PAGE, "w", encoding="utf-8", newline="\n").write(s)

    # ---------- 3) 样式 ----------
    c = io.open(CSS, encoding="utf-8").read()
    if "#u9001" in c:
        print("样式里已存在，跳过追加。")
    else:
        backup(CSS)
        io.open(CSS, "w", encoding="utf-8", newline="\n").write(c + TAB_CSS)
        print("  已追加页签样式")


def revert():
    n = 0
    for path in (PAGE, CSS):
        bak = path + ".bak"
        if os.path.exists(bak):
            shutil.copyfile(bak, path)
            os.remove(bak)
            print("  已还原:", os.path.basename(path))
            n += 1
    if not n:
        print("  没有找到 .bak 备份，无法还原。")


if __name__ == "__main__":
    if "--revert" in sys.argv:
        print("=== 还原 ===")
        revert()
    else:
        print("=== 安装「委托出租」页签 ===")
        install()
        print("完成。")
