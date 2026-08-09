# 全站 v9 奶油暖色系重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 学 v9 的「跨页颜色桥」——全站统一奶油纸底 + 淡粉/暖黄/雾青三色径向场，首屏遮罩换成奶油渐变 veil + 同组色场，深墨/sage/charcoal 文字，消除首屏字看不清与全站颜色跳跃。

**Architecture:** 纯 CSS 换色 + `animations.js` 一处 VIEW_HUE 换值 + 5 个 check 断言适配 + `?v=` 升版。结构（hero 居中布局、四页内容、路由、视频 5 保险、GSAP 动效结构）零改动。分 3 个可独立验证任务：①背景层 ②Hero ③色板 token + 全站组件扫。

**Tech Stack:** 现有 vanilla HTML/CSS/JS 单页站；headless CDP 验证 `node scripts/verify.mjs scripts/checks/<file>.js [--reduced-motion]`。

## Global Constraints

- 开发副本 `/Users/yxx/resume-v2`；生产 `/Users/yxx/resume` 与 47.85.52.9 零变更。
- **结构零改动**：index.html 结构、hero 居中布局、四页内容、路由、内联脚本、print/reduced-motion 块、视频 5 保险全不动；`js/animations.js` 只改 L7 `VIEW_HUE` 五值。
- 新色板 token（spec 色板段）：`--ink-strong:#102027`、`--ink:#2a3a41`、`--ink-soft:#536269`、`--ink-faint:#8b9497`、`--accent:#56826f`、`--accent-deep:#3f6150`、`--accent-soft:#e4ede7`、`--shadow/--glow/--border-glow` sage 暖调、`--glow-hue:330`。
- 三色径向场（全站共用）：淡粉 `rgba(255,191,210,.38)` @6%4% / 暖黄 `rgba(245,232,116,.38)` @94%8% / 雾青 `rgba(102,214,224,.38)` @94%82%，奶油底 `#f7f3e9`。
- `.nav-links` 保持白玻璃 `rgba(255,255,255,.55)`（task3/task7/task9 断言）；仅 `.navbar` 外层改奶油 `rgba(247,243,233,.8)`。
- 全局深色纹理 `.bg-video` 改为 `display:none`（元素保留，JS 零改动）。
- 光斑每页暖色相：about=330 暖粉 / education=45 暖黄 / experience=190 雾青 / works=350 玫瑰 / skills=160 浅 sage。
- `?v=20260809-12` → `20260809-13`（最后一个任务）。
- 天蓝硬编码全站清零：任务三残留扫描（grep 下列值）必须零命中。
- 5 个 check 适配（task1-background / task4-transitions / task6-hero / task7-nav）+ task9 无需改；全量 16 checks 全绿。
- ES5、中文注释、动画只动 transform/opacity。

---

### Task 1: 背景层换奶油三色场 + VIEW_HUE + task1-background/task4-transitions 适配

**Files:**
- Modify: `style.css`（body 背景 L41-44、`bg-flow` L52-61、`bg-video` L64-74、`:root --glow-hue` L30）
- Modify: `js/animations.js`（L7 `VIEW_HUE`）
- Modify: `scripts/checks/task1-background.js`、`scripts/checks/task4-transitions.js`

**Interfaces:**
- Consumes: 现有背景层四层（bg-flow/bg-glows/bg-dots/bg-video）、`--glow-hue` 机制、`VIEW_HUE`。
- Produces: body/bg-flow 奶油暖色；bg-video 隐藏；光斑暖色相；2 个 check 适配后仍绿。

- [ ] **Step 1: 改 `style.css` — body 背景**

L41-44 的 `background` 整体替换（body 其余属性不动）：
```css
  background:
    radial-gradient(circle at 6% 4%,  rgba(255, 191, 210, 0.38), transparent 30%),
    radial-gradient(circle at 94% 8%, rgba(245, 232, 116, 0.38), transparent 32%),
    radial-gradient(circle at 94% 82%, rgba(102, 214, 224, 0.38), transparent 34%),
    #f7f3e9;
```

- [ ] **Step 2: 改 `style.css` — `bg-flow` 暖色**

