let currentCarouselIndex = 0;
let carouselImages = [];
let autoSlideInterval;
let initialLoad = true;

// DOM 元素缓存
let cachedCarouselElements = {
    img: null,
    container: null,
    indicators: null,
    initialized: false
};

// 图片预加载缓存
const imageCache = new Map();

// 切换方向：1 = 向前（下一张），-1 = 向后（上一张），0 = 自动/直接
let slideDirection = 0;

// 是否正在切换中（防止动画冲突）
let isTransitioning = false;

/**
 * 初始化 DOM 缓存
 */
function initCarouselCache() {
    if (cachedCarouselElements.initialized) return;
    cachedCarouselElements.img = document.querySelector('.carousel-img');
    cachedCarouselElements.container = document.querySelector('.carousel-container');
    cachedCarouselElements.indicators = document.querySelector('.carousel-indicators');
    cachedCarouselElements.initialized = true;
}

/**
 * 预加载图片
 * @param {string} src - 图片URL
 * @returns {Promise<HTMLImageElement>}
 */
function preloadImage(src) {
    if (imageCache.has(src)) {
        return Promise.resolve(imageCache.get(src));
    }
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            imageCache.set(src, img);
            resolve(img);
        };
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * 预加载相邻图片
 */
function preloadAdjacentImages() {
    if (carouselImages.length <= 1) return;
    
    const nextIndex = (currentCarouselIndex + 1) % carouselImages.length;
    const prevIndex = (currentCarouselIndex - 1 + carouselImages.length) % carouselImages.length;
    
    // 异步预加载，不阻塞主线程
    preloadImage(carouselImages[nextIndex]).catch(() => {});
    preloadImage(carouselImages[prevIndex]).catch(() => {});
}

/**
 * 清除所有动画类
 * @param {HTMLElement} img - 图片元素
 */
function clearAnimationClasses(img) {
    img.classList.remove(
        'fade-out', 'fade-in',
        'slide-out-left', 'slide-out-right',
        'slide-in-left', 'slide-in-right'
    );
}

/**
 * 初始化轮播图
 */
function initCarousel() {
    if (!carouselImages || carouselImages.length === 0) {
        console.warn('No carousel images available');
        return;
    }

    initCarouselCache();
    
    const carouselImg = cachedCarouselElements.img;
    if (!carouselImg) {
        console.warn('Carousel image element not found');
        return;
    }
    
    // 预加载第一张图片并立即显示
    if (initialLoad) {
        preloadImage(carouselImages[0])
            .then(() => {
                carouselImg.src = carouselImages[0];
                carouselImg.style.opacity = 1;
                initialLoad = false;
                updateIndicators(0);
                // 预加载相邻图片
                preloadAdjacentImages();
            })
            .catch(() => {
                console.error('Failed to load initial carousel image:', carouselImages[0]);
                if (carouselImages.length > 1) {
                    currentCarouselIndex = 1;
                    showSlide(1);
                } else {
                    carouselImg.alt = "图片加载失败";
                    carouselImg.style.background = "#f0f0f0";
                }
                initialLoad = false;
            });
    } else {
        showSlide(currentCarouselIndex);
    }
    
    initCarouselIndicators();
    
    if (carouselImages.length > 1) {
        startAutoSlide();
    }
    
    setupCarouselEvents();
    setupButtons();
}

/**
 * 设置轮播图事件（使用事件委托）
 */
function setupCarouselEvents() {
    const container = cachedCarouselElements.container;
    if (!container || container.dataset.eventsAttached) return;
    
    let touchStartX = 0;
    
    // 鼠标悬停控制自动播放
    container.addEventListener('mouseenter', stopAutoSlide, { passive: true });
    container.addEventListener('mouseleave', startAutoSlide, { passive: true });
    
    // 触摸滑动支持
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextSlide() : prevSlide();
        }
    }, { passive: true });
    
    container.dataset.eventsAttached = 'true';
}

/**
 * 设置轮播图按钮（使用事件委托）
 */
function setupButtons() {
    // 在 carousel-card 上设置事件委托
    const carouselCard = document.querySelector('.carousel-card');
    if (!carouselCard || carouselCard.dataset.buttonsAttached) return;
    
    carouselCard.addEventListener('click', (e) => {
        const target = e.target.closest('.carousel-btn');
        if (!target) return;
        
        e.stopPropagation();
        target.classList.contains('next-btn') ? nextSlide() : prevSlide();
    });
    
    carouselCard.dataset.buttonsAttached = 'true';
}

/**
 * 显示指定索引的幻灯片
 * @param {number} index - 幻灯片索引
 * @param {number} direction - 切换方向：1 = 下一张，-1 = 上一张，0 = 自动
 */
