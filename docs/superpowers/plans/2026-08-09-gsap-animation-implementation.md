# GSAP 动效升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/Users/yxx/resume-v2`（开发副本）给简历网页加 GSAP 动效：视图切换编排、Hero 逐字展开、数字滚动计数、卡片 3D 倾斜、背景视差光斑，并保持可访问性与既有功能完整。

**Architecture:** 自托管 `assets/vendor/gsap.min.js`（v3.15.0）+ 新建 `js/animations.js` 模块（IIFE，暴露 `window.anim = { init, playView }`）。视图路由仍在 `index.html` 内联 JS，切换时调用 `anim.playView(name)` 播放入场编排。渐进增强：GSAP 缺失或 `prefers-reduced-motion` 时 `anim` 为 no-op，CSS 动效兜底。测试用无头 Chrome CDP 断言脚本（`scripts/verify.mjs` + `scripts/checks/*.js`）。

**Tech Stack:** 原生 HTML/CSS/JS（ES5 风格 IIFE，与现有内联脚本一致）、GSAP 3.15.0（仅核心，无 ScrollTrigger）、Node 内置 WebSocket + 无头 Chrome CDP 做验证。

## Global Constraints

- **不动生产**：只在 `/Users/yxx/resume-v2` 开发；`/Users/yxx/resume` 与 47.85.52.9 本阶段零变更。
- **无外链 CDN**：gsap 自托管到 `assets/vendor/`（大陆可访问）。
- **渐进增强**：GSAP 未加载 / `prefers-reduced-motion` / 无 JS 时，页面静态可见、功能完整、CSS 动效兜底。
- **只动 transform/opacity**：不触发布局与重绘。
- **视差/倾斜仅限精确指针设备**：`(hover: hover) and (pointer: fine)`，移动端天然不触发。
- **缓存版本号**：改 `style.css` 必须把 `index.html` 里 `style.css?v=` 升级（当前 `v=20260807-4` → `v=20260809-1`）。index.html 不缓存、style.css 缓存 30 天。
- **回归保底**：导航路由（hash 直达 + 点击切换）、联系弹窗、二维码放大弹窗、Escape 分层关闭、回到顶部，全部不能坏。
- **代码风格**：与现有内联脚本一致 —— `var`、IIFE、中文注释、原生 DOM API，不引入构建/框架。

---

## File Structure

| 文件 | 动作 | 职责 |
|---|---|---|
| `assets/vendor/gsap.min.js` | Create | 自托管 GSAP 3.15.0（curl 下载，~72KB） |
| `js/animations.js` | Create | GSAP 动效模块：`window.anim`（init / playView），含 hero 拆分、计数、倾斜、光斑 |
| `index.html` | Modify | 加 script 标签、greeting 文本、移除 caret/打字机、`data-count` 数字、`bg-glows` 光斑 DOM、改写内联 `show()`、`?v=` 升级 |
| `style.css` | Modify | `html.js-anim` 覆写、`.char`、`.num`、`.bg-glows/.glow`（删 `body::before`）、reduced-motion 补充 |
| `scripts/verify.mjs` | Create | 无头 Chrome CDP 验证运行器（不随页面加载，仅开发用） |
| `scripts/checks/*.js` | Create | 每任务一个浏览器内断言脚本，用 `__result(pass, msg)` |

---

### Task 1: 测试脚手架 + 自托管 GSAP + 接线 + 通用视图编排

**Files:**
- Create: `assets/vendor/gsap.min.js`、`js/animations.js`、`scripts/verify.mjs`、`scripts/checks/task1-view-switch.js`
- Modify: `index.html`（script 标签、`?v=`、改写内联 `show()`）、`style.css`（`html.js-anim` 覆写 + reduced-motion 补充）

**Interfaces:**
- Produces: `window.anim = { init(), playView(name) }`；`html.js-anim` class（GSAP 可用且未降级时挂在 `<html>`）；`scripts/verify.mjs <check.js> [--reduced-motion]` 退出码 0/1。
- Consumes: 无（首批）。

- [ ] **Step 1: 下载并核对 GSAP**

