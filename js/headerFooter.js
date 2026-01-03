/**
 * Header & Footer 交互逻辑模块
 * 提供滚动隐藏、运行时间显示、导航激活状态等功能
 */

// 上次滚动位置
let lastScrollY = 0;
// 滚动方向检测阈值
const SCROLL_THRESHOLD = 50;
// Header 元素引用
let headerElement = null;
// 运行时间更新定时器
let runtimeTimer = null;

/**
 * 初始化 Header 滚动行为
 * 向下滚动隐藏，向上滚动显示
 */
function initHeaderScroll() {
    headerElement = document.querySelector('header');
    if (!headerElement) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

/**
 * 处理滚动事件
 */
function handleScroll() {
    const currentScrollY = window.scrollY;
    
    // 在页面顶部时始终显示
    if (currentScrollY < SCROLL_THRESHOLD) {
        headerElement.classList.remove('header-hidden');
        lastScrollY = currentScrollY;
        return;
    }

    // 向下滚动 - 隐藏
    if (currentScrollY > lastScrollY + 10) {
        headerElement.classList.add('header-hidden');
    }
    // 向上滚动 - 显示
    else if (currentScrollY < lastScrollY - 10) {
        headerElement.classList.remove('header-hidden');
    }

    lastScrollY = currentScrollY;
}

/**
 * 更新导航激活状态
 * @param {string} sectionId - 当前激活的section ID
 */
function updateNavActiveState(sectionId) {
    const navLinks = document.querySelectorAll('.header-nav a');
    navLinks.forEach(link => {
        // 根据 onclick 属性中的 section 名称判断
        const onclick = link.getAttribute('onclick') || '';
        const href = link.getAttribute('href') || '';
        
        // 检查是否匹配当前 section
        const isActive = onclick.includes(`'${sectionId}'`) || 
                        (sectionId === 'homepage' && href.includes('#home')) ||
                        (sectionId === 'navpage' && href.includes('#nav'));
        
        if (isActive) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * 初始化 Footer 运行时间显示
 * @param {Object} config - 网站配置
 */
function initFooterRuntime(config) {
    if (!config?.siteInfo?.startDate) return;

    const startDate = new Date(config.siteInfo.startDate);
    const runtimeElement = document.getElementById('footer-runtime');
    
    if (!runtimeElement) return;

    // 更新运行天数
    function updateRuntime() {
        const now = new Date();
        const diff = now - startDate;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        runtimeElement.textContent = days;
    }

    // 立即更新一次
    updateRuntime();

    // 每小时更新一次（因为是按天计算）
    if (runtimeTimer) clearInterval(runtimeTimer);
    runtimeTimer = setInterval(updateRuntime, 1000 * 60 * 60);
}

/**
 * 设置 Footer 版权信息
 * @param {string} copyright - 版权文本（支持HTML）
 */
function setFooterCopyright(copyright) {
    const copyrightEl = document.querySelector('.footer-info .copyright');
    if (copyrightEl && copyright) {
        copyrightEl.innerHTML = copyright;
    }
}

/**
 * 滚动到页面顶部
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * 滚动到页面底部
 */
function scrollToBottom() {
    window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
    });
}

/**
 * 初始化所有 Header/Footer 功能
 * @param {Object} config - 网站配置
 */
function init(config) {
    // 初始化 Header 滚动行为
    initHeaderScroll();
    
    // 初始化 Footer 运行时间
    initFooterRuntime(config);
    
    // 设置版权信息
    if (config?.footer?.copyright) {
        setFooterCopyright(config.footer.copyright);
    }
    
    // 根据当前 URL hash 设置初始激活状态
    const hash = window.location.hash;
    if (hash === '#nav') {
        updateNavActiveState('navpage');
    } else {
        updateNavActiveState('homepage');
    }
}

export default {
    init,
    initHeaderScroll,
    initFooterRuntime,
    setFooterCopyright,
    updateNavActiveState,
    scrollToTop,
    scrollToBottom
};
