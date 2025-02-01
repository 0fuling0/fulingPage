/* ===== Background Image ===== */
const bgState = { images: [], currentIndex: 0, isTransitioning: false, timer: null, interval: 30000 };
const preloadCache = new Set();
let bgContainer, bottomLayer, topLayer;

function createLayers() {
    if (bgContainer) return;
    bgContainer = document.createElement('div');
    bgContainer.id = 'bg-container';
    bgContainer.style.cssText = 'position:fixed;inset:0;z-index:-10;overflow:hidden;pointer-events:none;background:#1a1a2e';
    const css = 'position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:1';
    bottomLayer = document.createElement('div');
    bottomLayer.style.cssText = css;
    topLayer = document.createElement('div');
    topLayer.style.cssText = css + ';transition:opacity 1.5s ease-in-out;will-change:opacity';
    bgContainer.append(bottomLayer, topLayer);
    document.body.insertBefore(bgContainer, document.body.firstChild);
}

function preloadImage(src) {
    if (preloadCache.has(src)) return Promise.resolve(true);
    return new Promise(res => {
        const img = new Image();
        img.onload = () => { preloadCache.add(src); res(true); };
        img.onerror = () => res(false);
        img.src = src;
    });
}

async function switchBg(index, animate = true) {
    if (bgState.isTransitioning || !bgState.images.length) return;
    const src = bgState.images[index];
    if (!src) return;
    bgState.isTransitioning = true;
    if (!(await preloadImage(src))) { bgState.isTransitioning = false; return; }
    if (animate) {
        bottomLayer.style.backgroundImage = `url('${src}')`;
        void bottomLayer.offsetHeight;
        topLayer.style.opacity = '0';
        await new Promise(r => setTimeout(r, 1600));
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = `url('${src}')`;
        topLayer.style.opacity = '1';
        void topLayer.offsetHeight;
        topLayer.style.transition = 'opacity 1.5s ease-in-out';
    } else {
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = bottomLayer.style.backgroundImage = `url('${src}')`;
        topLayer.style.opacity = '1';
        void topLayer.offsetHeight;
        topLayer.style.transition = 'opacity 1.5s ease-in-out';
    }
    bgState.currentIndex = index;
    bgState.isTransitioning = false;
    preloadImage(bgState.images[(index + 1) % bgState.images.length]);
    try { localStorage.setItem('bgIndex', index); } catch {}
}

function startBgAutoPlay() { stopBgAutoPlay(); if (bgState.images.length > 1) bgState.timer = setInterval(() => switchBg((bgState.currentIndex + 1) % bgState.images.length), bgState.interval); }
function stopBgAutoPlay() { if (bgState.timer) { clearInterval(bgState.timer); bgState.timer = null; } }

function initBackgroundImage(config) {
    if (!config?.images?.length) return;
    bgState.images = config.images;
    bgState.interval = config.interval || 30000;
    try { bgState.currentIndex = (parseInt(localStorage.getItem('bgIndex')) || 0) % bgState.images.length; } catch { bgState.currentIndex = 0; }
    document.body.style.backgroundImage = 'none';
    createLayers();
    switchBg(bgState.currentIndex, false);
    startBgAutoPlay();
    document.addEventListener('visibilitychange', () => document.hidden ? stopBgAutoPlay() : startBgAutoPlay(), { passive: true });
}

/* ===== Carousel ===== */
let carouselIdx = 0, carouselImages = [], carouselAutoIv, carouselFirstLoad = true, carouselTransitioning = false;
let carouselEls = { img: null, container: null, indicators: null };
const carouselCache = new Map();

function carouselPreload(src) {
    if (carouselCache.has(src)) return Promise.resolve();
    return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => { carouselCache.set(src, img); res(); };
        img.onerror = rej;
        img.src = src;
    });
}

function clearCarouselAnim(img) {
    img.classList.remove('fade-out', 'fade-in', 'slide-out-left', 'slide-out-right', 'slide-in-right', 'slide-in-left');
}

