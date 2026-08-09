# resume-v2 浅色电影感升级设计 — 第二期

日期：2026-08-09
状态：已获用户批准（2026-08-09）

## 背景与目标

第一期 GSAP 动效升级已完成（视图编排 / Hero 逐字 / 数字计数 / 卡片倾斜 / 光斑视差，6 任务 + 终审 clean）。用户反馈「格式变化不大」，参考了三套外部动效提示词（Skybridge 404 / Nexum hero / Mostar 滚动页），希望**在保留浅色基调与五视图结构的前提下，把整体质感提升到「浅色电影感」**。

- 用户明确约束：**保留五个视图**（about / education / experience / works / skills），结构不变。
- 参考的技法可迁移，素材不可热链（第三方 CloudFront），一律**自托管**。

## 已确认的决策

| 项 | 决策 |
|---|---|
| 基调 | **浅色**（保留现玻璃拟态浅色系），不转深色 |
| 结构 | 保留五视图切换，不改布局骨架 |
| 背景 | 流动浅色渐变 + 光斑视差 + **视频纹理层**（12%） |
| 背景素材 | 参考站视频 2（上亮下暗纵向渐变），**自托管压缩版**；视频 1 弃用（太暗偏暖） |
| 技法来源 | 三套参考：超大渐变排版（404）/ 玻璃组件（Nexum）/ 电影化层次（Mostar） |
| 执行 | 沿用第一期开发副本 `/Users/yxx/resume-v2`；生产 `/Users/yxx/resume` 与 47.85.52.9 本阶段零变更 |
| 后续 | 用户满意后再谈上线切换 |

## 技术底座（沿用第一期，不变）

- 自托管 GSAP 3.15.0（`assets/vendor/gsap.min.js`），无外链 CDN。
- `js/animations.js` 单 IIFE 模块：`splitChars` / `playView` / `playHero` / `countUp` / `setupTilt` / `setupBackground` / `init`，`window.anim = { init, playView }`。
- 渐进增强：`prefers-reduced-motion` / 无 JS / GSAP 缺失 → 全静态、内容完整可读。
- 动画只动 `transform` / `opacity`（`filter: blur` 为已豁免的电影化特效，见第一期评审）。
- 移动端重型动效减载；`style.css?v=` 每次 CSS 变更升版。
- 无头 CDP 验证：`node scripts/verify.mjs scripts/checks/<file>.js [--reduced-motion]`，`__result(pass, msg)` 模式。

## 背景系统（五层，全部 `pointer-events:none`）

层级（自底向上）：

```
body 流动浅蓝渐变底色 → .bg-glows 光斑(z:-3) → .bg-dots(z:-2) → .bg-video 视频纹理(z:-1) → 内容(0+)
```

> 现役值需让位：`.bg-glows` 目前 `z-index:-2`、`.bg-dots` 目前 `z-index:-1`，实现时重排为 -3 / -2，视频占 -1。

### ① 流动底色（升级）
- 现 `body` 静态浅蓝渐变升级为多层渐变 + 极轻微 `background-position` 缓慢漂移（呼吸感）。
- 保持浅色高亮，不引入深色。

### ② 光斑（升级）
- 现有 4 个 `.glow`：放大（约 1.3–1.5×）、模糊更柔和、视差幅度增强（鼠标 lerp 目标 ±40px，原 ±20px）。
- **随视图变色**：`--glow-hue` CSS 变量控制光斑色相，切换视图时 `playView` 更新该变量（作品→蓝、技能→青、实习→靛、教育→天蓝、关于→中性蓝），GSAP 平滑过渡。改动需柔和（浅色基调内微变）。

### ③ 视频纹理层（新增，核心）
- 新增 `<video class="bg-video" src="assets/vendor/bg-texture.mp4" autoplay muted loop playsinline preload="metadata" aria-hidden="true" tabindex="-1">`，放 `.bg-dots` 之后。
- 定位 `position:fixed; inset:0; width:100%; height:100%; object-fit:cover;`，`z-index:-1`。
- **CSS 恒为 `opacity:0`**（含 `js-anim` 下），视频是否播放由 JS 全权控制；`js-anim` 只是「允许 JS 播放」的门控，不直接改透明度。
- 防黑帧闪烁：animations.js 在视频 `loadeddata`/`canplay` 后 `gsap.to(video, { opacity: 0.12, duration: 0.8 })` 淡入（**从 0 起淡**，单一机制）；加载失败不显示（保持 CSS 静态背景）。
- `@media (prefers-reduced-motion: reduce) { .bg-video { display:none } }`；无 JS → 无 `js-anim` → 永不播放、opacity:0。→ 降级路径保证：**不黑屏、静态、可完整阅读**。
- **素材**：视频 2 重新压缩 → `assets/vendor/bg-texture.mp4`（1280×720 / h264 crf30 / `-an` / `+faststart`，实测 0.47MB，10s 循环）。
- 视频自身明暗（上亮下暗）即承担「电影纵深」，不再另加 shade 遮罩层。

