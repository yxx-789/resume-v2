/* js/animations.js — GSAP 动效编排（渐进增强） */
(function () {
  var HAS_GSAP = typeof gsap !== 'undefined';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!HAS_GSAP || REDUCED) {
    // 不注入 js-anim：内容保持静态可见，CSS 负责降级
    window.anim = { init: function () {}, playView: function () {} };
    return;
  }
  document.documentElement.classList.add('js-anim');

  /* ---------- 视图入场编排 ---------- */
  function playView(name) {
    var view = document.getElementById(name);
    if (!view) return;
    gsap.fromTo(view, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power1.out' });
    var reveals = view.querySelectorAll('.reveal');
    if (reveals.length) {
      gsap.set(reveals, { opacity: 0, y: 14 });
      gsap.to(reveals, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.2)', stagger: 0.07 });
    }
    if (name === 'about') playHero(view);
    if (name === 'experience' || name === 'works') countUp(view);
  }

  /* ---------- 字符拆分（幂等） ---------- */
  function splitChars(el) {
    if (!el || el.dataset.split) return null;
    el.dataset.split = '1';
    var full = el.textContent;
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', full);
    var html = '';
    for (var i = 0; i < full.length; i++) {
      var ch = full[i];
      if (ch === ' ') ch = ' ';
      html += '<span class="char" aria-hidden="true">' + ch + '</span>';
    }
    el.innerHTML = html;
    return el.querySelectorAll('.char');
  }

  /* ---------- Hero 逐字弹跳展开 ---------- */
  function playHero(view) {
    var role = view.querySelector('.hero .role');
    var nameChars = view.querySelectorAll('.hero .name .char');
    var greetChars = view.querySelectorAll('#typeTarget .char');
    var tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } });
    if (role) tl.from(role, { opacity: 0, y: 10, duration: 0.4 }, 0.05);
    if (nameChars && nameChars.length) {
      gsap.set(nameChars, { y: 30, opacity: 0 });
      tl.to(nameChars, { y: 0, opacity: 1, duration: 0.55, stagger: 0.06 }, 0.1);
    }
    if (greetChars && greetChars.length) {
      gsap.set(greetChars, { y: 22, opacity: 0 });
      tl.to(greetChars, { y: 0, opacity: 1, duration: 0.45, stagger: 0.02 }, '>-0.15');
    }
  }

  /* ---------- 数字滚动计数 ---------- */
  function countUp(view) {
    view.querySelectorAll('.num[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.2, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
      });
    });
  }

  function init() {
    splitChars(document.querySelector('.hero .name'));
    splitChars(document.querySelector('#typeTarget'));
  }

  window.anim = { init: init, playView: playView };
  init();
})();