L52-61 `.bg-flow` 的 `background` 整体替换（其余属性不动）：
```css
  background:
    radial-gradient(ellipse 40% 35% at 28% 30%, rgba(255, 190, 210, 0.18), transparent 70%),
    radial-gradient(ellipse 38% 32% at 72% 68%, rgba(246, 231, 116, 0.16), transparent 70%);
```

- [ ] **Step 3: 改 `style.css` — `bg-video` 隐藏**

L64-74 `.bg-video` 加一行 `display: none;`（含注释，其余属性不动）：
```css
  display: none; /* v9 奶油主题：全局深色纹理不再显示（元素保留，机制零改动） */
```

- [ ] **Step 4: 改 `:root --glow-hue` 与 `js/animations.js` VIEW_HUE**

- L30 `--glow-hue: 199;` → `--glow-hue: 330;`（注释同步「光斑色相（Task 4 过渡复用）」→「光斑默认色相（奶油暖粉）」）。
- `js/animations.js` L7：
```js
  /* 各视图光斑色相（奶油暖色系内微变）：暖粉 / 暖黄 / 雾青 / 玫瑰 / 浅 sage */
  var VIEW_HUE = { about: 330, education: 45, experience: 190, works: 350, skills: 160 };
```
只改这一行，其余 JS 零改动。

- [ ] **Step 5: 适配 `scripts/checks/task1-background.js`**

视频纹理淡入块（`var target = ...; var faded = await waitFor(...)` 三行）整体替换为：
```js
  // 全局纹理按设计不再显示（v9 奶油主题）；元素保留，CSS display:none
  __result(getComputedStyle(video).display === 'none', 'global bg-video hidden by design (cream theme), got ' + getComputedStyle(video).display);
```
其余（四层 z-index、glow 色相变量驱动、视差响应）不动。

- [ ] **Step 6: 适配 `scripts/checks/task4-transitions.js`**

光斑色相断言按新 VIEW_HUE 改：
- experience：`hue() >= 241 && hue() <= 245` + 消息含「indigo」→ `hue() >= 188 && hue() <= 192` + `'glow hue -> mist-cyan for experience, got ' + hue()`。
- skills：`hue() >= 184 && hue() <= 188` + 消息含「cyan」→ `hue() >= 158 && hue() <= 162` + `'glow hue -> light sage for skills, got ' + hue()`。
其余（blur→focus）不动。

- [ ] **Step 7: 验证**

```bash
node scripts/verify.mjs scripts/checks/task1-background.js
node scripts/verify.mjs scripts/checks/task4-transitions.js
node scripts/verify.mjs scripts/checks/task5-glows.js
node scripts/verify.mjs scripts/checks/task5-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task2-typography.js
node scripts/verify.mjs scripts/checks/task8-borderless.js
```
全部 PASS。其余 check 不涉背景色，本任务不跑全量（Task 3 全量回归）。

- [ ] **Step 8: 提交**

```bash
git add style.css js/animations.js scripts/checks/task1-background.js scripts/checks/task4-transitions.js
git commit -m "feat: cream pastel background layers + warm glow hues (v9 retheme part 1)"
```

---

### Task 2: Hero 重做（奶油 veil + 视频调亮 + 深墨/sage/charcoal 文字）+ task6-hero 适配

**Files:**
- Modify: `style.css`（`.hero-video` L370、`.hero-scrim` L371-377、hero 文字覆盖块 L391-424、base `.hero .char` L313、`.hero-next` L426-443、`.btn-accent` L473-478）
- Modify: `scripts/checks/task6-hero.js`

**Interfaces:**
- Consumes: Task 1 的奶油 body 背景；三期 `.hero-view` 结构（poster/video/scrim/hero-inner/hero-next）。
- Produces: 首屏奶油 veil + 三色场；深墨/sage/charcoal 文字；task6-hero 适配后全绿。

- [ ] **Step 1: 改 `.hero-video` — 微调亮**

L370 `.hero-video { opacity: 0; }` 加 filter：
```css
.hero-video { opacity: 0; filter: saturate(0.9) contrast(0.98) brightness(1.10); } /* 加载后由 JS 淡入；v9 手法微调亮深色云端小岛视频 */
```

