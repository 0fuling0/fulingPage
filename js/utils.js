/**
 * 为全局函数提供的桥接对象
 * 用于存储需要从window全局调用的模块化函数
 */
window.moduleExports = {};

/**
 * 处理页面加载动画
 */
function handleLoadingAnimation() {
    setTimeout(() => {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('fade-out');
            setTimeout(() => {
                loadingContainer.remove();
            }, 500);
        }
    }, 1000);
}

/**
 * 加载配置文件
 * @returns {Promise} 包含配置数据的Promise
 */
function loadConfigs() {
    return Promise.all([
        fetch('config.json').then(response => response.json()),
        fetch('nav.json').then(response => response.json())
    ])
    .catch(error => {
        console.error('Error loading config files:', error);
        return [null, null];
    });
}

/**
 * 初始化网格项点击事件
 */
function initGridItemEvents() {
    const gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(function (item) {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            const url = item.getAttribute('data-url');
            window.open(url, '_blank');
        });
    });
}

/**
 * 为DOM元素注册全局事件处理函数
 * 解决ES模块化后，HTML内联事件无法直接调用模块函数的问题
 * @param {Object} handlers - 处理函数映射
 */
function registerGlobalEventHandlers(handlers) {
    // 为window对象添加事件处理函数
    Object.entries(handlers).forEach(([name, handler]) => {
        window[name] = handler;
    });
}

/**
 * 将模块导出为全局可访问
 * @param {string} name - 模块名称
 * @param {Object} module - 模块对象
 */
function exposeModuleToGlobal(name, module) {
    window[name] = module;
}

export default {
    handleLoadingAnimation,
    loadConfigs,
    initGridItemEvents,
    registerGlobalEventHandlers,
    exposeModuleToGlobal
};
