# 首页调浅 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Hero 从深色电影感调浅为明亮视频背景 + 深色文字，全站统一浅色系，消除首屏与后四视图的明暗跳变。

**Architecture:** 纯 CSS 改动（Hero 遮罩/文字色板/导航覆盖块删除）+ 3 个 check 断言适配 + `?v=` 升版。零 JS、零 index.html 结构改动、零后四视图改动。

**Tech Stack:** 现有 vanilla HTML/CSS/JS 单页站；`js/animations.js`（不动）；headless CDP 验证 `node scripts/verify.mjs scripts/checks/<file>.js [--reduced-motion]`。

## Global Constraints

- 开发副本 `/Users/yxx/resume-v2`；生产 `/Users/yxx/resume` 与 47.85.52.9 零变更。
- 色板用现有变量：`--ink-strong:#334155`、`--ink:#475569`、`--ink-soft:#64748b`、`--accent:#38bdf8`、`--glass-bg:rgba(255,255,255,.6)`。
- Hero 名字/问候字渐变必须与 `.section-title .t` 相同：`linear-gradient(90deg,#1e3a5f,#64748b)`。
- `body[data-view="about"] .navbar:not(.is-scrolled)` 覆盖块**整块删除**（8 条规则）；`.nav-links` 的 `border-radius:999px` 与 `backdrop-filter:blur(16px)` 必须保留在基础规则（task3-components.js 断言）。
- `is-scrolled` class 机制与 `body.dataset.view` 保留，JS 与内联路由零改动。
- `?v=20260809-11` → `20260809-12`。
- 后四视图样式、背景动效层、Hero 视频机制 5 保险、print/reduced-motion 块零改动。
- ES5、中文注释、动画只动 transform/opacity。
- 既有 task1-6 + 二期 4 检查在适配后全量回归全绿。

---

### Task 1: Hero 调浅 + 导航覆盖块删除 + 3 check 适配 + 全量回归

**Files:**
- Modify: `style.css`（Hero 遮罩 + 文字色板 + 删除导航深色覆盖块）
- Modify: `index.html`（L8 `?v=20260809-12`）
- Modify: `scripts/checks/task6-hero.js`、`scripts/checks/task7-nav.js`、`scripts/checks/task9-hero-reduced-motion.js`

**Interfaces:**
- Consumes: 三期 Task 1 的 `.hero-view` 结构（poster/video/scrim/hero-inner/hero-next）、Task 2 的 `syncNav` 与 `body[data-view]`、Task 4 的 task9 check。
- Produces: 全站统一浅玻璃导航；Hero 深色文字；3 个 check 适配后仍全绿。

- [ ] **Step 1: 改 `style.css` — 删除导航深色覆盖块**

删除 L208-224 整个 `body[data-view="about"] .navbar:not(.is-scrolled)` 块（8 条规则，含块前 `/* 三期② ... */` 注释 L204-207）。导航回落到基础浅玻璃规则（`.navbar` `rgba(241,245,249,.78)`、`.nav-links` `rgba(255,255,255,.55)`）。

- [ ] **Step 2: 改 `style.css` — Hero 遮罩与文字色板**

`.hero-scrim`（现 L398）渐变改：
```css
background: linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.25) 45%, rgba(255, 255, 255, 0.55) 100%);
```

文字块（现 L413-446）逐条覆盖为深色，注意每条保留原选择器与注释语义：
```css
.hero-view .name { color: var(--ink-strong); }
.hero-view .char, .hero-view #typeTarget .char { color: var(--ink-strong); }
@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .hero-view .char, .hero-view #typeTarget .char {
    background: linear-gradient(90deg, #1e3a5f, #64748b);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
}
.hero-view .role {
  color: var(--ink-strong);
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(30, 58, 95, 0.16);
}
.hero-view .typing-line { color: var(--ink-soft); }
.hero-view .typing-target { color: var(--ink-strong); }
.hero-view .btn-ghost {
  background: rgba(255, 255, 255, 0.65);
  color: var(--ink-strong);
  border: 1px solid rgba(30, 58, 95, 0.18);
}
.hero-view .btn-ghost:hover {
  background: rgba(255, 255, 255, 0.85);
  color: var(--ink-strong);
  border-color: rgba(30, 58, 95, 0.3);
}
.hero-view .contacts { color: var(--ink-soft); }
.hero-view .contacts a {
  color: var(--ink-soft);
  border-bottom-color: rgba(30, 58, 95, 0.25);
}
```

`.hero-next`（现 L459）与 `.hero-next:hover`（现 L465）改：
```css
.hero-next { color: rgba(30, 58, 95, 0.7); }
.hero-next:hover { color: var(--ink-strong); }
```
（`@keyframes heroNudge` 不动。）

