# 浅色电影感升级 二期 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留浅色基调与五视图结构的前提下，把简历升级到「浅色电影感」：背景五层（流动层 + 光斑 + 视频纹理）、Hero 渐变大字、玻璃组件、电影化视图过渡，reduced-motion/无 JS 全静态可读。

**Architecture:** 纯前端静态页（自托管 GSAP 3.15.0）。二期改动集中在 `index.html`（背景 DOM）、`style.css`（视觉）、`js/animations.js`（背景系统 + playView 升级）、`assets/vendor/`（自托管视频纹理 + accent 字体）。`js/animations.js` 仍是单一 IIFE，`window.anim = { init, playView }`。视觉全部走 CSS，动效只走 GSAP 的 transform/opacity（`filter: blur` 为已豁免的电影化特效）。验证用无头 Chrome CDP。

**Tech Stack:** 原生 HTML/CSS/JS (ES5 IIFE)、GSAP 3.15.0、无头 Chrome CDP 检查脚本（`node scripts/verify.mjs scripts/checks/<file>.js [--reduced-motion]`）。

## Global Constraints

以下约束对每个任务生效，逐条原文复制进 review：

- **渐进增强**：`js-anim` class 仅在「GSAP 可用 + 非 prefers-reduced-motion」时由 animations.js 注入；无 JS / reduced-motion → 不注入 → 内容全静态可读。所有动效必须以此为前提设计。
- **动画只动 `transform` / `opacity`**（`filter: blur` 为已豁免的电影化特效，允许用于视图对焦与光斑）。
- **视频纹理机制（验收关键）**：`.bg-video` CSS **恒为 `opacity: 0`**，是否播放由 JS 全权控制；JS 在 `loadeddata` 后 `gsap.to(video, { opacity: 0.12 })` 从 0 淡入（桌面 0.12 / 移动 ≤640px 0.06）；`@media (prefers-reduced-motion: reduce)` 下 `display: none`；无 JS → 永不播放。任何任务不得让视频在无 JS/reduced-motion 下可见或播放。
- **`style.css?v=` 每次 CSS 变更升版**：Task 1 → `20260809-5`，Task 2 → `20260809-6`，Task 3 → `20260809-7`，Task 5 → `20260809-8`（当前是 `20260809-4`，见 index.html L8）。
- **代码风格**：ES5 IIFE、`var`、原生 DOM API、中文注释。动画/路由逻辑只在 `js/animations.js` 与 index.html 内联脚本。
- **无外链 CDN**：新资产一律自托管 `assets/vendor/`。视频 = `assets/vendor/bg-texture.mp4`，字体 = `assets/vendor/SpaceGrotesk-600.woff2`。
- **既有功能零回归**：五视图切换、hash 直达、`#typeTarget` 内容（27 字）、`.num[data-count]` 计数、联系弹窗 / 二维码弹窗 / Escape 分层关闭、回到顶部、`.backtop`、`.skill-bar-fill`。所有 index.html 内联路由脚本（L514-622）不动。
- **层级（自底向上）**：`body` 底色 → `.bg-flow`(z:-4) → `.bg-glows`(z:-3) → `.bg-dots`(z:-2) → `.bg-video`(z:-1) → 内容(0+)。现役 `.bg-glows` 是 `-2`、`.bg-dots` 是 `-1`，本计划把两者重排为 `-3` / `-2`。
- **生产零变更**：只开发 `/Users/yxx/resume-v2`；`/Users/yxx/resume` 与 47.85.52.9 本阶段不动。
- **光斑随视图变色**：`--glow-hue` CSS 变量（默认 199），`.glow` 背景用 `hsla(var(--glow-hue, 199), 95%, 80%, 0.6)`；视图切换时 playView 用 GSAP 平滑过渡该变量（Task 4）。
- **accent 字体**：`--num-font: 'Space Grotesk', 'Inter', 'PingFang SC', sans-serif`，仅 `.num` 用；`font-variant-numeric: tabular-nums` 保留；字体加载失败回退系统字体不影响可读性。

---

### Task 1: 背景系统（流动层 + 光斑升级 + 视频纹理层）

**Files:**
- Create: `assets/vendor/bg-texture.mp4`（复制已压缩视频）
- Modify: `index.html`（加 `.bg-flow` div + `.bg-video` video，升 `?v=` → `20260809-5`）、`style.css`（z-index 重排、body 多层渐变、`.bg-flow`、`.glow` hsl 升级放大、`.bg-video`）、`js/animations.js`（`setupBackground` 升级）
- Test: `scripts/checks/task1-background.js`

