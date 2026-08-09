// 背景系统二期：流动层 / 光斑升级(hsl+放大) / 视频纹理淡入 / 层序
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function waitFor(fn, timeout) {
  return new Promise(function (resolve) {
    var t0 = Date.now();
    (function poll() {
      if (fn()) return resolve(true);
      if (Date.now() - t0 > timeout) return resolve(false);
      setTimeout(poll, 120);
    })();
  });
}

// 层级自底向上：.bg-flow(-4) → .bg-glows(-3) → .bg-dots(-2) → .bg-video(-1)
var flow = document.querySelector('.bg-flow');
__result(!!flow, 'bg-flow layer exists');
if (flow) __result(getComputedStyle(flow).zIndex === '-4', 'bg-flow z-index -4, got ' + getComputedStyle(flow).zIndex);

var glows = document.querySelector('.bg-glows');
__result(glows && getComputedStyle(glows).zIndex === '-3', 'bg-glows z-index -3, got ' + (glows ? getComputedStyle(glows).zIndex : 'none'));

var dots = document.querySelector('.bg-dots');
__result(dots && getComputedStyle(dots).zIndex === '-2', 'bg-dots z-index -2, got ' + (dots ? getComputedStyle(dots).zIndex : 'none'));

var video = document.querySelector('.bg-video');
__result(!!video, 'bg-video exists');
if (video) {
  __result(getComputedStyle(video).zIndex === '-1', 'bg-video z-index -1, got ' + getComputedStyle(video).zIndex);
}
var g1 = document.querySelector('.g1');
if (g1) {
  // 计算样式会把 hsla(var(--glow-hue),…) 解析为 rgb，故改为验证色相变量驱动：改 --glow-hue 计算色须随之变化
  var bgBefore = getComputedStyle(g1).backgroundImage;
  document.documentElement.style.setProperty('--glow-hue', 280);
  var bgAfter = getComputedStyle(g1).backgroundImage;
  document.documentElement.style.removeProperty('--glow-hue');
  __result(!!bgAfter && bgBefore !== bgAfter, 'glow uses hsl( --glow-hue ), got ' + bgBefore);
  __result(parseFloat(getComputedStyle(g1).width) >= 640, 'glow enlarged (g1 width >= 640), got ' + getComputedStyle(g1).width);
}

// 视频纹理淡入：轮询等待不透明超过目标值一半（桌面 0.12 / 移动 0.06）
var target = window.matchMedia('(max-width: 640px)').matches ? 0.06 : 0.12;
var faded = await waitFor(function () {
  return parseFloat(getComputedStyle(video).opacity) > target * 0.5;
}, 5000);
__result(faded, 'video fades in to ~' + target + ' (got ' + getComputedStyle(video).opacity + ')');

// 视差仍响应指针
var t0 = getComputedStyle(glows).transform;
document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100, bubbles: true }));
await sleep(400);
__result(getComputedStyle(glows).transform !== t0, 'glow layer parallax still responds to pointer');