function updateCarouselDots() {
    if (!carouselEls.indicators) return;
    [...carouselEls.indicators.children].forEach((d, i) => d.classList.toggle('active', i === carouselIdx));
}

function showSlide(i, dir = 0) {
    if (!carouselImages.length || carouselTransitioning) return;
    i = ((i % carouselImages.length) + carouselImages.length) % carouselImages.length;
    const img = carouselEls.img || document.querySelector('.carousel-img');
    if (!img) return;
    const old = carouselIdx; carouselIdx = i;
    if (carouselFirstLoad) { img.src = carouselImages[i]; img.style.opacity = 1; carouselFirstLoad = false; updateCarouselDots(); return; }
    if (old === i) return;
    carouselTransitioning = true;
    const d = dir || (i > old ? 1 : -1);
    carouselPreload(carouselImages[i]).then(() => {
        clearCarouselAnim(img); img.classList.add(d > 0 ? 'slide-out-left' : 'slide-out-right');
        setTimeout(() => {
            img.src = carouselImages[i]; clearCarouselAnim(img); img.classList.add(d > 0 ? 'slide-in-right' : 'slide-in-left');
            setTimeout(() => { clearCarouselAnim(img); carouselTransitioning = false; }, 500);
        }, 300);
    }).catch(() => { carouselTransitioning = false; });
    updateCarouselDots();
}

function carouselNext() { if (carouselImages.length > 1 && !carouselTransitioning) showSlide(carouselIdx + 1, 1); }
function carouselPrev() { if (carouselImages.length > 1 && !carouselTransitioning) showSlide(carouselIdx - 1, -1); }
function startCarouselAuto() { stopCarouselAuto(); if (carouselImages.length > 1) carouselAutoIv = setInterval(carouselNext, 10000); }
function stopCarouselAuto() { if (carouselAutoIv) { clearInterval(carouselAutoIv); carouselAutoIv = null; } }

function initCarouselIndicators() {
    if (carouselImages.length <= 1) return;
    const c = document.querySelector('.carousel-container');
    if (!c) return;
    c.querySelector('.carousel-indicators')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'carousel-indicators';
    carouselImages.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot' + (i === carouselIdx ? ' active' : '');
        dot.addEventListener('click', e => {
            e.stopPropagation();
            if (!carouselTransitioning && i !== carouselIdx) { showSlide(i, i > carouselIdx ? 1 : -1); stopCarouselAuto(); startCarouselAuto(); }
        });
        wrap.appendChild(dot);
    });
    c.appendChild(wrap);
    carouselEls.indicators = wrap;
}

function initCarousel() {
    if (!carouselImages.length) return;
    carouselEls.img = document.querySelector('.carousel-img');
    carouselEls.container = document.querySelector('.carousel-container');
    if (!carouselEls.img) return;
    showSlide(carouselIdx); initCarouselIndicators();
    if (carouselImages.length > 1) startCarouselAuto();
    if (carouselEls.container && !carouselEls.container.dataset.ev) {
        let tx = 0;
        carouselEls.container.addEventListener('mouseenter', stopCarouselAuto, { passive: true });
        carouselEls.container.addEventListener('mouseleave', startCarouselAuto, { passive: true });
        carouselEls.container.addEventListener('touchstart', e => tx = e.changedTouches[0].screenX, { passive: true });
        carouselEls.container.addEventListener('touchend', e => {
            const d = tx - e.changedTouches[0].screenX;
            if (Math.abs(d) > 50) d > 0 ? carouselNext() : carouselPrev();
        }, { passive: true });
        carouselEls.container.dataset.ev = '1';
    }
    const card = document.querySelector('.carousel-card');
    if (card && !card.dataset.ev) {
        card.addEventListener('click', e => {
            const btn = e.target.closest('.carousel-btn');
            if (btn) { e.stopPropagation(); btn.classList.contains('next-btn') ? carouselNext() : carouselPrev(); }
        });
        card.dataset.ev = '1';
    }
}

