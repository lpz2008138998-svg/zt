/* biz-bar.js —— 全局业务切换条（四条业务线随时互跳） */
(function () {
  'use strict';

  var BIZ = [
    { k: 'all', n: '业务总览', h: 'overview.html' },
    { k: 'rent', n: '租赁业务', h: 'index.html' },
    { k: 'sale', n: '商品销售', h: 'orders-sale.html' },
    { k: 'esale', n: '委托出售', h: 'orders-entrust-sale.html' },
    { k: 'erent', n: '委托出租', h: 'orders-entrust-rent.html' }
  ];

  var path = location.pathname.split('/').pop() || 'index.html';
  var cur = 'rent';
  if (/^overview\.html$/i.test(path)) { cur = 'all'; }
  else if (/sale/i.test(path) && /entrust/i.test(path)) { cur = 'esale'; }
  else if (/entrust-rent/i.test(path)) { cur = 'erent'; }
  else if (/entrust-sale/i.test(path)) { cur = 'esale'; }
  else if (/sale/i.test(path)) { cur = 'sale'; }

  var html = '<div class="bizbar" id="bizbar"><span class="bb-lab">业务切换</span>' +
    BIZ.map(function (b) {
      return '<a href="' + b.h + '" class="' + (b.k === cur ? 'is-on' : '') + '">' + b.n + '</a>';
    }).join('') + '</div>';

  document.body.insertAdjacentHTML('beforeend', html);
})();