## 排版系统

### ④ Hero 大字渐变
- 名字「邢耀」`.hero .name` 与问候语 `#typeTarget`：保留逐字弹跳，但每个 `.char` span 加**纵向渐变文字**（`background: linear-gradient(180deg, #1e3a5f, rgba(30,58,95,0.45))` + `background-clip:text` + `-webkit-text-fill-color: transparent`）。
- 关键：渐变放在**每个 `.char` span 上**（而非父容器）——纵向渐变对每字一致，且与逐字 opacity 动画天然兼容；未拆分（reduced-motion / 无 JS）时 `.char` 不存在 → 文字保持正常深色，可读。
- 字号加大：名字与问候语在桌面约 +20–30%（具体在计划定，如名字 `clamp(3rem, 6vw, 4.5rem)`）。

### ⑤ 视图大标题
- 四个内容视图（education/experience/works/skills）的区块大标题：加大字号、`letter-spacing` 加宽、**微妙渐变文字**（同 ④ 手法，更轻），有「海报字」感。降级路径同上（未拆分则正常色）。

## 组件系统

### ⑥ 导航玻璃胶囊
- `.nav-links` 容器改为玻璃胶囊：`display:inline-flex; border-radius:999px; background:rgba(255,255,255,0.55); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.65); box-shadow:0 8px 32px rgba(31,78,121,0.12)`；内部链接各自圆角胶囊 hover。
- **必须保留**现有路由机制（`data-view` + 点击 handler + `.active` 状态），只改外观，不改行为。

### ⑦ 卡片升级
- `.project-card` / `.hobby-card` / `.tl-card`：渐变描边（`border-image` 或伪元素）+ 分层投影 + 加强 `backdrop-blur`。浅色玻璃在浅底上边界更清晰。
- 保留现有 hover 倾斜/上浮/阴影（第一期已实现）。

### ⑧ 数字 accent 字体
- `.num`（330+/3000+/97%...）换 accent 字体：自托管一个轻量显示字体（候选：Space Grotesk 600/700，单字重 woff2，~10–30KB），配套 `font-variant-numeric: tabular-nums` 保留。加载失败回退系统字体，不影响可读性。

## 视图切换（电影化）

### ⑨ 电影化进场
- 保留现有 reveal 错峰弹入 + 旧视图淡出，叠加：新视图进场 `filter: blur(4px) → 0` 的「对焦」过渡（GSAP，时长 ~0.5s，reduced-motion 下跳过）。
- `playView` 同步更新 `--glow-hue`（见 ②）。

## 可访问性 / 性能 / 降级

- `prefers-reduced-motion`：视频 `display:none`、光斑静止、blur 对焦跳过、渐变动画静态（文字以正常色完整显示）。
- 无 JS：`js-anim` 缺失 → 视频 opacity:0、`.char` 不存在、标题正常色 → 完全可读的浅色静态页。
- 视频加载失败：不显示视频，CSS 背景兜底。
- 移动端（≤640px）：视频透明度降 ~6%（或隐藏）、光斑减半、文字渐变保留（可读性优先）。
- 性能：只动 transform/opacity（blur 豁免）；视频 0.47MB 自托管；不阻塞首屏（视频延迟淡入，不影响内容）。

## 验收标准

在 `/Users/yxx/resume-v2` 本地验证：
1. 五视图切换正常，路由/弹窗/Escape/回到顶部（第一期既有功能）零回归。
2. 背景：流动底色 + 光斑视差 + 视频纹理（12%）统一叠底；PC 鼠标视差明显；视频自身动感柔和不抢内容。
3. Hero 名字/问候语逐字弹跳 + 纵向渐变文字；视图大标题渐变海报字。
4. 导航玻璃胶囊、卡片渐变描边/投影、数字 accent 字体，均正常。
5. 视图切换有 blur→focus 对焦过渡，光斑随视图微变色。
6. 无头实测：新增纹理/渐变/胶囊断言 + 既有 task1–6 全量回归全绿。
7. reduced-motion 下全静态、内容完整；390px 移动视口减载正常、可阅读。
8. 线上 `/Users/yxx/resume` 与 47.85.52.9 本阶段**不变更**。

## 上线切换（后续步骤）

- 用户满意后，将 `/Users/yxx/resume-v2` 新文件同步到 `/Users/yxx/resume`，`style.css?v=` 升版，服务器 `git pull`。本阶段不做。
