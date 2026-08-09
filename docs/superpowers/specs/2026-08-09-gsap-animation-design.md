# resume-v2 动效升级设计 — GSAP

日期：2026-08-09
状态：已获用户批准

## 背景与目标

用户希望简历网页（线上 http://47.85.52.9/，源码 `/Users/yxx/resume`）更精美、加动态效果。
采用方式：**复制开发**——在 `/Users/yxx/resume-v2` 开发新版本，线上稳定版 `/Users/yxx/resume` 不动，满意后再切换上线。

## 已确认的决策

| 项 | 决策 |
|---|---|
| 风格方向 | 保留现有玻璃拟态视觉 + 升级动效 |
| 动效性格 | 轻快有活力 |
| 技术选型 | 自托管 GSAP（下载 `gsap.min.js` 到 `assets/vendor/`，不走 CDN） |
| Hero 副标题 | 与主标题一致，改为逐字展开（不再用打字机） |
| 布局 | 保持现有视图切换式布局，不引入 ScrollTrigger |
| 背景 | 光斑视差 + 流动底色（方案一） |

## 技术底座

- 下载 `gsap.min.js`（v3.15 系列，约 70KB）到 `assets/vendor/gsap.min.js`，`<script src="assets/vendor/gsap.min.js">` 引入。
- 渐进增强：GSAP 未加载或 JS 出错时，页面回退到现有 CSS 动效，功能完整可用。
- `prefers-reduced-motion`：系统开启减少动态时跳过 GSAP 动画，不破坏布局。
- 移动端降级：关闭卡片 hover 倾斜（无 hover 天然不触发），背景粒子减量。
- 动画只动 `transform` / `opacity`，不触发布局/重绘。

## 动效清单

### ① 视图切换编排（核心）
- 用 GSAP timeline 统一编排 `.reveal` 元素：切换视图时按文档顺序 stagger 上浮 + 淡入，弹性缓动（`back.out(1.2)`）。
- 旧视图快速淡出，新视图弹入。
- 替换现有 CSS `riseUp` + JS 逐元素 delay 的实现；CSS 保留作降级。

### ② Hero 字符级展开
- 现 hero 结构（`index.html` L39-47）：
  - `.name` 主标题「邢耀」
  - `.role`「AI 产品经理」（并入入场 stagger，简单淡入上浮，不做逐字）
  - `.typing-line` 打字机行，`#typeTarget` 内容为完整问候语「你好呀，我是邢耀！希望我们可以一起做一些有意思的事情！」
- 主标题 `.name` 与打字机行 `#typeTarget` 均改为**逐字弹跳展开**：每个字符从下方 `y:30, opacity:0` 错峰弹起落下（stagger）。
- 移除现有打字机 JS（L564-578）与 caret 闪烁；`.typing-line` 保留容器，内容改为拆分后的字符 span。
- 汉字按单字拆分（可用 gsap utils 或手工 wrap 每个字于 `<span>`），确保不破坏语义（`aria-label` 保留完整句子，字符 span 加 `aria-hidden`）。

### ③ 数字滚动计数
- 给有冲击力的数字加计数动画，视图出现时从 0 滚动到目标值：
  - 330+ 自动化测试（作品）
  - 3000+ 日均处理量级（实习）
  - 97% / 98% / 95% 准确率（实习）
  - 15 条策略（实习，若标为 `data-count`）
- 实现：`data-count` 标记目标值 + 后缀（+、%），视图激活时 gsap `to()` 代理对象，`onUpdate` 写入文本。

### ④ 卡片微交互
- 作品卡片（`.project-card`）、爱好卡片（`.hobby-card`）、时间线卡片（`.tl-card`）：
  - 鼠标经过：轻微 3D 倾斜（rotateX/rotateY 跟随鼠标位置）+ 图标/emoji 上浮。
  - 移出：弹性回正（`elastic.out` 或 back.out）。
- 保留现有 hover 阴影/描边；移动端无 hover，天然不触发。

### ⑤ 背景系统升级：光斑视差 + 流动底色
现状问题：`body` 静态浅蓝渐变 + `body::before` 四个固定光斑（完全静止）+ `bg-dots` 六个小点各自漂移，三层无联动 → 页面"平、散"，整体性不强。

升级方案：
- **光斑 DOM 化**：把 `body::before` 的四个静态光斑改为固定定位的半透明 DOM 元素（`body` 下真实元素，便于 GSAP 逐层动画），替换原伪元素。
- **光斑漂移**：每层用 GSAP timeline `yoyo / repeat:-1` 缓慢漂移（不同幅度/相位，错开不齐步）。
- **鼠标视差（PC 主效果）**：四层光斑作为一组，监听光标位置，整组以 lerp 平滑（约 15~25px 幅度）**反向**随鼠标移动——背景比内容"慢半拍"，营造页面厚度与整体感。用 pointer 事件，仅 PC/触控板生效。
- **流动底色**：`body` 基础渐变从纯静态升级为缓慢流动的呼吸渐变（多层渐变 + 极轻微 background-position 漂移，控制幅度避免分心）。
- **保留** `bg-dots` 漂移小点，作为点缀层（不参与视差，或参与极小幅度）。
- 层级：底色 → 光斑（视差层）→ bg-dots → 内容，全部 `z-index:-1` / `pointer-events:none`。
- 移动端降级：无鼠标 → 仅保留光斑漂移与底色流动，无视差；`prefers-reduced-motion` → 全部静止为当前静态背景。

### ⑥ 技能条（低优先级，可选）
- 现有 skill-bar 为 CSS width 过渡，可保留；若统一体验则改为 GSAP 平滑填充。默认保留 CSS，减少改动面。

## 可访问性与性能

- `prefers-reduced-motion` 全局降级（见技术底座）。
- 语义保持：拆分字符用 span 包裹但保留完整可读文本（aria-label / aria-hidden 处理）。
- 不阻塞首屏：GSAP 脚本放 body 底部加载。
- 移动端所有重型动效降级。

## 验收标准

- 在 `/Users/yxx/resume-v2` 本地打开，逐项验证：
  1. 5 个视图切换均有 GSAP 编排入场。
  2. Hero 主/副标题逐字展开，无打字机残留。
  3. 数字计数正确（330+、3000+、97% 等滚动到目标值）。
  4. 卡片 hover 倾斜跟随鼠标，移出回正。
  5. 背景：光斑随鼠标视差移动（PC）、自身缓慢漂移、底色流动；移动端/ reduced-motion 下降级为静态，可读性不损。
  6. 无头浏览器实测 + 移动端视口（390px）+ reduced-motion 关闭动画。
  7. 既有功能回归：导航路由、联系弹窗、二维码放大弹窗、技能条、页脚。
- 线上 `/Users/yxx/resume` 与 47.85.52.9 在本阶段**不变更**。

## 上线切换（后续步骤）

- 用户满意后，将 `/Users/yxx/resume-v2` 的新文件同步到 `/Users/yxx/resume`，提交 push（GitHub `yxx-789/resume`），服务器 `git pull`，`style.css?v=` 版本号 +1。
- 本阶段不做上线切换。