function setCarouselImages(imgs) { carouselFirstLoad = true; carouselIdx = 0; carouselImages = imgs || []; }
function setAutoSlideInterval(ms) { stopCarouselAuto(); if (carouselImages.length > 1 && ms > 0) carouselAutoIv = setInterval(carouselNext, ms); }
function resetCarousel() { carouselFirstLoad = true; carouselIdx = 0; carouselTransitioning = false; setTimeout(initCarousel, 100); }

/* ===== Clock & Hitokoto ===== */
let dateF, timeF, hitokotoTimer;

function updateClock() {
    const clocks = document.querySelectorAll('.clock');
    if (!clocks.length) return;
    if (!dateF) {
        dateF = new Intl.DateTimeFormat('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeF = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    const now = new Date(), d = dateF.format(now), t = timeF.format(now);
    clocks.forEach(el => {
        if (!el.querySelector('.clock-date'))
            el.innerHTML = '<div class="clock-date"></div><div class="clock-time"></div>';
        el.querySelector('.clock-date').textContent = d;
        el.querySelector('.clock-time').textContent = t;
    });
}

function updateHitokoto(text) {
    document.querySelectorAll('.hitokoto-container').forEach(c => c.textContent = text);
}

function getHitokoto() {
    const url = window.siteConfig?.hitokoto?.url || 'https://international.v1.hitokoto.cn/';
    const opts = { mode: 'cors', headers: { Accept: 'application/json' } };
    fetch(url, opts)
        .then(r => r.ok ? r : fetch('https://v1.hitokoto.cn/', opts))
        .then(r => r.json())
        .then(d => updateHitokoto(d.from ? `『${d.hitokoto}』—— ${d.from}` : d.hitokoto))
        .catch(() => updateHitokoto(window.siteConfig?.hitokoto?.messages?.error || '获取一言失败'));
}

function updateRuntimeInfo(startDate) {
    if (!startDate) return false;
    const start = new Date(startDate);
    if (isNaN(start)) return false;
    const el = document.getElementById('runtime-info-container');
    if (!el) return false;
    const now = new Date();
    let y = now.getFullYear() - start.getFullYear(), m = now.getMonth() - start.getMonth(), d = now.getDate() - start.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    el.innerHTML = `<strong>网站运行时间：</strong>${y > 0 ? y + ' 年 ' : ''}${m > 0 ? m + ' 月 ' : ''}${d} 天`;
    return true;
}

function initClock() {
    updateClock();
    let iv = setInterval(updateClock, 1000);
    document.addEventListener('visibilitychange', () => {
        clearInterval(iv);
        if (!document.hidden) { updateClock(); iv = setInterval(updateClock, 1000); }
    }, { passive: true });
}

function initHitokoto() {
    updateHitokoto(window.siteConfig?.hitokoto?.messages?.loading || '正在加载一言...');
    getHitokoto();
    if (hitokotoTimer) clearInterval(hitokotoTimer);
    hitokotoTimer = setInterval(getHitokoto, window.siteConfig?.hitokoto?.interval || 10000);
}

/* ===== Dark Mode & Header ===== */
const THEME = { dark: 'rgba(38,38,38,0.25)', light: 'rgba(255,255,255,0.4)' };
let headerEl, lastScrollY = 0;

function isDark() { return document.documentElement.classList.contains('dark-mode'); }

function setTheme(dark) {
    const h = document.documentElement;
    h.classList.toggle('dark-mode', dark);
    h.classList.toggle('light', !dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME.dark : THEME.light);
}

function updateDarkModeIcons() {
    const cls = isDark() ? 'fas fa-sun' : 'fas fa-moon';
    document.querySelector('#darkModeToggle i')?.setAttribute('class', cls);
    const fi = document.getElementById('footerDarkIcon');
    if (fi) fi.className = cls;
}

function handleScroll() {
    const y = scrollY;
    if (y < 50) headerEl.classList.remove('header-hidden');
    else if (y > lastScrollY + 10) headerEl.classList.add('header-hidden');
    else if (y < lastScrollY - 10) headerEl.classList.remove('header-hidden');
    lastScrollY = y;
}

function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    const dark = saved !== null ? saved === 'true' : matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(dark);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        setTheme(e.matches); updateDarkModeIcons();
    });
}

