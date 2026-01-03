// DOM 元素缓存
let cachedDarkModeElements = {
    html: null,
    metaTheme: null,
    toggleBtn: null,
    icon: null,
    initialized: false
};

/**
 * 初始化 DOM 缓存
 */
function initDarkModeCache() {
    if (cachedDarkModeElements.initialized) return;
    cachedDarkModeElements.html = document.documentElement;
    cachedDarkModeElements.metaTheme = document.querySelector('meta[name="theme-color"]');
    cachedDarkModeElements.toggleBtn = document.getElementById('darkModeToggle');
    cachedDarkModeElements.icon = cachedDarkModeElements.toggleBtn?.querySelector('i');
    cachedDarkModeElements.initialized = true;
}

// 主题颜色常量
const THEME_COLORS = Object.freeze({
    dark: 'rgba(38, 38, 38, 0.25)',
    light: 'rgba(255, 255, 255, 0.4)'
});

/**
 * 初始化深色模式
 */
function initDarkMode() {
    initDarkModeCache();
    
    const { html, metaTheme } = cachedDarkModeElements;
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 确定初始模式
    const isDarkMode = savedMode !== null ? savedMode === 'true' : prefersDark;
    
    // 应用模式
    html.classList.toggle('dark-mode', isDarkMode);
    html.classList.toggle('light', !isDarkMode);
    metaTheme?.setAttribute('content', isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light);

    // 监听系统深色模式变化
    window.matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
            const { html } = cachedDarkModeElements;
            html.classList.toggle('dark-mode', e.matches);
            html.classList.toggle('light', !e.matches);
            setThemeColor();
            updateDarkModeIcon();
        });
}

/**
 * 切换深色模式
 */
function toggleDarkMode() {
    initDarkModeCache();
    
    const { html, icon } = cachedDarkModeElements;
    const isDarkMode = !html.classList.contains('dark-mode');
    
    html.classList.toggle('dark-mode', isDarkMode);
    html.classList.toggle('light', !isDarkMode);
    
    // 切换图标
    if (icon) {
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // 同步更新 footer 图标
    const footerIcon = document.getElementById('footerDarkIcon');
    if (footerIcon) {
        footerIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    localStorage.setItem('darkMode', isDarkMode);
    setThemeColor();
}

/**
 * 更新深色模式按钮图标
 */
function updateDarkModeIcon() {
    initDarkModeCache();
    
    const { html, icon } = cachedDarkModeElements;
    const isDarkMode = html.classList.contains('dark-mode');
    
    if (icon) {
        icon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    // 同步更新 footer 图标
    const footerIcon = document.getElementById('footerDarkIcon');
    if (footerIcon) {
        footerIcon.className = isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/**
 * 设置主题色
 */
function setThemeColor() {
    const { html, metaTheme } = cachedDarkModeElements;
    const isDark = html.classList.contains('dark-mode');
    metaTheme?.setAttribute('content', isDark ? THEME_COLORS.dark : THEME_COLORS.light);
}

export default {
    initDarkMode,
    toggleDarkMode,
    setThemeColor,
    updateDarkModeIcon
};