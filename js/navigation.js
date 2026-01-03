let timer;
let currentCardNumber = 1;

// 缓存 DOM 元素引用
let cachedElements = {
    main: null,
    headerH1: null,
    cardContainer: null
};

/**
 * 初始化 DOM 缓存
 */
function initDOMCache() {
    cachedElements.main = document.querySelector('main');
    cachedElements.headerH1 = document.querySelector('header h1');
    cachedElements.cardContainer = document.querySelector('.cardContainer');
}

/**
 * 初始化导航功能
 */
function initNavigation() {
    // 初始化 DOM 缓存
    initDOMCache();
    
    // 初始化当前卡片
    document.querySelector('.navButton[data-card="1"]')?.classList.add('current');
    currentCardNumber = 1;
    
    // 使用事件委托处理卡片点击
    const cardContainer = cachedElements.cardContainer;
    if (cardContainer) {
        cardContainer.addEventListener('click', handleCardClick);
    }

    // 监听URL哈希变化
    window.addEventListener('hashchange', handleHashChange, { passive: true });
    
    // 根据当前URL哈希初始化页面
    handleHashChange();
}

/**
 * 事件委托处理卡片点击
 */
function handleCardClick(e) {
    const cardItem = e.target.closest('.cardItem');
    if (cardItem) {
        const cardNumber = parseInt(cardItem.id.replace('card', ''), 10);
        if (!isNaN(cardNumber)) {
            switchToCard(cardNumber);
        }
    }
}

/**
 * 处理URL哈希变化
 */
function handleHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash === 'nav' || hash === 'home') {
        showSection(hash + 'page');
    } else {
        showSection('homepage');
    }
}

/**
 * 显示指定部分
 * @param {string} sectionId - 部分ID
 */
function showSection(sectionId) {
    // 使用 CSS class 切换而非直接操作 style
    const homepage = document.getElementById('homepage');
    const navpage = document.getElementById('navpage');
    
    if (homepage) homepage.style.display = sectionId === 'homepage' ? 'block' : 'none';
    if (navpage) navpage.style.display = sectionId === 'navpage' ? 'block' : 'none';
    
    updateHeaderText(sectionId);
    
    if (cachedElements.main) {
        cachedElements.main.style.columnCount = (sectionId === 'navpage') ? '1' : '';
    }
}

/**
 * 更新标题文本
 * @param {string} sectionId - 部分ID
 */
function updateHeaderText(sectionId) {
    if (cachedElements.headerH1) {
        const config = window.siteConfig?.header;
        cachedElements.headerH1.textContent = sectionId === 'navpage' 
            ? (config?.navTitle || 'Navigation')
            : (config?.title || 'Homepage');
    }
}

/**
 * 开始定时器
 * @param {number} cardNumber - 卡片编号
 */
function startTimer(cardNumber) {
    timer = setTimeout(() => showCard(cardNumber), 500);
}

/**
 * 清除定时器
 */
function clearTimer() {
    clearTimeout(timer);
}

/**
 * 显示卡片
 * @param {number} cardNumber - 卡片编号
 */
function showCard(cardNumber) {
    const cards = document.querySelectorAll('.cardItem');
    cards.forEach(card => card.classList.remove('active', 'current'));
    const selectedCard = document.getElementById(`card${cardNumber}`);
    if (selectedCard) {
        selectedCard.classList.add('active', 'current');
    }

    const oldNavButton = document.querySelector(`.navButton[data-card="${currentCardNumber}"]`);
    if (oldNavButton) {
        oldNavButton.classList.remove('current');
    }
    
    const newNavButton = document.querySelector(`.navButton[data-card="${cardNumber}"]`);
    if (newNavButton) {
        newNavButton.classList.add('current');
    }
    
    currentCardNumber = cardNumber;
}

/**
 * 切换到指定卡片
 * @param {number} newCardNumber - 新卡片编号
 */
function switchToCard(newCardNumber) {
    clearTimer();
    showCard(newCardNumber);
}

/**
 * 渲染导航卡片
 * @param {Array} cards - 卡片数据数组
 */
function renderCards(cards) {
    const parentContainer = cachedElements.cardContainer || document.querySelector('.cardContainer');
    if (!parentContainer) {
        console.error('Card container not found');
        return;
    }

    // 使用 DocumentFragment 批量插入 DOM
    const fragment = document.createDocumentFragment();

    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = card.id === 'card1' ? 'cardItem active' : 'cardItem';
        cardElement.id = card.id;

        const gridContainer = document.createElement('div');
        gridContainer.className = 'grid-container';

        // 批量创建链接
        card.items.forEach(item => {
            const link = document.createElement('a');
            link.href = item.url;
            link.target = '_blank';
            link.className = 'grid-item';
            link.dataset.url = item.url;
            link.innerHTML = `<img class="icon" src="${item.icon}" alt="" loading="lazy"><span>${item.name}</span>`;
            gridContainer.appendChild(link);
        });

        cardElement.appendChild(gridContainer);
        fragment.appendChild(cardElement);
    });

    parentContainer.appendChild(fragment);
    
    // 事件委托已在 initNavigation 中设置，无需重复绑定
}

/**
 * 滚动到指定位置
 */
function scrollToPosition(target) {
    window.scrollTo({ top: target, behavior: 'smooth' });
}

/**
 * 滚动到顶部
 */
function scrollToTop() {
    scrollToPosition(0);
}

/**
 * 滚动到底部
 */
function scrollToBottom() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollToPosition(maxScroll);
}

export default {
    initNavigation,
    renderCards,
    showSection,
    startTimer,
    clearTimer,
    switchToCard,
    scrollToTop,
    scrollToBottom
};