```bash
mkdir -p /Users/yxx/resume-v2/assets/vendor
curl -sL https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js -o /Users/yxx/resume-v2/assets/vendor/gsap.min.js
wc -c /Users/yxx/resume-v2/assets/vendor/gsap.min.js   # 期望约 72900 字节
grep -c "gsap" /Users/yxx/resume-v2/assets/vendor/gsap.min.js   # 期望 > 0
```

- [ ] **Step 2: 写验证运行器 `scripts/verify.mjs`**

```js
#!/usr/bin/env node
// scripts/verify.mjs — 无头 Chrome CDP 验证运行器
// 用法: node scripts/verify.mjs <check-file.js> [--reduced-motion]
// check-file.js 在浏览器上下文运行，逐条调用 globalThis.__result(pass, msg)。
// 全部通过退出 0，否则 1。
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const URL = 'file:///Users/yxx/resume-v2/index.html';
const checkFile = process.argv[2];
const reducedMotion = process.argv.includes('--reduced-motion');
if (!checkFile) { console.error('usage: node scripts/verify.mjs <check.js> [--reduced-motion]'); process.exit(2); }
const checkCode = readFileSync(checkFile, 'utf8');

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu',
  '--no-first-run', '--no-default-browser-check', '--window-size=1280,900',
  ...(reducedMotion ? ['--force-prefers-reduced-motion'] : []),
  URL,
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let page;
for (let i = 0; i < 20; i++) {           // 等待 Chrome 就绪
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    page = targets.find((t) => t.type === 'page');
    if (page) break;
  } catch (_) {}
  await sleep(250);
}
if (!page) { console.error('FAIL  chrome did not become ready'); chrome.kill(); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const d = JSON.parse(e.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
};
await new Promise((r) => (ws.onopen = r));
function send(method, params = {}) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

await send('Runtime.evaluate', { expression:
  `globalThis.__results = [];
   globalThis.__result = (pass, msg) => globalThis.__results.push({ pass: String(msg) });`
});
try {
  await send('Runtime.evaluate', { expression: `(async () => { ${checkCode} })()`, awaitPromise: true, returnByValue: true });
} catch (err) {
  console.error('FAIL  check script threw:', err.message);
}
await sleep(200);
const out = await send('Runtime.evaluate', { expression: 'JSON.stringify(globalThis.__results)', returnByValue: true });
const results = JSON.parse(out.result.value) || [];
let failed = 0;
for (const r of results) { console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.msg}`); if (!r.pass) failed++; }
console.log(`\n${results.length} checks, ${failed} failed`);
ws.close(); chrome.kill();
process.exit(failed ? 1 : 0);
```

- [ ] **Step 3: 写失败检查 `scripts/checks/task1-view-switch.js`**

```js
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
```

- [ ] **Step 4: 运行验证确认失败（尚未接线）**

Run: `node scripts/verify.mjs scripts/checks/task1-view-switch.js`
Expected: FAIL 于 `gsap loaded` 与 `html.js-anim applied`（其余视浏览器状态不定）。

- [ ] **Step 5: 创建 `js/animations.js`（骨架：guard + 通用视图编排）**

```js
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
  }

  function init() {}

  window.anim = { init: init, playView: playView };
  init();
})();
```

- [ ] **Step 6: 接线 `index.html`**

6a. 版本号升级（`style.css` 被改过，必须 +1）：
```html
<link rel="stylesheet" href="style.css?v=20260809-1">
```

6b. 内联 `<script>` 之前加两个标签（保持顺序：gsap → animations.js → 内联）：
```html
<script src="assets/vendor/gsap.min.js"></script>
<script src="js/animations.js"></script>
```

6c. 把内联脚本第一个 IIFE（`/* ═══ 多视图路由 ═══ */` 整块，含 `show`/`fromHash`/点击绑定/`animateBars` 调用）**整体替换**为：

```js
/* ═════════════ 多视图路由（支持 hash 直达 + GSAP 入场） ═════════════ */
(function () {
  var views = document.querySelectorAll('.view');
  var links = document.querySelectorAll('.nav-links a, .backtop');

  function activate(name) {
    views.forEach(function (v) { v.classList.toggle('active', v.id === name); });
    links.forEach(function (a) { a.classList.toggle('active', a.dataset.view === name); });
    if (window.anim && window.anim.playView) window.anim.playView(name);
  }

  var pending = null;
  function show(name) {
    name = name || 'about';
    var cur = document.querySelector('.view.active');
    var next = document.getElementById(name);
    if (pending) { pending.kill(); pending = null; }
    if (cur && cur !== next && window.gsap) {
      // 旧视图快速淡出，再切换（gsap 缺失时直接切换）
      pending = window.gsap.to(cur, {
        opacity: 0, duration: 0.12, ease: 'power1.in',
        onComplete: function () { pending = null; activate(name); }
      });
    } else {
      activate(name);
    }
  }

  function fromHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var valid = ['about', 'education', 'experience', 'works', 'skills'];
    return valid.indexOf(h) >= 0 ? h : 'about';
  }

  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var name = a.dataset.view;
      history.replaceState(null, '', '#' + name);
      show(name);
    });
  });

  var bt = document.querySelector('.backtop');
  if (bt) bt.addEventListener('click', function (e) {
    e.preventDefault();
    history.replaceState(null, '', '#about');
    show('about');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  show(fromHash());
})();
```

> 说明：原 IIFE 里的 `animateBars()` 调用已删除（页面不存在 `.skill-bar-fill[data-w]`，属死代码）；`animateBars` 函数体保留不动。

- [ ] **Step 7: 写 CSS 覆写 `style.css`**

在 `.view.active .reveal { animation: riseUp 0.55s ease both; }`（约 L171）之后追加：

```css
/* GSAP 接管入场：关闭 CSS 侧入场动画，避免双动画（仅在 JS+GSAP 可用时生效） */
html.js-anim .view { animation: none; }
html.js-anim .view.active .reveal { animation: none; opacity: 0; transform: translateY(14px); }
```

在 `@media (prefers-reduced-motion: reduce)` 块（约 L1052）内追加一条：

```css
  .view { animation: none; }