function showSlide(index, direction = 0) {
    if (!carouselImages || carouselImages.length === 0) return;
    if (isTransitioning) return; // 防止动画冲突
    
    // 边界处理
    index = ((index % carouselImages.length) + carouselImages.length) % carouselImages.length;
    
    const img = cachedCarouselElements.img || document.querySelector('.carousel-img');
    if (!img) return;
    
    const oldIndex = currentCarouselIndex;
    currentCarouselIndex = index;
    
    // 初始加载不使用动画
    if (initialLoad) {
        img.src = carouselImages[index];
        initialLoad = false;
        updateIndicators(index);
        preloadAdjacentImages();
        return;
    }
    
    // 如果索引相同，不执行动画
    if (oldIndex === index) return;
    
    isTransitioning = true;
    
    // 确定动画方向
    const actualDirection = direction || (index > oldIndex ? 1 : -1);
    
    // 选择淡出类
    const outClass = actualDirection > 0 ? 'slide-out-left' : 'slide-out-right';
    const inClass = actualDirection > 0 ? 'slide-in-right' : 'slide-in-left';
    
    // 使用预加载的图片
    preloadImage(carouselImages[index])
        .then(() => {
            // 清除旧动画类并添加淡出
            clearAnimationClasses(img);
            img.classList.add(outClass);
            
            setTimeout(() => {
                img.src = carouselImages[index];
                clearAnimationClasses(img);
                img.classList.add(inClass);
                
                // 动画结束后清理
                setTimeout(() => {
                    clearAnimationClasses(img);
                    isTransitioning = false;
                    preloadAdjacentImages();
                }, 500);
            }, 300);
        })
        .catch(() => {
            console.error('Failed to load carousel image:', carouselImages[index]);
            isTransitioning = false;
            if (carouselImages.length > 1) {
                setTimeout(() => nextSlide(), 500);
            }
        });
    
    updateIndicators(index);
}

/**
 * 重置轮播图状态
 */
function resetCarousel() {
    initialLoad = true;
    currentCarouselIndex = 0;
    isTransitioning = false;
    cachedCarouselElements.initialized = false;
    stopAutoSlide();
    
    setTimeout(initCarousel, 100);
}

/**
 * 切换到下一个幻灯片
 */
function nextSlide() {
    if (!carouselImages || carouselImages.length <= 1) return;
    if (isTransitioning) return;
    
    const nextIndex = (currentCarouselIndex + 1) % carouselImages.length;
    showSlide(nextIndex, 1);
}

/**
 * 切换到上一个幻灯片
 */
function prevSlide() {
    if (!carouselImages || carouselImages.length <= 1) return;
    if (isTransitioning) return;
    
    const prevIndex = (currentCarouselIndex - 1 + carouselImages.length) % carouselImages.length;
    showSlide(prevIndex, -1);
}

/**
 * 开始自动播放幻灯片
 */
function startAutoSlide() {
    if (!carouselImages || carouselImages.length <= 1) return;
    
    stopAutoSlide(); // 确保没有多个定时器运行
    autoSlideInterval = setInterval(nextSlide, 10000);
}

/**
 * 停止自动播放幻灯片
 */
function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

/**
 * 更新指示器状态
 * @param {number} index - 当前活动的指示器索引
 */
function updateIndicators(index) {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

/**
 * 初始化轮播图指示器
 */
function initCarouselIndicators() {
    if (!carouselImages || carouselImages.length <= 1) return;
    
    const container = document.querySelector('.carousel-container');
    if (!container) return;
    
    // 清除旧的指示器
    const oldIndicators = container.querySelector('.carousel-indicators');
    if (oldIndicators) {
        oldIndicators.remove();
    }
    
    // 创建新的指示器容器
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';
    
    // 为每张图片创建一个指示器
    carouselImages.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot';
        
        // 设置当前幻灯片指示器为激活状态
        if (index === currentCarouselIndex) {
            dot.classList.add('active');
        }
        
        // 添加点击事件
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isTransitioning || index === currentCarouselIndex) return;
            
            // 根据索引判断方向
            const direction = index > currentCarouselIndex ? 1 : -1;
            showSlide(index, direction);
            
            // 点击指示器后重置自动播放
            stopAutoSlide();
            startAutoSlide();
        });
        
        indicators.appendChild(dot);
    });
    
    container.appendChild(indicators);
}

/**
 * 跳转到指定幻灯片
 * @param {number} index - 目标幻灯片索引
 */
function goToSlide(index) {
    if (isTransitioning || index === currentCarouselIndex) return;
    if (index < 0 || index >= carouselImages.length) return;
    
    const direction = index > currentCarouselIndex ? 1 : -1;
    showSlide(index, direction);
    
    stopAutoSlide();
    startAutoSlide();
}

/**
 * 设置轮播图片数组
 * @param {Array} images - 图片URL数组
 */
function setCarouselImages(images) {
    if (!images || !Array.isArray(images)) {
        console.error('Invalid carousel images array');
        carouselImages = [];
        return;
    }
    
    // 重置状态
    initialLoad = true;
    currentCarouselIndex = 0;
    carouselImages = images;
    
    // 预加载所有图片
    if (images.length > 0) {
        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
}

/**
 * 设置自动轮播间隔
 * @param {number} interval - 间隔时间（毫秒）
 */
function setAutoSlideInterval(interval) {
    if (interval && typeof interval === 'number' && interval > 0) {
        stopAutoSlide();
        if (carouselImages.length > 1) {
            autoSlideInterval = setInterval(nextSlide, interval);
        }
    }
}

/**
 * 获取当前显示的幻灯片索引
 * @returns {number} 当前幻灯片索引
 */
function getCurrentIndex() {
    return currentCarouselIndex;
}

/**
 * 获取轮播图片数量
 * @returns {number} 轮播图片数量
 */
function getImageCount() {
    return carouselImages ? carouselImages.length : 0;
}

export default {
    initCarousel,
    nextSlide,
    prevSlide,
    startAutoSlide,
    stopAutoSlide,
    setCarouselImages,
    setAutoSlideInterval,
    getCurrentIndex,
    getImageCount,
    goToSlide,
    resetCarousel,
    setupButtons
};