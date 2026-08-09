// 数字计数：works 330+，experience 3000+/97%/98%/95%/15
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }

clickNav('works');
await sleep(1600);
var w = document.querySelectorAll('#works .num[data-count]');
__result(w.length === 1, 'works has 1 count number, got ' + w.length);
__result(w[0] && w[0].textContent === '330+', 'works 330+ counted, got ' + (w[0] && w[0].textContent));

clickNav('experience');
await sleep(1600);
var e = document.querySelectorAll('#experience .num[data-count]');
__result(e.length === 5, 'experience has 5 count numbers, got ' + e.length);
var texts = Array.from(e).map(function (n) { return n.textContent; });
__result(texts.indexOf('3000+') >= 0, '3000+ present');
__result(texts.indexOf('97%') >= 0, '97% present');
__result(texts.indexOf('98%') >= 0, '98% present');
__result(texts.indexOf('95%') >= 0, '95% present');
__result(texts.indexOf('15') >= 0, '15 present');
