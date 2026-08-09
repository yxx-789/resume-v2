# 三期「深色首屏画布 + 全站无框」Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 resume-v2 首页改成全屏「云端小岛」视频画布（深色电影感 + 白色内容 + 底部「下一页」引导），导航在首屏顶部呈深色玻璃白字、滚动/切视图恢复浅色玻璃，其余四视图去掉 `.glass` 容器、内容直接浮在浅色背景上。

**Architecture:** 沿用二期「渐进增强」底座。Hero 画布 = 海报兜底图（恒在）+ 视频（JS 注入 src、loadeddata 后淡入，error 保持透明）+ 深色渐变遮罩 三层叠放；导航状态由内联路由维护 `body[data-view]` + `js/animations.js` 维护 `.is-scrolled` 类，纯 CSS 选择器 `body[data-view="about"] .navbar:not(.is-scrolled)` 驱动深色玻璃态（reduced-motion / 无 GSAP 也生效）；去框靠删除 `.glass` 包裹 + 视图内统一块间距。

**Tech Stack:** 原生 HTML/CSS/ES5 IIFE、自托管 GSAP 3.15.0、无头 CDP 验证（`node scripts/verify.mjs scripts/checks/<file>.js [--reduced-motion]`）。

## Global Constraints

- **开发副本**：只在 `/Users/yxx/resume-v2` 改。生产 `/Users/yxx/resume` 与线上 47.85.52.9 本阶段**零变更**（用户满意后才谈上线）。
- **内联路由脚本**（index.html 尾部 `<script>` L519-629）：仅允许 Task 2 列出的 **3 处最小增量**编辑（add `.hero-next` 到链接选择器、add `.hero-next` 到点击处理选择器、`activate()` 内 add `body.dataset.view` + `window.scrollTo({top:0})`）。除此之外其余行一律不动。弹窗/Escape/二维码逻辑不动。
- **渐进增强**：`js-anim` 仅在 GSAP 存在且非 reduced-motion 时注入；reduced-motion / 无 GSAP → 内容静态完整可读，无隐藏内容。
- **Hero 视频机制**：HTML `<video class="hero-bg hero-video" preload="none" muted loop playsinline aria-hidden="true" tabindex="-1">` **不带 src 不带 autoplay**（`preload="none"` 无 JS 零网络）；JS 注入 `src='assets/vendor/hero-island.mp4'`、`preload='auto'`，`loadeddata` 后 `gsap` 淡入到 `opacity:1` 并 `play()`；`error` → `style.display='none'`（海报兜底，永不黑屏）。视频 CSS 常量 `opacity:0`。
- **动画只动 `transform` / `opacity`**（`filter: blur` 为既有豁免）。`@keyframes heroNudge` 只动 `transform`。
- **`.nav-links` 胶囊基础属性不得动**：`border-radius:999px` 与 `backdrop-filter: blur(16px)` 必须保留在 `.nav-links` 基础规则上（task3-components.js 断言依赖）。深色态只覆盖 `background` / `color` / `border-color` / `box-shadow`。
- **`style.css?v=` 每次 CSS 变更升版**：当前 `20260809-8` → Task 1 升 `20260809-9`、Task 2 升 `20260809-10`、Task 3 升 `20260809-11`（index.html L8 一个入口）。
- **ES5 IIFE、中文注释、原生 DOM API、`var`**；无外链 CDN。
- **零回归**：五视图切换、hash 直达、弹窗、Escape 分层、回到顶部、数字计数、卡片倾斜、光斑变色、reveal 错峰全部不变。
- **验证命令**：`node scripts/verify.mjs scripts/checks/<file>.js`（默认）与 `node scripts/verify.mjs scripts/checks/<file>.js --reduced-motion`。
- 既有检查 `task2-typography.js` / `task5-reduced-motion.js` / `task6-reduced-motion.js` / `task3-components.js` 的 hero 相关断言是 **presence 型**（`indexOf('linear-gradient')`、`.hero .name` 选择器、radius/blur），按本计划改造后**无需编辑即可保持全绿**——只改 CSS 值，不改断言。

### 与 spec 的一处已裁决偏差

spec 原文「`#about` 改为 `min-height: 100svh` 的全屏画布」。但导航是 `position: sticky`（占流式 `--nav-h: 58px`），Hero 画布从导航下方开始。若用字面 `100svh`，画布底部会探出首屏 58px，`.hero-next`（底部 1.2rem）将落在首屏外不可见。因此本计划用 **`min-height: calc(100svh - var(--nav-h))`**：视觉上画布恰好填满首屏、`.hero-next` 首屏可见，设计意图与 spec 一致。已由 controller 在 ledger 记档。

