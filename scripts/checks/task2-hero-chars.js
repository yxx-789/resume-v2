// Hero 逐字：名字/问候语拆为 .char、无 caret、无打字机残留、aria-label 保留
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }

clickNav('about');
await sleep(900);

var nameEl = document.querySelector('.hero .name');
var greetEl = document.getElementById('typeTarget');
var nameChars = nameEl.querySelectorAll('.char');
var greetChars = greetEl.querySelectorAll('.char');

__result(nameChars.length === 2, 'name split into 2 chars, got ' + nameChars.length);
__result(greetChars.length === 27, 'greeting split into 27 chars, got ' + greetChars.length);
__result(parseFloat(getComputedStyle(greetChars[0]).opacity) > 0.95, 'greeting first char visible after anim, got ' + getComputedStyle(greetChars[0]).opacity);
__result(greetEl.getAttribute('aria-label') === '你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！', 'aria-label preserved on greeting');
__result(!document.querySelector('.caret'), 'typewriter caret removed');
__result(greetEl.textContent.replace(/ /g, ' ') === '你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！', 'full greeting text intact after split');
