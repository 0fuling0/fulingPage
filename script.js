let currentBackgroundImageIndex = 0;
let currentCarouselIndex = 0;

let backgroundImages = [];
let carouselImages = [];

let autoSlideInterval;
let backgroundImageInterval;

(function() {
    let darkMode = false;
    const html = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (localStorage.getItem('darkMode') !== null) {
        darkMode = localStorage.getItem('darkMode') === 'true';
    } else if (prefersDarkMode) {
        darkMode = true;
    }
    
    if (darkMode) {
        html.classList.add('dark-mode');
        metaTheme.setAttribute('content', 'rgba(38, 38, 38, 0.25)');
    } else {
        html.classList.add('light');
        metaTheme.setAttribute('content', 'rgba(255, 255, 255, 0.4)');
    }
})();

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        const loadingContainer = document.querySelector('.loading-container');
        if (loadingContainer) {
            loadingContainer.classList.add('fade-out');
            setTimeout(() => {
                loadingContainer.remove();
            }, 500);
        }
    }, 1000);

    updateClock();
    
    fetch('config.json')
        .then(response => response.json())
        .then(config => {
            window.siteConfig = config;
            
            if (config.backgroundImages && Array.isArray(config.backgroundImages.images)) {
                backgroundImages = config.backgroundImages.images;
            }
            initBackgroundImage();
            startBackgroundSlideshow();
            
            if (config.carousel && Array.isArray(config.carousel.images)) {
                carouselImages = config.carousel.images;
                clearInterval(autoSlideInterval);
                autoSlideInterval = setInterval(nextSlide, config.carousel.interval || 10000);
            }
            
            initSiteWithConfig(config);
            
            if (config.homepage && config.homepage.cards) {
                renderHomepageCards(config.homepage.cards);
            } else {
                console.error('Homepage cards configuration not found');
            }
            
            initHitokoto();
            initCarousel();
        })
        .catch(error => {
            console.error('Error loading configuration:', error);
        });
});

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

function updateBackgroundImage() {
    if (!backgroundImages || backgroundImages.length === 0) return;
    
    const body = document.body;
    const currentImage = backgroundImages[currentBackgroundImageIndex];
    
    const img = new Image();
    img.onload = function() {
        body.style.transition = 'background-image 1.5s ease';
        body.style.backgroundImage = `url('${currentImage}')`;
        localStorage.setItem('backgroundImageIndex', currentBackgroundImageIndex);
        
        const nextIndex = (currentBackgroundImageIndex + 1) % backgroundImages.length;
        preloadNextBackgroundImage(nextIndex);
    };
    img.src = currentImage;
}

function nextBackgroundImage() {
    currentBackgroundImageIndex = (currentBackgroundImageIndex + 1) % backgroundImages.length;
    preloadNextBackgroundImage(updateBackgroundImage);
}

function preloadNextBackgroundImage(nextIndex) {
    if (!backgroundImages || backgroundImages.length === 0) return;
    
    const img = new Image();
    img.src = backgroundImages[nextIndex];
}

function initCarousel() {
    const carouselImg = document.querySelector('.carousel-img');
    if (!carouselImg) {
        console.warn('Carousel image element not found, waiting for homepage cards to render...');
        return;
    }
    
    showSlide(currentCarouselIndex);
    initCarouselIndicators();
    startAutoSlide();
    
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
    }
}

function showSlide(index) {
    const img = document.querySelector('.carousel-img');
    if (!img) return;
    
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
        }, 500);
    };
    newImg.src = carouselImages[index];
    
    updateIndicators(index);
}

function nextSlide() {
    currentCarouselIndex = (currentCarouselIndex + 1) % carouselImages.length;
    showSlide(currentCarouselIndex);
}

function prevSlide() {
    currentCarouselIndex = (currentCarouselIndex - 1 + carouselImages.length) % carouselImages.length;
    showSlide(currentCarouselIndex);
}