---

### Task 1: 首屏 Hero 全屏画布（结构 + 样式 + 视频）

**Files:**
- Modify: `index.html`（#about 视图 L50-71 整体替换；L8 `?v=20260809-9`）
- Modify: `style.css`（新增 Hero 画布段，插在 `.hero .contacts a:hover` 之后 L356 前；移动端块、print 块、reduced-motion 块追加）
- Modify: `js/animations.js`（`setupBackground` 内 bg-video 块之后追加 hero 视频注入）
- Create: `scripts/checks/task6-hero.js`

**Interfaces:**
- Produces: `.hero-view` section（含 `.hero-bg.hero-poster` / `.hero-bg.hero-video` / `.hero-scrim` / `.hero-inner.hero` / `.hero-next[data-view="education"]`）；`.hero-view` 深色文字适配 CSS；`setupBackground` 注入 hero 视频。

- [ ] **Step 1: 写失败检查 `scripts/checks/task6-hero.js`**

```js
// 三期① 首屏 Hero 全屏画布：无框、三层背景、白字、底部「下一页」引导、视频淡入
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var hero = document.getElementById('about');
__result(!!hero && hero.classList.contains('hero-view'), 'about is hero-view');
if (!hero) return;

// 全屏画布：宽度铺满视口、高度铺满（扣除 sticky 导航）
var w = hero.getBoundingClientRect().width;
__result(w >= window.innerWidth - 1, 'hero full-bleed width, got ' + w);
var mh = parseFloat(getComputedStyle(hero).minHeight);
__result(mh >= window.innerHeight - 100, 'hero fills viewport (minus nav), minHeight=' + mh + ' vh=' + window.innerHeight);

// 无 .glass 容器
__result(!hero.querySelector('.glass'), 'hero has no .glass box');

// 三层背景：海报兜底图 → 视频 → 深色渐变遮罩
var poster = hero.querySelector('.hero-poster');
__result(!!poster && getComputedStyle(poster).position === 'absolute', 'poster bg layer present');
var video = hero.querySelector('.hero-video');
__result(!!video, 'hero video element present');
if (video) {
  __result(!video.hasAttribute('autoplay'), 'video no autoplay attr (JS-controlled play)');
}
var scrim = hero.querySelector('.hero-scrim');
__result(!!scrim && getComputedStyle(scrim).backgroundImage.indexOf('linear-gradient') >= 0, 'hero scrim gradient present');

// 内容白字（逐字渐变改为白色系；computed style 把 #fff 序列化为 rgb(255, 255, 255)）
var nameEl = hero.querySelector('.hero .name');
__result(!!nameEl, 'hero name present');
var char = nameEl ? nameEl.querySelector('.char') : null;
__result(!!char, 'hero name split into chars');
if (char) {
  var cs = getComputedStyle(char);
  __result(cs.backgroundImage.indexOf('linear-gradient') >= 0, 'hero name char gradient present');
  __result(cs.backgroundImage.indexOf('255, 255, 255') >= 0, 'hero name gradient is LIGHT (white), got ' + cs.backgroundImage);
}
var greetChar = document.querySelector('.hero-view #typeTarget .char');
__result(!!greetChar, 'greeting chars present');
if (greetChar) {
  __result(getComputedStyle(greetChar).backgroundImage.indexOf('255, 255, 255') >= 0, 'greeting chars also light gradient');
}
var roleEl = hero.querySelector('.hero .role');
if (roleEl) {
  __result(getComputedStyle(roleEl).color.indexOf('255, 255, 255') >= 0, 'role badge white text, got ' + getComputedStyle(roleEl).color);
}

// 底部「下一页 · 教育背景」引导：可见且路由到 education
var next = hero.querySelector('.hero-next');
__result(!!next && next.getAttribute('data-view') === 'education', 'hero-next routes to education');
if (next) {
  var nr = next.getBoundingClientRect();
  __result(nr.bottom <= window.innerHeight + 1, 'hero-next visible in first viewport, bottom=' + nr.bottom + ' vh=' + window.innerHeight);
}

// 视频在 js-anim 下被注入 src 并淡入播放
if (video) {
  __result(video.src.indexOf('hero-island') >= 0, 'hero video src injected');
  __result(video.preload === 'auto', 'hero video preload=auto (JS)');
  await sleep(2500);
  var op = parseFloat(getComputedStyle(video).opacity);
  __result(op > 0.3, 'hero video fades in, opacity=' + op);
}
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task6-hero.js`
Expected: FAIL（`hero-view` 不存在、`.glass` 仍在、渐变是深色、无 `.hero-next`、视频无 src 等）

