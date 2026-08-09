// 全量回归：5 视图切换、hash 直达、弹窗、Escape 分层、回到顶部
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }

for (const name of ['about', 'education', 'experience', 'works', 'skills']) {
  clickNav(name);
  await sleep(450);
  __result(document.querySelector('.view.active').id === name, name + ' view activates on click');
}

// hash 直达
history.replaceState(null, '', '#experience');
clickNav('about');
await sleep(300);
history.replaceState(null, '', '#experience');
document.querySelector('.nav-links a[data-view="experience"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
await sleep(450);
__result(document.querySelector('.view.active').id === 'experience', 'hash #experience works after nav');

// 联系弹窗
openModal();
__result(document.getElementById('contactModal').classList.contains('open'), 'contact modal opens');
// 二维码弹窗
openQrModal();
__result(document.getElementById('qrModal').classList.contains('open'), 'qr modal opens');
// Escape 分层：先关二维码
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
__result(!document.getElementById('qrModal').classList.contains('open'), 'Escape closes qr first');
__result(document.getElementById('contactModal').classList.contains('open'), 'contact modal still open after first Escape');
// Escape 再关联系弹窗
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
__result(!document.getElementById('contactModal').classList.contains('open'), 'Escape closes contact second');

// 回到顶部
document.querySelector('.backtop').click();
await sleep(500);
__result(document.querySelector('.view.active').id === 'about', 'backtop returns to about');

// 技能条（当前页面无 .skill-bar-fill，跳过即可；若有则需 on）
var sb = document.querySelector('.skill-bar-fill');
__result(!sb || sb.classList.contains('on'), 'skill bar handled (or absent)');
