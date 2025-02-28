let timer;
let currentCardNumber = 1;

/**
 * 初始化导航功能
 */
function initNavigation() {
    // 初始化当前卡片
    document.querySelector('.navButton[data-card="1"]')?.classList.add('current');
    currentCardNumber = 1;
    
    // 为卡片项添加点击事件
    const cardItems = document.querySelectorAll('.cardItem');
    cardItems.forEach(card => {
        card.addEventListener('click', function() {
            const cardNumber = parseInt(this.id.replace('card', ''), 10);
            switchToCard(cardNumber);
        });
    });

    // 监听URL哈希变化
    window.addEventListener('hashchange', handleHashChange);
    
    // 根据当前URL哈希初始化页面
    handleHashChange();
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
    const sectionsToHide = ['homepage', 'navpage'];
    sectionsToHide.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
            section.style.display = 'none';
        }
    });
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) {
        sectionToShow.style.display = 'block';
        updateHeaderText(sectionId);
    } else {
        console.log(`Section with id ${sectionId} not found.`);
    }
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.style.columnCount = (sectionId === 'navpage') ? '1' : '';
    }
}

/**
 * 更新标题文本
 * @param {string} sectionId - 部分ID
 */
function updateHeaderText(sectionId) {
    const headerTextElement = document.querySelector('header h1');
    if (headerTextElement) {
        switch (sectionId) {
            case 'homepage':
                headerTextElement.textContent = window.siteConfig?.header?.title || "Homepage";
                break;
            case 'navpage':
                headerTextElement.textContent = window.siteConfig?.header?.navTitle || "Navigation";
                break;
            default:
                headerTextElement.textContent = "Homepage";
                break;
        }
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
    const parentContainer = document.querySelector('.cardContainer');
    if (!parentContainer) {
        console.error('Card container not found');
        return;
    }

    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('cardItem');
        cardElement.id = card.id;
        if (card.id === 'card1') {
            cardElement.classList.add('active');
        }

        const gridContainer = document.createElement('div');
        gridContainer.classList.add('grid-container');

        card.items.forEach(item => {
            const link = document.createElement('a');
            link.href = item.url;
            link.target = '_blank';
            link.classList.add('grid-item');
            link.setAttribute('data-url', item.url);

            const img = document.createElement('img');
            img.classList.add('icon');
            img.src = item.icon;
            img.alt = 'Website Icon';

            const span = document.createElement('span');
            span.textContent = item.name;

            link.appendChild(img);
            link.appendChild(span);
            gridContainer.appendChild(link);
        });

        cardElement.appendChild(gridContainer);
        parentContainer.appendChild(cardElement);
    });

    // 为生成的卡片绑定事件
    const cardItems = document.querySelectorAll('.cardItem');
    cardItems.forEach(card => {
        card.addEventListener('click', function() {
            const cardNumber = parseInt(this.id.replace('card', ''), 10);
            switchToCard(cardNumber);
        });
    });
}

/**
 * 初始化回到顶部和底部按钮
 */
function initScrollButtons() {
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', function() {
            scrollToPosition(0, 500);
        });
    }
    
    const backToBottomBtn = document.getElementById('backToBottom');
    if (backToBottomBtn) {
        backToBottomBtn.addEventListener('click', function() {
            const documentHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            const windowHeight = window.innerHeight;
            const targetPosition = documentHeight - windowHeight;
            scrollToPosition(targetPosition, 700);
        });
    }
}

/**
 * 滚动到指定位置
 * @param {number} target - 目标位置
 * @param {number} duration - 动画持续时间
 */
function scrollToPosition(target, duration) {
    const start = window.scrollY;
    const distance = target - start;
    const startTime = performance.now();
    
    function scroll() {
        const currentTime = performance.now();
        const timeElapsed = currentTime - startTime;
        const run = easeInOutQuad(timeElapsed, start, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) {
            requestAnimationFrame(scroll);
        }
    }
    
    requestAnimationFrame(scroll);
}

/**
 * 缓动函数
 */
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}

export default {
    initNavigation,
    renderCards,
    initScrollButtons,
    showSection,
    startTimer,
    clearTimer,
    switchToCard
};
