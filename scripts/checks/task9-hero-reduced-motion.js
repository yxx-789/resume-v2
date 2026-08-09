// 三期④ reduced-motion：Hero 显海报不播视频、导航浅玻璃静止、底部引导静止、内容完整
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

__result(!document.documentElement.classList.contains('js-anim'), 'no js-anim (static fallback)');

var video = document.querySelector('.hero-view .hero-video');
__result(!!video, 'hero video element present');
if (video) {
  __result(!video.src, 'hero video has no src under reduced-motion');
  __result(parseFloat(getComputedStyle(video).opacity) < 0.05, 'hero video hidden (poster shows)');
  __result(getComputedStyle(video).display === 'none', 'hero video display none (CSS)');
}
var poster = document.querySelector('.hero-view .hero-poster');
__result(!!poster && getComputedStyle(poster).display !== 'none', 'hero poster visible');
var scrim = document.querySelector('.hero-view .hero-scrim');
__result(!!scrim, 'hero scrim present (contrast)');

// 名字未拆分、问候完整可读
var nameEl = document.querySelector('.hero .name');
__result(nameEl && !nameEl.querySelector('.char'), 'hero name not split (static text)');
__result(document.getElementById('typeTarget').textContent === '你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！', 'greeting shown as full text');

// 导航在 about 顶部为浅玻璃（纯 CSS body[data-view] 驱动，不依赖 JS class）
var links = document.querySelector('.nav-links');
if (links) {
  __result(getComputedStyle(links).backgroundColor.indexOf('255, 255, 255') >= 0, 'nav-links light glass over hero under reduced-motion, got ' + getComputedStyle(links).backgroundColor);
}

// 底部引导静止
var next = document.querySelector('.hero-view .hero-next');
__result(!!next, 'hero-next present');
if (next) __result(getComputedStyle(next).animationName === 'none', 'hero-next static (no nudge)');
