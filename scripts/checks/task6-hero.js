// 三期① 首屏 Hero 全屏画布：无框、三层背景、深色文字、底部「下一页」引导、视频淡入
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var hero = document.getElementById('about');
__result(!!hero && hero.classList.contains('hero-view'), 'about is hero-view');
if (!hero) return;

// 全屏画布：宽度铺满视口、高度铺满（扣除 sticky 导航）
var w = hero.getBoundingClientRect().width;
__result(w >= window.innerWidth - 1, 'hero full-bleed width, got ' + w);
var mh = parseFloat(getComputedStyle(hero).minHeight);
__result(mh >= window.innerHeight - 100, 'hero fills viewport (minus nav), minHeight=' + mh + ' vh=' + window.innerHeight);

// 无 .glass 容器
__result(!hero.querySelector('.glass'), 'hero has no .glass box');

// 三层背景：海报兜底图 → 视频 → 奶油渐变遮罩 + 三色场
var poster = hero.querySelector('.hero-poster');
__result(!!poster && getComputedStyle(poster).position === 'absolute', 'poster bg layer present');
var video = hero.querySelector('.hero-video');
__result(!!video, 'hero video element present');
if (video) {
  __result(!video.hasAttribute('autoplay'), 'video no autoplay attr (JS-controlled play)');
}
var scrim = hero.querySelector('.hero-scrim');
__result(!!scrim && getComputedStyle(scrim).backgroundImage.indexOf('linear-gradient') >= 0, 'hero scrim gradient present');

// 内容深色文字（逐字渐变改为深色系；computed style 把十六进制序列化为 rgb()）
var nameEl = hero.querySelector('.hero .name');
__result(!!nameEl, 'hero name present');
var char = nameEl ? nameEl.querySelector('.char') : null;
__result(!!char, 'hero name split into chars');
if (char) {
  var cs = getComputedStyle(char);
  __result(cs.backgroundImage.indexOf('linear-gradient') >= 0, 'hero name char gradient present');
  __result(cs.backgroundImage.indexOf('16, 32, 39') >= 0, 'hero name gradient is warm ink, got ' + cs.backgroundImage);
}
var greetChar = document.querySelector('.hero-view #typeTarget .char');
__result(!!greetChar, 'greeting chars present');
if (greetChar) {
  __result(getComputedStyle(greetChar).backgroundImage.indexOf('16, 32, 39') >= 0, 'greeting chars also dark ink gradient');
}
var roleEl = hero.querySelector('.hero .role');
if (roleEl) {
  __result(getComputedStyle(roleEl).color.indexOf('255, 255, 255') >= 0, 'role badge white text, got ' + getComputedStyle(roleEl).color);
  __result(getComputedStyle(roleEl).backgroundColor.indexOf('86, 130, 111') >= 0, 'role badge sage bg, got ' + getComputedStyle(roleEl).backgroundColor);
}

// 底部「下一页 · 教育背景」引导：可见且路由到 education
var next = hero.querySelector('.hero-next');
__result(!!next && next.getAttribute('data-view') === 'education', 'hero-next routes to education');
if (next) {
  var nr = next.getBoundingClientRect();
  __result(nr.bottom <= window.innerHeight + 1, 'hero-next visible in first viewport, bottom=' + nr.bottom + ' vh=' + window.innerHeight);
}

// 视频在 js-anim 下被注入 src 并淡入播放
if (video) {
  __result(video.src.indexOf('hero-island') >= 0, 'hero video src injected');
  __result(video.preload === 'auto', 'hero video preload=auto (JS)');
  await sleep(2500);
  var op = parseFloat(getComputedStyle(video).opacity);
  __result(op > 0.3, 'hero video fades in, opacity=' + op);
}