```

- [ ] **Step 8: 运行验证确认通过**

Run: `node scripts/verify.mjs scripts/checks/task1-view-switch.js`
Expected: 全部 PASS，退出码 0。

- [ ] **Step 9: 手动目测**

用 Chrome 打开 `file:///Users/yxx/resume-v2/index.html`：切换 5 个视图，每个视图 `.reveal` 应错峰弹入（back.out 回弹感），旧视图 0.12s 淡出。再硬刷新一次确认无闪白/无内容消失。

- [ ] **Step 10: Commit**

```bash
cd /Users/yxx/resume-v2
git add assets/vendor/gsap.min.js js/animations.js scripts/verify.mjs scripts/checks/task1-view-switch.js index.html style.css
git commit -m "feat: 自托管 GSAP + 视图切换 GSAP 编排（js-anim 渐进增强）
- assets/vendor/gsap.min.js v3.15.0 自托管
- js/animations.js: window.anim，视图 reveal 错峰弹入 back.out
- 内联路由改写：旧视图淡出 + 调用 anim.playView
- scripts/verify.mjs 无头 CDP 验证运行器 + task1 检查
- style.css?v=20260809-1

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: Hero 逐字展开（名字 + 问候语），移除打字机

**Files:**
- Modify: `index.html`（greeting 进 `#typeTarget`、删 caret、删打字机 IIFE）、`js/animations.js`（`splitChars` + `playHero` + 挂进 playView/init）、`style.css`（`.char`）
- Test: `scripts/checks/task2-hero-chars.js`

**Interfaces:**
- Consumes: `window.anim.playView(name)`（Task 1）。
- Produces: `splitChars(el)` 返回 `NodeList` 字符 span（幂等，`data-split` 守卫）；`#typeTarget` 直接承载完整问候语文本。

- [ ] **Step 1: 写失败检查 `scripts/checks/task2-hero-chars.js`**

```js
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
```

- [ ] **Step 2: 运行确认失败（尚未实现拆分）**

Run: `node scripts/verify.mjs scripts/checks/task2-hero-chars.js`
Expected: 多处 FAIL（`.char` 不存在、caret 仍在）。