- [ ] **Step 3: 替换 index.html 的 #about 视图（L50-71 整段）**

把整段 `<section class="view" id="about">...</section>`（原 L50-71，含 `<div class="glass hero reveal">` 包裹）替换为：

```html
<!-- ═══════════════ ① 关于我 · 全屏画布 ═══════════════ -->
<section class="view hero-view" id="about">
  <img class="hero-bg hero-poster" src="assets/长大照片.jpg" alt="" aria-hidden="true">
  <video class="hero-bg hero-video" preload="none" muted loop playsinline aria-hidden="true" tabindex="-1"></video>
  <div class="hero-scrim" aria-hidden="true"></div>
  <div class="hero-inner hero">
    <div class="hero-photos">
      <img src="assets/小时候1.jpg" alt="小时候 · 十堰">
      <img src="assets/小时候照片2.jpg" alt="童年 · 家乡">
      <img src="assets/长大照片.jpg" alt="现在 · 邢耀">
    </div>
    <div class="name">邢耀</div>
    <div class="role">AI 产品经理</div>
    <div class="typing-line"><span class="typing-target" id="typeTarget" aria-label="你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！">你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！</span></div>
    <div class="actions">
      <a class="btn btn-accent" href="assets/产品-中南财经政法大学-邢耀.pdf" download>📄 下载简历 / 保存 PDF</a>
      <button class="btn btn-ghost" onclick="openModal()">📮 联系我</button>
    </div>
    <div class="contacts">
      <span>📞 15171387068</span>
      <span>✉️ <a href="mailto:yx71387068@163.com">yx71387068@163.com</a></span>
      <span>🐙 <a href="https://github.com/yxx-789" target="_blank" rel="noopener">github.com/yxx-789</a></span>
    </div>
  </div>
  <a class="hero-next" href="#education" data-view="education">
    <span class="hn-label">下一页</span>
    <strong class="hn-title">教育与成长</strong>
  </a>
</section>
```

要点：原有 `.hero-photos` / `.name` / `.role` / `#typeTarget` / `.actions` / `.contacts` 内容**逐字保留**；`.hero-inner hero` 保留了 `hero` 类，使既有 `.hero .name` / `.hero .role` / `.hero .char` 选择器继续命中；`glass` 与 `reveal` 类移除（Hero 由 playHero 编排，不参与 reveal 错峰）。

- [ ] **Step 4: style.css 新增 Hero 画布段**

在 `.hero .contacts a:hover { color: var(--accent); }`（L356）之后、`.btn {`（L358）之前插入：

```css
/* =========================================================
   三期① 首屏 Hero 全屏画布（深色电影感）
   ========================================================= */
.hero-view {
  position: relative;
  isolation: isolate;
  max-width: none;
  margin: 0;
  padding: 0;
  min-height: calc(100svh - var(--nav-h));
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
.hero-video { opacity: 0; } /* 加载后由 JS 淡入 */
.hero-scrim {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(7, 12, 14, 0.30) 0%, rgba(7, 12, 14, 0.55) 60%, rgba(7, 12, 14, 0.72) 100%);
}
.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 880px;
  margin: 0 auto;
  min-height: calc(100svh - var(--nav-h));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3.2rem 1rem 4.2rem;
}
/* 深色画布上的文字适配（置于既有 .hero 规则之后覆盖；#typeTarget 带 id 需更高优先级） */
.hero-view .name { color: #fff; }
.hero-view .char, .hero-view #typeTarget .char { color: #fff; }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero-view .char, .hero-view #typeTarget .char {
    background: linear-gradient(180deg, #ffffff, rgba(255, 255, 255, 0.55));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
.hero-view .role {
  color: #fff;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.30);
}
.hero-view .typing-line,
.hero-view .typing-target { color: rgba(255, 255, 255, 0.92); }
.hero-view .btn-ghost {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.30);
}
.hero-view .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.45);
}
.hero-view .contacts { color: rgba(255, 255, 255, 0.78); }
.hero-view .contacts a {
  color: rgba(255, 255, 255, 0.78);
  border-bottom-color: rgba(255, 255, 255, 0.35);
}
/* 底部「下一页」引导 */
.hero-next {
  position: absolute;
  left: 50%;
  bottom: 1.2rem;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
  padding: 0.4rem 1.1rem;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  animation: heroNudge 2.4s ease-in-out infinite;
}
.hero-next .hn-label { font-size: 0.7rem; letter-spacing: 0.24em; }
.hero-next .hn-title { font-size: 0.95rem; font-weight: 600; letter-spacing: 0.06em; }
.hero-next:hover { color: #fff; }
@keyframes heroNudge {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%      { transform: translateX(-50%) translateY(6px); }
}
```