**Interfaces:**
- Consumes: 现 `.bg-glows`（4 个 `.glow`）、`.bg-dots`（6 个 `.dot`）；`setupBackground` 由 `init()` 末尾调用（现 L136）。
- Produces: `.bg-flow` 固定层；`.bg-video` 视频元素（JS 设 src 后淡入）；`--glow-hue` 默认值 199；`.glow` 视差幅度 ±40px（Task 4 复用 `--glow-hue`）。

- [ ] **Step 1: 复制视频资产**

```bash
cp /tmp/novel_resume_video_check/v2_720.mp4 /Users/yxx/resume-v2/assets/vendor/bg-texture.mp4
ls -la /Users/yxx/resume-v2/assets/vendor/bg-texture.mp4
```
Expected: 文件存在（约 469KB）。已压缩（1280x720 h264 crf30 `-an` `+faststart`）。

- [ ] **Step 2: 写失败检查 `scripts/checks/task1-background.js`**

```js
// 背景系统二期：流动层 / 光斑升级(hsl+放大) / 视频纹理淡入 / 层序
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function waitFor(fn, timeout) {
  return new Promise(function (resolve) {
    var t0 = Date.now();
    (function poll() {
      if (fn()) return resolve(true);
      if (Date.now() - t0 > timeout) return resolve(false);
      setTimeout(poll, 120);
    })();
  });
}

// 层级自底向上：.bg-flow(-4) → .bg-glows(-3) → .bg-dots(-2) → .bg-video(-1)
var flow = document.querySelector('.bg-flow');
__result(!!flow, 'bg-flow layer exists');
if (flow) __result(getComputedStyle(flow).zIndex === '-4', 'bg-flow z-index -4, got ' + getComputedStyle(flow).zIndex);

var glows = document.querySelector('.bg-glows');
__result(glows && getComputedStyle(glows).zIndex === '-3', 'bg-glows z-index -3, got ' + (glows ? getComputedStyle(glows).zIndex : 'none'));

var dots = document.querySelector('.bg-dots');
__result(dots && getComputedStyle(dots).zIndex === '-2', 'bg-dots z-index -2, got ' + (dots ? getComputedStyle(dots).zIndex : 'none'));

var video = document.querySelector('.bg-video');
__result(!!video, 'bg-video exists');
if (video) {
  __result(getComputedStyle(video).zIndex === '-1', 'bg-video z-index -1, got ' + getComputedStyle(video).zIndex);
}
var g1 = document.querySelector('.g1');
__result(!!g1 && getComputedStyle(g1).backgroundImage.indexOf('hsl') >= 0, 'glow uses hsl( --glow-hue ), got ' + (g1 ? getComputedStyle(g1).backgroundImage : 'none'));
if (g1) __result(parseFloat(getComputedStyle(g1).width) >= 640, 'glow enlarged (g1 width >= 640), got ' + getComputedStyle(g1).width);

// 视频纹理淡入：轮询等待不透明超过目标值一半（桌面 0.12 / 移动 0.06）
var target = window.matchMedia('(max-width: 640px)').matches ? 0.06 : 0.12;
var faded = await waitFor(function () {
  return parseFloat(getComputedStyle(video).opacity) > target * 0.5;
}, 5000);
__result(faded, 'video fades in to ~' + target + ' (got ' + getComputedStyle(video).opacity + ')');

// 视差仍响应指针
var t0 = getComputedStyle(glows).transform;
document.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 100, bubbles: true }));
await sleep(400);
__result(getComputedStyle(glows).transform !== t0, 'glow layer parallax still responds to pointer');
```

- [ ] **Step 3: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task1-background.js`
Expected: FAIL（无 `.bg-flow`、无 `.bg-video`、z-index 未重排、`.glow` 仍是 rgba）。

- [ ] **Step 4: `index.html` —— 加背景 DOM + 升版**

在 `.bg-dots` 容器之后（L16 之后）、`.bg-glows` 之前插入流动层；在 `.bg-glows` 之后插入视频：

```html
<!-- ═══════════════ 背景流动层（GSAP 呼吸漂移） ═══════════════ -->
<div class="bg-flow" aria-hidden="true"></div>
```

```html
<!-- ═══════════════ 背景视频纹理（JS 注入 src 后淡入；无 JS/降级不播放） ═══════════════ -->
<video class="bg-video" preload="none" muted loop playsinline aria-hidden="true" tabindex="-1"></video>
```

L8 升版：`<link rel="stylesheet" href="style.css?v=20260809-5">`

- [ ] **Step 5: `style.css` —— 层级重排 + 流动层 + 光斑升级 + 视频**

**5a.** `.bg-glows` 的 `z-index: -2` 改 `-3`；`.bg-dots` 的 `z-index: -1` 改 `-2`。

**5b.** `body` 升级为多层浅色渐变（保持浅色高亮，不引入深色）：

```css
body {
  font-family: 'Inter', 'Noto Serif SC', 'PingFang SC', 'Hiragino Sans GB', serif;
  background:
    radial-gradient(ellipse 55% 45% at 18% 8%, rgba(224, 242, 254, 0.95), transparent 70%),
    radial-gradient(ellipse 60% 50% at 85% 88%, rgba(191, 219, 254, 0.7), transparent 70%),
    linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  min-height: 100vh;
  color: var(--ink);
  line-height: 1.65;
  position: relative;
}
```

**5c.** 在 `.bg-glows` 规则之前插入流动层与视频规则：

```css
/* 背景流动层（极慢呼吸漂移；无 JS 时静态） */
.bg-flow {
  position: fixed;
  inset: -10%;
  z-index: -4;
  pointer-events: none;
  background:
    radial-gradient(ellipse 40% 35% at 28% 30%, rgba(125, 211, 252, 0.22), transparent 70%),
    radial-gradient(ellipse 38% 32% at 72% 68%, rgba(56, 189, 248, 0.16), transparent 70%);
  will-change: transform;
}

