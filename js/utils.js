/**
 * 工具函数模块 - 性能优化版
 */

/**
 * 处理页面加载动画
 */
function handleLoadingAnimation() {
    // 使用 requestIdleCallback 在空闲时移除
    const remove = () => {
        const el = document.querySelector('.loading-container');
        if (el) {
            el.classList.add('fade-out');
            setTimeout(() => el.remove(), 500);
        }
    };
    
    if ('requestIdleCallback' in window) {
        setTimeout(() => requestIdleCallback(remove), 800);
    } else {
        setTimeout(remove, 1000);
    }
}

/**
 * 加载配置文件（并行请求）
 */
function loadConfigs() {
    return Promise.all([
        fetch('config.json').then(r => r.json()),
        fetch('nav.json').then(r => r.json())
    ]).catch(e => {
        console.error('Config load error:', e);
        return [null, null];
    });
}

/**
 * 初始化网格项点击事件（使用事件委托）
 */
function initGridItemEvents() {
    // 使用事件委托而非为每个元素绑定
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.grid-item');
        if (item) {
            e.preventDefault();
            const url = item.dataset.url;
            if (url) window.open(url, '_blank');
        }
    }, { passive: false });
}

/**
 * 注册全局事件处理函数
 */
function registerGlobalEventHandlers(handlers) {
    Object.assign(window, handlers);
}

/**
 * 将模块导出为全局可访问
 */
function exposeModuleToGlobal(name, module) {
    window[name] = module;
}

/**
 * 防抖函数
 */
function debounce(fn, delay = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * 节流函数
 */
function throttle(fn, limit = 16) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            fn(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export default {
    handleLoadingAnimation,
    loadConfigs,
    initGridItemEvents,
    registerGlobalEventHandlers,
    exposeModuleToGlobal,
    debounce,
    throttle
};