- [ ] **Step 5: style.css 移动端 / print / reduced-motion 追加**

`@media (max-width: 640px)` 块（L1134）内追加：

```css
  .hero-inner { padding: 2.6rem 1rem 3.6rem; }
  .hero-next { bottom: 0.7rem; }
  .hero-next .hn-label { font-size: 0.64rem; }
  .hero-next .hn-title { font-size: 0.85rem; }
```

`@media print` 块（L1146）内追加：

```css
  .hero-view, .hero-inner { min-height: auto; }
  .hero-view .hero-bg, .hero-view .hero-scrim, .hero-view .hero-next { display: none !important; }
  .hero-view .name, .hero-view .char, .hero-view #typeTarget .char, .hero-view .role, .hero-view .typing-line {
    color: var(--ink-strong) !important;
    background: none !important;
    -webkit-text-fill-color: var(--ink-strong) !important;
  }
  .hero-view .btn-ghost { background: #fff !important; color: var(--ink-strong) !important; border-color: #ddd !important; }
  .hero-view .contacts, .hero-view .contacts a { color: var(--ink-soft) !important; border-bottom-color: #ccc !important; }
```

`@media (prefers-reduced-motion: reduce)` 块（L1163）内追加：

```css
  .hero-view .hero-video { display: none; } /* 海报兜底，不播视频 */
  .hero-next { animation: none; }
```

- [ ] **Step 6: js/animations.js 注入 Hero 视频**

在 `setupBackground` 的 bg-video 块（`video.addEventListener('error', ...)` 那段，L148 附近）**之后**、`var fine = ...`（L152）**之前**插入：

```js
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
```

- [ ] **Step 7: 升版并运行验证**

index.html L8：`style.css?v=20260809-8` → `style.css?v=20260809-9`

Run: `node scripts/verify.mjs scripts/checks/task6-hero.js`
Expected: PASS（`__result` 全 true）

- [ ] **Step 8: 提交**

```bash
git add index.html style.css js/animations.js scripts/checks/task6-hero.js
git commit -m "feat: hero full-screen canvas — video backdrop + scrim + white text + next nudge (Phase 3)"
```

---

### Task 2: 导航 is-scrolled 过渡 + hero-next 路由接线

**Files:**
- Modify: `style.css`（导航段 L202 之后插入深色态覆盖；L8 `?v=20260809-10`）
- Modify: `js/animations.js`（模块级 `navEl` + `syncNav`，`playView` 末尾调用，`init` 挂滚动监听）
- Modify: `index.html`（内联路由 3 处最小增量；L8 `?v=20260809-10`）
- Create: `scripts/checks/task7-nav.js`

**Interfaces:**
- Consumes: `.hero-next`（Task 1）、`.hero-view`（Task 1）。
- Produces: 内联路由 `activate(name)` 设置 `document.body.dataset.view = name` 并在每次激活 `window.scrollTo({top:0})`；`js/animations.js` 的 `syncNav()` 维护 `.navbar.is-scrolled`（`about 顶部且 scrollY≤36` → false，否则 true）；`.hero-next` 点击可路由。

- [ ] **Step 1: 写失败检查 `scripts/checks/task7-nav.js`**