- [ ] **Step 3: HTML —— greeting 落位 + 删 caret**

把 L47：
```html
<div class="typing-line"><span class="typing-target" id="typeTarget"></span><span class="caret" aria-hidden="true">▌</span></div>
```
替换为：
```html
<div class="typing-line"><span class="typing-target" id="typeTarget" aria-label="你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！">你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！</span></div>
```

- [ ] **Step 4: HTML —— 删除打字机 IIFE**

删掉内联脚本里的整块 `/* ═════════════ Hero 打字机（友好问候，打完停留） ═════════════ */`（`var greeting` 到 `})();`，约 L562-578）。

- [ ] **Step 5: `js/animations.js` —— 加字符拆分与 Hero 动画**

在 IIFE 内 `playView` 之后插入两个函数，并把 `playView` 与 `init` 改成：

```js
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
    var nameChars = splitChars(view.querySelector('.hero .name'));
    var greetChars = splitChars(view.querySelector('#typeTarget'));
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
```

`playView` 末尾追加一行：
```js
    if (name === 'about') playHero(view);
```

`init` 改为：
```js
  function init() {
    splitChars(document.querySelector('.hero .name'));
    splitChars(document.querySelector('#typeTarget'));
  }
```

- [ ] **Step 6: `style.css` —— `.char` 样式**

在 `.hero .role`（约 L235）之后追加：

```css
/* Hero 逐字展开：单字为内联块以支持 transform 动画 */
.hero .char { display: inline-block; will-change: transform; }
```

- [ ] **Step 7: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task2-hero-chars.js`
Expected: 全部 PASS。

- [ ] **Step 8: 手动目测**

刷新：名字「邢耀」与问候语逐字从下方弹起，无打字机光标；再切走/切回 about，动画重播。

- [ ] **Step 9: Commit**

```bash
cd /Users/yxx/resume-v2
git add index.html js/animations.js style.css scripts/checks/task2-hero-chars.js
git commit -m "feat: Hero 名字+问候语逐字弹跳展开，移除打字机
- greeting 直接写入 #typeTarget，删除 caret 与打字机 IIFE
- splitChars 幂等拆分，aria-label 保留完整句

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 数字滚动计数

**Files:**
- Modify: `index.html`（6 处 `data-count` 数字）、`js/animations.js`（`countUp` + 挂进 playView）、`style.css`（`.num`）
- Test: `scripts/checks/task3-countup.js`

**Interfaces:**
- Consumes: `window.anim.playView(name)`。
- Produces: `.num[data-count]` 元素（`data-suffix` 可选），视图激活时从 0 滚动到目标；计数期间文本=`整数+后缀`。

- [ ] **Step 1: 写失败检查 `scripts/checks/task3-countup.js`**

```js
// 数字计数：works 330+，experience 3000+/97%/98%/95%/15
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }

clickNav('works');
await sleep(1600);
var w = document.querySelectorAll('#works .num[data-count]');
__result(w.length === 1, 'works has 1 count number, got ' + w.length);
__result(w[0] && w[0].textContent === '330+', 'works 330+ counted, got ' + (w[0] && w[0].textContent));

clickNav('experience');
await sleep(1600);
var e = document.querySelectorAll('#experience .num[data-count]');
__result(e.length === 5, 'experience has 5 count numbers, got ' + e.length);
var texts = Array.from(e).map(function (n) { return n.textContent; });
__result(texts.indexOf('3000+') >= 0, '3000+ present');
__result(texts.indexOf('97%') >= 0, '97% present');
__result(texts.indexOf('98%') >= 0, '98% present');
__result(texts.indexOf('95%') >= 0, '95% present');
__result(texts.indexOf('15') >= 0, '15 present');
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task3-countup.js`
Expected: `works has 1 count number, got 0` 等 FAIL。

- [ ] **Step 3: HTML —— 包 `data-count` span**

（`index.html` 三处精确替换）

3a. works 描述（约 L288，子串 `330+ 自动化测试`）：
```html
<span class="num" data-count="330" data-suffix="+">330+</span> 自动化测试
```

3b. experience「策略效果监控」li（约 L174，子串 `新增/维护 15 条笔记直播中`）：
```html
新增/维护 <span class="num" data-count="15">15</span> 条笔记直播中
```

