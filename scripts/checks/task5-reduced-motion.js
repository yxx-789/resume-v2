// reduced-motion 二期：视频不显示、光斑/流动层静止、内容完整、渐变文字可读
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

__result(!document.documentElement.classList.contains('js-anim'), 'no js-anim under reduced-motion');
var video = document.querySelector('.bg-video');
if (video) {
  __result(getComputedStyle(video).display === 'none', 'video hidden under reduced-motion');
} else {
  __result(true, 'video absent under reduced-motion');
}
var nameEl = document.querySelector('.hero .name');
__result(nameEl && !nameEl.querySelector('.char'), 'name not split under reduced-motion');
__result(nameEl && parseFloat(getComputedStyle(nameEl).fontSize) >= 40, 'name still enlarged (readable), got ' + (nameEl ? getComputedStyle(nameEl).fontSize : 'none'));
var tEl = document.querySelector('.section-title .t');
__result(tEl && getComputedStyle(tEl).backgroundImage.indexOf('linear-gradient') >= 0, 'section title gradient text static-readable');
var glows = document.querySelector('.bg-glows');
if (glows) {
  var t0 = getComputedStyle(glows).transform;
  await sleep(400);
  __result(getComputedStyle(glows).transform === t0, 'glow layer static under reduced-motion');
}
var reveals = document.querySelectorAll('.view.active .reveal');
var allVisible = Array.from(reveals).every(function (el) { return parseFloat(getComputedStyle(el).opacity) > 0.95; });
__result(allVisible, 'reveals statically visible, ' + reveals.length + ' elements');