```js
// 三期② 导航 is-scrolled 过渡：about 顶部深色玻璃白字，滚动/切视图浅色玻璃
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var nav = document.querySelector('.navbar');
var links = document.querySelector('.nav-links');
__result(!!nav && !!links, 'navbar + nav-links present');

// 初始（about 顶部）：无 is-scrolled → 深色玻璃白字
__result(nav && !nav.classList.contains('is-scrolled'), 'nav not is-scrolled at hero top');
if (links) {
  var bg = getComputedStyle(links).backgroundColor;
  __result(bg.indexOf('13, 23, 27') >= 0, 'nav-links dark glass over hero, got ' + bg);
  __result(getComputedStyle(links).borderRadius.indexOf('999') >= 0, 'nav-links pill radius kept, got ' + getComputedStyle(links).borderRadius);
  __result(getComputedStyle(links).backdropFilter.indexOf('blur') >= 0, 'nav-links blur kept, got ' + getComputedStyle(links).backdropFilter);
}
var firstLink = links ? links.querySelector('a') : null;
if (firstLink) {
  __result(getComputedStyle(firstLink).color.indexOf('255, 255, 255') >= 0, 'nav link white over hero, got ' + getComputedStyle(firstLink).color);
}

// 滚动到底 → is-scrolled → 浅色玻璃
window.scrollTo(0, 10000);
await sleep(350);
__result(nav.classList.contains('is-scrolled'), 'nav is-scrolled after scroll');
if (links) {
  var bg2 = getComputedStyle(links).backgroundColor;
  __result(bg2.indexOf('255, 255, 255') >= 0, 'nav-links back to light glass after scroll, got ' + bg2);
}

// 回到顶部，用 hero-next 路由到 education → 浅色玻璃 + 视图切换
window.scrollTo(0, 0);
await sleep(100);
var next = document.querySelector('.hero-next');
next.click();
await sleep(450);
__result(document.querySelector('.view.active').id === 'education', 'hero-next routes to education');
__result(nav.classList.contains('is-scrolled'), 'nav is-scrolled on education');
if (links) {
  __result(getComputedStyle(links).backgroundColor.indexOf('255, 255, 255') >= 0, 'nav-links light on education, got ' + getComputedStyle(links).backgroundColor);
}

// 回到 about → 顶部深色玻璃
document.querySelector('.nav-links a[data-view="about"]').click();
await sleep(450);
__result(document.querySelector('.view.active').id === 'about', 'back to about');
__result(nav.classList.contains('is-scrolled') === false, 'nav not is-scrolled back on about');
if (links) {
  __result(getComputedStyle(links).backgroundColor.indexOf('13, 23, 27') >= 0, 'nav-links dark again on about top, got ' + getComputedStyle(links).backgroundColor);
}
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task7-nav.js`
Expected: FAIL（nav-links 初始是浅色 `rgba(255,255,255,0.55)`，无深色态；hero-next 点击无路由）

- [ ] **Step 3: style.css 导航深色态覆盖**

在 `.navbar` 块（L125-202）之后、`/* ===== 视图容器` 之前插入：

```css
/* =========================================================
   三期② 导航 is-scrolled 过渡：深色首屏顶部深色玻璃白字
   （只覆盖背景/文字色/边框/阴影；radius 与 blur 保留在基础规则）
   ========================================================= */
body[data-view="about"] .navbar:not(.is-scrolled) {
  background: rgba(13, 23, 27, 0.35);
  border-bottom-color: rgba(255, 255, 255, 0.12);
}
body[data-view="about"] .navbar:not(.is-scrolled) .nav-links {
  background: rgba(13, 23, 27, 0.35);
  border-color: rgba(255, 255, 255, 0.18);
  box-shadow: none;
}
body[data-view="about"] .navbar:not(.is-scrolled) .nav-brand { color: #fff; }
body[data-view="about"] .navbar:not(.is-scrolled) .nav-brand .dot { color: #7dd3fc; }
body[data-view="about"] .navbar:not(.is-scrolled) .nav-links a { color: rgba(255, 255, 255, 0.82); }
body[data-view="about"] .navbar:not(.is-scrolled) .nav-links a:hover { color: #fff; background: rgba(255, 255, 255, 0.12); }
body[data-view="about"] .navbar:not(.is-scrolled) .nav-links a.active { color: #7dd3fc; }
body[data-view="about"] .navbar:not(.is-scrolled) .nav-links a.active::after { background: #7dd3fc; }
body[data-view="about"] .navbar:not(.is-scrolled) .nav-contact a { color: rgba(255, 255, 255, 0.82); }
body[data-view="about"] .navbar:not(.is-scrolled) .nav-contact a:hover { background: rgba(255, 255, 255, 0.12); }
```

- [ ] **Step 4: js/animations.js 导航滚动态**

在 `document.documentElement.classList.add('js-anim');`（L14）之后插入：

```js
  /* ---------- 导航滚动态：首屏顶部深色玻璃，滚动/其他视图浅色玻璃 ---------- */
  var navEl = document.querySelector('.navbar');
  function syncNav() {
    if (!navEl) return;
    var active = document.querySelector('.view.active');
    var overHero = active && active.id === 'about' && window.scrollY <= 36;
    navEl.classList.toggle('is-scrolled', !overHero);
  }
```

`playView` 末尾（hue tween 块 L33 之后、函数闭合 `}` 之前）追加一行：

```js
    syncNav();
```

`init` 内（`setupBackground();` 之前）追加：

```js
    if (navEl) {
      window.addEventListener('scroll', syncNav, { passive: true });
      syncNav();
    }
```

- [ ] **Step 5: index.html 内联路由 3 处最小增量（唯一允许触碰的既有脚本）**