function toggleDarkMode() {
    const dark = !isDark();
    setTheme(dark); updateDarkModeIcons();
    localStorage.setItem('darkMode', dark);
}

function updateNavActive(sectionId) {
    document.querySelectorAll('.header-nav a').forEach(a => {
        const onclick = a.getAttribute('onclick') || '', href = a.getAttribute('href') || '';
        a.classList.toggle('active',
            onclick.includes(`'${sectionId}'`) ||
            (sectionId === 'homepage' && href.includes('#home')) ||
            (sectionId === 'navpage' && href.includes('#nav'))
        );
    });
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

function initHeaderAndFooter(config) {
    headerEl = document.querySelector('header');
    if (headerEl) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) { requestAnimationFrame(() => { handleScroll(); ticking = false; }); ticking = true; }
        }, { passive: true });
    }
    if (config?.siteInfo?.startDate) {
        const start = new Date(config.siteInfo.startDate), el = document.getElementById('footer-runtime');
        if (el) { const update = () => el.textContent = Math.floor((Date.now() - start) / 864e5); update(); setInterval(update, 36e5); }
    }
    const cp = document.querySelector('.footer-info .copyright');
    if (cp && config?.footer?.copyright) cp.innerHTML = config.footer.copyright;
}

/* ===== Navigation ===== */
let navTimer, currentCard = 1, mainEl, navHeaderH1, cardContainer;

function showCard(n) {
    document.querySelectorAll('.cardItem').forEach(c => c.classList.remove('active', 'current'));
    document.getElementById(`card${n}`)?.classList.add('active', 'current');
    document.querySelector(`.navButton[data-card="${currentCard}"]`)?.classList.remove('current');
    document.querySelector(`.navButton[data-card="${n}"]`)?.classList.add('current');
    currentCard = n;
}

function showSection(id) {
    const hp = document.getElementById('homepage'), np = document.getElementById('navpage');
    if (hp) hp.style.display = id === 'homepage' ? 'block' : 'none';
    if (np) np.style.display = id === 'navpage' ? 'block' : 'none';
    if (navHeaderH1) {
        const c = window.siteConfig?.header;
        navHeaderH1.textContent = id === 'navpage' ? (c?.navTitle || 'Navigation') : (c?.title || 'Homepage');
    }
    if (mainEl) mainEl.style.columnCount = id === 'navpage' ? '1' : '';
    updateNavActive(id);
    window.scrollTo({ top: 0 });
}

function startTimer(n) { navTimer = setTimeout(() => showCard(n), 500); }
function clearTimer() { clearTimeout(navTimer); }
function switchToCard(n) { clearTimeout(navTimer); showCard(n); }

function renderCards(cards) {
    const parent = cardContainer || document.querySelector('.cardContainer');
    if (!parent) return;
    const frag = document.createDocumentFragment();
    cards.forEach(card => {
        const el = document.createElement('div');
        el.className = card.id === 'card1' ? 'cardItem active' : 'cardItem';
        el.id = card.id;
        const grid = document.createElement('div');
        grid.className = 'grid-container';
        card.items.forEach(item => {
            const a = document.createElement('a');
            a.href = item.url; a.target = '_blank'; a.className = 'grid-item'; a.dataset.url = item.url;
            a.innerHTML = `<img class="icon" src="${item.icon}" alt="" loading="lazy"><span>${item.name}</span>`;
            grid.appendChild(a);
        });
        el.appendChild(grid);
        frag.appendChild(el);
    });
    parent.appendChild(frag);
}

function handleHash() {
    const h = location.hash.substring(1);
    showSection(h === 'nav' || h === 'home' ? h + 'page' : 'homepage');
}

