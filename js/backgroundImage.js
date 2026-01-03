/**
 * 背景图片轮播模块 - 无闪烁版
 * 使用双层叠加实现平滑过渡
 */

let images = [];
let index = 0;
let timer = null;
const loaded = new Set();

// 背景层元素
let bgLayer1 = null;
let bgLayer2 = null;
let activeLayer = 1;

// 创建背景层
const createLayers = () => {
    if (bgLayer1) return;
    
    const createLayer = (zIndex) => {
        const layer = document.createElement('div');
        layer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: ${zIndex};
            transition: opacity 1.5s ease;
            pointer-events: none;
        `;
        document.body.prepend(layer);
        return layer;
    };
    
    bgLayer2 = createLayer(-2);
    bgLayer1 = createLayer(-1);
};

// 预加载图片
const preload = (src) => {
    if (loaded.has(src)) return Promise.resolve();
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => { loaded.add(src); resolve(); };
        img.onerror = resolve;
        img.src = src;
    });
};

// 显示背景（淡入淡出）
const show = async (transition = true) => {
    if (!images.length) return;
    
    createLayers();
    
    const src = images[index];
    await preload(src);
    
    const currentLayer = activeLayer === 1 ? bgLayer1 : bgLayer2;
    const nextLayer = activeLayer === 1 ? bgLayer2 : bgLayer1;
    
    // 设置新图片到下层
    nextLayer.style.backgroundImage = `url('${src}')`;
    nextLayer.style.opacity = '0';
    
    if (transition) {
        // 强制重绘
        nextLayer.offsetHeight;
        
        // 淡入新层，淡出旧层
        nextLayer.style.opacity = '1';
        currentLayer.style.opacity = '0';
        
        // 切换活动层
        activeLayer = activeLayer === 1 ? 2 : 1;
    } else {
        // 无过渡，直接显示
        nextLayer.style.transition = 'none';
        nextLayer.style.opacity = '1';
        currentLayer.style.opacity = '0';
        nextLayer.offsetHeight;
        nextLayer.style.transition = 'opacity 1.5s ease';
        activeLayer = activeLayer === 1 ? 2 : 1;
    }
    
    // 预加载下一张
    preload(images[(index + 1) % images.length]);
};

// 下一张
const next = () => {
    index = (index + 1) % images.length;
    show();
};

// 初始化
const init = (config) => {
    if (!config?.images?.length) return;
    
    images = config.images;
    index = parseInt(localStorage.getItem('bgIdx')) || 0;
    index = index % images.length;
    
    // 清除 body 背景
    document.body.style.backgroundImage = 'none';
    
    // 显示当前图片
    show(false);
    
    // 启动轮播
    if (timer) clearInterval(timer);
    timer = setInterval(next, config.interval || 30000);
    
    // 保存索引
    setInterval(() => localStorage.setItem('bgIdx', index), 5000);
};

export default { init };