function startAutoSlide() {
    if (autoSlideInterval) clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(nextSlide, 10000);
}

function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

function toggleDarkMode() {
    const html = document.documentElement;
    const isDarkMode = !html.classList.contains('dark-mode');
    
    if (isDarkMode) {
        html.classList.remove('light');
        html.classList.add('dark-mode');
    } else {
        html.classList.remove('dark-mode');
        html.classList.add('light');
    }
    
    localStorage.setItem('darkMode', isDarkMode);
    setThemeColor();
}

const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
darkModeMediaQuery.addEventListener('change', (e) => {
    const isDarkMode = e.matches;
    const html = document.documentElement;
    
    if (isDarkMode) {
        html.classList.remove('light');
        html.classList.add('dark-mode');
    } else {
        html.classList.remove('dark-mode');
        html.classList.add('light');
    }
    setThemeColor();
});

function setThemeColor() {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (document.documentElement.classList.contains('dark-mode')) {
        metaTheme.setAttribute('content', 'rgba(38, 38, 38, 0.25)');
    } else {
        metaTheme.setAttribute('content', 'rgba(255, 255, 255, 0.4)');
    }
}

function updateClock() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const dateString = now.toLocaleDateString('zh-CN', options);
    const timeString = now.toLocaleTimeString('zh-CN', {
        hour12: false
    });
    
    document.querySelectorAll('.clock').forEach(clockElement => {
        if (!clockElement.querySelector('.clock-date')) {
            clockElement.innerHTML = `
                <div class="clock-date"></div>
                <div class="clock-time"></div>
            `;
        }
        clockElement.querySelector('.clock-date').textContent = dateString;
        clockElement.querySelector('.clock-time').textContent = timeString;
    });
}
setInterval(updateClock, 1000);

document.getElementById('backToTop').addEventListener('click', function () {
    scrollToPosition(0, 500);
});

document.getElementById('backToBottom').addEventListener('click', function () {
    const documentHeight = Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );
    const windowHeight = window.innerHeight;
    const targetPosition = documentHeight - windowHeight;
    scrollToPosition(targetPosition, 700);
});

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

function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}

let currentHitokoto = window.siteConfig?.hitokoto?.messages?.default || '你好，又见面了！';

function initHitokoto() {
    updateAllHitokotoContainers(window.siteConfig?.hitokoto?.messages?.loading || '正在加载一言...');
    getHitokoto();
    setInterval(getHitokoto, window.siteConfig?.hitokoto?.interval || 10000);
}

function updateAllHitokotoContainers(content) {
    document.querySelectorAll('.hitokoto-container').forEach(container => {
        container.textContent = content;
    });
}