function initNavigation() {
    mainEl = document.querySelector('main');
    navHeaderH1 = document.querySelector('header h1');
    cardContainer = document.querySelector('.cardContainer');
    document.querySelector('.navButton[data-card="1"]')?.classList.add('current');
    cardContainer?.addEventListener('click', e => {
        const item = e.target.closest('.cardItem');
        if (item) { const n = parseInt(item.id.replace('card', '')); if (!isNaN(n)) showCard(n); }
    });
    window.addEventListener('hashchange', handleHash, { passive: true });
    handleHash();
}

/* ===== Rain Effect (no wave/ripple interaction) ===== */
let rainCanvas, rainCtx, drops = [], splashes = [], rainAnimId, rainRunning = false, cardRects = [];
const rainCfg = {
    dropCount: 80, dropSpeed: 8, dropLength: 35, dropWidth: 2.5,
    color: 'rgba(174, 194, 224, 0.5)',
    splashColor: 'rgba(174, 194, 224, 0.7)'
};

function rainResize() { if (rainCanvas) { rainCanvas.width = innerWidth; rainCanvas.height = innerHeight; } }
function createDrop() {
    return { x: Math.random() * rainCanvas.width, y: Math.random() * rainCanvas.height - rainCanvas.height,
        speed: rainCfg.dropSpeed + Math.random() * 5, length: rainCfg.dropLength + Math.random() * 10, opacity: 0.3 + Math.random() * 0.4 };
}
function updateCardRects() { cardRects = [...document.querySelectorAll('.card, header, footer')].map(el => el.getBoundingClientRect()); }
function isOnCard(x, y) { return cardRects.some(r => x >= r.left && x <= r.right && y >= r.top && y <= r.bottom); }

function rainAnimate() {
    if (!rainRunning) return;
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    rainCtx.strokeStyle = rainCfg.color; rainCtx.lineCap = 'round'; rainCtx.lineWidth = rainCfg.dropWidth;
    const screenBottom = rainCanvas.height;
    drops.forEach(d => {
        d.y += d.speed;
        // Card splash
        if (!d.hitCard && isOnCard(d.x, d.y + d.length)) {
            d.hitCard = true;
            if (Math.random() > 0.7) splashes.push({ x: d.x, y: d.y + d.length, radius: 0, opacity: 0.6,
                particles: Array.from({ length: 4 }, () => ({ angle: Math.random() * Math.PI * 2, speed: 1 + Math.random() * 2, size: 2 + Math.random() * 2, life: 1 })) });
        }
        // Bottom-of-screen splash
        if (!d.hitBottom && d.y + d.length >= screenBottom) {
            d.hitBottom = true;
            if (Math.random() > 0.4) {
                const splashY = screenBottom - 2;
                splashes.push({
                    x: d.x, y: splashY, radius: 0, opacity: 0.7, isBottom: true,
                    particles: Array.from({ length: 5 + Math.floor(Math.random() * 4) }, () => ({
                        vx: (Math.random() - 0.5) * 4,
                        vy: -(2 + Math.random() * 4),
                        size: 1.5 + Math.random() * 2,
                        life: 1,
                        gravity: 0.15
                    }))
                });
            }
        }
        if (d.y > screenBottom) { d.y = -d.length; d.x = Math.random() * rainCanvas.width; d.hitCard = false; d.hitBottom = false; }
        rainCtx.beginPath(); rainCtx.globalAlpha = d.opacity; rainCtx.moveTo(d.x, d.y); rainCtx.lineTo(d.x, d.y + d.length); rainCtx.stroke();
    });
    splashes = splashes.filter(s => {
        if (s.isBottom) {
            // Bottom splash: upward particle burst
            s.opacity -= 0.025;
            if (s.opacity <= 0) return false;
            rainCtx.fillStyle = rainCfg.splashColor;
            let alive = false;
            s.particles.forEach(p => {
                if (p.life > 0) {
                    alive = true;
                    p.life -= 0.035;
                    p.vy += p.gravity;
                    p.vx *= 0.99;
                    const px = s.x + p.vx * (1 - p.life) * 15;
                    const py = s.y + p.vy * (1 - p.life) * 12;
                    rainCtx.globalAlpha = s.opacity * p.life;
                    rainCtx.beginPath();
                    rainCtx.arc(px, py, p.size * p.life, 0, Math.PI * 2);
                    rainCtx.fill();
                }
            });
            // Small elliptical ring at base
            if (s.radius < 20) {
                s.radius += 1.5;
                rainCtx.strokeStyle = rainCfg.splashColor;
                rainCtx.globalAlpha = s.opacity * 0.5;
                rainCtx.lineWidth = 1;
                rainCtx.beginPath();
                rainCtx.ellipse(s.x, s.y, s.radius, s.radius * 0.3, 0, 0, Math.PI * 2);
                rainCtx.stroke();
            }
            return alive;
        } else {
            // Card splash (original)
            s.radius += 2; s.opacity -= 0.03;
            if (s.opacity <= 0) return false;
            rainCtx.strokeStyle = rainCfg.splashColor; rainCtx.globalAlpha = s.opacity; rainCtx.lineWidth = 1;
            rainCtx.beginPath(); rainCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); rainCtx.stroke();
            rainCtx.fillStyle = rainCfg.splashColor;
            s.particles.forEach(p => {
                if (p.life > 0) {
                    p.life -= 0.05;
                    rainCtx.globalAlpha = s.opacity * p.life; rainCtx.beginPath();
                    rainCtx.arc(s.x + Math.cos(p.angle) * s.radius * p.speed * 0.5, s.y + Math.sin(p.angle) * s.radius * p.speed * 0.3 - s.radius * 0.5, p.size * p.life, 0, Math.PI * 2); rainCtx.fill();
                }
            });
            return true;
        }
    });
    rainCtx.globalAlpha = 1;
    rainAnimId = requestAnimationFrame(rainAnimate);
}