3c. experience「垂类模型搭建」li（约 L175，子串 `日均处理量级 3000+，F1 模型 Precision 97%、Recall 98%，拒绝模型准确率均达 95%`）：
```html
日均处理量级 <span class="num" data-count="3000" data-suffix="+">3000+</span>，F1 模型 Precision <span class="num" data-count="97" data-suffix="%">97%</span>、Recall <span class="num" data-count="98" data-suffix="%">98%</span>，拒绝模型准确率均达 <span class="num" data-count="95" data-suffix="%">95%</span>
```

- [ ] **Step 4: `js/animations.js` —— 加 `countUp`**

`playHero` 之后插入：

```js
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
```

`playView` 末尾追加一行：
```js
    if (name === 'experience' || name === 'works') countUp(view);
```

- [ ] **Step 5: `style.css` —— `.num` 等宽数字**

在 `.hero .char` 规则后追加：

```css
/* 数字滚动计数：等宽数字避免逐位跳动 */
.num { font-variant-numeric: tabular-nums; }
```

- [ ] **Step 6: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task3-countup.js`
Expected: 全部 PASS。

- [ ] **Step 7: 手动目测**

切到「个人作品」「实习经历」：330+、3000+、97%/98%/95%、15 从 0 滚动到目标，无布局抖动。

- [ ] **Step 8: Commit**

```bash
cd /Users/yxx/resume-v2
git add index.html js/animations.js style.css scripts/checks/task3-countup.js
git commit -m "feat: 关键数字滚动计数（330+/3000+/97%/98%/95%/15）
- .num[data-count][data-suffix] 标记，视图激活时从 0 滚动
- tabular-nums 防跳动

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 卡片 3D 倾斜微交互

**Files:**
- Modify: `js/animations.js`（`setupTilt` + init 调用）
- Test: `scripts/checks/task4-tilt.js`

**Interfaces:**
- Consumes: 无新接口；作用于 `.project-card` / `.hobby-card` / `.tl-card`。
- Produces: 精确指针设备上，卡片 hover 跟随 3D 倾斜 + 图标/图片上浮，移出弹性回正。

- [ ] **Step 1: 写失败检查 `scripts/checks/task4-tilt.js`**

```js
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
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task4-tilt.js`
Expected: `card rotates while hovered` FAIL（transform 无变化）。

- [ ] **Step 3: `js/animations.js` —— 加 `setupTilt`**

`countUp` 之后插入：

```js
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
```

`init` 末尾追加一行：
```js
    setupTilt();
```

> 说明：GSAP 内联 transform 会覆盖 CSS `:hover` 的 `translateY(-3px/-2px)`，故 hover 时用 tween 的 `y: lift` 复刻抬升；box-shadow/border 的 hover 效果仍来自 CSS，不受影响。

- [ ] **Step 4: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task4-tilt.js`
Expected: 全部 PASS。

- [ ] **Step 5: 手动目测**

在 Chrome（桌面）hover 作品/爱好/时间线卡片：卡片轻微跟随鼠标 3D 倾斜，图标/图片上浮；移出后弹性回正。触控设备不应触发。

- [ ] **Step 6: Commit**

```bash
cd /Users/yxx/resume-v2
git add js/animations.js scripts/checks/task4-tilt.js
git commit -m "feat: 作品/爱好/时间线卡片 hover 3D 倾斜 + 图标上浮
- 仅 (hover:hover) and (pointer:fine) 生效
- y:lift 复刻 CSS hover 抬升，避免被内联 transform 覆盖

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: 背景视差光斑 + 流动底色

**Files:**
- Modify: `index.html`（`bg-glows` DOM）、`style.css`（`.bg-glows/.glow`，删 `body::before`）、`js/animations.js`（`setupBackground` + init 调用）
- Test: `scripts/checks/task5-glows.js`

**Interfaces:**
- Consumes: 无新接口；作用于 `.bg-glows` 及其 4 个 `.glow`。
- Produces: 光斑各自漂移 + 整层鼠标视差；reduced-motion/无 JS 时为静态光斑。

