/* ==========================================================================
   通用外壳交互（两页共用）：顶栏模块、侧栏/页签跳转、轻提示
   ========================================================================== */
(function () {
  'use strict';

  var toastEl = null;

  function toast(msg) {
    if (!toastEl) toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('is-on'); }, 1800);
  }
  window.uiToast = toast;

  document.addEventListener('click', function (ev) {
    var nav = ev.target.closest ? ev.target.closest('.nav-item') : null;
    if (nav) {
      Array.prototype.forEach.call(document.querySelectorAll('.nav-item'), function (b) {
        b.classList.remove('is-active');
      });
      nav.classList.add('is-active');
      if (nav.getAttribute('data-module') !== 'rent') {
        toast('演示原型：' + nav.textContent.trim() + ' 模块未实现');
      }
      return;
    }

    var back = ev.target.closest ? ev.target.closest('.tab-back') : null;
    if (back) {
      /* 被 Axure 内联框架等以 iframe 嵌入时不接管浏览器历史，避免影响外层原型 */
      if (window.self === window.top && history.length > 1) history.back();
      return;
    }

    var todo = ev.target.closest ? ev.target.closest('[data-todo]') : null;
    if (todo) {
      ev.preventDefault();
      var msg = todo.getAttribute('data-todo');
      toast(msg ? msg : '演示原型：' + todo.textContent.replace('×', '').trim() + ' 页面未实现');
    }
  });
})();