function startRain() { if (!rainRunning) { rainRunning = true; rainAnimate(); } }
function stopRain() { rainRunning = false; if (rainAnimId) { cancelAnimationFrame(rainAnimId); rainAnimId = null; } }

function initRainEffect(options = {}) {
    Object.assign(rainCfg, options);
    rainCanvas = document.createElement('canvas');
    rainCanvas.id = 'rain-canvas';
    rainCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1';
    document.body.insertBefore(rainCanvas, document.body.firstChild);
    rainCtx = rainCanvas.getContext('2d');
    rainResize();
    for (let i = 0; i < rainCfg.dropCount; i++) drops.push(createDrop());
    updateCardRects();
    window.addEventListener('resize', () => { rainResize(); updateCardRects(); }, { passive: true });
    window.addEventListener('scroll', updateCardRects, { passive: true });
    setInterval(updateCardRects, 2000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopRain(); else { updateCardRects(); startRain(); } }, { passive: true });
    startRain();
}

/* ===== Search ===== */
const SEARCH_URLS = {
    Google: 'https://www.google.com/search?q=', Bing: 'https://www.bing.com/search?q=',
    Yahoo: 'https://search.yahoo.com/search?p=', DuckDuckGo: 'https://duckduckgo.com/?q=',
    Baidu: 'https://www.baidu.com/s?wd=', Yandex: 'https://yandex.com/search/?text=',
    Ask: 'https://www.ask.com/web?q=', AOL: 'https://search.aol.com/aol/search?q=',
    WolframAlpha: 'https://www.wolframalpha.com/input/?i=', Dogpile: 'https://www.dogpile.com/search/web?q='
};
let searchInput, searchStyled, searchOpts;

function initSearch() {
    searchInput = document.querySelector('.search-input');
    searchStyled = document.querySelector('.select-styled');
    searchOpts = document.getElementById('searchOptions');
    const last = localStorage.getItem('lastSelectedEngine');
    if (last && searchStyled) searchStyled.textContent = last;
    searchInput?.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
}

