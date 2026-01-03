import backgroundImage from './js/backgroundImage.js';
import clock from './js/clock.js';
import carousel from './js/carousel.js';
import darkMode from './js/darkMode.js';
import hitokoto from './js/hitokoto.js';
import navigation from './js/navigation.js';
import search from './js/search.js';
import siteInfo from './js/siteInfo.js';
import utils from './js/utils.js';
import headerFooter from './js/headerFooter.js';

// 将模块暴露给全局，用于HTML内联事件调用
utils.exposeModuleToGlobal('carouselModule', {
    nextSlide: carousel.nextSlide,
    prevSlide: carousel.prevSlide,
    goToSlide: carousel.goToSlide
});
utils.exposeModuleToGlobal('darkModeModule', darkMode);
utils.exposeModuleToGlobal('navigationModule', {
    ...navigation,
    showSection: navigation.showSection
});
utils.exposeModuleToGlobal('searchModule', search);
utils.exposeModuleToGlobal('headerFooterModule', headerFooter);

// 注册全局事件处理程序
utils.registerGlobalEventHandlers({
    // 搜索相关
    toggleOptions: search.toggleOptions,
    selectOption: search.selectOption,
    search: search.search,
    
    // 导航相关
    startTimer: navigation.startTimer,
    clearTimer: navigation.clearTimer,
    switchToCard: navigation.switchToCard,
    showSection: (sectionId) => {
        navigation.showSection(sectionId);
        headerFooter.updateNavActiveState(sectionId);
    },
    
    // 轮播图相关
    nextSlide: carousel.nextSlide,
    prevSlide: carousel.prevSlide,
    
    // 深色模式
    toggleDarkMode: darkMode.toggleDarkMode,
    
    // Header/Footer 相关
    scrollToTop: headerFooter.scrollToTop,
    scrollToBottom: headerFooter.scrollToBottom
});

// 初始化深色模式
darkMode.initDarkMode();

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 更新深色模式图标
    darkMode.updateDarkModeIcon();
    // 处理加载动画
    utils.handleLoadingAnimation();
    
    // 初始化时钟
    clock.initClock();
    
    // 加载配置文件
    utils.loadConfigs().then(([config, navData]) => {
        if (!config || !navData) {
            console.error('Failed to load configuration');
            return;
        }
        
        // 保存配置到全局变量
        window.siteConfig = config;
        
        // 初始化站点配置
        siteInfo.initSiteWithConfig(config);
        
        // 初始化 Header/Footer 功能
        headerFooter.init(config);
        
        // 初始化网站运行时间
        if (config.siteInfo && config.siteInfo.startDate) {
            clock.initRuntimeInfo(config);
        }
        
        // 初始化背景图片轮播
        backgroundImage.init(config.backgroundImages);
        
        // 初始化轮播图
        if (config.carousel && Array.isArray(config.carousel.images)) {
            carousel.setCarouselImages(config.carousel.images);
            carousel.setAutoSlideInterval(config.carousel.interval || 10000);
            // 轮播图会在渲染卡片时初始化
        }
        
        // 渲染主页卡片
        if (config.homepage && config.homepage.cards) {
            siteInfo.renderHomepageCards(config.homepage.cards);
        } else {
            console.error('Homepage cards configuration not found');
        }
        
        // 初始化一言
        hitokoto.initHitokoto();
        
        // 初始化导航卡片
        if (navData.cards) {
            navigation.renderCards(navData.cards);
        }
        
        // 初始化导航
        navigation.initNavigation();
    });
    
    // 初始化搜索功能
    search.initSearch();
    
    // 初始化网格项点击事件
    utils.initGridItemEvents();
});