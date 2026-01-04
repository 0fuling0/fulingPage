/**
 * 背景图片轮播模块
 * 使用交叉淡入淡出实现无缝过渡
 */

// 状态管理
const state = {
    images: [],
    currentIndex: 0,
    isTransitioning: false,
    timer: null,
    interval: 30000
};

// 预加载缓存
const preloadCache = new Set();

// DOM 元素
let container = null;
let bottomLayer = null;  // 底层（新图片先放这里）
let topLayer = null;     // 顶层（当前显示的图片）

/**
 * 创建背景层元素
 */
function createBackgroundLayers() {
    if (container) return;
    
    container = document.createElement('div');
    container.id = 'bg-container';
    container.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: -10;
        overflow: hidden;
        pointer-events: none;
        background: #1a1a2e;
    `;
    
    // 底层 - 新图片先放这里，始终可见
    bottomLayer = document.createElement('div');
    bottomLayer.className = 'bg-layer';
    bottomLayer.style.cssText = `
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 1;
    `;
    
    // 顶层 - 当前图片，淡出时显示底层
    topLayer = document.createElement('div');
    topLayer.className = 'bg-layer';
    topLayer.style.cssText = `
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 1;
        transition: opacity 1.5s ease-in-out;
        will-change: opacity;
    `;
    
    container.appendChild(bottomLayer);
    container.appendChild(topLayer);
    
    document.body.insertBefore(container, document.body.firstChild);
}

/**
 * 预加载图片
 */
function preloadImage(src) {
    if (preloadCache.has(src)) {
        return Promise.resolve(true);
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            preloadCache.add(src);
            resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = src;
    });
}

/**
 * 预加载下一张图片
 */
function preloadNext() {
    const nextIndex = (state.currentIndex + 1) % state.images.length;
    preloadImage(state.images[nextIndex]);
}

/**
 * 切换到指定索引的背景
 */
async function switchTo(index, animate = true) {
    if (state.isTransitioning || !state.images.length) return;
    
    const src = state.images[index];
    if (!src) return;
    
    state.isTransitioning = true;
    
    // 预加载图片
    const loaded = await preloadImage(src);
    if (!loaded) {
        state.isTransitioning = false;
        return;
    }
    
    if (animate) {
        // 1. 先将新图片放到底层（此时顶层遮挡，用户看不到）
        bottomLayer.style.backgroundImage = `url('${src}')`;
        
        // 强制重绘确保图片已设置
        void bottomLayer.offsetHeight;
        
        // 2. 淡出顶层，露出底层的新图片
        topLayer.style.opacity = '0';
        
        // 3. 等待过渡完成
        await new Promise(resolve => setTimeout(resolve, 1600));
        
        // 4. 将新图片也设置到顶层，然后立即恢复顶层不透明
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = `url('${src}')`;
        topLayer.style.opacity = '1';
        
        // 强制重绘后恢复过渡
        void topLayer.offsetHeight;
        topLayer.style.transition = 'opacity 1.5s ease-in-out';
        
    } else {
        // 无动画：直接设置两层
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = `url('${src}')`;
        bottomLayer.style.backgroundImage = `url('${src}')`;
        topLayer.style.opacity = '1';
        void topLayer.offsetHeight;
        topLayer.style.transition = 'opacity 1.5s ease-in-out';
    }
    
    state.currentIndex = index;
    state.isTransitioning = false;
    
    // 预加载下一张
    preloadNext();
    
    // 保存当前索引
    try {
        localStorage.setItem('bgIndex', index);
    } catch (e) {}
}

/**
 * 切换到下一张背景
 */
function next() {
    const nextIndex = (state.currentIndex + 1) % state.images.length;
    switchTo(nextIndex, true);
}

/**
 * 切换到上一张背景
 */
function prev() {
    const prevIndex = (state.currentIndex - 1 + state.images.length) % state.images.length;
    switchTo(prevIndex, true);
}

/**
 * 启动自动轮播
 */
function startAutoPlay() {
    stopAutoPlay();
    if (state.images.length <= 1) return;
    state.timer = setInterval(next, state.interval);
}

/**
 * 停止自动轮播
 */
function stopAutoPlay() {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }
}

/**
 * 处理页面可见性变化
 */
function handleVisibilityChange() {
    if (document.hidden) {
        stopAutoPlay();
    } else {
        startAutoPlay();
    }
}

/**
 * 初始化背景轮播
 */
function init(config) {
    if (!config?.images?.length) return;
    
    state.images = config.images;
    state.interval = config.interval || 30000;
    
    try {
        const savedIndex = parseInt(localStorage.getItem('bgIndex')) || 0;
        state.currentIndex = savedIndex % state.images.length;
    } catch (e) {
        state.currentIndex = 0;
    }
    
    document.body.style.backgroundImage = 'none';
    
    createBackgroundLayers();
    switchTo(state.currentIndex, false);
    startAutoPlay();
    
    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });
}

/**
 * 销毁背景轮播
 */
function destroy() {
    stopAutoPlay();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    
    if (container) {
        container.remove();
        container = null;
        bottomLayer = null;
        topLayer = null;
    }
    
    state.images = [];
    state.currentIndex = 0;
    preloadCache.clear();
}

export default {
    init,
    destroy,
    next,
    prev,
    switchTo,
    startAutoPlay,
    stopAutoPlay
};
