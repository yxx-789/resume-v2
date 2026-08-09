// 数字计数：works 330+，experience 3000+/97%/98%/95%/15
// 中段探针：动画激活时计数从 0 滚动，+600ms 应严格处于中间（回归防线）；
// 降级模式（无 GSAP / prefers-reduced-motion）下静态文本=终值，走 else 分支。
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }

// js-anim 仅由 animations.js 在 GSAP 可用且未降级时注入
var animActive = document.documentElement.classList.contains('js-anim');

// works：+600ms 中段探针，随后确认最终文本 330+
clickNav('works');
await sleep(600);
var wMid = document.querySelector('#works .num[data-count]');
var wMidVal = parseInt(wMid && wMid.textContent, 10);
if (animActive) {
  __result(wMid && wMidVal > 0 && wMidVal < 330, 'works mid-flight at 600ms (0 < ' + wMidVal + ' < 330)');
} else {
  __result(wMid && wMidVal === 330, 'works static without anim (got ' + wMidVal + ')');
}
await sleep(1000);

var w = document.querySelectorAll('#works .num[data-count]');
__result(w.length === 1, 'works has 1 count number, got ' + w.length);
__result(w[0] && w[0].textContent === '330+', 'works 330+ counted, got ' + (w[0] && w[0].textContent));

// experience：以 3000+ 为代表做 +600ms 中段探针，随后确认 5 个数字最终文本
clickNav('experience');
await sleep(600);
var e3000 = document.querySelector('#experience .num[data-count="3000"]');
var e3000Val = parseInt(e3000 && e3000.textContent, 10);
if (animActive) {
  __result(e3000 && e3000Val > 0 && e3000Val < 3000, 'experience 3000+ mid-flight at 600ms (0 < ' + e3000Val + ' < 3000)');
} else {
  __result(e3000 && e3000Val === 3000, 'experience 3000+ static without anim (got ' + e3000Val + ')');
}
await sleep(1000);

var e = document.querySelectorAll('#experience .num[data-count]');
__result(e.length === 5, 'experience has 5 count numbers, got ' + e.length);
var texts = Array.from(e).map(function (n) { return n.textContent; });
__result(texts.indexOf('3000+') >= 0, '3000+ present');
__result(texts.indexOf('97%') >= 0, '97% present');
__result(texts.indexOf('98%') >= 0, '98% present');
__result(texts.indexOf('95%') >= 0, '95% present');
__result(texts.indexOf('15') >= 0, '15 present');