function getHitokoto() {
    const url = window.siteConfig?.hitokoto?.url || 'https://international.v1.hitokoto.cn/';
    return fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Origin': window.location.origin,
            'Referer': window.location.href
        }
    })
        .then(response => {
            if (!response.ok) {
                if (url.includes('international')) {
                    const fallbackUrl = 'https://v1.hitokoto.cn/';
                    console.log('Falling back to regular API:', fallbackUrl);
                    return fetch(fallbackUrl, {
                        method: 'GET',
                        mode: 'cors',
                        headers: {
                            'Accept': 'application/json'
                        }
                    });
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const content = data.from ? 
                `『${data.hitokoto}』—— ${data.from}` : 
                data.hitokoto;
            updateAllHitokotoContainers(content);
        })
        .catch(error => {
            console.warn('Error fetching hitokoto:', error);
            updateAllHitokotoContainers(window.siteConfig?.hitokoto?.messages?.error || '获取一言失败，请稍后再试...');
        });
}

function updateRuntimeInfo(startDate) {
    const currentDate = new Date();
    const startDateObj = new Date(startDate);
    
    let years = currentDate.getFullYear() - startDateObj.getFullYear();
    let months = currentDate.getMonth() - startDateObj.getMonth();
    let days = currentDate.getDate() - startDateObj.getDate();
    
    if (days < 0) {
        months--;
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        days += previousMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    const yearString = years > 0 ? `${years} 年 ` : '';
    const monthString = months > 0 ? `${months} 月 ` : '';
    const dayString = `${days} 天`;
    
    const runtimeInfoContainer = document.getElementById('runtime-info-container');
    if (runtimeInfoContainer) {
        runtimeInfoContainer.innerHTML = `
            <strong>网站运行时间：</strong>
            ${yearString}${monthString}${dayString}
        `;
    }
}

function initRuntimeInfo(config) {
    if (config.siteInfo && config.siteInfo.startDate) {
        updateRuntimeInfo(config.siteInfo.startDate);
        setInterval(() => {
            updateRuntimeInfo(config.siteInfo.startDate);
        }, 1000);
    }
}

twikoo.init({
    envId: 'https://twikoo.fuling.me/',
    el: '#tcomment',
});

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
    mainElement.style.columnCount = (sectionId === 'navpage') ? '1' : '';
}

function updateHeaderText(sectionId) {
    const headerTextElement = document.querySelector('header h1');
    if (headerTextElement) {
        switch (sectionId) {
            case 'homepage':
                headerTextElement.textContent = "Fuling's Homepage";
                break;
            case 'navpage':
                headerTextElement.textContent = "Fuling's Navigation";
                break;
            default:
                headerTextElement.textContent = "Fuling's Homepage";
                break;
        }
    }
}

function init() {
    const hash = window.location.hash.substring(1);
    if (hash === 'nav' || hash === 'home') {
        showSection(hash + 'page');
    } else {
        showSection('homepage');
    }
}
init();
window.addEventListener('hashchange', init);

let timer;
let currentCardNumber;

function startTimer(cardNumber) {
    timer = setTimeout(() => showCard(cardNumber), 500);
}

function clearTimer() {
    clearTimeout(timer);
}

function showCard(cardNumber) {
    const cards = document.querySelectorAll('.cardItem');
    cards.forEach(card => card.classList.remove('active', 'current'));
    const selectedCard = document.getElementById(`card${cardNumber}`);
    selectedCard.classList.add('active', 'current');
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
document.querySelector('.navButton[data-card="1"]').classList.add('current');
currentCardNumber = 1;

function switchToCard(newCardNumber) {
    clearTimer();
    showCard(newCardNumber);
}
const cardItems = document.querySelectorAll('.cardItem');
cardItems.forEach(card => {
    card.addEventListener('click', function () {
        const cardNumber = parseInt(this.id.replace('card', ''), 10);
        switchToCard(cardNumber);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    var gridItems = document.querySelectorAll('.grid-item');
    gridItems.forEach(function (item) {
        item.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            var url = item.getAttribute('data-url');
            window.open(url, '_blank');
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var linkElements = document.querySelectorAll('.grid-item');
    var totalLinks = linkElements.length;
    var placeholdersNeeded = Math.max(0, 24 - totalLinks);
    for (var i = 0; i < placeholdersNeeded; i++) {
        var placeholder = document.createElement('div');
        placeholder.classList.add('grid-item', 'placeholder');
        placeholder.style.backgroundColor = 'transparent';
    }
});

function toggleOptions() {
    var options = document.getElementById('searchOptions');
    options.style.display = options.style.display === 'grid' ? 'none' : 'grid';
}

function selectOption(option) {
    document.querySelector('.select-styled').textContent = option;
    toggleOptions();
    localStorage.setItem('lastSelectedEngine', option);
}

function search() {
    var selectedEngine = document.querySelector('.select-styled').textContent;
    var searchTerm = document.querySelector('.search-input').value;
    var searchURLs = {
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
    var searchURL = searchURLs[selectedEngine] + encodeURIComponent(searchTerm);
    window.open(searchURL, '_blank');

    localStorage.setItem('lastSelectedEngine', selectedEngine);
}

document.addEventListener('DOMContentLoaded', function () {
    var lastSelectedEngine = localStorage.getItem('lastSelectedEngine');
    if (lastSelectedEngine) {
        document.querySelector('.select-styled').textContent = lastSelectedEngine;
    }
});

document.querySelector('.search-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        search();
    }
});

fetch('config.json')
    .then(response => response.json())
    .then(config => {
        initSiteWithConfig(config);
    })
    .catch(error => {
        console.error('Error loading config:', error);
    });

function initSiteWithConfig(config) {
    if (!config) {
        console.error('Configuration not loaded');
        return;
    }

    try {
        document.addEventListener('DOMContentLoaded', () => {
            if (config.siteInfo) {
                document.title = config.siteInfo.title;
                const mottoElement = document.querySelector('.motto');
                if (mottoElement) {
                    mottoElement.textContent = config.siteInfo.motto;
                }
                
                const profileImg = document.querySelector('.profile img');
                const profileName = document.querySelector('.profile-info h2');
                const profileNickname = document.querySelector('.profile-info p');
                
                if (profileImg) profileImg.src = config.siteInfo.avatar;
                if (profileName) profileName.textContent = config.siteInfo.profile.name;
                if (profileNickname) profileNickname.textContent = config.siteInfo.profile.nickname;
            }
            
            if (config.backgroundImages) {
                backgroundImages = config.backgroundImages.images;
                clearInterval(backgroundImageInterval);
                backgroundImageInterval = setInterval(nextBackgroundImage, config.backgroundImages.interval);
            }
            
            if (config.carousel) {
                carouselImages = config.carousel.images;
                clearInterval(autoSlideInterval);
                autoSlideInterval = setInterval(nextSlide, config.carousel.interval);
            }
            
            if (config.music && config.music.type === 'meting') {
                const musicContainer = document.querySelector('#aplayer');
                if (musicContainer) {
                    musicContainer.innerHTML = '';
                    const metingJs = document.createElement('meting-js');
                    Object.entries(config.music.settings).forEach(([key, value]) => {
                        metingJs.setAttribute(key, value);
                    });
                    musicContainer.appendChild(metingJs);
                }
            }
            
            if (config.comments && config.comments.system === 'twikoo') {
                twikoo.init(config.comments.settings);
            }
            
            if (config.siteInfo && config.siteInfo.startDate) {
                const startDate = new Date(config.siteInfo.startDate);
                updateRuntimeInfo(startDate);
            }
            
            if (config.projects) {
                const projectList = document.querySelector('.project-list');
                if (projectList) {
                    renderProjects(config.projects);
                }
            }

            if (config.homepage && config.homepage.cards) {
                renderHomepageCards(config.homepage.cards);
            }

            initRuntimeInfo(config);
        });

    } catch (error) {
        console.error('Error initializing site with config:', error);
    }
    if (config && config.siteInfo) {
        document.title = config.siteInfo.title || document.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && config.siteInfo.description) {
            metaDesc.setAttribute('content', config.siteInfo.description);
        }
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
            headerTitle.textContent = config.header?.title || config.siteInfo.title;
        }
        const mottoEl = document.querySelector('.motto');
        if (mottoEl && config.siteInfo.motto) {
            mottoEl.textContent = config.siteInfo.motto;
        }
    }
    if (config && config.header && config.header.links) {
        const linksContainer = document.getElementById('headerLinks');
        if (linksContainer) {
            linksContainer.innerHTML = '';
            config.header.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                if (link.icon) {
                    const i = document.createElement('i');
                    i.className = link.icon;
                    a.appendChild(i);
                    a.appendChild(document.createTextNode(link.text));
                } else {
                    a.textContent = link.text;
                }
                if (link.onclick) a.setAttribute('onclick', link.onclick);
                linksContainer.appendChild(a);
            });
        }
    }
    if (config && config.footer) {
        const footerP = document.querySelector('footer p');
        if (footerP) {
            footerP.innerHTML = config.footer.copyright;
        }
    }
}

function renderProjects(projects) {
    const projectList = document.querySelector('#homepage .project-list');
    if (!projectList) {
        console.debug('No .project-list found in #homepage, waiting for DOM updates...');
        return;
    }
    projectList.innerHTML = projects.map(project => `
        <li class="project">
            <a href="${project.url}" target="_blank">
                <i class="fab fa-${project.icon}"></i>
                <span>${project.name}</span>
            </a>
            <p>${project.description}</p>
        </li>
    `).join('');
}

function renderHomepageCards(cards) {
    const homepage = document.getElementById('homepage');
    if (!homepage) return;
    
    homepage.innerHTML = '';

    cards.forEach(card => {
        const section = document.createElement('section');
        section.className = 'card';
        if (card.type) section.classList.add(card.type);

        switch (card.type) {
            case 'clock':
                section.innerHTML = `
                    <div class="clock">
                        <div class="clock-date"></div>
                        <div class="clock-time"></div>
                    </div>
                    <div class="hitokoto-container"></div>
                `;
                updateClock();
                break;

            case 'profile':
                section.innerHTML = `
                    <img src="${window.siteConfig.siteInfo.avatar}" alt="头像">
                    <div class="profile-info">
                        <h2>${window.siteConfig.siteInfo.profile.name}</h2>
                        <p>${window.siteConfig.siteInfo.profile.nickname}</p>
                    </div>
                    <div class="buttons">
                        ${card.buttons.map(btn => `
                            <a href="${btn.url}" target="_blank" class="button ${btn.type}-button">
                                <i class="fas ${btn.icon}"></i> ${btn.text}
                            </a>
                        `).join('')}
                    </div>
                `;
                break;

            case 'education':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <ul>
                        <li>大学: ${window.siteConfig.siteInfo.profile.education.university}</li>
                        <li>专业: ${window.siteConfig.siteInfo.profile.education.major}</li>
                        <li>年份: ${window.siteConfig.siteInfo.profile.education.year}</li>
                    </ul>
                `;
                break;

            case 'projects':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <ul class="project-list"></ul>
                `;
                renderProjects(window.siteConfig.projects);
                break;

            case 'contact':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <div class="contact-options">
                        <a href="${window.siteConfig.socialLinks.email}">
                            <i class="fas fa-at"></i>
                            <span>电子邮件</span><br>
                        </a>
                        <a href="${window.siteConfig.socialLinks.github}" target="_blank">
                            <i class="fab fa-github"></i>
                            <span>Github</span><br>
                        </a>
                        <a href="${window.siteConfig.socialLinks.bilibili}" target="_blank">
                            <i class="fab fa-bilibili"></i>
                            <span>Bilibili</span>
                        </a>
                    </div>
                `;
                break;

            case 'website-info':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <ul>
                        ${card.showVisits ? `
                            <li><strong>本站总访问量：</strong>
                                <span id="busuanzi_site_pv"></span> 次
                            </li>
                            <li><strong>本站总访客数：</strong>
                                <span id="busuanzi_site_uv"></span> 人
                            </li>
                        ` : ''}
                        <li><div id="runtime-info-container"></div></li>
                    </ul>
                `;
                
                if (window.siteConfig?.siteInfo?.startDate) {
                    initRuntimeInfo(window.siteConfig);
                }
                break;

            case 'carousel':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><br>
                    <div class="carousel-card">
                        <button class="next-btn" onclick="nextSlide()">❯</button>
                        <button class="prev-btn" onclick="prevSlide()">❮</button>
                        <div class="carousel-container">
                            <img class="carousel-img">
                        </div>
                    </div>
                `;
                break;

            case 'music':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3>
                    <br><br>
                    <div id="aplayer"></div>
                `;
                break;

            case 'comments':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <div id="twikoo"></div>
                `;
                break;

            default:
                if (card.title) {
                    section.innerHTML = `
                        <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                        ${card.content ? `<p>${card.content}</p>` : ''}
                        ${card.items ? `
                            <ul>
                                ${card.items.map(item => `
                                    <li>${item.label}: ${item.value}</li>
                                `).join('')}
                            </ul>
                        ` : ''}
                    `;
                }
                break;
        }

        homepage.appendChild(section);
    });

    initCarousel();
    updateClock();
    initHitokoto();
    if (window.siteConfig.music && window.siteConfig.music.type === 'meting') {
        const musicContainer = document.querySelector('#aplayer');
        if (musicContainer) {
            const metingJs = document.createElement('meting-js');
            Object.entries(window.siteConfig.music.settings).forEach(([key, value]) => {
                metingJs.setAttribute(key, value);
            });
            musicContainer.appendChild(metingJs);
        }
    }
    if (window.siteConfig.comments && window.siteConfig.comments.system === 'twikoo') {
        twikoo.init(window.siteConfig.comments.settings);
    }
    if (window.siteConfig.projects) {
        renderProjects(window.siteConfig.projects);
    }
}

function refreshBusuanzi() {
    if (typeof window.busuanzi_refresh === 'function') {
        window.busuanzi_refresh();
    } else {
        const script = document.createElement('script');
        script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = function() {
            setTimeout(() => {
                const pv = document.getElementById('busuanzi_container_site_pv');
                const uv = document.getElementById('busuanzi_container_site_uv');
                if (pv) pv.style.display = '';
                if (uv) uv.style.display = '';
            }, 1000);
        };
    }
}

document.addEventListener('DOMContentLoaded', function () {
    updateClock();
    initBackgroundImage();
    initHitokoto();
    
    fetch('config.json')
        .then(response => response.json())
        .then(config => {
            initSiteWithConfig(config);
            if (config.carousel) {
                carouselImages = config.carousel.images;
                initCarousel();
                startAutoSlide();
            }
        })
        .catch(error => {
            console.error('Error loading config:', error);
        });
});

fetch('nav.json')
    .then(response => response.json())
    .then(data => {
        renderCards(data.cards);
    })
    .catch(error => {
        console.error('Error loading cards:', error);
    });

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

    initializeCardInteractions();
}

function initializeCardInteractions() {
    const cardItems = document.querySelectorAll('.cardItem');
    cardItems.forEach(card => {
        card.addEventListener('click', function() {
            const cardNumber = parseInt(this.id.replace('card', ''), 10);
            switchToCard(cardNumber);
        });
    });
}

function startBackgroundSlideshow() {
    if (!backgroundImages || backgroundImages.length === 0) return;
    
    if (backgroundImageInterval) clearInterval(backgroundImageInterval);
    const interval = window.siteConfig?.backgroundImages?.interval || 30000;
    
    updateBackgroundImage();
    
    backgroundImageInterval = setInterval(() => {
        currentBackgroundImageIndex = (currentBackgroundImageIndex + 1) % backgroundImages.length;
        updateBackgroundImage();
    }, interval);
}

function updateIndicators(index) {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function initCarouselIndicators() {
    if (!carouselImages || !carouselImages.length) return;
    
    const container = document.querySelector('.carousel-container');
    if (!container) return;
    
    const oldIndicators = container.querySelector('.carousel-indicators');
    if (oldIndicators) {
        oldIndicators.remove();
    }
    
    const indicators = document.createElement('div');
    indicators.className = 'carousel-indicators';
    
    carouselImages.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot';
        if (index === currentCarouselIndex) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => {
            currentCarouselIndex = index;
            showSlide(index);
        });
        indicators.appendChild(dot);
    });
    
    container.appendChild(indicators);
}