/* 背景视频纹理（默认不可见，JS 加载后淡入） */
.bg-video {
  position: fixed;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  filter: blur(2px);
  pointer-events: none;
}
```

**5d.** `.glow` 升级为 hsl 色相 + 放大 + 更柔模糊：

```css
.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
  opacity: 0.65;
  background: radial-gradient(circle, hsla(var(--glow-hue, 199), 95%, 80%, 0.6), transparent 70%);
}
.g1 { width: 700px; height: 500px; top: 6%;  left: 6%; }
.g2 { width: 600px; height: 440px; top: 16%; right: 6%; }
.g3 { width: 800px; height: 560px; bottom: 10%; left: 18%; }
.g4 { width: 580px; height: 420px; bottom: 6%; right: 16%; }
```

**5e.** `:root` 加默认色相：在 `--border-glow: #bae6fd;` 之后加一行 `--glow-hue: 199;`。

**5f.** `@media (max-width: 640px)`（L1040 附近）追加移动端视频减载（JS 已按断点选目标透明度；这里兜底降级时不可见）：

```css
  .bg-video { opacity: 0; }
```

> 说明：移动端实际淡入目标由 JS 控制（0.06），此 CSS 仅确保降级路径视频不可见。

- [ ] **Step 6: `js/animations.js` —— 升级 `setupBackground`**

将现 `setupBackground`（L109-130）整体替换为：

```js
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
```

`init()` 末尾的 `setupBackground();` 调用保持不变。

- [ ] **Step 7: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task1-background.js`
Expected: 全部 PASS（视频淡入轮询 ≤5s 内完成）。

- [ ] **Step 8: 回归既有背景检查**

Run: `node scripts/verify.mjs scripts/checks/task5-glows.js`
Expected: 全部 PASS（光斑数量/视差/漂移不受影响）。

- [ ] **Step 9: 手动目测**

桌面刷新：浅色底上有两个柔和径向高光极慢「呼吸」漂移；四个光斑比之前更大更柔；视频纹理极淡（12%）有轻微动感，不抢内容；鼠标移动时光斑层整体反向跟随（±40px）。移动端视口：视频更淡（6%）。

- [ ] **Step 10: Commit**

```bash
cd /Users/yxx/resume-v2
git add assets/vendor/bg-texture.mp4 index.html style.css js/animations.js scripts/checks/task1-background.js
git commit -m "feat: 背景系统二期 — 流动层 + 光斑 hsl 升级放大 + 视频纹理淡入
- 层级重排 bg-flow(-4)/glows(-3)/dots(-2)/video(-1)
- 视差幅度 ±40px；视频 loadeddata 后从 0 淡入(桌面 0.12/移动 0.06)
- style.css?v=20260809-5

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: 排版（Hero 渐变大字 + 视图大标题海报字）

**Files:**
- Modify: `index.html`（7 处 `.section-title` 标题文本包 `<span class="t">`，升 `?v=` → `20260809-6`）、`style.css`（hero 字号/逐字渐变、`.typing-line`、`.section-title` 海报字）
- Test: `scripts/checks/task2-typography.js`

**Interfaces:**
- Consumes: 现有 `splitChars` 生成的 `.char` span（hero `.name` 2 字 / `#typeTarget` 27 字）。
- Produces: `.section-title .t` span（7 处）；渐变文字 CSS（只作用于 `.char` 与 `.t`，reduced-motion/无 JS 时 `.char` 不存在 → 文字保持正常色可读）。

- [ ] **Step 1: 写失败检查 `scripts/checks/task2-typography.js`**