- [ ] **Step 2: 改 `.hero-scrim` — 奶油 veil + 三色场**

L376 `background` 整体替换（其余属性不动）：
```css
  background:
    radial-gradient(circle at 5% 8%,  rgba(255, 190, 210, 0.30), transparent 34%),
    radial-gradient(circle at 91% 8%, rgba(246, 231, 116, 0.22), transparent 31%),
    radial-gradient(circle at 93% 88%, rgba(102, 214, 224, 0.25), transparent 35%),
    linear-gradient(180deg, rgba(247, 243, 233, 0.50) 0%, rgba(247, 243, 233, 0.70) 38%, rgba(247, 243, 233, 0.72) 55%, rgba(247, 243, 233, 0.55) 100%);
```
（文字居中 → veil 中央段最强 .70/.72；上下略弱仍保导航区与 hero-next 区对比度。）

- [ ] **Step 3: 改 hero 文字覆盖块（L391-424）**

逐条替换（保留原选择器与注释语义）：
```css
.hero-view .name { color: var(--ink-strong); }
.hero-view .char, .hero-view #typeTarget .char { color: var(--ink-strong); }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero-view .char, .hero-view #typeTarget .char {
    background: linear-gradient(90deg, #102027, #536269);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
.hero-view .role {
  color: #fff;
  background: #56826f;
  border: 1px solid rgba(86, 130, 111, 0.35);
}
.hero-view .typing-line { color: var(--ink-soft); }
.hero-view .typing-target { color: var(--ink-strong); }
.hero-view .btn-ghost {
  background: rgba(255, 255, 255, 0.55);
  color: var(--ink-strong);
  border: 1px solid rgba(16, 32, 39, 0.22);
}
.hero-view .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.85);
  color: var(--ink-strong);
  border-color: rgba(16, 32, 39, 0.3);
}
.hero-view .contacts { color: var(--ink-soft); }
.hero-view .contacts a {
  color: var(--ink-soft);
  border-bottom-color: rgba(16, 32, 39, 0.25);
}
```

- [ ] **Step 4: 改 base `.hero .char` 渐变（L313）**

`linear-gradient(180deg, #1e3a5f, rgba(30, 58, 95, 0.35))` → `linear-gradient(180deg, #102027, rgba(16, 32, 39, 0.35))`。

- [ ] **Step 5: 改 `.hero-next`（L426-443）**

- `.hero-next` 内 `color: rgba(30, 58, 95, 0.7)` → `color: rgba(16, 32, 39, 0.62)`。
- `.hero-next:hover` 保持 `color: var(--ink-strong)`（已是）。`@keyframes heroNudge` 不动。

- [ ] **Step 6: 改 `.btn-accent`（L473-478）→ charcoal**

```css
.btn-accent {
  background: #263437;
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 32, 39, 0.3);
}
.btn-accent:hover { background: #334548; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(16, 32, 39, 0.35); }
```

- [ ] **Step 7: 适配 `scripts/checks/task6-hero.js`**

- L36：`indexOf('30, 58, 95') >= 0` + 消息含「DARK ink」→ `indexOf('16, 32, 39') >= 0` + 消息 `'hero name gradient is warm ink, got ' + cs.backgroundImage`。
- L41：`indexOf('30, 58, 95') >= 0` → `indexOf('16, 32, 39') >= 0`。
- L43-46 role 断言块替换为双断言：
```js
var roleEl = hero.querySelector('.hero .role');
if (roleEl) {
  __result(getComputedStyle(roleEl).color.indexOf('255, 255, 255') >= 0, 'role badge white text, got ' + getComputedStyle(roleEl).color);
  __result(getComputedStyle(roleEl).backgroundColor.indexOf('86, 130, 111') >= 0, 'role badge sage bg, got ' + getComputedStyle(roleEl).backgroundColor);
}
```
- L17 注释「浅色渐变遮罩」→「奶油渐变遮罩 + 三色场」。scrim 渐变 presence（L26）、视频淡入（L58-62）、hero-next 路由（L50-54）不动。

- [ ] **Step 8: 验证**