在 L523 `var links = ...` 行，加入 `.hero-next`：

```js
  var links = document.querySelectorAll('.nav-links a, .backtop, .hero-next');
```

在 `activate(name)`（L525-529）内，`links.forEach(...)` 之后追加两行：

```js
    document.body.dataset.view = name;
    window.scrollTo({ top: 0, behavior: 'auto' });
```

在 L554 点击处理选择器，加入 `.hero-next`：

```js
  document.querySelectorAll('.nav-links a, .hero-next').forEach(function (a) {
```

（其余行逐字保留。`body.dataset.view` 驱动 CSS 深色态——纯 CSS 选择器在 reduced-motion / 无 GSAP 下也生效，因为内联路由无条件运行；`scrollTo({top:0})` 保证切回 about 时回到顶部 → `is-scrolled` 正确复位为 false。）

- [ ] **Step 6: 升版并运行验证**

index.html L8：`style.css?v=20260809-9` → `style.css?v=20260809-10`

Run: `node scripts/verify.mjs scripts/checks/task7-nav.js`
Expected: PASS

- [ ] **Step 7: 提交**

```bash
git add style.css js/animations.js index.html scripts/checks/task7-nav.js
git commit -m "feat: navbar is-scrolled transition + hero-next routing (Phase 3)"
```

---

### Task 3: 四视图去框（移除全部 `.glass`）

**Files:**
- Modify: `index.html`（移除 6 个 `.glass` 包裹；skills 视图 `ability` 类移到 `<section>`；L8 `?v=20260809-11`）
- Modify: `style.css`（删除 `.glass` 规则与 `.ability` 组间距规则；新增视图内块间距；移动端/print 选择器去 `.glass`）
- Create: `scripts/checks/task8-borderless.js`

**Interfaces:**
- Consumes: Task 1/2 的路由与 `.nav-links` 导航。
- Produces: 五视图均无 `.glass`；`#skills` 为 `<section class="view ability" id="skills">`；视图内块间距规则 `.view:not(.hero-view) > * + * { margin-top: 1.4rem; }`。

- [ ] **Step 1: 写失败检查 `scripts/checks/task8-borderless.js`**

```js
// 三期③ 四视图去框：无 .glass 容器，内容直接浮在浅色背景上，内层卡片保留
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// 全站无 .glass
var glasses = document.querySelectorAll('.glass');
__result(glasses.length === 0, 'no .glass containers remain, got ' + glasses.length);

// 五视图渲染 + 直系 section-title（about 是 Hero 画布，无 section-title）
['about', 'education', 'experience', 'works', 'skills'].forEach(function (id) {
  var v = document.getElementById(id);
  __result(!!v, 'view exists: ' + id);
  if (v) {
    __result(v.getBoundingClientRect().width > 0, id + ' renders');
    if (id !== 'about') {
      __result(!!v.querySelector(':scope > .section-title'), id + ' has direct section-title child');
    }
  }
});

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
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task8-borderless.js`
Expected: FAIL（`glasses.length` = 6，education 无直系 section-title 等）

- [ ] **Step 3: index.html 移除 6 个 `.glass` 包裹（内容逐字保留）**

按顺序精确删除（只删包裹 div 的开/闭标签，内层全部保留）：

| # | 位置 | 包裹开标签 | 闭标签 |
|---|---|---|---|
| 1 | education | L75 `<div class="glass">` | L111 `</div>` |
| 2 | experience | L116 `<div class="glass">` | L285 `</div>` |
| 3 | works | L318 `<div class="glass">` | L358 `</div>` |
| 4 | skills 技术栈 | L363 `<div class="glass ability reveal">` | L393 `</div>` |
| 5 | skills 技能·爱好 | L395 `<div class="glass">` | L419 `</div>` |
| 6 | skills 竞赛·荣誉 | L421 `<div class="glass">` | L441 `</div>` |
| 7 | skills 生活掠影 | L443 `<div class="glass reveal">` | L471 `</div>` |

（共 7 对开闭标签 = 移除后 `.glass` 全站为 0。）

同时把 skills 的 `ability` 类从被删的包裹（#4）转移到 section 上：

```html
<section class="view ability" id="skills">
```

`#4` 的 `reveal` 类丢弃（该整块不再整体入场；内层 `.hobby-card` / `.mini-card` 等自身 reveal 保留）。

- [ ] **Step 4: style.css 删除 `.glass` 与 `.ability` 间距规则 + 新增块间距**

删除 `.glass` 规则（L232-241 整段）。**保留** `--glass-bg` / `--glass-border` 变量（L17-18，`.tag`/卡片仍用）。

