// 搜索引擎 URL 映射（静态，只创建一次）
const SEARCH_URLS = Object.freeze({
    Google: 'https://www.google.com/search?q=',
    Bing: 'https://www.bing.com/search?q=',
    Yahoo: 'https://search.yahoo.com/search?p=',
    DuckDuckGo: 'https://duckduckgo.com/?q=',
    Baidu: 'https://www.baidu.com/s?wd=',
    Yandex: 'https://yandex.com/search/?text=',
    Ask: 'https://www.ask.com/web?q=',
    AOL: 'https://search.aol.com/aol/search?q=',
    WolframAlpha: 'https://www.wolframalpha.com/input/?i=',
    Dogpile: 'https://www.dogpile.com/search/web?q='
});

// DOM 缓存
let cachedSearchElements = {
    input: null,
    selectStyled: null,
    options: null,
    initialized: false
};

/**
 * 初始化搜索功能
 */
function initSearch() {
    // 初始化 DOM 缓存
    cachedSearchElements.input = document.querySelector('.search-input');
    cachedSearchElements.selectStyled = document.querySelector('.select-styled');
    cachedSearchElements.options = document.getElementById('searchOptions');
    cachedSearchElements.initialized = true;
    
    // 恢复上次使用的搜索引擎
    const lastEngine = localStorage.getItem('lastSelectedEngine');
    if (lastEngine && cachedSearchElements.selectStyled) {
        cachedSearchElements.selectStyled.textContent = lastEngine;
    }

    // 为搜索框添加回车搜索事件
    cachedSearchElements.input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') search();
    });
}

/**
 * 执行搜索
 */
function search() {
    const selectStyled = cachedSearchElements.selectStyled;
    const searchInput = cachedSearchElements.input;
    
    if (!selectStyled || !searchInput) return;
    
    const engine = selectStyled.textContent;
    const term = searchInput.value.trim();
    
    if (!term) return;

    const baseUrl = SEARCH_URLS[engine];
    if (baseUrl) {
        window.open(baseUrl + encodeURIComponent(term), '_blank');
        localStorage.setItem('lastSelectedEngine', engine);
    }
}

/**
 * 切换选项显示
 */
function toggleOptions() {
    const options = cachedSearchElements.options;
    if (options) {
        options.style.display = options.style.display === 'grid' ? 'none' : 'grid';
    }
}

/**
 * 选择搜索引擎选项
 */
function selectOption(option) {
    if (cachedSearchElements.selectStyled) {
        cachedSearchElements.selectStyled.textContent = option;
    }
    toggleOptions();
    localStorage.setItem('lastSelectedEngine', option);
}

export default {
    initSearch,
    search,
    toggleOptions,
    selectOption
};