function doSearch() {
    const engine = searchStyled?.textContent, term = searchInput?.value.trim();
    if (!term || !SEARCH_URLS[engine]) return;
    window.open(SEARCH_URLS[engine] + encodeURIComponent(term), '_blank');
    localStorage.setItem('lastSelectedEngine', engine);
}

function toggleSearchOptions() {
    if (searchOpts) searchOpts.style.display = searchOpts.style.display === 'grid' ? 'none' : 'grid';
}

function selectSearchOption(opt) {
    if (searchStyled) searchStyled.textContent = opt;
    toggleSearchOptions();
    localStorage.setItem('lastSelectedEngine', opt);
}

/* ===== Site Info ===== */
function initSiteWithConfig(config) {
    if (!config) return;
    if (config.siteInfo) {
        document.title = config.siteInfo.title || document.title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', config.siteInfo.description || '');
        const h1 = document.querySelector('header h1');
        if (h1) h1.textContent = config.header?.title || config.siteInfo.title;
        const motto = document.querySelector('.motto');
        if (motto) motto.textContent = config.siteInfo.motto || '';
    }
    if (config.header?.links) {
        const nav = document.getElementById('headerLinks');
        if (nav) {
            nav.innerHTML = '';
            config.header.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.innerHTML = link.icon ? `<i class="${link.icon}"></i> ${link.text}` : link.text;
                if (link.onclick) a.setAttribute('onclick', link.onclick);
                if (link.url && !link.url.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
                nav.appendChild(a);
            });
        }
    }
}