删除 `.ability` 间距规则：L522 `.ability { margin-top: 0.2rem; }`、L523 `.ability .group { margin-bottom: 0.9rem; }`、L524 `.ability .group:last-child { margin-bottom: 0; }`、L605 `.ability .group { margin-bottom: 1.1rem; }`。**保留** `.ability .group-label` 规则（L525-531，`ability` 类已移到 section，仍命中）。

在 `.glass` 删除处（或 `.view.active .reveal` 相关 L229 之后）新增：

```css
/* 去框后：视图内内容块直接浮在背景上，块间统一间距 */
.view:not(.hero-view) > * + * { margin-top: 1.4rem; }
```

移动端块 L1138：`.glass, .featured { padding: 1.3rem 1.1rem; }` → `.featured { padding: 1.3rem 1.1rem; }`

print 块 L1151：`.glass, .featured, .tl-card, .mini-card, .hobby-card, .project-card, .modal-card {` → `.featured, .tl-card, .mini-card, .hobby-card, .project-card, .modal-card {`

- [ ] **Step 5: 升版并运行验证**

index.html L8：`style.css?v=20260809-10` → `style.css?v=20260809-11`

Run: `node scripts/verify.mjs scripts/checks/task8-borderless.js`
Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add index.html style.css scripts/checks/task8-borderless.js
git commit -m "feat: borderless views — remove all glass containers (Phase 3)"
```

---

### Task 4: reduced-motion Hero 检查 + 全量回归 + 收尾

**Files:**
- Create: `scripts/checks/task9-hero-reduced-motion.js`
- Verify: 全量回归（下述列表），如某既有检查意外变红则按「presence 型断言适配」原则最小修复并记档。

**Interfaces:**
- Consumes: Task 1 的 `.hero-view` 三层背景与 `.hero-next`、Task 2 的 `body[data-view]` 深色导航、Task 3 的去框结果。

- [ ] **Step 1: 写 `scripts/checks/task9-hero-reduced-motion.js`**

```js
// 三期④ reduced-motion：Hero 显海报不播视频、导航深色静止、底部引导静止、内容完整
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

__result(!document.documentElement.classList.contains('js-anim'), 'no js-anim (static fallback)');

var video = document.querySelector('.hero-view .hero-video');
__result(!!video, 'hero video element present');
if (video) {
  __result(!video.src, 'hero video has no src under reduced-motion');
  __result(parseFloat(getComputedStyle(video).opacity) < 0.05, 'hero video hidden (poster shows)');
  __result(getComputedStyle(video).display === 'none', 'hero video display none (CSS)');
}
var poster = document.querySelector('.hero-view .hero-poster');
__result(!!poster && getComputedStyle(poster).display !== 'none', 'hero poster visible');
var scrim = document.querySelector('.hero-view .hero-scrim');
__result(!!scrim, 'hero scrim present (contrast)');

// 名字未拆分、问候完整可读
var nameEl = document.querySelector('.hero .name');
__result(nameEl && !nameEl.querySelector('.char'), 'hero name not split (static text)');
__result(document.getElementById('typeTarget').textContent === '你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！', 'greeting shown as full text');

// 导航在 about 顶部为深色玻璃（纯 CSS body[data-view] 驱动，不依赖 JS class）
var links = document.querySelector('.nav-links');
if (links) {
  __result(getComputedStyle(links).backgroundColor.indexOf('13, 23, 27') >= 0, 'nav-links dark over hero under reduced-motion, got ' + getComputedStyle(links).backgroundColor);
}

