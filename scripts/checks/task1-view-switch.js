// 视图切换：GSAP 接管入场（js-anim 生效、CSS 动画关闭、reveal 弹入）
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }

__result(typeof gsap !== 'undefined', 'gsap loaded: ' + (typeof gsap !== 'undefined'));
__result(document.documentElement.classList.contains('js-anim'), 'html.js-anim applied');

var active = document.querySelector('.view.active');
__result(getComputedStyle(active).animationName === 'none', 'CSS view animation off (js-anim), got ' + getComputedStyle(active).animationName);

clickNav('education');
await sleep(900);
var edu = document.getElementById('education');
__result(edu.classList.contains('active'), 'education activates on click');
var first = edu.querySelector('.reveal');
__result(first && parseFloat(getComputedStyle(first).opacity) > 0.95, 'education first reveal fully visible, got ' + (first ? getComputedStyle(first).opacity : 'none'));

clickNav('about');
await sleep(500);
__result(document.querySelector('.view.active').id === 'about', 'back to about');
