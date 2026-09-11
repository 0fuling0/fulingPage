# fulingHome

一个基于个人学习逐步完善的个人主页模板项目。

## 使用方式

1.  **Fork 项目:**
    [![Fork this project](https://img.shields.io/badge/Fork%20this%20project-GitHub-blue?logo=github)](https://github.com/0fuling0/fulingPage/fork)

2.  **配置网站:**  进入 Fork 后的项目，修改 `config.json` 文件配置网站信息 (也可修改 `nav.json` 配置导航页)。

3.  **部署:** 选择以下方式进行部署：

    *   **Cloudflare Pages 部署:**
        [![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy%20to-Cloudflare%20Pages-blue?logo=cloudflare)](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github)
    *   **Vercel 部署:**
        [![Deploy to Vercel](https://img.shields.io/badge/Deploy%20to-Vercel-blue?logo=vercel)](https://vercel.com/import/project?template=https://github.com/0fuling0/fulingPage)

## 项目阶段

*   **阶段1 (已完成 2024-03-05):** AI 辅助试作品，一个简单的个人主页。详见 [State1.md](State1.md)。
*   **阶段2 (已完成 2025-02-17):** 增加配置文件，使其成为真正意义上的主页模板。详见 [State2.md](State2.md)。
*   **阶段3 (进行中):** 使用 Vue 3 重构配置驱动的主页与导航页渲染，主页卡片已拆分为 `homepage-card` 组件，并完成玻璃拟态视觉系统的配色、布局、响应式与交互状态优化，当前采用悬浮光晕卡片风格，保留现有特效和第三方插件的兼容性。当前继续采用 CDN + 原生 CSS/JS，以支持直接打开 `index.html` 和静态部署；迁移至 `.vue` 单文件组件需先引入构建工具。
*   **阶段4:** 构建多套可随时切换的主题 (例如：透明卡片风格、仿报纸简约风格、高对比度现代风格)。
*   **阶段5:** 待定。