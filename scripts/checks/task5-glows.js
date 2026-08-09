// 背景光斑：DOM 存在、body::before 已移除、视差响应、漂移随时间变化
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var glows = document.querySelector('.bg-glows');
__result(!!glows, 'bg-glows container exists');
__result(glows && glows.querySelectorAll('.glow').length === 4, '4 glow elements, got ' + (glows ? glows.querySelectorAll('.glow').length : 0));

var before = getComputedStyle(document.body, '::before');
__result(before.backgroundImage === 'none', 'legacy body::before removed, got ' + before.backgroundImage);

var t0 = getComputedStyle(glows).transform;
document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100, bubbles: true }));
await sleep(350);
var t1 = getComputedStyle(glows).transform;
__result(t1 !== t0, 'glow layer parallax responds to pointer, ' + t0 + ' -> ' + t1);

var g0 = getComputedStyle(glows.querySelector('.g1')).transform;
await sleep(2500);
var g1 = getComputedStyle(glows.querySelector('.g1')).transform;
__result(g1 !== g0, 'glow drifts over time, ' + g0 + ' -> ' + g1);
