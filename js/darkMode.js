/**
 * 初始化深色模式
 */
function initDarkMode() {
    let darkMode = false;
    const html = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (localStorage.getItem('darkMode') !== null) {
        darkMode = localStorage.getItem('darkMode') === 'true';
    } else if (prefersDarkMode) {
        darkMode = true;
    }
    
    if (darkMode) {
        html.classList.add('dark-mode');
        metaTheme.setAttribute('content', 'rgba(38, 38, 38, 0.25)');
    } else {
        html.classList.add('light');
        metaTheme.setAttribute('content', 'rgba(255, 255, 255, 0.4)');
    }

    // 监听系统深色模式变化
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (e) => {
        const isDarkMode = e.matches;
        const html = document.documentElement;
        
        if (isDarkMode) {
            html.classList.remove('light');
            html.classList.add('dark-mode');
        } else {
            html.classList.remove('dark-mode');
            html.classList.add('light');
        }
        setThemeColor();
    });
}

/**
 * 切换深色模式
 */
function toggleDarkMode() {
    const html = document.documentElement;
    const isDarkMode = !html.classList.contains('dark-mode');
    
    if (isDarkMode) {
        html.classList.remove('light');
        html.classList.add('dark-mode');
    } else {
        html.classList.remove('dark-mode');
        html.classList.add('light');
    }
    
    localStorage.setItem('darkMode', isDarkMode);
    setThemeColor();
}

/**
 * 设置主题色
 */
function setThemeColor() {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (document.documentElement.classList.contains('dark-mode')) {
        metaTheme.setAttribute('content', 'rgba(38, 38, 38, 0.25)');
    } else {
        metaTheme.setAttribute('content', 'rgba(255, 255, 255, 0.4)');
    }
}

export default {
    initDarkMode,
    toggleDarkMode,
    setThemeColor
};
