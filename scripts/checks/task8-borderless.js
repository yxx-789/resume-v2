// 三期③ 四视图去框：无 .glass 容器，内容直接浮在浅色背景上，内层卡片保留
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// 全站无 .glass
var glasses = document.querySelectorAll('.glass');
__result(glasses.length === 0, 'no .glass containers remain, got ' + glasses.length);

// 五视图渲染 + 直系 section-title（about 是 Hero 画布，无 section-title）
// 路由同一时刻只激活一个视图（其余 display:none）；逐个切到目标视图后再断言渲染
async function checkViews() {
  var ids = ['about', 'education', 'experience', 'works', 'skills'];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    var v = document.getElementById(id);
    __result(!!v, 'view exists: ' + id);
    if (v) {
      if (id !== 'about') {
        var link = document.querySelector('.nav-links a[data-view="' + id + '"]');
        if (link) link.click();
        await sleep(450);
      }
      __result(v.getBoundingClientRect().width > 0, id + ' renders');
      if (id !== 'about') {
        __result(!!v.querySelector(':scope > .section-title'), id + ' has direct section-title child');
      }
    }
  }
}
await checkViews();

// 内层卡片独立描边（Phase2 渐变环保留）
var pc = document.querySelector('.project-card');
__result(pc && getComputedStyle(pc, '::before').maskImage.indexOf('linear-gradient') >= 0, 'project-card gradient ring preserved');
var ec = document.querySelector('.edu-card');
__result(!!ec && parseFloat(getComputedStyle(ec).borderRadius) > 0, 'edu-card keeps card styling');
var mc = document.querySelector('.mini-card');
__result(!!mc && getComputedStyle(mc).boxShadow.indexOf('rgba') >= 0, 'mini-card keeps shadow');

// 视图块间距生效（education 第二个直系块有上边距）
var ed = document.getElementById('education');
if (ed) {
  var blocks = ed.children;
  if (blocks.length >= 2) {
    var mt = parseFloat(getComputedStyle(blocks[1]).marginTop);
    __result(mt > 0, 'education blocks spaced, marginTop=' + mt);
  } else {
    __result(true, 'education single block, spacing n/a');
  }
}

// 去框后 skills 仍可路由 + 内容渲染
document.querySelector('.nav-links a[data-view="skills"]').click();
await sleep(450);
var sk = document.getElementById('skills');
__result(sk.classList.contains('active'), 'skills activates after de-boxing');
__result(sk.querySelector('.hobby-card') !== null, 'skills hobby cards render');
__result(sk.querySelector('.group') !== null, 'skills ability groups render');
