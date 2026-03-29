/* ===== Background Image ===== */
const bgState = { images: [], currentIndex: 0, isTransitioning: false, timer: null, interval: 30000, apiUrls: new Set() };
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

function isApiUrl(src) {
    return bgState.apiUrls.has(src);
}

function getCacheBustedUrl(src) {
    const sep = src.includes('?') ? '&' : '?';
    return src + sep + '_t=' + Date.now();
}

function preloadImage(src) {
    if (!isApiUrl(src) && preloadCache.has(src)) return Promise.resolve(true);
    const loadUrl = isApiUrl(src) ? getCacheBustedUrl(src) : src;
    return new Promise(res => {
        const img = new Image();
        img.onload = () => { if (!isApiUrl(src)) preloadCache.add(src); res(true); };
        img.onerror = () => res(false);
        img.src = loadUrl;
    });
}

async function switchBg(index, animate = true) {
    if (bgState.isTransitioning || !bgState.images.length) return;
    const src = bgState.images[index];
    if (!src) return;
    bgState.isTransitioning = true;
    if (!(await preloadImage(src))) { bgState.isTransitioning = false; return; }
    const displayUrl = isApiUrl(src) ? getCacheBustedUrl(src) : src;
    if (animate) {
        bottomLayer.style.backgroundImage = `url('${displayUrl}')`;
        void bottomLayer.offsetHeight;
        topLayer.style.opacity = '0';
        await new Promise(r => setTimeout(r, 1600));
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = `url('${displayUrl}')`;
        topLayer.style.opacity = '1';
        void topLayer.offsetHeight;
        topLayer.style.transition = 'opacity 1.5s ease-in-out';
    } else {
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = bottomLayer.style.backgroundImage = `url('${displayUrl}')`;
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
    bgState.apiUrls = new Set(config.api || []);
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
    const cl = img.classList;
    cl.remove('fade-out', 'fade-in', 'slide-out-left', 'slide-out-right', 'slide-in-right', 'slide-in-left');
}

function updateCarouselDots() {
    if (!carouselEls.indicators) return;
    const children = carouselEls.indicators.children;
    for (let i = 0, len = children.length; i < len; i++) children[i].classList.toggle('active', i === carouselIdx);
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
    for (let i = 0, len = carouselImages.length; i < len; i++) {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot' + (i === carouselIdx ? ' active' : '');
        dot.addEventListener('click', (function(idx) {
            return function(e) {
                e.stopPropagation();
                if (!carouselTransitioning && idx !== carouselIdx) { showSlide(idx, idx > carouselIdx ? 1 : -1); stopCarouselAuto(); startCarouselAuto(); }
            };
        })(i));
        wrap.appendChild(dot);
    }
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

/* ===== Clock & Jinrishici (今日诗词) ===== */
let dateF, timeF, jinrishiciTimer;
let clockEls = null, lastDateStr = '', lastTimeStr = '';

function updateClock() {
    if (!clockEls) clockEls = document.querySelectorAll('.clock');
    if (!clockEls.length) return;
    if (!dateF) {
        dateF = new Intl.DateTimeFormat('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        timeF = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }
    const now = new Date(), d = dateF.format(now), t = timeF.format(now);
    // Only update DOM when text actually changed
    const dateChanged = d !== lastDateStr;
    const timeChanged = t !== lastTimeStr;
    if (!dateChanged && !timeChanged) return;
    lastDateStr = d; lastTimeStr = t;
    for (let i = 0, len = clockEls.length; i < len; i++) {
        const el = clockEls[i];
        if (!el.querySelector('.clock-date'))
            el.innerHTML = '<div class="clock-date"></div><div class="clock-time"></div>';
        if (dateChanged) el.querySelector('.clock-date').textContent = d;
        if (timeChanged) el.querySelector('.clock-time').textContent = t;
    }
}

function refreshClockEls() { clockEls = null; lastDateStr = ''; lastTimeStr = ''; }

function updateJinrishici(text) {
    const els = document.querySelectorAll('.hitokoto-container');
    for (let i = 0, len = els.length; i < len; i++) els[i].textContent = text;
}

function getJinrishici() {
    if (typeof jinrishici !== 'undefined' && jinrishici.load) {
        jinrishici.load(function(result) {
            if (result && result.status === 'success') {
                const d = result.data;
                const origin = d.origin;
                const info = origin ? `${origin.dynasty}·${origin.author}《${origin.title}》` : '';
                updateJinrishici(info ? `『${d.content}』—— ${info}` : d.content);
            } else {
                updateJinrishici(window.siteConfig?.jinrishici?.messages?.error || '获取诗词失败');
            }
        }, function() {
            updateJinrishici(window.siteConfig?.jinrishici?.messages?.error || '获取诗词失败');
        });
    } else {
        fetch('https://v2.jinrishici.com/one.json', { method: 'GET', headers: { 'X-User-Token': 'default' } })
            .then(r => r.json())
            .then(result => {
                if (result && result.status === 'success') {
                    const d = result.data;
                    const origin = d.origin;
                    const info = origin ? `${origin.dynasty}·${origin.author}《${origin.title}》` : '';
                    updateJinrishici(info ? `『${d.content}』—— ${info}` : d.content);
                } else {
                    updateJinrishici(window.siteConfig?.jinrishici?.messages?.error || '获取诗词失败');
                }
            })
            .catch(() => updateJinrishici(window.siteConfig?.jinrishici?.messages?.error || '获取诗词失败'));
    }
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

function initJinrishici() {
    updateJinrishici(window.siteConfig?.jinrishici?.messages?.loading || '正在加载诗词...');
    getJinrishici();
    if (jinrishiciTimer) clearInterval(jinrishiciTimer);
    jinrishiciTimer = setInterval(getJinrishici, window.siteConfig?.jinrishici?.interval || 15000);
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
    const links = document.querySelectorAll('.header-nav a');
    for (let i = 0, len = links.length; i < len; i++) {
        const a = links[i];
        const onclick = a.getAttribute('onclick') || '', href = a.getAttribute('href') || '';
        a.classList.toggle('active',
            onclick.includes(`'${sectionId}'`) ||
            (sectionId === 'homepage' && href.includes('#home')) ||
            (sectionId === 'navpage' && href.includes('#nav'))
        );
    }
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
    const items = document.querySelectorAll('.cardItem');
    for (let i = 0, len = items.length; i < len; i++) items[i].classList.remove('active', 'current');
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
    for (let ci = 0, clen = cards.length; ci < clen; ci++) {
        const card = cards[ci];
        const el = document.createElement('div');
        el.className = card.id === 'card1' ? 'cardItem active' : 'cardItem';
        el.id = card.id;
        const grid = document.createElement('div');
        grid.className = 'grid-container';
        const items = card.items;
        for (let ii = 0, ilen = items.length; ii < ilen; ii++) {
            const item = items[ii];
            const a = document.createElement('a');
            a.href = item.url; a.target = '_blank'; a.className = 'grid-item'; a.dataset.url = item.url;
            a.innerHTML = `<img class="icon" src="${item.icon}" alt="" loading="lazy"><span>${item.name}</span>`;
            grid.appendChild(a);
        }
        el.appendChild(grid);
        frag.appendChild(el);
    }
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
let rainCanvas, rainCtx, drops = [], splashes = [], splashCount = 0, rainAnimId, rainRunning = false, cardRects = [];
let rainScrollThrottle = false;
const rainCfg = {
    dropCount: 80, dropSpeed: 8, dropLength: 35, dropWidth: 2.5,
    color: 'rgba(174, 194, 224, 0.5)',
    splashColor: 'rgba(174, 194, 224, 0.7)'
};

function rainResize() { if (rainCanvas) { rainCanvas.width = innerWidth; rainCanvas.height = innerHeight; } }
function createDrop() {
    return { x: Math.random() * rainCanvas.width, y: Math.random() * rainCanvas.height - rainCanvas.height,
        speed: rainCfg.dropSpeed + Math.random() * 5, length: rainCfg.dropLength + Math.random() * 10, opacity: 0.3 + Math.random() * 0.4,
        hitCard: false, hitBottom: false };
}
function updateCardRects() {
    const els = document.querySelectorAll('.card, header, footer');
    cardRects.length = 0;
    for (let i = 0; i < els.length; i++) cardRects.push(els[i].getBoundingClientRect());
}
function isOnCard(x, y) {
    for (let i = 0, len = cardRects.length; i < len; i++) {
        const r = cardRects[i];
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
    }
    return false;
}

function rainAnimate() {
    if (!rainRunning) return;
    const w = rainCanvas.width, h = rainCanvas.height;
    rainCtx.clearRect(0, 0, w, h);
    const ctx = rainCtx;
    const TWO_PI = Math.PI * 2;

    // --- Batch draw raindrops by opacity groups ---
    ctx.lineCap = 'round';
    ctx.lineWidth = rainCfg.dropWidth;
    ctx.strokeStyle = rainCfg.color;

    // Group drops by rounded opacity for fewer state changes
    const opacityGroups = new Map();
    for (let i = 0, len = drops.length; i < len; i++) {
        const d = drops[i];
        d.y += d.speed;
        const dy = d.y + d.length;
        // Card splash
        if (!d.hitCard && isOnCard(d.x, dy)) {
            d.hitCard = true;
            if (Math.random() > 0.7) {
                const particles = [];
                for (let j = 0; j < 4; j++) particles.push({ angle: Math.random() * TWO_PI, speed: 1 + Math.random() * 2, size: 2 + Math.random() * 2, life: 1 });
                splashes[splashCount++] = { x: d.x, y: dy, radius: 0, opacity: 0.6, isBottom: false, particles };
            }
        }
        // Bottom splash
        if (!d.hitBottom && dy >= h) {
            d.hitBottom = true;
            if (Math.random() > 0.4) {
                const splashY = h - 2;
                const pCount = 5 + ((Math.random() * 4) | 0);
                const particles = [];
                for (let j = 0; j < pCount; j++) particles.push({ vx: (Math.random() - 0.5) * 4, vy: -(2 + Math.random() * 4), size: 1.5 + Math.random() * 2, life: 1, gravity: 0.15 });
                splashes[splashCount++] = { x: d.x, y: splashY, radius: 0, opacity: 0.7, isBottom: true, particles };
            }
        }
        if (d.y > h) { d.y = -d.length; d.x = Math.random() * w; d.hitCard = false; d.hitBottom = false; }
        // Group by quantized opacity
        const oKey = (d.opacity * 10 + 0.5) | 0;
        let grp = opacityGroups.get(oKey);
        if (!grp) { grp = []; opacityGroups.set(oKey, grp); }
        grp.push(d);
    }
    // Draw drops in batched strokes per opacity
    opacityGroups.forEach((grp, oKey) => {
        ctx.globalAlpha = oKey / 10;
        ctx.beginPath();
        for (let i = 0, len = grp.length; i < len; i++) {
            const d = grp[i];
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x, d.y + d.length);
        }
        ctx.stroke();
    });

    // --- Update and draw splashes (in-place compaction, no new array) ---
    let writeIdx = 0;
    for (let i = 0; i < splashCount; i++) {
        const s = splashes[i];
        let keep = false;
        if (s.isBottom) {
            s.opacity -= 0.025;
            if (s.opacity > 0) {
                ctx.fillStyle = rainCfg.splashColor;
                const pts = s.particles;
                for (let j = 0, plen = pts.length; j < plen; j++) {
                    const p = pts[j];
                    if (p.life > 0) {
                        keep = true;
                        p.life -= 0.035;
                        p.vy += p.gravity;
                        p.vx *= 0.99;
                        const factor = 1 - p.life;
                        const px = s.x + p.vx * factor * 15;
                        const py = s.y + p.vy * factor * 12;
                        ctx.globalAlpha = s.opacity * p.life;
                        ctx.beginPath();
                        ctx.arc(px, py, p.size * p.life, 0, TWO_PI);
                        ctx.fill();
                    }
                }
                if (s.radius < 20) {
                    s.radius += 1.5;
                    ctx.strokeStyle = rainCfg.splashColor;
                    ctx.globalAlpha = s.opacity * 0.5;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.ellipse(s.x, s.y, s.radius, s.radius * 0.3, 0, 0, TWO_PI);
                    ctx.stroke();
                }
            }
        } else {
            s.radius += 2; s.opacity -= 0.03;
            if (s.opacity > 0) {
                keep = true;
                ctx.strokeStyle = rainCfg.splashColor; ctx.globalAlpha = s.opacity; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, TWO_PI); ctx.stroke();
                ctx.fillStyle = rainCfg.splashColor;
                const pts = s.particles;
                for (let j = 0, plen = pts.length; j < plen; j++) {
                    const p = pts[j];
                    if (p.life > 0) {
                        p.life -= 0.05;
                        ctx.globalAlpha = s.opacity * p.life; ctx.beginPath();
                        ctx.arc(s.x + Math.cos(p.angle) * s.radius * p.speed * 0.5, s.y + Math.sin(p.angle) * s.radius * p.speed * 0.3 - s.radius * 0.5, p.size * p.life, 0, TWO_PI); ctx.fill();
                    }
                }
            }
        }
        if (keep) splashes[writeIdx++] = s;
    }
    splashCount = writeIdx;

    ctx.globalAlpha = 1;
    ctx.lineWidth = rainCfg.dropWidth;
    ctx.strokeStyle = rainCfg.color;
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
    // Pre-allocate splash array
    splashes = new Array(256);
    splashCount = 0;
    for (let i = 0; i < rainCfg.dropCount; i++) drops.push(createDrop());
    updateCardRects();
    // Throttled resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { rainResize(); updateCardRects(); }, 100);
    }, { passive: true });
    // Throttled scroll for card rects
    window.addEventListener('scroll', () => {
        if (!rainScrollThrottle) {
            rainScrollThrottle = true;
            requestAnimationFrame(() => { updateCardRects(); rainScrollThrottle = false; });
        }
    }, { passive: true });
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
            const links = config.header.links;
            for (let i = 0, len = links.length; i < len; i++) {
                const link = links[i];
                const a = document.createElement('a');
                a.href = link.url;
                a.innerHTML = link.icon ? `<i class="${link.icon}"></i> ${link.text}` : link.text;
                if (link.onclick) a.setAttribute('onclick', link.onclick);
                if (link.url && !link.url.startsWith('#')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
                nav.appendChild(a);
            }
        }
    }
}

function renderHomepageCards(cards) {
    const homepage = document.getElementById('homepage');
    if (!homepage) return;
    homepage.innerHTML = '';
    const order = window.siteConfig?.homepage?.cardOrder || [];
    for (let oi = 0, olen = order.length; oi < olen; oi++) {
        const type = order[oi];
        const card = cards.find(c => c.type === type);
        if (!card) continue;
        const s = document.createElement('section');
        s.className = `card ${type}`;
        switch (type) {
            case 'clock':
                s.innerHTML = '<div class="clock"><div class="clock-date"></div><div class="clock-time"></div></div><div class="hitokoto-container"></div>';
                break;
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
    }
    // 所有卡片已插入 DOM，刷新时钟缓存使其包含新建的主页时钟元素
    refreshClockEls();
    updateClock();
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
        const ids = ['busuanzi_value_site_pv', 'busuanzi_value_site_uv'];
        for (let i = 0; i < ids.length; i++) { const el = document.getElementById(ids[i]); if (el) el.style.display = ''; }
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
        initJinrishici();
        if (navData.cards) renderCards(navData.cards);
        initNavigation();
    });
    initSearch();
    initGridEvents();
});
