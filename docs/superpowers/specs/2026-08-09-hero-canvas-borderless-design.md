# resume-v2 三期升级设计 — 深色首屏画布 + 全站无框

日期：2026-08-09
状态：已获用户批准（2026-08-09）

## 背景与目标

二期「浅色电影感」已完成（深色光斑随视图变色、玻璃胶囊、卡片渐变描边、blur→focus 过渡，5 任务 + opus 终审全绿）。用户看到参考项目 `/Users/yxx/xingyao-resume-multipage-v4` 首页后提出两个方向性意见：

1. **背景**：想用参考首页的「云端小岛」视频背景（全屏、电影感）。
2. **无边界**：当前页面内容都包在 `.glass` 玻璃卡片里，视觉上有「框框」；参考项目是编辑式排版、内容直接铺在画面上，没有明确容器边界。

经确认，决策如下：

| 项 | 决策 |
|---|---|
| 首屏明暗 | **深色电影感**（同参考）：视频 + 深色渐变遮罩 + 白色内容 |
| 无框范围 | **全站无框**：五个视图都去掉 `.glass` 容器，内容直接浮在背景上 |
| 首屏排版 | **居中竖排**（保持现状）：成长照在上、名字/问候/按钮居中 |
| 底部引导 | **加**「下一页 · 教育背景」底部引导 |
| 其余四视图 | 保持**浅色**基调，去掉外层 `.glass`，内层卡片（自带描边投影）直接浮在浅色背景 |
| 素材 | 云端小岛视频**自托管**（下载 + 压缩，同二期 bg-texture 做法） |
| 执行 | 沿用开发副本 `/Users/yxx/resume-v2`；生产 `/Users/yxx/resume` 与 47.85.52.9 本阶段零变更 |
| 后续 | 用户满意后再谈上线切换 |

## 技术底座（沿用二期，不变）

- 自托管 GSAP 3.15.0，无外链 CDN。
- `js/animations.js` 单 IIFE：`splitChars` / `playView` / `playHero` / `countUp` / `setupTilt` / `setupBackground` / `init`。
- 渐进增强：`js-anim` 仅 GSAP 存在且非 reduced-motion 时注入；无 JS / reduced-motion → 全静态、内容完整可读。
- 动画只动 `transform` / `opacity`（`filter: blur` 为豁免）。
- 五视图、hash 路由、内联路由脚本（index.html L514-622）、弹窗、Escape、回到顶部一律不动。
- `style.css?v=` 每次 CSS 变更升版（当前 `20260809-8` → 三期升 `20260809-9`）。
- 无头 CDP 验证：`node scripts/verify.mjs scripts/checks/<file>.js [--reduced-motion]`。

## 视频素材（自托管）

| 项 | 值 |
|---|---|
| 源 | `https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_171521_25968ba2-b594-4b32-aab7-f6b69398a6fa.mp4` |
| 源规格 | h264 / 1924×1076 / 24fps / 10.04s / 14.37MB |
| 压缩后 | `assets/vendor/hero-island.mp4`，1280×716 / crf28 / `-an` / `+faststart`，实测 **322KB** |
| 海报兜底 | `assets/长大照片.jpg`（已有资源） |

## ① 首屏 Hero 画布（about 视图）

`#about` 改为 `min-height: 100svh` 的全屏画布，无容器框。背景三层（自底向上）：

```
海报兜底图（<img class="hero-poster">，恒在）→ 云端小岛视频（<video class="hero-video">）→ 深色渐变遮罩（<div class="hero-scrim">）
```

- **海报兜底图**：`assets/长大照片.jpg`，`object-fit: cover` 铺满全屏，恒显示。它是「永不黑屏」的根基——视频任何状态下都盖在海报之上，视频透明时露出海报。
- **视频**：`<video class="hero-video" preload="none" muted loop playsinline aria-hidden="true" tabindex="-1">`，HTML **不带 src 不带 autoplay**。JS（js-anim 且非 reduced-motion）注入 `src='assets/vendor/hero-island.mp4'`、`preload='auto'`，`loadeddata` 后淡入播放（同 bg-video 机制）。`error` → 保持透明，海报兜底。
- **遮罩**：深色渐变保证白色内容对比度。参考项目为左→右深渐变（`rgba(7,12,14,.68)→.36→.12`）；本页内容居中，采用**中心加权深渐变**（上浅下深，如 `linear-gradient(180deg, rgba(7,12,14,.30) 0%, rgba(7,12,14,.55) 60%, rgba(7,12,14,.72) 100%)`，最终值计划定），确保居中白字可读且不遮死天空。
- **内容**（直接浮在视频上，居中竖排，保持现状顺序）：
  - 三张成长照（`hero-photos`，圆角保持，阴影适配深色）
  - 「邢耀」白色大标题（`.hero .char` 渐变改**浅色系** `linear-gradient(180deg, #fff, rgba(255,255,255,0.55))`）
  - 「AI 产品经理」徽章（`role`，改深色玻璃：半透明白底 + 白字）
  - 问候语 `#typeTarget` 白字
  - 下载简历/联系按钮（深色适配）
  - 联系方式白字
