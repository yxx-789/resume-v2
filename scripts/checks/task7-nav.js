// 三期② 导航 is-scrolled 过渡：about 顶部深色玻璃白字，滚动/切视图浅色玻璃
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var nav = document.querySelector('.navbar');
var links = document.querySelector('.nav-links');
__result(!!nav && !!links, 'navbar + nav-links present');

// 初始（about 顶部）：无 is-scrolled → 深色玻璃白字
__result(nav && !nav.classList.contains('is-scrolled'), 'nav not is-scrolled at hero top');
if (links) {
  var bg = getComputedStyle(links).backgroundColor;
  __result(bg.indexOf('13, 23, 27') >= 0, 'nav-links dark glass over hero, got ' + bg);
  __result(getComputedStyle(links).borderRadius.indexOf('999') >= 0, 'nav-links pill radius kept, got ' + getComputedStyle(links).borderRadius);
  __result(getComputedStyle(links).backdropFilter.indexOf('blur') >= 0, 'nav-links blur kept, got ' + getComputedStyle(links).backdropFilter);
}
var firstLink = links ? links.querySelector('a') : null;
if (firstLink) {
  __result(getComputedStyle(firstLink).color.indexOf('255, 255, 255') >= 0, 'nav link white over hero, got ' + getComputedStyle(firstLink).color);
}

// 滚动到底 → is-scrolled → 浅色玻璃
window.scrollTo(0, 10000);
await sleep(350);
__result(nav.classList.contains('is-scrolled'), 'nav is-scrolled after scroll');
if (links) {
  var bg2 = getComputedStyle(links).backgroundColor;
  __result(bg2.indexOf('255, 255, 255') >= 0, 'nav-links back to light glass after scroll, got ' + bg2);
}

// 回到顶部，用 hero-next 路由到 education → 浅色玻璃 + 视图切换
window.scrollTo(0, 0);
await sleep(100);
var next = document.querySelector('.hero-next');
next.click();
await sleep(450);
__result(document.querySelector('.view.active').id === 'education', 'hero-next routes to education');
__result(nav.classList.contains('is-scrolled'), 'nav is-scrolled on education');
if (links) {
  __result(getComputedStyle(links).backgroundColor.indexOf('255, 255, 255') >= 0, 'nav-links light on education, got ' + getComputedStyle(links).backgroundColor);
}

// 回到 about → 顶部深色玻璃
document.querySelector('.nav-links a[data-view="about"]').click();
await sleep(450);
__result(document.querySelector('.view.active').id === 'about', 'back to about');
__result(nav.classList.contains('is-scrolled') === false, 'nav not is-scrolled back on about');
if (links) {
  __result(getComputedStyle(links).backgroundColor.indexOf('13, 23, 27') >= 0, 'nav-links dark again on about top, got ' + getComputedStyle(links).backgroundColor);
}