- [ ] **Step 3: 改 `index.html` — 升版**

L8 `style.css?v=20260809-11` → `style.css?v=20260809-12`。其余零改动。

- [ ] **Step 4: 适配 `scripts/checks/task6-hero.js`**

3 处断言值改（其余不动）：
- L35-36：`cs.backgroundImage.indexOf('255, 255, 255') >= 0` + 消息 `'hero name gradient is LIGHT (white), got ' + ...` → `cs.backgroundImage.indexOf('30, 58, 95') >= 0` + 消息 `'hero name gradient is DARK ink, got ' + ...`。
- L41：`getComputedStyle(greetChar).backgroundImage.indexOf('255, 255, 255') >= 0` → `indexOf('30, 58, 95') >= 0`。
- L45：`getComputedStyle(roleEl).color.indexOf('255, 255, 255') >= 0` → `indexOf('51, 65, 85') >= 0`（`--ink-strong` 的 rgb(51,65,85)）。
- 文件头注释 L1 提及「白字」同步改为「深色文字」。
- 注意：L26 scrim 渐变断言（`linear-gradient` presence）不改；L58-62 视频淡入断言不改。

- [ ] **Step 5: 适配 `scripts/checks/task7-nav.js`**

about 顶部断言由深色改浅玻璃（base 值）：`bg` 含 `255, 255, 255`；inactive 链接 `--ink-soft`=`100, 116, 139`；active 链接 `--accent`=`56, 189, 248`。结构保留：初始（about 顶部）→ 滚动 is-scrolled → hero-next 路由 education → 回 about。改后各条：
- L12：`bg.indexOf('13, 23, 27') >= 0` + `'nav-links dark glass over hero'` → `bg.indexOf('255, 255, 255') >= 0` + `'nav-links light glass over hero (light hero), got ' + bg`。
- L19：inactive 链接 `color.indexOf('255, 255, 255') >= 0` → `indexOf('100, 116, 139') >= 0` + `'nav inactive link ink over hero, got ' + ...`。
- L23：active 链接 `color.indexOf('125, 211, 252') >= 0` → `indexOf('56, 189, 248') >= 0` + `'nav active link accent-blue over hero, got ' + ...`。
- L53：`bg.indexOf('13, 23, 27') >= 0` + `'nav-links dark again on about top'` → `bg.indexOf('255, 255, 255') >= 0` + `'nav-links light glass on about top, got ' + bg`。
- 其余（is-scrolled 切换、L32/L44 浅玻璃、路由断言）不改。
- 文件头注释 L1 同步改为「about 顶部浅玻璃」。

- [ ] **Step 6: 适配 `scripts/checks/task9-hero-reduced-motion.js`**

- L38：`getComputedStyle(links).backgroundColor.indexOf('13, 23, 27') >= 0` + 消息含「dark over hero」→ `indexOf('255, 255, 255') >= 0` + `'nav-links light glass over hero under reduced-motion, got ' + ...`。
- 其余（video 无 src、poster 可见、scrim presence、name 不拆字、问候全文、hero-next 静止）不改。

- [ ] **Step 7: 运行验证**

```bash
node scripts/verify.mjs scripts/checks/task6-hero.js
node scripts/verify.mjs scripts/checks/task7-nav.js
node scripts/verify.mjs scripts/checks/task9-hero-reduced-motion.js --reduced-motion
```
全部 PASS。然后全量回归（全部应为 PASS）：
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
node scripts/verify.mjs scripts/checks/task6-reduced-motion.js --reduced-motion
node scripts/verify.mjs scripts/checks/task6-regression.js
```
预期：既有 12 个其他 check 无需改动即全绿（presence 型）。若某 check 意外变红，最小修复（只改断言匹配新结构，不删断言、不放宽语义）并记档根因。

- [ ] **Step 8: 提交**

```bash
git add style.css index.html scripts/checks/task6-hero.js scripts/checks/task7-nav.js scripts/checks/task9-hero-reduced-motion.js
git commit -m "feat: lighten hero — white scrim + ink text, uniform light navbar (Phase 3)"
```

- [ ] **Step 9: 人工目测清单（用户桌面验证）**

计划执行 + final review 通过后请用户浏览器目测：
1. 首页视频明亮、遮罩白色 wash、文字/徽章/按钮/联系方式深色可读，无白字残留。
2. 导航全站浅玻璃，滚动/切视图无深色胶囊跳变。
3. 后四视图视觉零回归。
4. DevTools reduced-motion：Hero 显海报、文字深色完整。
5. 390×844 移动视口：Hero 一屏放下、底部引导可见。
