# resume-v2 三期微调 — 首页调浅（全站统一浅色系）

日期：2026-08-09
状态：已获用户批准（2026-08-09）

## 背景与目标

三期「深色首屏画布 + 全站无框」完成后，用户反馈：**第一页（深色电影感）和后几页（浅色）颜色跳跃性太大**。用户原意是换后几页背景图（深暖色 `秋招/背景.png`），后经确认改为**只调浅首页**：首页遮罩减淡、文字改深色，后几页保持现状浅色。全站统一浅色系，云端小岛视频变明亮背景。深暖图本期不用，素材保留在用户目录。

## 决策

| 项 | 决策 |
|---|---|
| 首页明暗 | **调浅**：深色遮罩 → 白色半透明 wash，视频透出明亮感 |
| 首页文字 | 白字 → **深色**（沿用四视图 ink 色板），保证浅底对比度 |
| 导航 | **删除** `body[data-view="about"]` 深色覆盖块 → 全站统一浅玻璃 |
| 后四视图 | 保持现状浅色，零改动 |
| 成长照阴影 | 白边 + 天蓝光晕在浅底上仍协调，不改 |
| 素材 | `秋招/背景.png` 本期不使用，保留在用户目录 |
| 执行 | 开发副本 `/Users/yxx/resume-v2`；生产 `/Users/yxx/resume` 与 47.85.52.9 零变更 |
| 后续 | 用户满意后再谈上线切换 |

## 具体改动

### ① Hero 遮罩（style.css `.hero-scrim`）

```
现：linear-gradient(180deg, rgba(7,12,14,.30) 0%, rgba(7,12,14,.55) 60%, rgba(7,12,14,.72) 100%)
新：linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,.25) 45%, rgba(255,255,255,.55) 100%)
```

上下略强：保证顶部导航区与底部 `.hero-next` 区文字对比度。

### ② Hero 文字全部改深色（与四视图同色板）

| 元素 | 现（深色适配） | 新 |
|---|---|---|
| `.hero-view .name` | `#fff` | `var(--ink-strong)` |
| `.hero-view .char` / `#typeTarget .char` | 白渐变 `linear-gradient(180deg,#fff,rgba(255,255,255,.55))` | 与 `.section-title .t` 相同 `linear-gradient(90deg,#1e3a5f,#64748b)` |
| `.hero-view .role` | 深玻璃白字 | 浅玻璃深字：`color:var(--ink-strong)` + `background:rgba(255,255,255,.65)` + `border:1px solid rgba(30,58,95,.16)` |
| `.hero-view .typing-line` | `rgba(255,255,255,.92)` | `var(--ink-soft)` |
| `.hero-view .typing-target` | `rgba(255,255,255,.92)` | `var(--ink-strong)` |
| `.hero-view .btn-ghost` | 深玻璃白字 | 浅玻璃深字：`background:rgba(255,255,255,.65)` + `color:var(--ink-strong)` + `border:1px solid rgba(30,58,95,.18)` |
| `.hero-view .btn-ghost:hover` | 白 | `background:rgba(255,255,255,.85)` + `color:var(--ink-strong)` + `border-color:rgba(30,58,95,.3)` |
| `.hero-view .contacts` | `rgba(255,255,255,.78)` | `var(--ink-soft)` |
| `.hero-view .contacts a` | 白 + 白下划线 | `color:var(--ink-soft)` + `border-bottom-color:rgba(30,58,95,.25)` |
| `.hero-next` | `rgba(255,255,255,.82)` | `rgba(30,58,95,.7)` |
| `.hero-next:hover` | `#fff` | `var(--ink-strong)` |

### ③ 导航：删除深色覆盖块

删除 `style.css` L208-224 整个 `body[data-view="about"] .navbar:not(.is-scrolled)` 块（8 条规则）。导航全站统一浅玻璃（`.navbar` 基础 `rgba(241,245,249,.78)` + `.nav-links` `rgba(255,255,255,.55)`）。`is-scrolled` class 机制（js/animations.js `syncNav`）保留，CSS 无区分。`body.dataset.view` 保留（内联路由三处增量不动，作为未来主题钩子，无害）。

### ④ 版本与检查适配

- `?v=` `20260809-11` → `20260809-12`。
- **`task6-hero.js`**：名字/问候字渐变断言 白（`255,255,255`）→ 深（`30,58,95`）；role 白字 → `--ink-strong`（`51,65,85`）。
- **`task7-nav.js`**：about 顶部深色断言 → 浅玻璃（`bg` 含 `255,255,255`；inactive 链接 `--ink-soft`=`100,116,139`；active 链接 `--accent`=`56,189,248`）；保留 is-scrolled 切换、路由、浅玻璃断言。
- **`task9-hero-reduced-motion.js`**：导航深色断言 → 浅玻璃（`bg` 含 `255,255,255`）。
- 其余 check 为 presence 型，不受影响（`.hero` 类保留、radius/blur 在基础规则、渐变断言改为深值）。

## 不改动

- 后四视图一切样式、卡片、背景动效层（`bg-flow`/`bg-glows`/`bg-dots`/`bg-video`）保持不变。
- Hero 视频机制 5 保险不变（无 src / opacity:0 / loadeddata 淡入 / error 兜底 / reduced-motion 不播）。
- 内联路由脚本、animations.js、print 块（已 ink 兼容）、reduced-motion 块不变。
- 生产 `/Users/yxx/resume` 与 47.85.52.9 零变更。

## 验收标准

在 `/Users/yxx/resume-v2` 本地验证：
1. 首页视频明亮通透、遮罩为白色 wash、名字/问候/徽章/按钮/联系方式全部深色可读，无白字残留。
2. 导航全站统一浅玻璃；滚动/切视图无深色胶囊跳变；`is-scrolled` 行为正常。
3. 后四视图视觉零回归。
4. 无头实测：3 个适配 check + 全量 15 checks 全绿。
5. reduced-motion 下 Hero 显海报、内容深色完整；390px 移动视口一屏放下。
6. 生产环境零变更。