```js
// 排版二期：Hero 渐变大字（每字渐变）+ 视图大标题海报字
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var nameEl = document.querySelector('.hero .name');
__result(nameEl && parseFloat(getComputedStyle(nameEl).fontSize) >= 40, 'hero name font >= 2.6rem, got ' + (nameEl ? getComputedStyle(nameEl).fontSize : 'none'));

var nameChars = document.querySelectorAll('.hero .name .char');
__result(nameChars.length === 2, 'name split into 2 chars, got ' + nameChars.length);
if (nameChars.length) {
  var cs = getComputedStyle(nameChars[0]);
  __result(cs.backgroundImage.indexOf('linear-gradient') >= 0, 'char has vertical gradient, got ' + cs.backgroundImage);
  __result(cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)', 'char text fill transparent, got ' + cs.webkitTextFillColor);
}

var greetChars = document.querySelectorAll('#typeTarget .char');
__result(greetChars.length === 27, 'greeting split into 27 chars, got ' + greetChars.length);

var titles = document.querySelectorAll('.section-title');
__result(titles.length === 7, '7 section titles, got ' + titles.length);
var tEls = document.querySelectorAll('.section-title .t');
__result(tEls.length === 7, 'every title wrapped in .t span, got ' + tEls.length);
if (tEls.length) {
  var ts = getComputedStyle(tEls[0]);
  __result(ts.backgroundImage.indexOf('linear-gradient') >= 0, 'section title has gradient, got ' + ts.backgroundImage);
  __result(parseFloat(getComputedStyle(document.querySelector('.section-title')).fontSize) >= 16, 'section title enlarged (>= 1rem), got ' + getComputedStyle(document.querySelector('.section-title')).fontSize);
}
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task2-typography.js`
Expected: FAIL（字号未变、无 `.t`、`.char` 无渐变）。

- [ ] **Step 3: `index.html` —— 标题包 `.t` + 升版**

7 处 `.section-title`（education「教育背景」、experience「实习经历」、works「项目经历」、skills「技术栈」/「技能 · 爱好」/「竞赛 · 荣誉」/「生活掠影」），把标题文本包进 `<span class="t">`。例：

```html
<h2 class="section-title"><span class="icon">🎓</span> <span class="t">教育背景</span></h2>
```

其余 6 处同式（注意保留原文本与 icon emoji）。L8 升版：`style.css?v=20260809-6`。

- [ ] **Step 4: `style.css` —— Hero 渐变大字 + 大标题海报字**

**4a.** `.hero .name` 字号加大，加逐字渐变（含 `@supports` 兜底，避免不支持的浏览器文字不可见）：

```css
.hero .name {
  font-size: clamp(2.6rem, 5.5vw, 4rem);
  font-weight: 600;
  color: var(--ink-strong);
  letter-spacing: 0.06em;
  margin-bottom: 0.2rem;
}
/* Hero 逐字：默认深色，支持渐变时纵向渐变文字 */
.hero .char, #typeTarget .char { color: var(--ink-strong); }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero .char, #typeTarget .char {
    background: linear-gradient(180deg, #1e3a5f, rgba(30, 58, 95, 0.35));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
```

**4b.** `.typing-line` 字号加大：

```css
.typing-line {
  font-size: clamp(1.2rem, 2.8vw, 1.7rem);
  color: var(--ink-soft);
  min-height: 1.7em;
  margin-bottom: 0.8rem;
}
```

**4c.** `.section-title` 海报字（渐变标题文字，icon 保持本色）：

```css
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(1.05rem, 2.2vw, 1.35rem);
  font-weight: 700;
  letter-spacing: 0.14em;
  margin-bottom: 1.1rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.9);
  color: var(--ink-faint);
}
.section-title .icon { font-size: 0.95rem; color: var(--accent); }
/* 标题文字：默认灰蓝，支持渐变时海报字 */
.section-title .t { color: var(--ink-strong); }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .section-title .t {
    background: linear-gradient(90deg, #1e3a5f, #64748b);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
```

> 现有 `.section-title` 规则（L196-209）整体被 4c 替换；`.section-title .icon` 的 `font-size: 0.95rem` 保留（原来在 L209）。

