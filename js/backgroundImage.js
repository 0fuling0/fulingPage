let currentBackgroundImageIndex = 0;
let backgroundImages = [];
let backgroundImageInterval;
let isSlideShowRunning = false;
let preloadedImages = {};

/**
 * 预加载初始背景图片
 * @param {Function} callback - 图片加载完成后的回调函数
 */
function preloadInitialBackgroundImage(callback) {
    if (!window.siteConfig || !window.siteConfig.backgroundImages || !window.siteConfig.backgroundImages.images) {
        if (callback) callback();
        return;
    }
    
    const [firstImage] = window.siteConfig.backgroundImages.images;
    if (!firstImage) {
        if (callback) callback();
        return;
    }
    
    const img = new Image();
    img.onload = function() {
        document.body.style.backgroundImage = `url('${firstImage}')`;
        preloadedImages[firstImage] = img;
        if (callback) callback();
    };
    img.onerror = function() {
        console.error('Failed to load initial background image:', firstImage);
        if (callback) callback();
    };
    img.src = firstImage;
}

/**
 * 初始化背景图片
 */
function initBackgroundImage() {
    const body = document.body;
    const savedIndex = localStorage.getItem('backgroundImageIndex');
    if (savedIndex !== null) {
        currentBackgroundImageIndex = parseInt(savedIndex);
    }
    
    updateBackgroundImage();
    body.addEventListener('transitionend', function () {
        body.style.transition = '';
    });
}

/**
 * 更新背景图片并预加载下一张
 */
function updateBackgroundImage() {
    if (!backgroundImages || backgroundImages.length === 0) return;
    
    const body = document.body;
    const currentImage = backgroundImages[currentBackgroundImageIndex];
    
    // 如果当前图片已预加载，直接使用
    if (preloadedImages[currentImage]) {
        body.style.transition = 'background-image 1.5s ease';
        body.style.backgroundImage = `url('${currentImage}')`;
        localStorage.setItem('backgroundImageIndex', currentBackgroundImageIndex);
        
        // 预加载下一张图片
        const nextIndex = (currentBackgroundImageIndex + 1) % backgroundImages.length;
        preloadNextBackgroundImage(nextIndex);
    } else {
        // 否则先预加载当前图片
        const img = new Image();
        img.onload = function() {
            preloadedImages[currentImage] = img;
            body.style.transition = 'background-image 1.5s ease';
            body.style.backgroundImage = `url('${currentImage}')`;
            localStorage.setItem('backgroundImageIndex', currentBackgroundImageIndex);
            
            // 预加载下一张图片
            const nextIndex = (currentBackgroundImageIndex + 1) % backgroundImages.length;
            preloadNextBackgroundImage(nextIndex);
        };
        img.onerror = function() {
            console.error('Failed to load background image:', currentImage);
            // 失败时尝试加载下一张
            nextBackgroundImage();
        };
        img.src = currentImage;
    }
}

/**
 * 切换到下一张背景图片
 */
function nextBackgroundImage() {
    currentBackgroundImageIndex = (currentBackgroundImageIndex + 1) % backgroundImages.length;
    updateBackgroundImage();
}

/**
 * 预加载下一张背景图片
 * @param {Number} nextIndex - 下一张图片的索引
 */
function preloadNextBackgroundImage(nextIndex) {
    if (!backgroundImages || backgroundImages.length === 0 || nextIndex >= backgroundImages.length) return;
    
    const nextImage = backgroundImages[nextIndex];
    
    // 避免重复预加载
    if (!preloadedImages[nextImage]) {
        const img = new Image();
        img.onload = function() {
            preloadedImages[nextImage] = img;
        };
        img.onerror = function() {
            console.error('Failed to preload image:', nextImage);
        };
        img.src = nextImage;
    }
}

/**
 * 启动背景图片轮播
 */
function startBackgroundSlideshow() {
    if (!backgroundImages || backgroundImages.length === 0 || isSlideShowRunning) return;
    
    // 先加载初始图片，然后开始轮播
    preloadInitialBackgroundImage(() => {
        if (backgroundImageInterval) clearInterval(backgroundImageInterval);
        const interval = window.siteConfig?.backgroundImages?.interval || 30000;
        
        // 初始图片已加载，显示并准备下一张
        updateBackgroundImage();
        
        // 启动轮播
        isSlideShowRunning = true;
        backgroundImageInterval = setInterval(() => {
            nextBackgroundImage();
        }, interval);
    });
}

/**
 * 设置背景图片数组
 * @param {Array} images - 背景图片URL数组
 */
function setBackgroundImages(images) {
    backgroundImages = images;
    // 重置预加载图片缓存
    preloadedImages = {};
}

// 导出模块函数
export default {
    preloadInitialBackgroundImage,
    initBackgroundImage,
    startBackgroundSlideshow,
    nextBackgroundImage,
    setBackgroundImages
};
