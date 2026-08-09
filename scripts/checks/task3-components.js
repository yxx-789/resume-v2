// 组件二期：导航玻璃胶囊 / 卡片渐变描边 / 数字 accent 字体
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var links = document.querySelector('.nav-links');
__result(links && getComputedStyle(links).borderRadius.indexOf('999') >= 0, 'nav-links pill radius, got ' + (links ? getComputedStyle(links).borderRadius : 'none'));
if (links) __result(getComputedStyle(links).backdropFilter.indexOf('blur') >= 0, 'nav-links glass blur, got ' + getComputedStyle(links).backdropFilter);

await document.fonts.load('600 16px "Space Grotesk"');
__result(document.fonts.check('600 16px "Space Grotesk"'), 'Space Grotesk 600 loaded');

var num = document.querySelector('.num[data-count]');
__result(num && getComputedStyle(num).fontFamily.indexOf('Space Grotesk') >= 0, '.num uses accent font, got ' + (num ? getComputedStyle(num).fontFamily : 'none'));

var card = document.querySelector('.project-card');
__result(!!card, 'project card exists');
if (card) {
  var cs = getComputedStyle(card);
  __result(cs.borderTopColor === 'rgba(0, 0, 0, 0)', 'card border transparent (ring carries gradient), got ' + cs.borderTopColor);
  __result(getComputedStyle(card, '::before').maskImage.indexOf('linear-gradient') >= 0, 'card gradient border ring (mask), got ' + getComputedStyle(card, '::before').maskImage);
  __result(cs.backdropFilter.indexOf('blur') >= 0, 'card stronger blur, got ' + cs.backdropFilter);
}
var hb = document.querySelector('.hobby-card');
__result(!!hb && getComputedStyle(hb, '::before').maskImage.indexOf('linear-gradient') >= 0, 'hobby card gradient ring, got ' + (hb ? getComputedStyle(hb, '::before').maskImage : 'none'));
var tl = document.querySelector('.tl-card');
__result(!!tl && getComputedStyle(tl, '::before').maskImage.indexOf('linear-gradient') >= 0, 'tl card gradient ring, got ' + (tl ? getComputedStyle(tl, '::before').maskImage : 'none'));