- [ ] **Step 5: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task2-typography.js`
Expected: 全部 PASS。

- [ ] **Step 6: 回归既有 Hero/计数检查**

Run: `node scripts/verify.mjs scripts/checks/task2-hero-chars.js` 和 `node scripts/verify.mjs scripts/checks/task3-countup.js`
Expected: 全部 PASS（`.char` 渐变不干扰逐字/计数动画）。

- [ ] **Step 7: 手动目测**

桌面刷新：名字「邢耀」超大纵向渐变逐字弹跳；问候语渐变大字；七个区块标题海报字（灰蓝渐变）；移动端字号自适应。

- [ ] **Step 8: Commit**

```bash
cd /Users/yxx/resume-v2
git add index.html style.css scripts/checks/task2-typography.js
git commit -m "feat: 排版二期 — Hero 渐变大字 + 视图大标题海报字
- 每字纵向渐变(180deg 深蓝→半透明) + clamp 字号
- 7 处 section-title 文本包 .t 渐变海报字
- @supports 兜底，reduced-motion 正常色可读
- style.css?v=20260809-6

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: 组件（导航玻璃胶囊 + 卡片渐变描边 + 数字 accent 字体）

**Files:**
- Create: `assets/vendor/SpaceGrotesk-600.woff2`（下载自托管字体）
- Modify: `style.css`（@font-face、`.num` 字体、`.nav-links` 玻璃胶囊、卡片渐变描边/分层投影/加强 blur，升 `?v=` → `20260809-7`）
- Test: `scripts/checks/task3-components.js`

**Interfaces:**
- Consumes: `.nav-links`（L28-34）、`.num[data-count]`、`.project-card` / `.hobby-card` / `.tl-card`。
- Produces: `--num-font` CSS 变量（仅 `.num` 用）；卡片 `::before` 渐变描边环。

- [ ] **Step 1: 下载 accent 字体**

```bash
cd /Users/yxx/resume-v2
curl -s -o assets/vendor/SpaceGrotesk-600.woff2 "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj42VnskPMBBSSJLm2E.woff2"
ls -la assets/vendor/SpaceGrotesk-600.woff2
```
Expected: 约 13KB 的合法 woff2（`file` 输出含 "Web Open Font Format (Version 2)"）。

- [ ] **Step 2: 写失败检查 `scripts/checks/task3-components.js`**

```js
// 组件二期：导航玻璃胶囊 / 卡片渐变描边 / 数字 accent 字体
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

var links = document.querySelector('.nav-links');
__result(links && getComputedStyle(links).borderRadius.indexOf('999') >= 0, 'nav-links pill radius, got ' + (links ? getComputedStyle(links).borderRadius : 'none'));
if (links) __result(getComputedStyle(links).backdropFilter.indexOf('blur') >= 0, 'nav-links glass blur, got ' + getComputedStyle(links).backdropFilter);

await document.fonts.load('600 16px "Space Grotesk"');
__result(document.fonts.check('600 16px "Space Grotesk"'), 'Space Grotesk 600 loaded');

var num = document.querySelector('.num[data-count]');
__result(num && getComputedStyle(num).fontFamily.indexOf('Space Grotesk') >= 0, '.num uses accent font, got ' + (num ? getComputedStyle(num).fontFamily : 'none'));

var card = document.querySelector('.project-card');
__result(!!card, 'project card exists');
if (card) {
  var cs = getComputedStyle(card);
  __result(cs.borderTopColor === 'rgba(0, 0, 0, 0)', 'card border transparent (ring carries gradient), got ' + cs.borderTopColor);
  __result(cs.maskImage.indexOf('linear-gradient') >= 0, 'card gradient border ring (mask), got ' + cs.maskImage);
  __result(cs.backdropFilter.indexOf('blur') >= 0, 'card stronger blur, got ' + cs.backdropFilter);
}
var hb = document.querySelector('.hobby-card');
__result(!!hb && getComputedStyle(hb).maskImage.indexOf('linear-gradient') >= 0, 'hobby card gradient ring, got ' + (hb ? getComputedStyle(hb).maskImage : 'none'));
var tl = document.querySelector('.tl-card');
__result(!!tl && getComputedStyle(tl).maskImage.indexOf('linear-gradient') >= 0, 'tl card gradient ring, got ' + (tl ? getComputedStyle(tl).maskImage : 'none'));
```