```bash
node scripts/verify.mjs scripts/checks/task6-hero.js
node scripts/verify.mjs scripts/checks/task2-typography.js
node scripts/verify.mjs scripts/checks/task9-hero-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task6-reduced-motion.js --reduced-motion
```
全部 PASS（hero 改动不触 task1/task4/task5/task7/task8，Task 3 全量回归兜底）。

- [ ] **Step 9: 提交**

```bash
git add style.css scripts/checks/task6-hero.js
git commit -m "feat: hero cream veil + warm ink/sage/charcoal text (v9 retheme part 2)"
```

---

### Task 3: 色板 token + 导航奶油 + 全站组件扫 + task7-nav 适配 + ?v= + 全量回归

**Files:**
- Modify: `style.css`（`:root` L16-33、`.navbar` L137、全站天蓝硬编码扫、特殊渐变行）
- Modify: `index.html`（L8 `?v=`）
- Modify: `scripts/checks/task7-nav.js`

**Interfaces:**
- Consumes: Task 1/2 完成的背景层与 Hero；全站 `var(--accent/--ink-*/--glow)` 引用。
- Produces: 全站奶油暖色 token；导航奶油玻璃；天蓝硬编码清零；task7 适配后全量 16 checks 全绿。

- [ ] **Step 1: 改 `:root` token 段（L16-33）**

整体替换为（保留 `--radius`/`--num-font`/`--nav-h`，注释同步更新）：
```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.62);
  --glass-border: rgba(255, 255, 255, 0.85);
  --ink: #2a3a41;          /* 次级正文 · 暖墨 */
  --ink-strong: #102027;   /* 正文/标题最重 · v9 近黑墨 */
  --ink-soft: #536269;     /* 弱文字 · v9 同款 */
  --ink-faint: #8b9497;    /* 最弱文字 */
  --accent: #56826f;       /* 主强调 · sage 灰绿 */
  --accent-deep: #3f6150;
  --accent-soft: #e4ede7;  /* 浅 sage 底 */
  --radius: 1.5rem;
  --shadow: 0 4px 20px rgba(15, 23, 42, 0.05), 0 4px 28px rgba(86, 130, 111, 0.10);
  --glow: rgba(86, 130, 111, 0.15);   /* sage 暖光 */
  --border-glow: #cfe3d6;             /* 悬停浅 sage 描边 */
  --glow-hue: 330;                    /* 光斑默认色相（奶油暖粉） */
  --num-font: 'Space Grotesk', 'Inter', 'PingFang SC', sans-serif;
  --nav-h: 58px;
}
```

- [ ] **Step 2: 全站天蓝/旧色硬编码全局替换（style.css 全文）**

按下列精确对逐条替换（大小写一致、含空格；`rgba(...)` 按带空格原样）：
```
#38bdf8          → #56826f
#0ea5e9          → #3f6150
#e0f2fe          → #e4ede7
#bae6fd          → #cfe3d6
#1e3a5f          → #102027
#64748b          → #536269
rgba(56, 189, 248,   → rgba(86, 130, 111,
rgba(125, 211, 252,  → rgba(102, 214, 224,
rgba(30, 58, 95,     → rgba(16, 32, 39,
rgba(51, 65, 85,     → rgba(16, 32, 39,
rgba(100, 116, 139,  → rgba(83, 98, 105,
rgba(241, 245, 249, 0.78) → rgba(247, 243, 233, 0.8)
%2338bdf8        → %2356826f
```
（含 `.navbar` 奶油玻璃即由此条完成。）

- [ ] **Step 3: 特殊渐变行最终值（覆盖机械替换结果）**

全局替换后，再显式写定以下 4 处（否则渐变色相不协调）：
- `.btn-primary`（L461）`background: var(--ink-strong)` → `background: #263437;`，hover `#0f172a` → `#334548`（charcoal，v9 同款）。
- `.skill-bar-fill`（L689）`background` → `linear-gradient(90deg, #56826f, #7ea08f 55%, #a3c9ac);`。
- `.featured .tag`（L925）`background` → `linear-gradient(135deg, #56826f, #7ea08f 50%, #a3c9ac);`。
- 三卡渐变环 `.project-card::before, .hobby-card::before, .tl-card::before`（L1067）`background` → `linear-gradient(135deg, rgba(255, 191, 210, 0.9), rgba(246, 231, 116, 0.45), rgba(102, 214, 224, 0.8));`（三色场家族）。
- 确认 `.btn-accent`（Task 2 已 charcoal）未被替换回；`.dot`（bg-dots，L108）机械替换后为 `rgba(102,214,224,.5) + rgba(86,130,111,.07)`，保留。

