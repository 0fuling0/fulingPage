let currentCarouselIndex = 0;
let carouselImages = [];
let autoSlideInterval;
let initialLoad = true; // 标记是否为初始加载

/**
 * 初始化轮播图
 */
function initCarousel() {
    // 如果没有图片，不执行任何操作
    if (!carouselImages || carouselImages.length === 0) {
        console.warn('No carousel images available');
        return;
    }

    const carouselImg = document.querySelector('.carousel-img');
    if (!carouselImg) {
        console.warn('Carousel image element not found, waiting for homepage cards to render...');
        return;
    }
    
    // 预加载第一张图片并立即显示，无动画
    if (initialLoad) {
        const firstImg = new Image();
        firstImg.onload = function() {
            carouselImg.src = carouselImages[0];
            carouselImg.style.opacity = 1;
            initialLoad = false; // 只在首次加载时执行
            updateIndicators(0); // 更新指示器状态
        };
        firstImg.onerror = function() {
            console.error('Failed to load initial carousel image:', carouselImages[0]);
            // 如果第一张图片加载失败，尝试加载第二张
            if (carouselImages.length > 1) {
                currentCarouselIndex = 1;
                showSlide(1);
            } else {
                // 显示默认图片或错误信息
                carouselImg.alt = "图片加载失败";
                carouselImg.style.background = "#f0f0f0";
            }
            initialLoad = false;
        };
        firstImg.src = carouselImages[0];
    } else {
        // 非首次加载，正常显示当前幻灯片
        showSlide(currentCarouselIndex);
    }
    
    // 初始化轮播图指示器
    initCarouselIndicators();
    
    // 如果有多张图片，启动自动播放
    if (carouselImages.length > 1) {
        startAutoSlide();
    }
    
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        // 移除之前可能附加的事件监听器，避免重复
        carouselContainer.removeEventListener('mouseenter', stopAutoSlide);
        carouselContainer.removeEventListener('mouseleave', startAutoSlide);
        
        // 添加新的事件监听器
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
        
        // 触摸事件支持
        let touchStartX = 0;
        let touchEndX = 0;
        
        // 移除可能存在的触摸事件监听器
        carouselContainer.removeEventListener('touchstart', handleTouchStart);
        carouselContainer.removeEventListener('touchend', handleTouchEnd);
        
        // 定义触摸处理函数
        function handleTouchStart(e) {
            touchStartX = e.changedTouches[0].screenX;
        }
        
        function handleTouchEnd(e) {
            touchEndX = e.changedTouches[0].screenX;
            if (touchStartX - touchEndX > 50) {
                // 向左滑动，显示下一张
                nextSlide();
            } else if (touchEndX - touchStartX > 50) {
                // 向右滑动，显示上一张
                prevSlide();
            }
        }
        
        // 添加新的触摸事件监听器
        carouselContainer.addEventListener('touchstart', handleTouchStart, {passive: true});
        carouselContainer.addEventListener('touchend', handleTouchEnd, {passive: true});
    }
    
    // 确保按钮事件正确绑定
    setupButtons();
}

/**
 * 设置轮播图按钮
 */
function setupButtons() {
    // 移除可能存在的事件监听器
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    
    nextBtns.forEach(btn => {
        // 移除所有事件监听器
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // 添加新的事件监听器
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nextSlide();
        });
    });
    
    prevBtns.forEach(btn => {
        // 移除所有事件监听器
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // 添加新的事件监听器
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            prevSlide();
        });
    });
}

/**
 * 显示指定索引的幻灯片
 * @param {number} index - 幻灯片索引
 */
function showSlide(index) {
    // 边界检查
    if (!carouselImages || carouselImages.length === 0) return;
    if (index < 0) index = carouselImages.length - 1;
    if (index >= carouselImages.length) index = 0;
    
    const img = document.querySelector('.carousel-img');
    if (!img) return;
    
    currentCarouselIndex = index;
    
    // 如果是初始加载，直接设置图片，不使用动画效果
    if (initialLoad) {
        img.src = carouselImages[index];
        initialLoad = false;
        updateIndicators(index);
        return;
    }
    
    const newImg = new Image();
    newImg.onload = function() {
        img.classList.add('fade-out');
        
        setTimeout(() => {
            img.src = carouselImages[index];
            img.classList.remove('fade-out');
            img.classList.add('fade-in');
            
            setTimeout(() => {
                img.classList.remove('fade-in');
            }, 500);
        }, 300); // 缩短淡出时间以提高响应速度
    };
    
    newImg.onerror = function() {
        console.error('Failed to load carousel image:', carouselImages[index]);
        // 尝试加载下一张图片
        if (carouselImages.length > 1) {
            setTimeout(() => nextSlide(), 500);
        } else {
            img.alt = "图片加载失败";
            img.style.background = "#f0f0f0";
        }
    };
    
    newImg.src = carouselImages[index];
    updateIndicators(index);
}

/**
 * 重置轮播图状态
 */
function resetCarousel() {
    initialLoad = true;
    currentCarouselIndex = 0;
    stopAutoSlide();
    
    // 重新初始化
    setTimeout(() => {
        initCarousel();
    }, 100);
}

/**
 * 切换到下一个幻灯片
 */
function nextSlide() {
    if (!carouselImages || carouselImages.length <= 1) return;
    
    currentCarouselIndex = (currentCarouselIndex + 1) % carouselImages.length;
    showSlide(currentCarouselIndex);
}

/**
 * 切换到上一个幻灯片
 */
function prevSlide() {
    if (!carouselImages || carouselImages.length <= 1) return;
    
    currentCarouselIndex = (currentCarouselIndex - 1 + carouselImages.length) % carouselImages.length;
    showSlide(currentCarouselIndex);
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
            currentCarouselIndex = index;
            showSlide(index);
            
            // 点击指示器后重置自动播放
            stopAutoSlide();
            startAutoSlide();
        });
        
        indicators.appendChild(dot);
    });
    
    container.appendChild(indicators);
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

/**
 * 跳转到指定索引的幻灯片
 * @param {number} index - 目标幻灯片索引
 */
function goToSlide(index) {
    if (index >= 0 && index < carouselImages.length) {
        currentCarouselIndex = index;
        showSlide(index);
    }
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
