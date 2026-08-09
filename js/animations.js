/* js/animations.js — GSAP 动效编排（渐进增强） */
(function () {
  var HAS_GSAP = typeof gsap !== 'undefined';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 各视图光斑色相（奶油暖色系内微变）：暖粉 / 暖黄 / 雾青 / 玫瑰 / 浅 sage */
  var VIEW_HUE = { about: 330, education: 45, experience: 190, works: 350, skills: 160 };

  if (!HAS_GSAP || REDUCED) {
    // 不注入 js-anim：内容保持静态可见，CSS 负责降级
    window.anim = { init: function () {}, playView: function () {} };
    return;
  }
  document.documentElement.classList.add('js-anim');

  /* ---------- 导航滚动态：全视图统一浅色玻璃（is-scrolled 保留为状态钩子，CSS 不再区分明暗） ---------- */
  var navEl = document.querySelector('.navbar');
  function syncNav() {
    if (!navEl) return;
    var active = document.querySelector('.view.active');
    var overHero = active && active.id === 'about' && window.scrollY <= 36;
    navEl.classList.toggle('is-scrolled', !overHero);
  }

  /* ---------- 视图入场编排（电影化 blur→focus + 光斑变色） ---------- */
  function playView(name) {
    var view = document.getElementById(name);
    if (!view) return;
    gsap.fromTo(view,
      { opacity: 0, y: -6, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power1.out' });
    var reveals = view.querySelectorAll('.reveal');
    if (reveals.length) {
      gsap.set(reveals, { opacity: 0, y: 14 });
      gsap.to(reveals, { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.2)', stagger: 0.07 });
    }
    if (name === 'about') playHero(view);
    if (name === 'experience' || name === 'works') countUp(view);
    var hue = VIEW_HUE[name];
    if (hue !== undefined) {
      gsap.to(document.documentElement, { '--glow-hue': hue, duration: 0.8, ease: 'sine.inOut' });
    }
    syncNav();
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
      // 评审 Fix 2：视图反复激活时先清理作用在元素上的残留 tween
      gsap.killTweensOf(el);
      // 根因兜底：计数 tween 的目标是代理对象（obj）而非 el，killTweensOf(el) 杀不到它，
      // 需按引用杀掉上一轮代理 tween，否则新旧 tween 同时写 el.textContent 造成数字抖动
      if (el._countTween) el._countTween.kill();
      var obj = { v: 0 };
      el._countTween = gsap.to(obj, {
        v: target, duration: 1.2, ease: 'power2.out',
        onUpdate: function () { el.textContent = Math.round(obj.v) + suffix; }
      });
    });
  }

  /* ---------- 卡片 3D 倾斜微交互 ---------- */
  function setupTilt() {
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;
    var LIFT = { '.project-card': -3, '.hobby-card': -2, '.tl-card': -2 };
    document.querySelectorAll('.project-card, .hobby-card, .tl-card').forEach(function (card) {
      var cls = '.' + card.className.split(' ')[0];
      var lift = LIFT[cls] || 0;
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        gsap.to(card, {
          rotationY: (px - 0.5) * 8, rotationX: (0.5 - py) * 8, y: lift,
          transformPerspective: 600, duration: 0.35, ease: 'power2.out'
        });
        var hot = card.querySelector('.pc-emoji, .hobby-img');
        if (hot) gsap.to(hot, { y: -5, duration: 0.3 });
      });
      card.addEventListener('pointerleave', function () {
        gsap.to(card, {
          rotationX: 0, rotationY: 0, y: 0,
          transformPerspective: 600, duration: 0.6, ease: 'elastic.out(1, 0.55)'
        });
        var hot = card.querySelector('.pc-emoji, .hobby-img');
        if (hot) gsap.to(hot, { y: 0, duration: 0.3 });
      });
    });
  }

  /* ---------- 背景：流动层 + 光斑视差 + 视频纹理 ---------- */
  function setupBackground() {
    // 流动层：极慢呼吸漂移（transform-only）
    var flow = document.querySelector('.bg-flow');
    if (flow) {
      gsap.to(flow, { x: 22, y: -14, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }
    // 光斑各自漂移
    var glows = document.querySelector('.bg-glows');
    if (glows) {
      gsap.utils.toArray('.bg-glows .glow').forEach(function (g, i) {
        gsap.to(g, {
          x: gsap.utils.random(-34, 34), y: gsap.utils.random(-26, 26),
          duration: gsap.utils.random(6, 10), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.5
        });
      });
    }
    // 视频纹理：loadeddata 后从 0 淡入到目标透明度（桌面 0.12 / 移动 ≤640px 0.06）
    var video = document.querySelector('.bg-video');
    if (video) {
      video.src = 'assets/vendor/bg-texture.mp4';
      video.preload = 'auto';
      var targetOp = window.matchMedia && window.matchMedia('(max-width: 640px)').matches ? 0.06 : 0.12;
      var onReady = function () {
        gsap.to(video, { opacity: targetOp, duration: 0.8, ease: 'sine.inOut' });
        if (video.play) video.play().catch(function () {});
      };
      if (video.readyState >= 2) {
        onReady();
      } else {
        video.addEventListener('loadeddata', onReady, { once: true });
        video.addEventListener('error', function () { video.style.display = 'none'; }, { once: true });
      }
    }
    // 首屏 Hero 云端小岛视频：海报兜底不黑屏，loadeddata 后淡入播放
    var heroVideo = document.querySelector('.hero-view .hero-video');
    if (heroVideo) {
      heroVideo.src = 'assets/vendor/hero-island.mp4';
      heroVideo.preload = 'auto';
      var heroReady = function () {
        gsap.to(heroVideo, { opacity: 1, duration: 0.8, ease: 'sine.inOut' });
        if (heroVideo.play) heroVideo.play().catch(function () {});
      };
      if (heroVideo.readyState >= 2) {
        heroReady();
      } else {
        heroVideo.addEventListener('loadeddata', heroReady, { once: true });
        heroVideo.addEventListener('error', function () { heroVideo.style.display = 'none'; }, { once: true });
      }
    }
    // 整层鼠标视差（±40px，原 ±20px）
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!glows || !fine) return;
    var cur = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    document.addEventListener('pointermove', function (e) {
      target.x = (e.clientX / window.innerWidth - 0.5) * 80;
      target.y = (e.clientY / window.innerHeight - 0.5) * 80;
    });
    gsap.ticker.add(function () {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      gsap.set(glows, { x: cur.x, y: cur.y });
    });
  }

  function init() {
    splitChars(document.querySelector('.hero .name'));
    splitChars(document.querySelector('#typeTarget'));
    setupTilt();
    if (navEl) {
      window.addEventListener('scroll', syncNav, { passive: true });
      syncNav();
    }
    setupBackground();
  }

  window.anim = { init: init, playView: playView };
  init();
})();