// 底部引导静止
var next = document.querySelector('.hero-view .hero-next');
__result(!!next, 'hero-next present');
if (next) __result(getComputedStyle(next).animationName === 'none', 'hero-next static (no nudge)');
```

- [ ] **Step 2: 运行确认通过**

Run: `node scripts/verify.mjs scripts/checks/task9-hero-reduced-motion.js --reduced-motion`
Expected: PASS（Task 1/2 的 CSS 降级规则已就位）

- [ ] **Step 3: 全量回归**

常规模式逐一运行（全部应为 PASS）：

```bash
node scripts/verify.mjs scripts/checks/task1-background.js
node scripts/verify.mjs scripts/checks/task1-view-switch.js
node scripts/verify.mjs scripts/checks/task2-hero-chars.js
node scripts/verify.mjs scripts/checks/task2-typography.js
node scripts/verify.mjs scripts/checks/task3-components.js
node scripts/verify.mjs scripts/checks/task3-countup.js
node scripts/verify.mjs scripts/checks/task4-tilt.js
node scripts/verify.mjs scripts/checks/task4-transitions.js
node scripts/verify.mjs scripts/checks/task6-regression.js
node scripts/verify.mjs scripts/checks/task6-hero.js
node scripts/verify.mjs scripts/checks/task7-nav.js
node scripts/verify.mjs scripts/checks/task8-borderless.js
```

reduced-motion 模式（全部应为 PASS）：

```bash
node scripts/verify.mjs scripts/checks/task5-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task6-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task9-hero-reduced-motion.js --reduced-motion
```

预期：既有 task1-6 + 二期 4 检查无需改动即全绿（断言均为 presence 型；`.hero` 类保留使 `.hero .name` 等继续命中；radius/blur 在基础规则；无 `.glass` 后 reveal 均在内层卡片）。若某检查意外变红，**最小修复**（只改断言使其匹配新结构，不删断言、不放宽语义），并在 ledger 记档根因。

- [ ] **Step 4: 提交**

```bash
git add scripts/checks/task9-hero-reduced-motion.js
git commit -m "test: reduced-motion hero check + full Phase 3 regression (Phase 3)"
```

（若 Step 3 有适配既有检查的改动，一并 add + 在 commit message 注明。）

- [ ] **Step 5: 人工终审清单（用户桌面验证）**

计划执行完成、final whole-branch review 通过后，请用户在浏览器打开 `/Users/yxx/resume-v2/index.html` 目测确认（headless 无法覆盖观感）：
1. 首屏云端小岛视频淡入播放，海报兜底不闪黑，白字可读；底部「下一页 · 教育与成长」可见可点、路由到 education。
2. 导航在 about 顶部为深色玻璃白字；滚动/进其他视图恢复浅色玻璃胶囊；切回 about 回到深色。
3. 四视图内容直接浮在浅色流动背景上，卡片描边投影正常、可读性无退化。
4. `?v=20260809-11` 生效（刷新无样式残留）。
5. DevTools 模拟 `prefers-reduced-motion: reduce`：Hero 显海报、视频静止、无抖动。
6. 390×844 移动视口：Hero 一屏放下、底部引导可见。

---

## Self-Review

**1. Spec coverage:**
- ① Hero 画布（100svh 画布、三层背景、白字、底部引导）→ Task 1 ✓（min-height 偏差已裁决）
- ② 导航透明→玻璃过渡、`.is-scrolled` → Task 2 ✓
- ③ 四视图去框、`.glass` 清理 → Task 3 ✓
- 既有检查适配 + 新增 Hero/导航/去框/reduced-motion 检查 + 全量回归 → Task 1/2/3 各带新检查，Task 4 全量回归 ✓
- 可访问性/性能/降级（reduced-motion 不播视频、无 JS 零网络、error 兜底、移动端紧凑）→ Task 1 Step 5（CSS 降级）+ Task 1 Step 6（JS 机制）+ Task 4 检查 ✓
- 验收标准 7 项 → Task 1-4 对应 ✓；「生产零变更」→ 全局约束 ✓
- 视频素材自托管 → 已在上阶段完成（`assets/vendor/hero-island.mp4` 322KB，已提交 29c6e68），本计划无重复步骤 ✓

**2. Placeholder scan:** 所有 CSS/JS/检查代码均完整给出，无 TBD/占位；HTML 移除操作给出精确行号与内容保留原则。✓

**3. Type/名称一致性：**
- `.hero-view` / `.hero-poster` / `.hero-video` / `.hero-scrim` / `.hero-inner` / `.hero-next` 在 Task 1（HTML+CSS）与 Task 4（检查）命名一致 ✓
- `syncNav` / `navEl` / `.navbar.is-scrolled` / `body[data-view]` 在 Task 2 CSS 与 JS、Task 4 检查一致 ✓
- `.view:not(.hero-view) > * + *` 在 Task 3 与检查一致 ✓
- `?v=` 序列 9→10→11 与各 CSS 变更任务一一对应 ✓
- `data-view="education"`（hero-next）与 Task 2 路由接线、Task 7 检查一致 ✓

**4. 既有断言兼容性复核：** `task2-typography.js`（linear-gradient presence + webkitTextFillColor）、`task5-reduced-motion.js` / `task6-reduced-motion.js`（`.hero .name` 无 char + fontSize ≥40 + 问候全文）、`task3-components.js`（radius/blur 基础规则）、`task1-view-switch.js`（reveal opacity）、`task6-regression.js`（路由/弹窗/backtop）——均在改造后保持命中或不受影响，Task 4 回归兜底。✓