- **底部引导**：`.hero-next`「下一页 · 教育背景」，浮在画布底部居中，白/半透明，指向 `#education`（复用现有 `data-view` 路由），带轻微上浮/呼吸动画。

## ② 导航栏：透明 → 玻璃过渡

- 导航为 `position: fixed`。默认状态（浮在深色首屏上）：`.nav-links` / `.nav-brand` / `.nav-contact` 白色文字，胶囊底色改**深色玻璃**（`rgba(13,23,27,0.35)` + 保持 `backdrop-filter: blur(16px)`、`border-radius:999px`）。
- `.is-scrolled`（`scrollY > 36`）或非 about 视图：恢复二期浅色玻璃胶囊（现状）。
- 切换逻辑：`body[data-view="about"]:not(.is-scrolled)` → 深色玻璃白字；其余 → 浅色玻璃。
- **关键约束**：`.nav-links` 的 `border-radius: 999px` 与 `backdrop-filter: blur(16px)` 必须保留在基础规则上（只覆盖背景色/文字色/边框/阴影），保证 task3-components.js 的胶囊断言不回归。

## ③ 其余四视图：去框

- 移除 education / experience / works / skills 视图内所有 `.glass` 容器（含 works 的 `.glass`、skills 的 `.glass ability reveal`、`.glass reveal` 等）。
- 各 `.view` 补自身垂直 padding（如 `padding: 2.4rem clamp(1rem,4vw,2.5rem)`），内容卡片直接浮在浅色流动背景上。
- 内层卡片（`.edu-card` / `.tl-card` / `.project-card` / `.hobby-card` / 技能卡）沿用二期描边投影，无需改。
- `.glass` 规则若去框后无任何引用，删除（含 `@media print` 与移动端里的 `.glass` 选择器一并清理；`.featured` 等共享选择器注意保留）。
- 保持：`.section-title` 海报字、数字计数、卡片倾斜、reveal 错峰全部不变。

## 既有检查适配（本期的计划约束）

- `scripts/checks/task2-typography.js`：`.hero .char` 渐变断言当前为深色 `linear-gradient(180deg, #1e3a5f, rgba(30,58,95,0.35))`；首屏改深色后须更新为**浅色渐变值**（白色系）。`.section-title .t` 深色渐变断言不变（四视图仍浅色底）。
- `scripts/checks/task3-components.js`：`.nav-links` 胶囊断言（radius 999px + backdrop blur）必须保持通过——设计上透明/深色态只覆盖背景色/文字色/边框/阴影，不动 radius 与 blur 基础规则。
- 新增检查（计划内定义）：Hero 画布（100svh、三层背景、白字）、导航 is-scrolled 过渡、reduced-motion 下 Hero 显海报不播视频、四视图无 `.glass` 容器。
- 全量回归：既有 task1–6 + 二期 4 检查在适配后仍须全绿。

## 可访问性 / 性能 / 降级

- `prefers-reduced-motion`：Hero 视频不播放（JS 早退，不注入 src）→ 海报静止；`.hero-video { display:none }` 兜底；底部引导静止；导航过渡静止。
- 无 JS：`js-anim` 缺失 → Hero 视频无 src 不下载（`preload="none"` 零网络），海报 + 遮罩 + 白字完整可读。
- 视频加载失败：`error` → 视频透明，海报兜底，不黑屏。
- 移动端（≤640px）：Hero 内容紧凑居中，保证 390px 视口一屏放下（照片缩小、字号 clamp 收窄）；遮罩保持对比度。
- 性能：视频 322KB 自托管；海报为静态图；动画只动 transform/opacity。

## 验收标准

在 `/Users/yxx/resume-v2` 本地验证：
1. 首屏 `#about` 全屏无框，视频淡入播放、海报兜底不黑屏、白字可读；底部「下一页 · 教育背景」可点并路由到 education。
2. 导航在 about 顶部为深色玻璃白字，滚动/切视图后恢复浅色玻璃胶囊。
3. 四视图去框后内容直接浮在浅色背景上，卡片描边投影正常，可读性无退化。
4. 五视图切换、路由、弹窗、Escape、回到顶部、数字计数、卡片倾斜零回归。
5. 无头实测：新增 Hero/导航/去框断言 + 既有 task1–6 全量回归全绿。
6. reduced-motion 下全静态、Hero 显海报、内容完整；390px 移动视口一屏放得下、可阅读。
7. 线上 `/Users/yxx/resume` 与 47.85.52.9 本阶段**不变更**。

## 上线切换（后续步骤）

用户满意后，将 `/Users/yxx/resume-v2` 新文件同步到 `/Users/yxx/resume`，`style.css?v=` 升版，服务器 `git pull`。本阶段不做。
