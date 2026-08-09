# resume-v2 全站 v9 奶油暖色系重设计（首屏可读性 + 全站颜色衔接）

日期：2026-08-09
状态：已获用户批准（2026-08-09，含色系走向决定：**全站换 v9 奶油暖色系**）

## 背景与目标

三期「首页调浅」（commit 4d2c3b6）后，用户反馈**首屏文字仍看不清**，并给出手法参考：`/Users/yxx/xingyao-resume-multipage-v9`。

**根因**（已核实）：`assets/vendor/hero-island.mp4` 是深色视频（采样帧主色 `rgb(7,11,12)` 近黑 + 暖色点缀 `rgb(189,135,96)`），白色 wash（`rgba(255,255,255,.25–.55)`）叠在深色视频上＝中灰糊，ink 深字（`#334155/#475569/#64748b`）同为中灰调 → 不可读。

**v9 的解法**（`style.css` L601-620、L701-749 实测）：不把首屏调亮，而是让**首屏和浅色页共用同一组色场**——奶油纸底 + 淡粉/暖黄/雾青三径向场穿透全站；首屏深色视频上叠「奶油渐变 veil + 同组色场」，veil 文字侧最强（30%–72%），文字改深墨，role 用 sage、CTA 用 charcoal。深墨字在奶油 veil 上对比度达标（≥4.5:1），首屏与后续页共享同一色族 → 跳跃感消失。

用户已确认：**全站换 v9 奶油暖色系**。

## 决策

| 项 | 决策 |
|---|---|
| 色系 | **全站 v9 奶油暖色系**：body/四页/首屏统一奶油底 + 淡粉/暖黄/雾青三径向色场 |
| 首屏可读 | 白色 wash → **奶油渐变 veil（中央最强 70–72%）+ 三色径向场**；视频微调亮；文字深墨 |
| 结构 | **零改动**：hero 居中布局、四页内容、路由、GSAP 动效结构、视频 5 保险全不动，只换色 |
| 全局深色纹理 `bg-video` | 奶油上发灰 → **不再显示**（CSS `display:none`；JS/HTML 零改动，机制保留） |
| 导航 | 浅玻璃 → **奶油玻璃**，ink 文字，active/hover 用 sage |
| 强调色 | 天蓝 `--accent:#38bdf8` → **sage `#56826f`**（17 处 `var(--accent)` 引用自动跟随；硬编码天蓝值单独扫） |
| 主 CTA | `.btn-accent`(下载简历)/`.btn-primary`(在线体验) → **charcoal `#263437`** |
| 执行 | 开发副本 `/Users/yxx/resume-v2`；生产 `/Users/yxx/resume` 与 47.85.52.9 零变更 |
| 后续 | 用户目测满意后再谈上线切换 |

## 色板 token（`:root` 精确值）

```
--ink-strong: #102027   （正文/标题最重，v9 同款近黑墨）
--ink:        #2a3a41   （次级正文，暖墨）
--ink-soft:   #536269   （弱文字，v9 同款）
--ink-faint:  #8b9497   （最弱文字）
--accent:     #56826f   （sage 灰绿 — 强调/active/链接 hover/role 徽章）
--accent-deep:#3f6150   （sage 深一档）
--accent-soft:#e4ede7   （浅 sage 底）
--shadow: 0 4px 20px rgba(15,23,42,.05), 0 4px 28px rgba(86,130,111,.10)
--glow:      rgba(86,130,111,.15)
--border-glow:#cfe3d6   （浅 sage 描边）
--glow-hue:  330        （光斑默认色相，暖粉；页面各自见下）
--glass-bg:  rgba(255,255,255,.62)  （卡片玻璃，奶油上保持白色磨砂）
```

## 三色径向色场（全站共用同一组值）

```
淡粉   rgba(255,191,210,.38)   位置 左上 6% 4%
暖黄   rgba(245,232,116,.38)   位置 右上 94% 8%
雾青   rgba(102,214,224,.38)   位置 右下 94% 82%
奶油底 #f7f3e9
```

## 具体改动

### ① `:root` token（style.css L16-33）
按「色板 token」段整体替换上述 11 个变量。`--num-font`、`--radius`、`--nav-h` 不变。

