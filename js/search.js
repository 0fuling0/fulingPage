/**
 * 初始化搜索功能
 */
function initSearch() {
    // 恢复上次使用的搜索引擎
    const lastSelectedEngine = localStorage.getItem('lastSelectedEngine');
    if (lastSelectedEngine) {
        const selectStyled = document.querySelector('.select-styled');
        if (selectStyled) {
            selectStyled.textContent = lastSelectedEngine;
        }
    }

    // 为搜索框添加回车搜索事件
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                search();
            }
        });
    }
}

/**
 * 执行搜索
 */
function search() {
    const selectedEngine = document.querySelector('.select-styled').textContent;
    const searchTerm = document.querySelector('.search-input').value;
    const searchURLs = {
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
    };

    if (!searchTerm.trim()) return;

    const searchURL = searchURLs[selectedEngine] + encodeURIComponent(searchTerm);
    window.open(searchURL, '_blank');

    localStorage.setItem('lastSelectedEngine', selectedEngine);
}

/**
 * 切换选项显示
 */
function toggleOptions() {
    const options = document.getElementById('searchOptions');
    if (options) {
        options.style.display = options.style.display === 'grid' ? 'none' : 'grid';
    }
}

/**
 * 选择搜索引擎选项
 */
function selectOption(option) {
    const selectStyled = document.querySelector('.select-styled');
    if (selectStyled) {
        selectStyled.textContent = option;
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