- [ ] **Step 1: 写失败检查 `scripts/checks/task5-glows.js`**

```js
// 背景光斑：DOM 存在、body::before 已移除、视差响应、漂移随时间变化
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var glows = document.querySelector('.bg-glows');
__result(!!glows, 'bg-glows container exists');
__result(glows && glows.querySelectorAll('.glow').length === 4, '4 glow elements, got ' + (glows ? glows.querySelectorAll('.glow').length : 0));

var before = getComputedStyle(document.body, '::before');
__result(before.backgroundImage === 'none', 'legacy body::before removed, got ' + before.backgroundImage);

var t0 = getComputedStyle(glows).transform;
document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100, bubbles: true }));
await sleep(350);
var t1 = getComputedStyle(glows).transform;
__result(t1 !== t0, 'glow layer parallax responds to pointer, ' + t0 + ' -> ' + t1);

var g0 = getComputedStyle(glows.querySelector('.g1')).transform;
await sleep(2500);
var g1 = getComputedStyle(glows.querySelector('.g1')).transform;
__result(g1 !== g0, 'glow drifts over time, ' + g0 + ' -> ' + g1);
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task5-glows.js`
Expected: FAIL（无 `.bg-glows`，`body::before` 仍在）。

- [ ] **Step 3: HTML —— 加 `bg-glows` DOM**

在 `.bg-dots` 容器之后插入：

```html
<!-- ═══════════════ 背景光斑（GSAP 漂移 + 鼠标视差） ═══════════════ -->
<div class="bg-glows" aria-hidden="true">
  <span class="glow g1"></span><span class="glow g2"></span>
  <span class="glow g3"></span><span class="glow g4"></span>
</div>
```

- [ ] **Step 4: `style.css` —— 光斑样式，删除 `body::before`**

删除 `body::before { ... }` 整块（约 L37-49），替换为：

```css
/* 背景光斑（GSAP 漂移 + 视差；无 JS/降级时为静态装饰） */
.bg-glows {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  will-change: transform;
  opacity: 0.65;
}
.g1 { width: 520px; height: 360px; top: 6%;  left: 6%;  background: radial-gradient(circle, rgba(125, 211, 252, 0.55), transparent 70%); }
.g2 { width: 440px; height: 320px; top: 16%; right: 6%; background: radial-gradient(circle, rgba(56, 189, 248, 0.50), transparent 70%); }
.g3 { width: 600px; height: 420px; bottom: 10%; left: 18%; background: radial-gradient(circle, rgba(147, 197, 253, 0.50), transparent 70%); }
.g4 { width: 420px; height: 300px; bottom: 6%; right: 16%; background: radial-gradient(circle, rgba(56, 189, 248, 0.40), transparent 70%); }
```

在 `@media (max-width: 640px)`（约 L1030）内追加移动端减载：

```css
  .glow { filter: blur(40px); opacity: 0.5; }
```

- [ ] **Step 5: `js/animations.js` —— 加 `setupBackground`**

`setupTilt` 之后插入：

```js
  /* ---------- 背景视差光斑 ---------- */
  function setupBackground() {
    var glows = document.querySelector('.bg-glows');
    if (!glows) return;
    gsap.utils.toArray('.bg-glows .glow').forEach(function (g, i) {
      gsap.to(g, {
        x: gsap.utils.random(-34, 34), y: gsap.utils.random(-26, 26),
        duration: gsap.utils.random(6, 10), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.5
      });
    });
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;
    var cur = { x: 0, y: 0 }, target = { x: 0, y: 0 };
    document.addEventListener('pointermove', function (e) {
      target.x = (e.clientX / window.innerWidth - 0.5) * 40;
      target.y = (e.clientY / window.innerHeight - 0.5) * 40;
    });
    gsap.ticker.add(function () {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      gsap.set(glows, { x: cur.x, y: cur.y });
    });
  }
```

`init` 末尾追加一行：
```js
    setupBackground();
```