### ② body 背景（L39-49）
```
现：两团天蓝椭圆 + linear-gradient(135deg,#f0f9ff,#e0f2fe)
新：三色径向场 + #f7f3e9
  background:
    radial-gradient(circle at 6% 4%,  rgba(255,191,210,.38), transparent 30%),
    radial-gradient(circle at 94% 8%, rgba(245,232,116,.38), transparent 32%),
    radial-gradient(circle at 94% 82%, rgba(102,214,224,.38), transparent 34%),
    #f7f3e9;
```

### ③ `bg-flow`（L52-61）→ 暖色光斑
```
新：
  radial-gradient(ellipse 40% 35% at 28% 30%, rgba(255,190,210,.18), transparent 70%),
  radial-gradient(ellipse 38% 32% at 72% 68%, rgba(246,231,116,.16), transparent 70%)
```

### ④ `bg-glows .glow`（L84-95）
色相沿用 `--glow-hue`（机制不变），每页值改为暖色相：
```
about=330(暖粉) education=45(暖黄) experience=190(雾青) works=350(玫瑰) skills=160(浅sage)
```
（改 `animations.js` `VIEW_HUE` 五值 + `:root --glow-hue` 默认 330。）玻璃光斑 opacity 保持 `.65` 不变。

### ⑤ 全局 `bg-video`（L64-74）
`display: none;`（不再显示；HTML/JS 零改动，机制保留）。

### ⑥ Hero scrim（L371-377）→ 奶油 veil + 三色场
```
新：
  background:
    radial-gradient(circle at 5% 8%,  rgba(255,190,210,.30), transparent 34%),
    radial-gradient(circle at 91% 8%, rgba(246,231,116,.22), transparent 31%),
    radial-gradient(circle at 93% 88%, rgba(102,214,224,.25), transparent 35%),
    linear-gradient(180deg, rgba(247,243,233,.50) 0%, rgba(247,243,233,.70) 38%, rgba(247,243,233,.72) 55%, rgba(247,243,233,.55) 100%);
```
文字在正中 → veil 中央段最强（.70/.72），上下略弱仍保证导航区与 `.hero-next` 区对比度。近黑视频 + 中央 .72 奶油 ≈ L0.66，对 ink #102027 对比度 ≈11:1。

### ⑦ Hero 视频微调亮
`.hero-view .hero-video` 加 `filter: saturate(.9) contrast(.98) brightness(1.10);`（比 v9 略强，因本视频更暗；只改 filter，动画机制不动）。

### ⑧ Hero 文字（L391-424 覆盖块）
| 元素 | 新值 |
|---|---|
| `.hero-view .name` | `color: var(--ink-strong)`（#102027） |
| `.hero-view .char` / `#typeTarget .char` 渐变 | `linear-gradient(90deg,#102027,#536269)` |
| `.hero-view .role` | sage 徽章：`color:#fff; background:#56826f; border:1px solid rgba(86,130,111,.35)` |
| `.hero-view .typing-line` | `var(--ink-soft)` |
| `.hero-view .typing-target` | `var(--ink-strong)` |
| `.hero-view .btn-ghost` | `background:rgba(255,255,255,.55); color:var(--ink-strong); border:1px solid rgba(16,32,39,.22)` hover `background:rgba(255,255,255,.85)` |
| `.btn-accent`（下载简历，hero 唯一使用处） | `background:#263437; color:#fff; box-shadow:0 2px 8px rgba(16,32,39,.3)` hover `background:#334548`（charcoal） |
| `.hero-view .contacts` | `var(--ink-soft)` |
| `.hero-view .contacts a` | `color:var(--ink-soft); border-bottom-color:rgba(16,32,39,.25)` hover `color:var(--accent)` |
| `.hero-next` | `color:rgba(16,32,39,.62)` hover `var(--ink-strong)` |

### ⑨ 导航 → 奶油玻璃
`.navbar` 底 `rgba(241,245,249,.78)` → `rgba(247,243,233,.8)`；`.nav-links` 底保持 `rgba(255,255,255,.55)`；`.nav-links a` 色跟随 `--ink-soft`/`--ink-strong`/`--accent`（token 变更自动生效）；`.nav-links a.active::after` 跟随 `--accent`（→ sage）。`is-scrolled` 机制保留。