- [ ] **Step 3: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task3-components.js`
Expected: FAIL（导航非胶囊、无渐变描边环、`.num` 无 accent 字体）。

- [ ] **Step 4: `style.css` —— 字体 + 导航胶囊 + 卡片描边**

**4a.** 文件头部（`.num` 规则 L261 附近）加 @font-face 与 `--num-font`：

```css
/* 数字 accent 字体（自托管，失败回退系统字体） */
@font-face {
  font-family: 'Space Grotesk';
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url('assets/vendor/SpaceGrotesk-600.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
```

`:root` 加 `--num-font`（在 `--glow-hue: 199;` 之后）：

```css
  --num-font: 'Space Grotesk', 'Inter', 'PingFang SC', sans-serif;
```

`.num` 规则（L261 `font-variant-numeric: tabular-nums;`）改为：

```css
/* 数字滚动计数：accent 字体 + 等宽数字 */
.num {
  font-family: var(--num-font);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
```

**4b.** `.nav-links`（L110-116）改为玻璃胶囊（行为/路由不动）：

```css
.nav-links {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.3rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 8px 32px rgba(31, 78, 121, 0.12);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

`.nav-links a` 的 `border-radius: 0.6rem` 改 `999px`（hover 圆角胶囊）。

**4c.** 卡片渐变描边环 + 分层投影 + 加强 blur。给 `.project-card`、`.hobby-card`、`.tl-card` 加 `position: relative;`、`border: 1px solid transparent;`、`backdrop-filter: blur(24px)`，并追加 `::before` 渐变环：

```css
.project-card,
.hobby-card,
.tl-card {
  position: relative;
  border: 1px solid transparent;
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
}
.project-card::before,
.hobby-card::before,
.tl-card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(125, 211, 252, 0.9), rgba(56, 189, 248, 0.35), rgba(129, 140, 248, 0.7));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask-composite: exclude;
  pointer-events: none;
}
```

**4d.** 三卡现有 `border: 1px solid rgba(255,255,255,...)` 改 `border: 1px solid transparent`（`.project-card` L817、`.hobby-card` L879、`.tl-card` L623），并加强 `box-shadow` 分层投影：

```css
/* project-card 现有 box-shadow（L819-820）替换为 */
box-shadow: 0 4px 10px rgba(51, 65, 85, 0.06), 0 8px 24px rgba(51, 65, 85, 0.10), 0 12px 40px rgba(56, 189, 248, 0.16);
/* hobby-card 现有 box-shadow（L882）替换为 */
box-shadow: 0 4px 10px rgba(51, 65, 85, 0.05), 0 10px 26px rgba(56, 189, 248, 0.14), 0 12px 34px rgba(56, 189, 248, 0.14);
/* tl-card 现有（L622-625 无 box-shadow，补充） */
box-shadow: 0 4px 10px rgba(51, 65, 85, 0.05), 0 10px 26px rgba(56, 189, 248, 0.14);
```

> hover 规则不动（transform/shadow 增强仍生效）。`.tl-card` 原有 `border-radius: 1.1rem` 保留，`::before` 的 `border-radius: inherit` 继承。

- [ ] **Step 5: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task3-components.js`
Expected: 全部 PASS。

- [ ] **Step 6: 回归倾斜/计数检查**

Run: `node scripts/verify.mjs scripts/checks/task4-tilt.js` 和 `node scripts/verify.mjs scripts/checks/task3-countup.js`
Expected: 全部 PASS（卡片 `::before` 环不干扰 3D 倾斜，`pointer-events:none`）。

- [ ] **Step 7: 手动目测**

桌面刷新：顶部导航居中玻璃胶囊；作品/爱好/时间线卡片有柔和渐变描边 + 更深分层投影 + 更明显玻璃模糊；数字（330+、3000+ 等）用 Space Grotesk 显示；卡片 hover 倾斜正常。

- [ ] **Step 8: Commit**

```bash
cd /Users/yxx/resume-v2
git add assets/vendor/SpaceGrotesk-600.woff2 style.css scripts/checks/task3-components.js
git commit -m "feat: 组件二期 — 导航玻璃胶囊 + 卡片渐变描边/分层投影 + 数字 accent 字体
- .nav-links 胶囊化(999px + blur16)，路由行为不变
- 三卡 ::before mask 渐变环(pointer-events:none)，投影分层
- 自托管 Space Grotesk 600 (13KB)，.num 专用
- style.css?v=20260809-7

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: 视图切换电影化（blur→focus 对焦进场 + 光斑随视图变色）

**Files:**
- Modify: `js/animations.js`（`playView` 升级 + `VIEW_HUE` 映射）
- Test: `scripts/checks/task4-transitions.js`

**Interfaces:**
- Consumes: `playView(name)` 由 index.html 内联路由的 `activate()` 调用（`window.anim.playView(name)`）；`--glow-hue` 变量（Task 1 已建，默认 199）。
- Produces: 视图进场 `filter: blur(4px)→0`；`--glow-hue` 随视图平滑过渡。

- [ ] **Step 1: 写失败检查 `scripts/checks/task4-transitions.js`**

```js
// 视图切换电影化：blur→focus 对焦进场 + 光斑随视图变色
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function clickNav(name) { document.querySelector('.nav-links a[data-view="' + name + '"]').click(); }
function hue() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--glow-hue')); }

// 光斑变色：experience 靛(243) / skills 青(186)
clickNav('experience');
await sleep(1300);
__result(hue() >= 241 && hue() <= 245, 'glow hue -> indigo for experience, got ' + hue());
clickNav('skills');
await sleep(1300);
__result(hue() >= 184 && hue() <= 188, 'glow hue -> cyan for skills, got ' + hue());

// blur→focus：进场中段有 blur>0，落定后 blur(0px)
clickNav('about');
await sleep(300); // 旧视图淡出 120ms + 新视图 blur 动画进行中
var mid = getComputedStyle(document.getElementById('about')).filter;
__result(mid.indexOf('blur(') >= 0 && mid.indexOf('blur(0px)') === -1, 'view mid-flight blur>0, got ' + mid);
await sleep(900);
var end = getComputedStyle(document.getElementById('about')).filter;
__result(end === 'blur(0px)' || end === 'none', 'view settles to no blur, got ' + end);
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task4-transitions.js`
Expected: FAIL（无 blur 过渡、`--glow-hue` 不变）。

- [ ] **Step 3: `js/animations.js` —— 升级 `playView`**

在文件顶部（`var HAS_GSAP` 之后）加 VIEW_HUE 映射：

```js
  /* 各视图光斑色相（浅色基调内微变）：sky / lighter blue / indigo / blue / cyan */
  var VIEW_HUE = { about: 199, education: 210, experience: 243, works: 217, skills: 186 };
```

将现 `playView`（L14-25）整体替换为：

```js
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
  }
```

- [ ] **Step 4: 运行验证**

Run: `node scripts/verify.mjs scripts/checks/task4-transitions.js`
Expected: 全部 PASS。

- [ ] **Step 5: 回归视图/背景检查**

Run: `node scripts/verify.mjs scripts/checks/task1-view-switch.js`、`node scripts/verify.mjs scripts/checks/task1-background.js`
Expected: 全部 PASS（blur 不破坏 reveal 落定与视频淡入）。

- [ ] **Step 6: 手动目测**

桌面刷新：切五个视图时，新视图有约半秒的「对焦」模糊→清晰过渡；背景光斑随视图在蓝/靛/青之间平滑变色；快速来回切换无残留。

- [ ] **Step 7: Commit**

```bash
cd /Users/yxx/resume-v2
git add js/animations.js scripts/checks/task4-transitions.js
git commit -m "feat: 视图切换电影化 — blur→focus 对焦进场 + 光斑随视图变色
- playView 加 filter blur(4px)->0 (0.45s)
- VIEW_HUE 映射，GSAP 平滑过渡 --glow-hue

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: a11y/perf + 全量回归 + 收尾

**Files:**
- Modify: `style.css`（reduced-motion 视频隐藏、print 隐藏背景层，升 `?v=` → `20260809-8`）、`index.html`（`?v=` 升版）
- Test: `scripts/checks/task5-reduced-motion.js`

**Interfaces:**
- Consumes: 全部二期功能。
- Produces: reduced-motion 下视频 `display:none`；print 下背景层全部隐藏。

- [ ] **Step 1: 写 reduced-motion 检查 `scripts/checks/task5-reduced-motion.js`**

```js
// reduced-motion 二期：视频不显示、光斑/流动层静止、内容完整、渐变文字可读
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

__result(!document.documentElement.classList.contains('js-anim'), 'no js-anim under reduced-motion');
var video = document.querySelector('.bg-video');
if (video) {
  __result(getComputedStyle(video).display === 'none', 'video hidden under reduced-motion');
} else {
  __result(true, 'video absent under reduced-motion');
}
var nameEl = document.querySelector('.hero .name');
__result(nameEl && !nameEl.querySelector('.char'), 'name not split under reduced-motion');
__result(nameEl && parseFloat(getComputedStyle(nameEl).fontSize) >= 40, 'name still enlarged (readable), got ' + (nameEl ? getComputedStyle(nameEl).fontSize : 'none'));
var tEl = document.querySelector('.section-title .t');
__result(tEl && getComputedStyle(tEl).backgroundImage.indexOf('linear-gradient') >= 0, 'section title gradient text static-readable');
var glows = document.querySelector('.bg-glows');
if (glows) {
  var t0 = getComputedStyle(glows).transform;
  await sleep(400);
  __result(getComputedStyle(glows).transform === t0, 'glow layer static under reduced-motion');
}
var reveals = document.querySelectorAll('.view.active .reveal');
var allVisible = Array.from(reveals).every(function (el) { return parseFloat(getComputedStyle(el).opacity) > 0.95; });
__result(allVisible, 'reveals statically visible, ' + reveals.length + ' elements');
```

- [ ] **Step 2: 运行确认失败**

Run: `node scripts/verify.mjs scripts/checks/task5-reduced-motion.js --reduced-motion`
Expected: FAIL（视频当前在 reduced-motion 下仍可能可见——现 `.bg-video` 只有 `opacity:0`，无 `display:none`）。

- [ ] **Step 3: `style.css` —— reduced-motion + print**

**3a.** `@media (prefers-reduced-motion: reduce)` 块（L1059-1064）追加：

```css
  .bg-video { display: none; }
```

**3b.** `@media print` 隐藏规则（L1046）改为：

```css
  .navbar, .bg-dots, .bg-glows, .bg-flow, .bg-video, .modal-overlay, .nav-contact { display: none !important; }
```

- [ ] **Step 4: `index.html` 升版**

L8：`style.css?v=20260809-8`。

- [ ] **Step 5: 跑全量回归（常规模式）**

```bash
cd /Users/yxx/resume-v2
for f in scripts/checks/task1-view-switch.js scripts/checks/task2-hero-chars.js scripts/checks/task3-countup.js scripts/checks/task4-tilt.js scripts/checks/task5-glows.js scripts/checks/task6-regression.js scripts/checks/task1-background.js scripts/checks/task2-typography.js scripts/checks/task3-components.js scripts/checks/task4-transitions.js; do
  echo "== $f"; node scripts/verify.mjs "$f" || exit 1;
done
```
Expected: 全部 PASS（二期 10 个检查 + 一期 6 个）。

- [ ] **Step 6: 跑 reduced-motion 检查**

```bash
node scripts/verify.mjs scripts/checks/task6-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task5-reduced-motion.js --reduced-motion
```
Expected: 全部 PASS。

- [ ] **Step 7: 手动终审（浏览器）**

用 Chrome 打开页面逐项目测：
1. 五视图切换有 blur→focus 对焦过渡；光斑随视图变色。
2. 背景：浅色流动层呼吸漂移 + 光斑视差 + 视频纹理（桌面 12%/移动 6%）统一叠底，不抢内容。
3. 名字/问候语逐字弹跳 + 纵向渐变文字；七个区块标题海报字。
4. 导航玻璃胶囊、卡片渐变描边/分层投影、数字 Space Grotesk 字体。
5. 联系弹窗/二维码弹窗/Escape 分层关闭/回到顶部均可点。
6. DevTools Rendering → Emulate prefers-reduced-motion 打开刷新：全部静态、视频不显示、内容完整可读。
7. 手机视口 390px：光斑变淡变小、视频更淡、卡片无倾斜、可正常滑动阅读。

- [ ] **Step 8: Commit**

```bash
cd /Users/yxx/resume-v2
git add index.html style.css scripts/checks/task5-reduced-motion.js
git commit -m "test: 二期收尾 — reduced-motion 视频隐藏 + print 隐藏背景层 + 全量回归
- reduced-motion: .bg-video display:none
- print: 背景流动层/视频一并隐藏
- style.css?v=20260809-8

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Self-Review 记录

**Spec 覆盖：**
- ① 背景系统（流动底色 + 光斑升级 + 视频纹理）→ Task 1 ✓
- ② 光斑随视图变色（`--glow-hue`）→ Task 1（默认 199）+ Task 4（过渡）✓
- ③ 视频纹理机制（0.12/0.06、loadeddata 淡入、降级不播放）→ Task 1 + Task 5 ✓
- ④ Hero 渐变大字（每字渐变 + clamp）→ Task 2 ✓
- ⑤ 视图大标题海报字（`.section-title .t`）→ Task 2 ✓
- ⑥ 导航玻璃胶囊 → Task 3 ✓
- ⑦ 卡片渐变描边/分层投影/加强 blur → Task 3 ✓
- ⑧ 数字 accent 字体（自托管 Space Grotesk）→ Task 3 ✓
- ⑨ 电影化进场（blur→focus）→ Task 4 ✓
- 可访问性/性能/降级（reduced-motion 静态、视频 fallback 不黑屏、移动减载、只动 transform/opacity）→ Task 5 + 各任务 ✓
- 验收：既有 task1–6 全量回归 + 新增 4 检查全绿；reduced-motion 与 390px 减载 → Task 5 ✓

**Placeholder 扫描：** 无 TBD/TODO；所有步骤含完整可执行代码；check 脚本完整。

**类型/命名一致性：** 全程统一 `.bg-flow` / `.bg-video` / `.glow`（hsl 由 `--glow-hue` 驱动）/ `.section-title .t` / `.char` / `.num` / `--num-font` / `Space Grotesk-600.woff2`；`setupBackground` / `playView` / `VIEW_HUE`；CSS 版本号 `20260809-5..8`。`@supports` 兜底保证 `background-clip:text` 不支持时文字正常色。