- [ ] **Step 6: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task5-glows.js`
Expected: 全部 PASS（含 2.5s 漂移断言）。

- [ ] **Step 7: 手动目测**

桌面刷新：四个柔和光斑缓慢漂移，鼠标移动时光斑层整体反向跟随（±20px 视觉厚度）；移动浏览器仅有缓慢漂移。系统开启「减少动态」时全静态。

- [ ] **Step 8: Commit**

```bash
cd /Users/yxx/resume-v2
git add index.html style.css js/animations.js scripts/checks/task5-glows.js
git commit -m "feat: 背景光斑视差 + 流动层（替换静态 body::before）
- 4 个 .glow 各自 GSAP 漂移 + 整层 lerp 鼠标视差
- 移动端 blur/opacity 减载

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: reduced-motion 验证 + 全量回归 + 收尾

**Files:**
- Test: `scripts/checks/task6-regression.js`、`scripts/checks/task6-reduced-motion.js`
- Modify: 无（验证与收尾；若发现缺陷则修复）

**Interfaces:**
- Consumes: 全部已实现功能。

- [ ] **Step 1: 写全量回归检查 `scripts/checks/task6-regression.js`**

```js
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
```

- [ ] **Step 2: 写 reduced-motion 检查 `scripts/checks/task6-reduced-motion.js`**

```js
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
```

- [ ] **Step 3: 常规模式跑回归**

Run: `node scripts/verify.mjs scripts/checks/task6-regression.js`
Expected: 全部 PASS。

- [ ] **Step 4: reduced-motion 模式跑检查**

Run: `node scripts/verify.mjs scripts/checks/task6-reduced-motion.js --reduced-motion`
Expected: 全部 PASS（验证 `--force-prefers-reduced-motion` 降级路径）。

- [ ] **Step 5: 手动终审（浏览器）**

用 Chrome 打开页面逐项目测：
1. 首屏 hero 名字/问候语逐字弹跳；五个视图切换错峰弹入；旧视图淡出。
2. 数字滚动正确（330+、3000+、97/98/95%、15）。
3. 作品/爱好/时间线卡片 hover 倾斜 + 图标上浮，移出回正。
4. 背景光斑漂移 + 鼠标视差；滚动页面（可点回到顶部）。
5. 联系弹窗、二维码放大弹窗、Escape 分层关闭、下载 PDF、外链按钮均可点。
6. Chrome 开发者工具 Rendering → Emulate prefers-reduced-motion 打开后刷新：全部静态、内容完整可见。
7. 手机视口（DevTools 390px）：光斑变淡变小、无倾斜、页面可正常滑动阅读。

- [ ] **Step 6: 清理 + 提交**

确认 `scripts/` 与 `docs/` 不会影响页面（非 HTML 引用）；提交检查脚本：

```bash
cd /Users/yxx/resume-v2
git add scripts/checks/task6-regression.js scripts/checks/task6-reduced-motion.js
git commit -m "test: reduced-motion + 全量回归检查（视图/弹窗/Escape/回到顶部）

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review 记录

**Spec 覆盖：**
- ① 视图编排 → Task 1（`playView` stagger back.out）✓
- ② Hero 逐字展开（名字 + 问候语，删打字机）→ Task 2 ✓
- ③ 数字计数（330+/3000+/97%/98%/95%/15）→ Task 3 ✓
- ④ 卡片倾斜 + 图标上浮 → Task 4 ✓
- ⑤ 背景光斑视差 + 流动底色 → Task 5 ✓
- ⑥ 技能条（spec 标记「可选，默认保留 CSS」；页面实测无 `.skill-bar-fill`，无改动）→ 记于 Task 1 Step 6c 说明 ✓
- 可访问性/性能/降级 → Task 1（guard、js-anim）+ Task 6（reduced-motion 检查 + 手动终审）✓
- 验收：移动端 390px、reduced-motion 关闭动画 → Task 6 ✓

**Placeholder 扫描：** 无 TBD/TODO；所有代码步骤含完整可执行内容；verify/check 脚本完整。

**类型/命名一致性：** 全程统一 `window.anim`（`init`/`playView`）、`splitChars`、`countUp`、`setupTilt`、`setupBackground`、`.char`、`.num[data-count]`、`.bg-glows/.glow`；内联路由统一调用 `anim.playView`。CSS 版本号统一为 `v=20260809-1`。
