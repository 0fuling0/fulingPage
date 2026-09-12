# fulingHome

一个基于个人学习逐步完善的个人主页模板项目。

## 使用方式

1.  **Fork 项目:**
    [![Fork this project](https://img.shields.io/badge/Fork%20this%20project-GitHub-blue?logo=github)](https://github.com/0fuling0/fulingPage/fork)

2.  **配置网站:**  进入 Fork 后的项目，修改 `config.json` 文件配置网站信息 (也可修改 `nav.json` 配置导航页)。主题与背景处理同样在 `config.json` 的 `theme` 字段自定义：
    *   `theme.default`：默认主题，可选 `glass`（玻璃卡片）/ `minimal`（极简素白）/ `newspaper`（简约报纸）/ `terminal`（终端极客）；
    *   `theme.bgFilters`：按主题指定默认背景滤镜（`none` / `blur` / `bright` / `dim` / `mono` / `sepia` / `vivid`）；
    *   `theme.bgFilter`：未在 `bgFilters` 中列出的主题使用的全局兜底滤镜；
    *   `animation.default`：默认背景动画，可选 `rain`（雨滴）/ `code`（代码流动）/ `none`（无）；
    *   背景壁纸支持多源：任一源下载失败或超时（8s）时自动故障转移到下一源，全部失败则保持当前背景；建议把稳定源（如 `https://bz.w3h5.com/img/rand` 必应随机壁纸）排在前列，本地图片放第一张以保证首屏速度；
    *   访客在菜单中手动选择主题或滤镜后会记住其选择并覆盖以上配置；未手动选择过的访客始终跟随配置。

3.  **部署:** 选择以下方式进行部署：

    *   **Cloudflare Pages 部署:**
        [![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-blue?logo=cloudflare)](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github)
    *   **Vercel 部署:**
        [![Deploy to Vercel](https://img.shields.io/badge/Deploy%20to-Vercel-blue?logo=vercel)](https://vercel.com/import/project?template=https://github.com/0fuling0/fulingPage)

## 项目阶段

*   **阶段1 (已完成 2024-03-05):** AI 辅助试作品，一个简单的个人主页。详见 [State1.md](State1.md)。
*   **阶段2 (已完成 2025-02-17):** 增加配置文件，使其成为真正意义上的主页模板。详见 [State2.md](State2.md)。
*   **阶段3 (已完成 2026-09-12):** 使用 Vue 3 重构配置驱动的主页与导航页渲染，主页卡片拆分为 `homepage-card` 组件，完成玻璃拟态视觉系统的配色、布局、响应式与交互状态优化，保留现有特效和第三方插件的兼容性。当前继续采用 CDN + 原生 CSS/JS，以支持直接打开 `index.html` 和静态部署；迁移至 `.vue` 单文件组件需先引入构建工具。
*   **阶段4 (已完成 2026-09-12):** 构建多套可随时切换的主题，并同步完成一组体验修复与性能优化。
    *   **主题：** 玻璃卡片（默认，即原版毛玻璃样式）、极简素白、简约报纸、终端极客（亮色为白昼终端、暗色为磷光夜视，两种形态差异明显）。新主题在 `main.css` 末尾追加 `html[data-theme="..."]` 变量块（必须含 `.dark-mode` 组合块，以覆盖 `:root.dark-mode` 的高特异性）并在 `main.js` 的 `SITE_THEMES` 注册即可。
    *   **切换与记忆：** header 调色板按钮展开菜单选择主题与背景滤镜，菜单项带色板预览圆点，面板填充与卡片一致（`--panel-fill`）；手动选择经 `localStorage` 记忆，未手动选择过的访客始终跟随配置。
    *   **配置：** `config.json` 的 `theme` 字段：`default` 设置默认主题、`bgFilters` 按主题指定默认背景滤镜、`bgFilter` 作为未列出主题的全局兜底（详见「使用方式」）。
    *   **背景滤镜：** 原图 / 模糊 / 提亮 / 压暗 / 黑白 / 怀旧 / 鲜艳 七种，新滤镜在 `BG_FILTERS` 中添加。
    *   **动画：** 菜单「动画」分组可切换 无 / 雨滴 / 代码流动（Matrix 式字符下落，颜色跟随主题强调色），`config.json` 的 `animation.default` 设默认；新动画实现启停函数后在 `ANIMATIONS` 中注册。
    *   **迭代中淘汰：** 透明卡片（透明描边宫格并入默认主题）、高对比度、独立玻璃卡片、水墨古风（与简约报纸相似度高，保留后者）。
    *   **修复与优化：** 暗色切换按钮图标实时更新；移动端断点圆角改为主题变量（`--card-radius-mobile` 等）保证单列/多列一致；悬停光效统一走 `--glow-color`；`scrollbar-gutter: stable` 常驻滚动条槽位，内容高度变化时主元素不再横移；评论（Twikoo）与音乐播放器（APlayer/Meting）脚本按配置按需加载，对应卡片未启用时不下载；背景图预加载使用与展示相同的地址（消除 API 图二次下载）+ `img.decode()` 预解码 + 图层合成器提升（`will-change`），切换动画附 Ken Burns 缓推，整行源码流动动画（`ANIMATIONS`）；PSI 对比度/标签/可爬取链接等无障碍与 SEO 修复。
*   **阶段5 (待定):** 候选方向：更多主题风格（和风淡彩、糖果马卡龙、新拟态）；为音乐播放器引入自建/可配置的 Meting API 提升可用性；引入构建工具迁移 `.vue` 单文件组件；按主题细化默认明暗模式。