- [ ] **Step 4: 适配 `scripts/checks/task7-nav.js`**

- L19：`indexOf('100, 116, 139') >= 0` + 消息「ink over hero」→ `indexOf('83, 98, 105') >= 0` + 消息 `'nav inactive link warm ink over hero, got ' + ...`。
- L24：`indexOf('56, 189, 248') >= 0` + 消息「accent-blue」→ `indexOf('86, 130, 111') >= 0` + 消息 `'nav active link sage over hero, got ' + ...`。
- 其余（nav-links 白玻璃 `255,255,255` 四处、is-scrolled、路由）不动。

- [ ] **Step 5: 升版 `index.html`**

L8 `style.css?v=20260809-12` → `style.css?v=20260809-13`。其余零改动。

- [ ] **Step 6: 残留扫描**

```bash
grep -n "38bdf8\|0ea5e9\|e0f2fe\|bae6fd\|60a5fa\|818cf8\|1e3a5f\|30, 58, 95\|56, 189, 248\|125, 211, 252\|191, 219, 254\|224, 242, 254\|100, 116, 139\|51, 65, 85\|241, 245, 249" style.css index.html js/animations.js scripts/checks/*.js
```
预期零命中（唯一允许例外：注释里说明性提及可接受，若有需改措辞）。

- [ ] **Step 7: 全量回归**

全部 16 个 check 逐个跑（含 `--reduced-motion` 变体），全部 PASS：
```bash
node scripts/verify.mjs scripts/checks/task1-background.js
node scripts/verify.mjs scripts/checks/task1-view-switch.js
node scripts/verify.mjs scripts/checks/task2-hero-chars.js
node scripts/verify.mjs scripts/checks/task2-typography.js
node scripts/verify.mjs scripts/checks/task3-components.js
node scripts/verify.mjs scripts/checks/task3-countup.js
node scripts/verify.mjs scripts/checks/task4-tilt.js
node scripts/verify.mjs scripts/checks/task4-transitions.js
node scripts/verify.mjs scripts/checks/task5-glows.js
node scripts/verify.mjs scripts/checks/task5-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task6-hero.js
node scripts/verify.mjs scripts/checks/task6-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task6-regression.js
node scripts/verify.mjs scripts/checks/task7-nav.js
node scripts/verify.mjs scripts/checks/task8-borderless.js
node scripts/verify.mjs scripts/checks/task9-hero-reduced-motion.js --reduced-motion
```
若某 check 意外变红，最小修复（只改断言匹配新色板，不删断言、不放宽语义）并记档根因。

- [ ] **Step 8: 提交**

```bash
git add style.css index.html scripts/checks/task7-nav.js
git commit -m "feat: full-site cream/warm palette + sage accents, sweep sky-blue, ?v=13 (v9 retheme part 3)"
```

- [ ] **Step 9: 人工目测清单（用户桌面验证）**

计划执行 + final review 通过后请用户浏览器目测：
1. 首屏视频透出运动、奶油 veil 中央最强，名字/role/问候/按钮/联系方式全部深墨或 sage/charcoal 可读，无中灰糊。
2. 首屏与四页共享奶油底 + 淡粉/暖黄/雾青三色场，切换无颜色跳跃。
3. 导航奶油玻璃，滚动/切视图无颜色跳变。
4. 全局深色纹理 `bg-video` 不再显示，其余动效（bg-flow/bg-glows/bg-dots）正常。
5. DevTools reduced-motion：Hero 显海报、文字深墨完整可读。
6. 390×844 移动视口：Hero 一屏放下、底部引导可见。
7. 打印预览友好（hero 文字 ink、无天蓝残留）。