### ⑩ 组件扫（token 变更自动 + 硬编码值手动）
- `.section-title .t` 渐变（L252）与 `.hero .char` 渐变（L313 纵向、L396 覆盖横向）`linear-gradient(90deg|180deg,#1e3a5f,…)` → `linear-gradient(90deg|180deg,#102027,#536269)`（三处全改，保证 `30,58,95` 零残留）。
- `.btn-primary`（作品页在线体验，L461）`background:var(--ink-strong)` → 直接写 charcoal `#263437`，hover `#334548`。
- `--shadow/--glow/--border-glow`（:root）已按 token 段换成 sage 暖调。
- 卡片玻璃 `rgba(255,255,255,.6–.9)` 保持白色磨砂（奶油上视觉自然，不改）。
- 其余全站扫一遍：凡硬编码天蓝 `#38bdf8/#0ea5e9/#e0f2fe/#bae6fd/rgba(56,189,248,…)/rgba(125,211,252,…)` 处 → sage/奶油暖值（计划阶段列出清单）。

### ⑪ `?v=` 与 check 适配
- `?v=` `20260809-12` → `20260809-13`。
- **`task6-hero.js`**：名字/问候字渐变断言 `30,58,95` → `16,32,39`（#102027）；role 断言由 `color 含 51,65,85` → `color 含 255,255,255` + `background 含 86,130,111`；scrim 仍断言 linear-gradient。
- **`task7-nav.js`**：nav-links 底保持白玻璃 `255,255,255`（**不改**）；仅两处链接色断言——inactive `100,116,139` → `83,98,105`（新 `--ink-soft` #536269）、active `56,189,248` → `86,130,111`（新 `--accent` sage）。
- **`task9-hero-reduced-motion.js`**：nav-links 底 `255,255,255` 不变 → **无需适配**（保持白玻璃）。
- **`task1-background.js`**：`.bg-video` 淡入断言（`opacity > target*0.5`）→ 改为断言 `display === 'none'`（全局纹理按设计不再显示；元素保留在 HTML，`.bg-video` 存在性断言不改）。
- **`task4-transitions.js`**：光斑色相断言 `experience 241–245` → `190`（雾青，188–192）；`skills 184–188` → `160`（浅 sage，158–162）。
- 其余 11 个 check 为 presence/timing 型，实现后全量扫描确认无天蓝色断言残留。

## 不改动

- 四页内容、卡片结构、hero 居中布局（hero-photos/name/role/typing/actions/contacts/hero-next 位置）、路由、内联脚本。
- Hero 视频 5 保险：无 src / opacity:0 / loadeddata 淡入 / error 兜底 / reduced-motion 不播。
- GSAP 动效结构（`playView`/`setupBackground`/`setupTilt`/字符拆分/计数）只改 `VIEW_HUE` 五值。
- `bg-dots`、打印块（已 ink 兼容，核对无天蓝残留）、reduced-motion 块。
- 生产 `/Users/yxx/resume` 与 47.85.52.9 零变更。

## 验收标准

在 `/Users/yxx/resume-v2` 本地验证：
1. 首屏视频透出运动、奶油 veil 中央最强，名字/role/问候/按钮/联系方式全部深墨或 sage/charcoal 可读，无中灰糊。
2. 首屏与四页共享奶油底 + 淡粉/暖黄/雾青三色场，切换无颜色跳跃。
3. 导航奶油玻璃，滚动/切视图无颜色跳变；`is-scrolled` 行为正常。
4. 全局深色纹理 `bg-video` 不再显示，其余动效（bg-flow/bg-glows/bg-dots）正常。
5. 无头实测：4 个适配 check + 全量 16 checks 全绿。
6. reduced-motion 下 Hero 显海报、内容深墨完整可读；390px 移动视口一屏放下；no-JS 路径静态可读。
7. 打印友好（hero 文字 ink、无天蓝残留）。
8. 生产环境零变更。
