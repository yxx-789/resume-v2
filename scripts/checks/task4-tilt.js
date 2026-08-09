// 卡片倾斜：hover 旋转、移出回正
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }

clickNav('works');
await sleep(700);
var card = document.querySelector('.project-card');
var r = card.getBoundingClientRect();
var cx = r.left + r.width * 0.8, cy = r.top + r.height * 0.2;
var t0 = getComputedStyle(card).transform;

card.dispatchEvent(new PointerEvent('pointermove', { clientX: cx, clientY: cy, bubbles: true }));
await sleep(450);
var t1 = getComputedStyle(card).transform;
__result(t1 !== t0, 'card rotates while hovered, ' + t0 + ' -> ' + t1);

card.dispatchEvent(new PointerEvent('pointerleave', { clientX: cx, clientY: cy, bubbles: true }));
await sleep(750);
var t2 = getComputedStyle(card).transform;
__result(t2 !== t1, 'card returns to rest after leave');