function renderHomepageCards(cards) {
    const homepage = document.getElementById('homepage');
    if (!homepage) return;
    homepage.innerHTML = '';
    const order = window.siteConfig?.homepage?.cardOrder || [];
    order.forEach(type => {
        const card = cards.find(c => c.type === type);
        if (!card) return;
        const s = document.createElement('section');
        s.className = `card ${type}`;
        switch (type) {
            case 'clock':
                s.innerHTML = '<div class="clock"><div class="clock-date"></div><div class="clock-time"></div></div><div class="hitokoto-container"></div>';
                updateClock(); break;
            case 'profile':
                s.innerHTML = `<img src="${card.avatar}" alt="头像"><div class="profile-info"><h2>${card.name}</h2><p>${card.nickname}</p></div>
                    <div class="buttons">${card.buttons.map(b => `<a href="${b.url}" target="_blank" class="button ${b.type}-button"><i class="fas ${b.icon}"></i> ${b.text}</a>`).join('')}</div>`;
                break;
            case 'education':
                s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><ul><li>大学: ${card.university}</li><li>专业: ${card.major}</li><li>年份: ${card.year}</li></ul>`;
                break;
            case 'projects':
                s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><ul class="project-list">${card.list.map(p =>
                    `<li class="project"><a href="${p.url}" target="_blank"><i class="${p.icon}"></i><span>${p.name}</span></a><p>${p.description}</p></li>`).join('')}</ul>`;
                break;
            case 'carousel':
                s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><br>
                    <div class="carousel-card"><button class="carousel-btn prev-btn" aria-label="上一张"><i class="fas fa-chevron-left"></i></button>
                    <button class="carousel-btn next-btn" aria-label="下一张"><i class="fas fa-chevron-right"></i></button>
                    <div class="carousel-container"><img class="carousel-img" alt="轮播图片" style="opacity:0"></div></div>`;
                setCarouselImages(card.images);
                requestAnimationFrame(() => setTimeout(resetCarousel, 200));
                break;
            case 'music':
                s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><br><div id="aplayer"></div>`;
                if (card.settings) {
                    const m = document.createElement('meting-js');
                    Object.entries(card.settings).forEach(([k, v]) => m.setAttribute(k, v));
                    s.querySelector('#aplayer').appendChild(m);
                }
                break;
            case 'comments':
                s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><div id="tcomment"></div>`;
                break;
            case 'contact':
                s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <div class="contact-options"><a href="${card.links.email}"><i class="fas fa-at"></i><span>电子邮件</span><br></a>
                    <a href="${card.links.github}" target="_blank"><i class="fab fa-github"></i><span>Github</span><br></a>
                    <a href="${card.links.bilibili}" target="_blank"><i class="fab fa-bilibili"></i><span>Bilibili</span></a></div>`;
                break;
            case 'website-info':
                s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><ul>
                    ${card.showVisits ? '<li><strong>本站总访问量：</strong><span id="busuanzi_value_site_pv">加载中...</span> 次</li><li><strong>本站总访客数：</strong><span id="busuanzi_value_site_uv">加载中...</span> 人</li>' : ''}
                    ${card.showRuntime ? '<li id="runtime-info-container"><strong>网站运行时间：</strong>加载中...</li>' : ''}</ul>`;
                if (card.showRuntime && window.siteConfig?.siteInfo?.startDate)
                    requestAnimationFrame(() => updateRuntimeInfo(window.siteConfig.siteInfo.startDate));
                refreshBusuanzi();
                break;
            default:
                if (card.title) s.innerHTML = `<h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>${card.content ? `<p>${card.content}</p>` : ''}
                    ${card.items ? `<ul>${card.items.map(i => `<li>${i.label}: ${i.value}</li>`).join('')}</ul>` : ''}`;
                break;
        }
        homepage.appendChild(s);
    });
    const cc = cards.find(c => c.type === 'comments');
    if (cc?.settings && window.twikoo) setTimeout(() => twikoo.init({ envId: cc.settings.envId, el: '#tcomment' }), 100);
}

function refreshBusuanzi() {
    const script = document.createElement('script');
    script.src = 'https://npm.onmicrosoft.cn/penndu@16.0.0/bsz.js';
    script.defer = true;
    script.setAttribute('data-prefix', 'busuanzi_value');
    document.body.appendChild(script);
    script.onload = () => setTimeout(() => {
        ['busuanzi_value_site_pv', 'busuanzi_value_site_uv'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ''; });
    }, 1000);
}

/* ===== Utils ===== */
function handleLoading() {
    setTimeout(() => {
        const el = document.querySelector('.loading-container');
        if (el) { el.classList.add('fade-out'); setTimeout(() => el.remove(), 500); }
    }, 800);
}

function loadConfigs() {
    return Promise.all([
        fetch('config.json').then(r => r.json()),
        fetch('nav.json').then(r => r.json())
    ]).catch(() => [null, null]);
}

function initGridEvents() {
    document.addEventListener('click', e => {
        const item = e.target.closest('.grid-item');
        if (item?.dataset.url) { e.preventDefault(); window.open(item.dataset.url, '_blank'); }
    });
}

/* ===== Global Bindings ===== */
Object.assign(window, {
    toggleOptions: toggleSearchOptions,
    selectOption: selectSearchOption,
    search: doSearch,
    startTimer,
    clearTimer,
    switchToCard,
    showSection,
    toggleDarkMode,
    scrollToTop,
});

/* ===== Init ===== */
initDarkMode();

document.addEventListener('DOMContentLoaded', () => {
    updateDarkModeIcons();
    handleLoading();
    initClock();
    loadConfigs().then(([config, navData]) => {
        if (!config || !navData) return;
        window.siteConfig = config;
        initSiteWithConfig(config);
        initHeaderAndFooter(config);
        initBackgroundImage(config.backgroundImages);
        if (config.rainEffect?.enabled !== false) initRainEffect(config.rainEffect);
        if (config.carousel?.images) {
            setCarouselImages(config.carousel.images);
            setAutoSlideInterval(config.carousel.interval || 10000);
        }
        if (config.homepage?.cards) renderHomepageCards(config.homepage.cards);
        initHitokoto();
        if (navData.cards) renderCards(navData.cards);
        initNavigation();
    });
    initSearch();
    initGridEvents();
});
