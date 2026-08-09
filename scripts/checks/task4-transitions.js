// 视图切换电影化：blur→focus 对焦进场 + 光斑随视图变色
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }
function hue() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--glow-hue')); }

// 光斑变色：experience 雾青(190) / skills 浅 sage(160)
clickNav('experience');
await sleep(1300);
__result(hue() >= 188 && hue() <= 192, 'glow hue -> mist-cyan for experience, got ' + hue());
clickNav('skills');
await sleep(1300);
__result(hue() >= 158 && hue() <= 162, 'glow hue -> light sage for skills, got ' + hue());

// blur→focus：进场中段有 blur>0，落定后 blur(0px)
clickNav('about');
await sleep(300); // 旧视图淡出 120ms + 新视图 blur 动画进行中
var mid = getComputedStyle(document.getElementById('about')).filter;
__result(mid.indexOf('blur(') >= 0 && mid.indexOf('blur(0px)') === -1, 'view mid-flight blur>0, got ' + mid);
await sleep(900);
var end = getComputedStyle(document.getElementById('about')).filter;
__result(end === 'blur(0px)' || end === 'none', 'view settles to no blur, got ' + end);
