// reduced-motion：不注入 js-anim、不拆字、内容静态可见、光斑不漂移
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

__result(!document.documentElement.classList.contains('js-anim'), 'reduced-motion: no js-anim class');
var nameEl = document.querySelector('.hero .name');
__result(!nameEl.querySelector('.char'), 'reduced-motion: name not split into chars');
__result(document.getElementById('typeTarget').textContent === '你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！', 'reduced-motion: greeting shown as full text');

var reveals = document.querySelectorAll('.view.active .reveal');
var allVisible = Array.from(reveals).every(function (el) { return parseFloat(getComputedStyle(el).opacity) > 0.95; });
__result(allVisible, 'reduced-motion: reveals statically visible, ' + reveals.length + ' elements');

var glows = document.querySelector('.bg-glows');
if (glows) {
  var t0 = getComputedStyle(glows).transform;
  await sleep(400);
  __result(getComputedStyle(glows).transform === t0, 'reduced-motion: glow layer static');
}
