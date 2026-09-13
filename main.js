/* ===== Background Image ===== */
const bgState = { images: [], currentIndex: 0, isTransitioning: false, timer: null, interval: 30000, apiUrls: new Set(), displayUrls: {} };
let bgVisibilityHandler;
const preloadCache = new Set();
const BG_FADE_MS = 800;
let bgContainer, bottomLayer, topLayer;

function createLayers() {
    if (bgContainer) return;
    bgContainer = document.createElement('div');
    bgContainer.id = 'bg-container';
    bgContainer.style.cssText = 'position:fixed;inset:0;z-index:-10;overflow:hidden;pointer-events:none;background:#1a1a2e';
    // will-change + translateZ 将图层提升到合成器，淡入淡出不再走主线程重绘
    const css = 'position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:1;will-change:opacity,transform;transform:translateZ(0);contain:layout paint style';
    bottomLayer = document.createElement('div');
    bottomLayer.style.cssText = css;
    topLayer = document.createElement('div');
    topLayer.style.cssText = css + ';transition:opacity 0.8s ease-in-out, transform 9s linear';
    bgContainer.append(bottomLayer, topLayer);
    document.body.insertBefore(bgContainer, document.body.firstChild);
}

function renderHeaderApp(config) {
    const mount = document.getElementById('header-app');
    if (!mount || !window.Vue) return;
    headerApp?.unmount();
    const links = config?.header?.links || [];
    const app = Vue.createApp({
        data: () => ({
            title: config?.header?.title || config?.siteInfo?.title || 'Homepage',
            motto: config?.siteInfo?.motto || '',
            links,
            section: pageState.section,
            themeId: getSiteTheme() || 'glass',
            dark: isDark(),
            themeMenuOpen: false,
            bgFilterId: getBgFilter() || 'none',
            animId: getAnimation() || 'rain',
            siteThemes: SITE_THEMES,
            bgFilters: BG_FILTERS,
            animList: ANIMATIONS
        }),
        mounted() {
            this.sectionHandler = event => { this.section = event.detail; };
            document.addEventListener('sectionchange', this.sectionHandler);
            this.siteThemeHandler = event => { this.themeId = event.detail; };
            document.addEventListener('sitethemechange', this.siteThemeHandler);
            this.bgFilterHandler = event => { this.bgFilterId = event.detail; };
            document.addEventListener('bgfilterchange', this.bgFilterHandler);
            this.animHandler = event => { this.animId = event.detail; };
            document.addEventListener('animchange', this.animHandler);
            this.darkModeHandler = event => { this.dark = event.detail; };
            document.addEventListener('darkmodechange', this.darkModeHandler);
            this.outsideHandler = event => {
                if (!event.target.closest?.('.theme-menu')) this.themeMenuOpen = false;
            };
            document.addEventListener('click', this.outsideHandler);
            this.escHandler = event => { if (event.key === 'Escape') this.themeMenuOpen = false; };
            document.addEventListener('keydown', this.escHandler);
        },
        beforeUnmount() {
            document.removeEventListener('sectionchange', this.sectionHandler);
            document.removeEventListener('sitethemechange', this.siteThemeHandler);
            document.removeEventListener('bgfilterchange', this.bgFilterHandler);
            document.removeEventListener('animchange', this.animHandler);
            document.removeEventListener('darkmodechange', this.darkModeHandler);
            document.removeEventListener('click', this.outsideHandler);
            document.removeEventListener('keydown', this.escHandler);
        },
        methods: {
            navigate(link) {
                const section = link.onclick?.match(/showSection\('([^']+)'\)/)?.[1];
                if (section) showSection(section);
            },
            toggleTheme() {
                toggleDarkMode();
            },
            toggleThemeMenu() {
                this.themeMenuOpen = !this.themeMenuOpen;
            },
            selectTheme(id) {
                applySiteTheme(id);
                this.themeMenuOpen = false;
            },
            selectBgFilter(id) {
                applyBgFilter(id);
            },
            selectAnimation(id) {
                applyAnimation(id);
            }
        },
        template: `
            <div class="header-content">
                <div class="header-brand">
                    <h1>{{ section === 'navpage' ? (configNavTitle || 'Navigation') : title }}</h1>
                    <p class="motto">{{ motto }}</p>
                </div>
                <div class="header-nav-wrapper">
                    <nav class="header-nav" role="navigation" aria-label="主导航">
                        <a v-for="link in links" :key="link.text" :href="link.url"
                            :target="link.url && !link.url.startsWith('#') ? '_blank' : undefined"
                            :rel="link.url && !link.url.startsWith('#') ? 'noopener noreferrer' : undefined"
                            :class="{ active: (section === 'homepage' && link.url === '#home') || (section === 'navpage' && link.url === '#nav') }"
                            @click="navigate(link)">
                            <i v-if="link.icon" :class="link.icon"></i> {{ link.text }}
                        </a>
                    </nav>
                    <button class="header-dark-toggle" @click="toggleTheme"
                        aria-label="切换暗色模式" title="切换暗色模式">
                        <i class="fas" :class="dark ? 'fa-sun' : 'fa-moon'"></i>
                    </button>
                    <div class="theme-menu">
                        <button class="header-dark-toggle" @click="toggleThemeMenu"
                            aria-label="主题与背景滤镜" title="主题与背景滤镜"
                            aria-haspopup="menu" :aria-expanded="themeMenuOpen">
                            <i class="fas fa-palette"></i>
                        </button>
                        <div class="theme-menu-panel" v-show="themeMenuOpen" role="menu">
                            <div class="theme-menu-group">主题</div>
                            <button v-for="t in siteThemes" :key="t.id" type="button" role="menuitemradio"
                                :aria-checked="themeId === t.id" class="theme-menu-item"
                                :class="{ active: themeId === t.id }" @click="selectTheme(t.id)">
                                <span class="theme-menu-swatch"><span v-for="c in t.colors" :key="c"
                                    class="swatch-dot" :style="{ background: c }"></span>{{ t.name }}</span>
                                <i v-if="themeId === t.id" class="fas fa-check"></i>
                            </button>
                            <div class="theme-menu-group">背景滤镜</div>
                            <button v-for="f in bgFilters" :key="f.id" type="button" role="menuitemradio"
                                :aria-checked="bgFilterId === f.id" class="theme-menu-item"
                                :class="{ active: bgFilterId === f.id }" @click="selectBgFilter(f.id)">
                                <span>{{ f.name }}</span><i v-if="bgFilterId === f.id" class="fas fa-check"></i>
                            </button>
                            <div class="theme-menu-group">动画</div>
                            <button v-for="a in animList" :key="a.id" type="button" role="menuitemradio"
                                :aria-checked="animId === a.id" class="theme-menu-item"
                                :class="{ active: animId === a.id }" @click="selectAnimation(a.id)">
                                <span class="theme-menu-swatch"><i :class="a.icon" style="width:18px;text-align:center;font-size:0.8rem;color:var(--muted-color)"></i>{{ a.name }}</span>
                                <i v-if="animId === a.id" class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="header-indicator"></div>
        `,
        computed: {
            configNavTitle() {
                return config?.header?.navTitle || 'Navigation';
            }
        }
    });
    headerApp = app;
    app.mount(mount);
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
        img.decoding = 'async';
        if ('fetchPriority' in img) img.fetchPriority = 'low'; // 背景图不与关键资源抢占带宽
        img.onload = () => {
            if (!isApiUrl(src)) preloadCache.add(src);
            // 记录预加载实际使用的地址（API 图带时间戳），展示时复用同一地址避免二次下载
            bgState.displayUrls[src] = loadUrl;
            // 提前异步解码，消除大图首次绘制时的主线程解码卡顿
            const done = () => res(true);
            if (img.decode) img.decode().then(done, done); else done();
        };
        img.onerror = () => res(false);
        img.src = loadUrl;
    });
}

function preloadWithTimeout(src, ms = 8000) {
    // 壁纸源加载超时：8 秒内未完成视为失败，触发多源故障转移
    return Promise.race([preloadImage(src), new Promise(res => setTimeout(() => res(false), ms))]);
}

async function switchBg(index, animate = true, attempted = new Set()) {
    if (bgState.isTransitioning || !bgState.images.length) return;
    if (attempted.size >= bgState.images.length) return; // 所有源都失败，保持当前背景
    index = ((index % bgState.images.length) + bgState.images.length) % bgState.images.length;
    if (attempted.has(index)) {
        for (let i = 1; i < bgState.images.length; i++) {
            const cand = (index + i) % bgState.images.length;
            if (!attempted.has(cand)) return switchBg(cand, animate, attempted);
        }
        return;
    }
    const src = bgState.images[index];
    attempted.add(index);
    bgState.isTransitioning = true;
    if (!(await preloadWithTimeout(src))) {
        // 当前源失败（下载失败或超时），自动故障转移到下一张
        bgState.isTransitioning = false;
        return switchBg(index + 1, animate, attempted);
    }
    // 复用预加载时的地址，杜绝展示阶段的二次下载
    const displayUrl = bgState.displayUrls[src] || (isApiUrl(src) ? getCacheBustedUrl(src) : src);
    if (animate) {
        bottomLayer.style.backgroundImage = `url('${displayUrl}')`;
        void bottomLayer.offsetHeight;
        topLayer.style.opacity = '0'; // 旧图淡出，露出底部新图
        await new Promise(r => setTimeout(r, BG_FADE_MS + 100));
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = `url('${displayUrl}')`;
        topLayer.style.transform = 'scale(1)';
        void topLayer.offsetHeight;
        topLayer.style.transition = 'opacity 0.8s ease-in-out, transform 9s linear';
        topLayer.style.opacity = '1';
        requestAnimationFrame(() => { topLayer.style.transform = 'scale(1.05)'; }); // Ken Burns 缓推
    } else {
        topLayer.style.transition = 'none';
        topLayer.style.backgroundImage = `url('${displayUrl}')`;
        topLayer.style.transform = 'scale(1)';
        void topLayer.offsetHeight;
        topLayer.style.transition = 'opacity 0.8s ease-in-out, transform 9s linear';
        topLayer.style.opacity = '1';
        requestAnimationFrame(() => { topLayer.style.transform = 'scale(1.05)'; }); // Ken Burns 缓推
    }
    bgState.currentIndex = index;
    bgState.isTransitioning = false;
    // 空闲时段再预加载下一张，避免与关键资源抢占带宽
    const nextSrc = bgState.images[(index + 1) % bgState.images.length];
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 200));
    idle(() => preloadImage(nextSrc));
    try { localStorage.setItem('bgIndex', index); } catch {}
}

function startBgAutoPlay() { stopBgAutoPlay(); if (bgState.images.length > 1) bgState.timer = setInterval(() => switchBg((bgState.currentIndex + 1) % bgState.images.length), bgState.interval); }
function stopBgAutoPlay() { if (bgState.timer) { clearInterval(bgState.timer); bgState.timer = null; } }

function initBackgroundImage(config) {
    if (!config?.images?.length) return;
    stopBgAutoPlay();
    bgState.images = config.images;
    bgState.interval = config.interval || 30000;
    bgState.apiUrls = new Set(config.api || []);
    try { bgState.currentIndex = (parseInt(localStorage.getItem('bgIndex')) || 0) % bgState.images.length; } catch { bgState.currentIndex = 0; }
    document.body.style.backgroundImage = 'none';
    createLayers();
    initBgFilter();
    switchBg(bgState.currentIndex, false);
    startBgAutoPlay();
    if (bgVisibilityHandler) document.removeEventListener('visibilitychange', bgVisibilityHandler);
    bgVisibilityHandler = () => document.hidden ? stopBgAutoPlay() : startBgAutoPlay();
    document.addEventListener('visibilitychange', bgVisibilityHandler, { passive: true });
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
let dateF, timeF, jinrishiciTimer, clockTimer, runtimeTimer, clockVisibilityHandler;
let clockEls = null, lastDateStr = '', lastTimeStr = '';

function updateClock() {
    // 注意：只选 div.clock —— clock 卡片的 <section> 自身也带 clock 类型类名，
    // 若用 '.clock' 会把 section 一起选中，innerHTML 初始化就会清空 section 的
    // 所有 children（含里面的 .clock div 与 .hitokoto-container），导致诗词行消失。
    if (!clockEls) clockEls = [...document.querySelectorAll('div.clock')].map(el => ({ el, dateEl: null, timeEl: null }));
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
        const c = clockEls[i];
        if (!c.dateEl) {
            c.el.innerHTML = '<div class="clock-date"></div><div class="clock-time"></div>';
            c.dateEl = c.el.querySelector('.clock-date');
            c.timeEl = c.el.querySelector('.clock-time');
        }
        if (dateChanged) c.dateEl.textContent = d;
        if (timeChanged) c.timeEl.textContent = t;
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
    if (clockTimer) clearInterval(clockTimer);
    if (clockVisibilityHandler) document.removeEventListener('visibilitychange', clockVisibilityHandler);
    updateClock();
    clockTimer = setInterval(updateClock, 1000);
    clockVisibilityHandler = () => {
        clearInterval(clockTimer);
        if (!document.hidden) { updateClock(); clockTimer = setInterval(updateClock, 1000); }
    };
    document.addEventListener('visibilitychange', clockVisibilityHandler, { passive: true });
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

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setTheme(dark) {
    const h = document.documentElement;
    h.classList.toggle('dark-mode', dark);
    h.classList.toggle('light', !dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? THEME.dark : THEME.light);
    document.dispatchEvent(new CustomEvent('darkmodechange', { detail: dark }));
}

function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    const dark = saved !== null ? saved === 'true' : matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(dark);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => setTheme(e.matches));
}

function toggleDarkMode() {
    setTheme(!isDark());
    localStorage.setItem('darkMode', isDark());
}

function handleScroll() {
    const y = scrollY;
    if (y < 50) headerEl.classList.remove('header-hidden');
    else if (y > lastScrollY + 10) headerEl.classList.add('header-hidden');
    else if (y < lastScrollY - 10) headerEl.classList.remove('header-hidden');
    lastScrollY = y;
}

/* ===== Site Theme (Stage 4) ===== */
const SITE_THEMES = [
    { id: 'glass', name: '玻璃卡片', colors: ['#8fb7ff', '#c5b3ff', '#7de3ff'] },
    { id: 'minimal', name: '极简素白', colors: ['#ffffff', '#18181b', '#a1a1aa'] },
    { id: 'newspaper', name: '简约报纸', colors: ['#f6f3ec', '#1c1a17', '#8c2f1c'] },
    { id: 'terminal', name: '终端极客', colors: ['#eef2ee', '#16a34a', '#060a07'] }
];

function getSiteTheme() {
    let id = null;
    try { id = localStorage.getItem('siteTheme'); } catch {}
    return SITE_THEMES.some(theme => theme.id === id) ? id : '';
}

function applySiteTheme(id, persist = true) {
    const theme = SITE_THEMES.find(t => t.id === id) || SITE_THEMES[0];
    document.documentElement.setAttribute('data-theme', theme.id);
    // 仅在访客手动选择时持久化；初始化应用配置默认值时不写入，
    // 这样站长修改 config.json 的 theme.default 后对所有未手动选择的访客生效。
    if (persist) {
        try { localStorage.setItem('siteTheme', theme.id); } catch {}
    }
    // 用户未手动选过滤镜时，跟随主题的默认背景滤镜
    if (!getBgFilter()) applyBgFilter(getThemeBgFilter(theme.id) || 'none', false);
    document.dispatchEvent(new CustomEvent('sitethemechange', { detail: theme.id }));
    return theme.id;
}

function initSiteTheme(defaultId) {
    applySiteTheme(getSiteTheme() || (SITE_THEMES.some(t => t.id === defaultId) ? defaultId : SITE_THEMES[0].id), false);
}

/* ===== Background Filters ===== */
const BG_FILTERS = [
    { id: 'none', name: '原图' },
    { id: 'blur', name: '模糊', filter: 'blur(16px)', scale: 1.08 },
    { id: 'bright', name: '提亮', filter: 'brightness(1.18) saturate(1.08)' },
    { id: 'dim', name: '压暗', filter: 'brightness(0.72) saturate(0.95)' },
    { id: 'mono', name: '黑白', filter: 'grayscale(1) contrast(1.05)' },
    { id: 'sepia', name: '怀旧', filter: 'sepia(0.5) saturate(1.1)' },
    { id: 'vivid', name: '鲜艳', filter: 'saturate(1.55) contrast(1.08)' }
];

function getBgFilter() {
    let id = null;
    try { id = localStorage.getItem('bgFilter'); } catch {}
    return BG_FILTERS.some(f => f.id === id) ? id : '';
}

function getThemeBgFilter(themeId) {
    const t = window.siteConfig?.theme || {};
    const map = t.bgFilters;
    if (map && BG_FILTERS.some(f => f.id === map[themeId])) return map[themeId];
    // 未单独列出的主题回退到全局默认滤镜
    if (t.bgFilter && BG_FILTERS.some(f => f.id === t.bgFilter)) return t.bgFilter;
    return '';
}

function applyBgFilter(id, persist = true) {
    const preset = BG_FILTERS.find(f => f.id === id) || BG_FILTERS[0];
    if (bgContainer) {
        bgContainer.style.filter = preset.filter || '';
        bgContainer.style.transform = preset.scale ? `scale(${preset.scale})` : '';
    }
    if (persist) {
        try { localStorage.setItem('bgFilter', preset.id); } catch {}
    }
    document.dispatchEvent(new CustomEvent('bgfilterchange', { detail: preset.id }));
    return preset.id;
}

function initBgFilter() {
    applyBgFilter(getBgFilter() || getThemeBgFilter(document.documentElement.getAttribute('data-theme') || 'glass') || 'none', false);
}

function updateNavActive(sectionId) {
    const links = document.querySelectorAll('.header-nav a');
    for (let i = 0, len = links.length; i < len; i++) {
        const a = links[i];
        const href = a.getAttribute('href') || '';
        a.classList.toggle('active',
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
}

/* ===== Navigation ===== */
let navTimer, currentCard = 1, mainEl, navHeaderH1;
const pageState = { section: 'homepage' };
let homepageApp, navigationApp, navigationView, footerApp, headerApp, loadingApp;

function showCard(n) {
    const id = `card${n}`;
    currentCard = n;
    // 以 Vue 响应式状态为唯一真相源：按钮 .current 与面板 .active/.current 由模板 :class 驱动。
    // 悬停路径原来直接改 DOM：一是模板按钮根本没有 data-card 属性（query 永远落空，按钮高亮不变）；
    // 二是改完的类名会在下次 Vue 渲染时被按旧 currentCard 覆盖回去，造成“切过去了但没激活”。
    if (navigationView) { navigationView.currentCard = id; return; }
    // 降级路径（无 Vue 时）：直接操作 DOM
    const items = document.querySelectorAll('.cardItem');
    for (let i = 0, len = items.length; i < len; i++) items[i].classList.remove('active', 'current');
    document.getElementById(id)?.classList.add('active', 'current');
    const buttons = document.querySelectorAll('.navButton');
    for (let i = 0, len = buttons.length; i < len; i++)
        buttons[i].classList.toggle('current', buttons[i].dataset.card == n);
}

/* ===== Nav favicons（先显示占位图标，首访完成后自动抓取各站真实图标并缓存本地） ===== */
const NAV_FAVICON_KEY = 'navFavicons';
const NAV_ICON_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#475569"/><circle cx="16" cy="16" r="8.5" fill="none" stroke="#e2e8f0" stroke-width="2.5"/><path d="M16 7v18M8.5 16h15" stroke="#e2e8f0" stroke-width="2.5"/></svg>');

function getNavFaviconCache() {
    try { return JSON.parse(localStorage.getItem(NAV_FAVICON_KEY)) || {}; } catch { return {}; }
}

function saveNavFavicon(host, url) {
    const cache = getNavFaviconCache();
    cache[host] = url;
    try { localStorage.setItem(NAV_FAVICON_KEY, JSON.stringify(cache)); } catch {}
}

function deleteNavFavicon(host) {
    const cache = getNavFaviconCache();
    delete cache[host];
    try { localStorage.setItem(NAV_FAVICON_KEY, JSON.stringify(cache)); } catch {}
}

function navFaviconSources(host) {
    return [
        `https://icons.duckduckgo.com/ip3/${host}.ico`,
        `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
        `https://${host}/favicon.ico`
    ];
}

function probeNavFavicon(url) {
    return new Promise(res => {
        const img = new Image();
        const timer = setTimeout(() => { img.src = ''; res(null); }, 8000);
        img.onload = () => { clearTimeout(timer); res(img.naturalWidth >= 16 ? url : null); };
        img.onerror = () => { clearTimeout(timer); res(null); };
        img.src = url;
    });
}

function applyNavIcons() {
    const cache = getNavFaviconCache();
    const pending = [];
    document.querySelectorAll('.cardItem .grid-item').forEach(a => {
        const img = a.querySelector('img.icon');
        if (!img || !a.href) return;
        let host = '';
        try { host = new URL(a.href).hostname; } catch { return; }
        img.dataset.host = host;
        // 占位图标：nav.json 指定图标，缺省用通用地球占位
        const fallback = img.dataset.iconFallback || NAV_ICON_PLACEHOLDER;
        // 真实图标加载失败时回退占位图标，并清除缓存条目以便下次重试
        img.onerror = () => {
            img.onerror = null;
            deleteNavFavicon(host);
            img.src = fallback;
        };
        const cached = cache[host];
        if (cached) { img.src = cached; return; }
        pending.push({ img, host, fallback });
    });
    if (!pending.length) return;
    const run = () => pending.forEach(({ img, host, fallback }) => {
        const sources = navFaviconSources(host);
        const tryNext = i => {
            if (i >= sources.length) return; // 所有源都失败，保持占位图标
            probeNavFavicon(sources[i]).then(found => {
                if (found) {
                    img.onerror = () => { img.onerror = null; deleteNavFavicon(host); img.src = fallback; };
                    img.src = found;
                    saveNavFavicon(host, found);
                } else tryNext(i + 1);
            });
        };
        tryNext(0);
    });
    (window.requestIdleCallback || (cb => setTimeout(cb, 800)))(run);
}

function renderNavigationApp(cards) {
    const mount = document.getElementById('navpage-app');
    if (!mount || !window.Vue) return;
    navigationApp?.unmount();
    navigationView = null;
    // 已缓存的真实图标放入独立字段；nav.json 的图标保留为回退占位
    const favicons = getNavFaviconCache();
    cards.forEach(c => c.items.forEach(i => {
        try {
            const host = new URL(i.url, location.href).hostname;
            if (favicons[host]) { i.cachedFavicon = favicons[host]; i.iconFallback = i.icon || NAV_ICON_PLACEHOLDER; }
        } catch {}
    }));
    const app = Vue.createApp({
        data: () => ({
            cards,
            currentCard: cards[0]?.id || '',
            engine: localStorage.getItem('lastSelectedEngine') || 'Google',
            searchTerm: '',
            optionsOpen: false,
            placeholderIcon: NAV_ICON_PLACEHOLDER
        }),
        mounted() {
            refreshClockEls();
            updateClock();
        },
        methods: {
            selectCard(id) {
                this.currentCard = id;
                currentCard = Number(id.replace('card', '')) || 1;
            },
            startTimer(card) {
                startTimer(card);
            },
            clearTimer() {
                clearTimer();
            },
            search() {
                const term = this.searchTerm.trim();
                const url = SEARCH_URLS[this.engine];
                if (!term || !url) return;
                window.open(url + encodeURIComponent(term), '_blank', 'noopener,noreferrer');
                localStorage.setItem('lastSelectedEngine', this.engine);
            },
            selectEngine(engine) {
                this.engine = engine;
                this.optionsOpen = false;
                localStorage.setItem('lastSelectedEngine', engine);
            }
        },
        template: `
            <section class="card navigation-card">
                <div class="clock"></div>
                <div class="hitokoto-container"></div><br>
                <div class="search-container">
                    <div class="custom-select">
                        <button type="button" class="select-styled" aria-haspopup="listbox"
                            :aria-expanded="optionsOpen" @click="optionsOpen = !optionsOpen">{{ engine }}</button>
                        <div class="search-options" id="searchOptions" :class="{ 'is-open': optionsOpen }">
                            <div v-for="(_, name) in searchUrls" :key="name" class="search-option"
                                role="option" tabindex="0" @click="selectEngine(name)"
                                @keydown.enter="selectEngine(name)">{{ name }}</div>
                        </div>
                    </div>
                    <input v-model="searchTerm" class="search-input" placeholder="输入搜索词"
                        aria-label="输入搜索词" @keydown.enter="search">
                    <button type="button" class="search-button" aria-label="搜索" @click="search">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
                <div class="cardContainer">
                    <div class="navButtons">
                        <button v-for="card in cards" :key="card.id" type="button" class="navButton"
                            :class="{ current: currentCard === card.id }" @click="selectCard(card.id)"
                            @mouseenter="startTimer(Number(card.id.replace('card', '')))"
                            @mouseleave="clearTimer">{{ card.title }}</button>
                    </div>
                    <div v-for="card in cards" :key="card.id" class="cardItem"
                        :id="card.id" :class="{ active: currentCard === card.id, current: currentCard === card.id }">
                        <div class="grid-container">
                            <a v-for="item in card.items" :key="item.url" :href="item.url" target="_blank"
                                rel="noopener noreferrer" class="grid-item">
                                <img class="icon" :src="item.cachedFavicon || item.icon || placeholderIcon" :data-icon-fallback="item.icon || placeholderIcon" :alt="item.name" loading="lazy">
                                <span>{{ item.name }}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        `,
        computed: {
            searchUrls() {
                return SEARCH_URLS;
            }
        }
    });
    navigationApp = app;
    navigationView = app.mount(mount);
    // 首访完成后（空闲时段）抓取各站真实图标并缓存到 localStorage
    const idle = window.requestIdleCallback || (cb => setTimeout(cb, 1200));
    idle(() => applyNavIcons());
}

function showSection(id) {
    const section = id === 'navpage' ? 'navpage' : 'homepage';
    pageState.section = section;
    const hp = document.getElementById('homepage'), np = document.getElementById('navpage');
    if (hp) hp.style.display = section === 'homepage' ? 'block' : 'none';
    if (np) np.style.display = section === 'navpage' ? 'block' : 'none';
    if (navHeaderH1) {
        const c = window.siteConfig?.header;
        navHeaderH1.textContent = section === 'navpage' ? (c?.navTitle || 'Navigation') : (c?.title || 'Homepage');
    }
    if (mainEl) mainEl.style.columnCount = section === 'navpage' ? '1' : '';
    updateNavActive(section);
    document.dispatchEvent(new CustomEvent('sectionchange', { detail: section }));
    window.scrollTo({ top: 0 });
}

function startTimer(n) { navTimer = setTimeout(() => showCard(n), 500); }
function clearTimer() { clearTimeout(navTimer); }

function handleHash() {
    const h = location.hash.substring(1);
    showSection(h === 'nav' || h === 'home' ? h + 'page' : 'homepage');
}

function initNavigation() {
    mainEl = document.querySelector('main');
    navHeaderH1 = document.querySelector('header h1');
    window.addEventListener('hashchange', handleHash, { passive: true });
    handleHash();
}

function disposeVueApps() {
    stopBgAutoPlay();
    stopCarouselAuto();
    if (clockTimer) { clearInterval(clockTimer); clockTimer = null; }
    if (clockVisibilityHandler) {
        document.removeEventListener('visibilitychange', clockVisibilityHandler);
        clockVisibilityHandler = null;
    }
    if (bgVisibilityHandler) {
        document.removeEventListener('visibilitychange', bgVisibilityHandler);
        bgVisibilityHandler = null;
    }
    if (jinrishiciTimer) { clearInterval(jinrishiciTimer); jinrishiciTimer = null; }
    if (runtimeTimer) { clearInterval(runtimeTimer); runtimeTimer = null; }
    // Meting 2.0.1 throws from disconnectedCallback when Vue unmounts it
    // before its internal player has finished initializing.
    if (!document.querySelector('meting-js')) homepageApp?.unmount();
    navigationApp?.unmount();
    footerApp?.unmount();
    headerApp?.unmount();
    loadingApp?.unmount();
    homepageApp = null;
    navigationApp = null;
    navigationView = null;
    footerApp = null;
    headerApp = null;
    loadingApp = null;
}

/* ===== Rain Effect (no wave/ripple interaction) ===== */
let rainCanvas, rainCtx, drops = [], splashes = [], splashCount = 0, rainAnimId, rainRunning = false, rainLast = 0;
const rainCfg = {
    dropCount: 80, dropSpeed: 8, dropLength: 35, dropWidth: 2.5,
    color: 'rgba(174, 194, 224, 0.5)',
    splashColor: 'rgba(174, 194, 224, 0.7)'
};

function rainResize() { if (rainCanvas) { rainCanvas.width = innerWidth; rainCanvas.height = innerHeight; } }
function createDrop() {
    return { x: Math.random() * rainCanvas.width, y: Math.random() * rainCanvas.height - rainCanvas.height,
        speed: rainCfg.dropSpeed + Math.random() * 5, length: rainCfg.dropLength + Math.random() * 10, opacity: 0.3 + Math.random() * 0.4,
        hitBottom: false };
}
function rainAnimate(ts) {
    if (!rainRunning) return;
    const now = ts || performance.now();
    const dt = rainLast ? Math.min((now - rainLast) / 16.7, 3) : 1; // 帧间隔补偿（以 60fps 为基准）
    rainLast = now;
    if (dt < 0.5) { rainAnimId = requestAnimationFrame(rainAnimate); return; } // 限 ~30fps，画布工作量减半
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
        d.y += d.speed * dt;
        const dy = d.y + d.length;
        // 溅落只在当前窗口底部出现
        if (!d.hitBottom && dy >= h) {
            d.hitBottom = true;
            if (Math.random() > 0.4) {
                const splashY = h - 2;
                const pCount = 5 + ((Math.random() * 4) | 0);
                const particles = [];
                for (let j = 0; j < pCount; j++) particles.push({ vx: (Math.random() - 0.5) * 4, vy: -(2 + Math.random() * 4), size: 1.5 + Math.random() * 2, life: 1, gravity: 0.15 });
                splashes[splashCount++] = { x: d.x, y: splashY, radius: 0, opacity: 0.7, particles };
            }
        }
        if (d.y > h) { d.y = -d.length; d.x = Math.random() * w; d.hitBottom = false; }
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

    // --- Update and draw bottom splashes only (in-place compaction, no new array) ---
    let writeIdx = 0;
    for (let i = 0; i < splashCount; i++) {
        const s = splashes[i];
        let keep = false;
        s.opacity -= 0.025 * dt;
        if (s.opacity > 0) {
            ctx.fillStyle = rainCfg.splashColor;
            const pts = s.particles;
            for (let j = 0, plen = pts.length; j < plen; j++) {
                const p = pts[j];
                if (p.life > 0) {
                    keep = true;
                    p.life -= 0.035 * dt;
                    p.vy += p.gravity * dt;
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
                s.radius += 1.5 * dt;
                ctx.strokeStyle = rainCfg.splashColor;
                ctx.globalAlpha = s.opacity * 0.5;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(s.x, s.y, s.radius, s.radius * 0.3, 0, 0, TWO_PI);
                ctx.stroke();
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

function startRain() { if (!rainRunning) { rainRunning = true; rainLast = 0; rainAnimate(); } }
function stopRain() { rainRunning = false; if (rainAnimId) { cancelAnimationFrame(rainAnimId); rainAnimId = null; } }

function initRainEffect(options = {}) {
    Object.assign(rainCfg, options);
    if (rainCanvas) return; // 已初始化过，仅更新配置
    rainCanvas = document.createElement('canvas');
    rainCanvas.id = 'rain-canvas';
    rainCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000';
    document.body.insertBefore(rainCanvas, document.body.firstChild);
    rainCtx = rainCanvas.getContext('2d');
    rainResize();
    // Pre-allocate splash array
    splashes = new Array(256);
    splashCount = 0;
    for (let i = 0; i < rainCfg.dropCount; i++) drops.push(createDrop());
    // Throttled resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(rainResize, 100);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopRain(); else if (currentAnim === 'rain' && !prefersReducedMotion()) startRain(); }, { passive: true });
    startRain();
}

/* ===== Background Animations (雨滴 / 代码流动) ===== */
const ANIMATIONS = [
    { id: 'none', name: '无', icon: 'fa-solid fa-ban' },
    { id: 'rain', name: '雨滴', icon: 'fa-solid fa-cloud-rain' },
    { id: 'code', name: '代码流动', icon: 'fa-solid fa-code' }
];
let currentAnim = null;

function getAnimation() {
    let id = null;
    try { id = localStorage.getItem('siteAnim'); } catch {}
    return ANIMATIONS.some(a => a.id === id) ? id : '';
}

function getAnimationDefault() {
    const t = window.siteConfig?.animation?.default;
    if (ANIMATIONS.some(a => a.id === t)) return t;
    return window.siteConfig?.rainEffect?.enabled === false ? 'none' : 'rain';
}

function applyAnimation(id, persist = true) {
    const anim = ANIMATIONS.find(a => a.id === id) || ANIMATIONS[0];
    currentAnim = anim.id;
    if (anim.id === 'rain') {
        stopCodeRain();
        initRainEffect(window.siteConfig?.rainEffect || {});
        rainCanvas.style.display = '';
        if (!prefersReducedMotion()) startRain();
    } else if (anim.id === 'code') {
        stopRain();
        if (rainCanvas) { rainCanvas.style.display = 'none'; if (rainCtx) rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height); }
        startCodeRain();
    } else {
        stopRain();
        stopCodeRain();
        if (rainCanvas) { rainCanvas.style.display = 'none'; if (rainCtx) rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height); }
    }
    if (persist) {
        try { localStorage.setItem('siteAnim', anim.id); } catch {}
    }
    document.dispatchEvent(new CustomEvent('animchange', { detail: anim.id }));
    return anim.id;
}

function initAnimation() {
    applyAnimation(getAnimation() || getAnimationDefault(), false);
}

/* ===== Code Rain（复用雨滴逻辑：等宽竖列字符匀速下落） ===== */
const CODE_CHARS = '01ABCDEFabcdef<>{}[]()$#*+-=;:|&%@?';
let codeCanvas, codeCtx, codeDrops = [], codeAnimId, codeRunning = false;
let codeVisHandler = null, codeThemeHandler = null;
const codeCfg = {
    fontSize: 15,
    dropCount: 80,   // 列数，对应雨滴 dropCount
    dropSpeed: 8,    // 下落速度 px/帧，对应雨滴 dropSpeed
    trail: 12,       // 每列尾迹字符数，对应雨滴 length
    color: '#4ade80',
    headColor: '#ffffff'
};

function codeResize() { if (codeCanvas) { codeCanvas.width = innerWidth; codeCanvas.height = innerHeight; } }
function randomCodeChar() { return CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0]; }
function createCodeDrop(initial) {
    const w = codeCanvas ? codeCanvas.width : innerWidth;
    const h = codeCanvas ? codeCanvas.height : innerHeight;
    const chars = new Array(codeCfg.trail);
    for (let i = 0; i < chars.length; i++) chars[i] = randomCodeChar();
    return {
        x: Math.random() * w,
        y: initial ? Math.random() * h - h : -chars.length * codeCfg.fontSize,
        speed: (codeCfg.dropSpeed + Math.random() * 5) * (2 / 3),
        opacity: 0.35 + Math.random() * 0.45,
        chars
    };
}

// 主题色只在启动 / 主题切换时读取一次，避免每帧 getComputedStyle
function refreshCodeColor() {
    try {
        codeCfg.color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim() || '#4ade80';
    } catch { codeCfg.color = '#4ade80'; }
    codeCfg.headColor = isDark() ? '#ffffff' : '#f8fafc';
}

function createCodeCanvas() {
    if (codeCanvas) return;
    codeCanvas = document.createElement('canvas');
    codeCanvas.id = 'code-canvas';
    codeCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000';
    document.body.insertBefore(codeCanvas, document.body.firstChild);
    codeCtx = codeCanvas.getContext('2d');
    codeResize();
    for (let i = 0; i < codeCfg.dropCount; i++) codeDrops.push(createCodeDrop(true));
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(codeResize, 100);
    }, { passive: true });
    codeVisHandler = () => {
        if (document.hidden) {
            if (codeAnimId) { cancelAnimationFrame(codeAnimId); codeAnimId = null; }
        } else if (currentAnim === 'code' && codeRunning && !codeAnimId) {
            codeLast = 0;
            codeAnimId = requestAnimationFrame(codeAnimate);
        }
    };
    document.addEventListener('visibilitychange', codeVisHandler, { passive: true });
    // 主题 / 明暗变化时刷新颜色，动画无需重启
    codeThemeHandler = () => { if (currentAnim === 'code') refreshCodeColor(); };
    document.addEventListener('sitethemechange', codeThemeHandler);
    document.addEventListener('darkmodechange', codeThemeHandler);
}

let codeLast = 0;
function codeAnimate(ts) {
    if (!codeRunning) return;
    const now = ts || performance.now();
    const dt = codeLast ? Math.min((now - codeLast) / 16.7, 3) : 1; // 帧间隔补偿（以 60fps 为基准）
    codeLast = now;
    if (dt < 0.5) { codeAnimId = requestAnimationFrame(codeAnimate); return; } // 限 ~30fps，绘制量减半
    const w = codeCanvas.width, h = codeCanvas.height;
    codeCtx.clearRect(0, 0, w, h);
    const ctx = codeCtx, fs = codeCfg.fontSize;
    ctx.font = fs + 'px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
    ctx.textBaseline = 'top';
    for (let i = 0, len = codeDrops.length; i < len; i++) {
        const d = codeDrops[i];
        d.y += d.speed * dt;
        // 落出屏幕后回到顶部（同雨滴重置逻辑）
        if (d.y - d.chars.length * fs > h) Object.assign(d, createCodeDrop(false));
        // 头部换新字符，尾迹偶尔闪烁其一
        d.chars[0] = randomCodeChar();
        if (Math.random() < 0.1) d.chars[(Math.random() * d.chars.length) | 0] = randomCodeChar();
    }
    // 尾迹：主题色，按行衰减（两次 fillStyle 切换即可）
    ctx.fillStyle = codeCfg.color;
    for (let i = 0, len = codeDrops.length; i < len; i++) {
        const d = codeDrops[i], n = d.chars.length;
        for (let j = 1; j < n; j++) {
            ctx.globalAlpha = d.opacity * (1 - j / n);
            ctx.fillText(d.chars[j], d.x, d.y - j * fs);
        }
    }
    // 头部：高亮
    ctx.fillStyle = codeCfg.headColor;
    for (let i = 0, len = codeDrops.length; i < len; i++) {
        const d = codeDrops[i];
        ctx.globalAlpha = d.opacity;
        ctx.fillText(d.chars[0], d.x, d.y);
    }
    ctx.globalAlpha = 1;
    codeAnimId = requestAnimationFrame(codeAnimate);
}

function startCodeRain() {
    if (currentAnim !== 'code') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    createCodeCanvas();
    codeCanvas.style.display = '';
    refreshCodeColor();
    codeResize();
    if (codeRunning && codeAnimId) return;
    codeRunning = true;
    if (codeAnimId) cancelAnimationFrame(codeAnimId);
    codeAnimId = requestAnimationFrame(codeAnimate);
}

function stopCodeRain() {
    codeRunning = false;
    if (codeAnimId) { cancelAnimationFrame(codeAnimId); codeAnimId = null; }
    if (codeCanvas && codeCtx) {
        codeCtx.clearRect(0, 0, codeCanvas.width, codeCanvas.height);
        codeCanvas.style.display = 'none';
    }
}

/* ===== Search ===== */
const SEARCH_URLS = {
    Google: 'https://www.google.com/search?q=', Bing: 'https://www.bing.com/search?q=',
    Yahoo: 'https://search.yahoo.com/search?p=', DuckDuckGo: 'https://duckduckgo.com/?q=',
    Baidu: 'https://www.baidu.com/s?wd=', Yandex: 'https://yandex.com/search/?text=',
    Ask: 'https://www.ask.com/web?q=', AOL: 'https://search.aol.com/aol/search?q=',
    WolframAlpha: 'https://www.wolframalpha.com/input/?i=', Dogpile: 'https://www.dogpile.com/search/web?q='
};

/* ===== Site Info ===== */
function initSiteWithConfig(config) {
    if (!config) return;
    if (config.siteInfo) {
        const title = config.siteInfo.title || document.title;
        const description = config.siteInfo.description || '';
        document.title = title;
        document.querySelector('meta[name="description"]')?.setAttribute('content', description);
        document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
        document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    }
}

function renderHomepageCards(cards) {
    const homepage = document.getElementById('homepage-app');
    if (!homepage || !window.Vue) return;
    homepageApp?.unmount();

    const app = Vue.createApp({
        data: () => ({ cards, order: window.siteConfig?.homepage?.cardOrder || [] }),
        computed: {
            orderedCards() {
                return this.order.map(type => this.cards.find(card => card.type === type))
                    .filter(card => card && card.enabled !== false);
            }
        },
        methods: { carouselPrev, carouselNext },
        mounted() {
            const carousel = this.cards.find(card => card.type === 'carousel');
            if (carousel) {
                setCarouselImages(carousel.images);
                setAutoSlideInterval(carousel.interval || 10000);
            }
            this.$nextTick(() => {
                markAppReady();
                refreshClockEls();
                updateClock();
                resetCarousel();
                refreshBusuanzi();
                const runtime = this.cards.find(card => card.type === 'website-info');
                if (runtime?.showRuntime && window.siteConfig?.siteInfo?.startDate)
                    updateRuntimeInfo(window.siteConfig.siteInfo.startDate);
                const comments = this.cards.find(card => card.type === 'comments');
                if (comments?.settings) {
                    const init = () => {
                        if (!window.twikoo) return;
                        twikoo.init({ envId: comments.settings.envId, el: '#tcomment' });
                        patchTwikooA11y();
                        observeTwikooA11y();
                    };
                    (twikooReady || Promise.resolve()).then(init, init);
                }
            });
        },
        template: `
            <homepage-card v-for="card in orderedCards" :key="card.type" :card="card"
                @carousel-prev="carouselPrev" @carousel-next="carouselNext"></homepage-card>
        `
    });
    app.component('homepage-card', {
        props: { card: { type: Object, required: true } },
        emits: ['carousel-prev', 'carousel-next'],
        template: `
            <section class="card homepage-card" :class="card.type">
                <template v-if="card.type === 'clock'">
                    <div class="clock"><div class="clock-date"></div><div class="clock-time"></div></div>
                    <div class="hitokoto-container"></div>
                </template>
                <template v-else-if="card.type === 'profile'">
                    <img :src="card.avatar" alt="头像" loading="lazy">
                    <div class="profile-info"><h2>{{ card.name }}</h2><p>{{ card.nickname }}</p></div>
                    <div class="buttons">
                        <external-link v-for="button in card.buttons" :key="button.type" :href="button.url"
                            class="button" :class="button.type + '-button'">
                            <i class="fas" :class="button.icon"></i> {{ button.text }}
                        </external-link>
                    </div>
                </template>
                <template v-else-if="card.type === 'projects'">
                    <card-heading :card="card"></card-heading><br>
                    <project-list :projects="card.list"></project-list>
                </template>
                <template v-else-if="card.type === 'education'">
                    <card-heading :card="card"></card-heading><br>
                    <ul><li>大学: {{ card.university }}</li><li>专业: {{ card.major }}</li><li>年份: {{ card.year }}</li></ul>
                </template>
                <template v-else-if="card.type === 'carousel'">
                    <card-heading :card="card"></card-heading><br><br>
                    <div class="carousel-card">
                        <button class="carousel-btn prev-btn" aria-label="上一张" @click="$emit('carousel-prev')"><i class="fas fa-chevron-left"></i></button>
                        <button class="carousel-btn next-btn" aria-label="下一张" @click="$emit('carousel-next')"><i class="fas fa-chevron-right"></i></button>
                        <div class="carousel-container"><img class="carousel-img" alt="轮播图片" style="opacity:0"></div>
                    </div>
                </template>
                <template v-else-if="card.type === 'contact'">
                    <card-heading :card="card"></card-heading><br>
                    <div class="contact-options">
                        <external-link :href="card.links.email" :external="false"><i class="fas fa-at"></i><span>电子邮件</span><br></external-link>
                        <external-link :href="card.links.github"><i class="fab fa-github"></i><span>Github</span><br></external-link>
                        <external-link :href="card.links.bilibili"><i class="fab fa-bilibili"></i><span>Bilibili</span></external-link>
                    </div>
                </template>
                <template v-else-if="card.type === 'music'">
                    <card-heading :card="card"></card-heading><br><br>
                    <div id="aplayer"><meting-js v-if="card.settings" v-bind="card.settings"></meting-js></div>
                </template>
                <template v-else-if="card.type === 'comments'">
                    <card-heading :card="card"></card-heading><br><div id="tcomment"></div>
                </template>
                <template v-else-if="card.type === 'website-info'">
                    <card-heading :card="card"></card-heading><br><ul>
                        <li v-if="card.showVisits"><strong>本站总访问量：</strong><span id="busuanzi_value_site_pv">加载中...</span> 次</li>
                        <li v-if="card.showVisits"><strong>本站总访客数：</strong><span id="busuanzi_value_site_uv">加载中...</span> 人</li>
                        <li v-if="card.showRuntime" id="runtime-info-container"><strong>网站运行时间：</strong>加载中...</li>
                    </ul>
                </template>
                <template v-else>
                    <card-heading v-if="card.title" :card="card"></card-heading><br>
                    <p v-if="card.content">{{ card.content }}</p>
                    <item-list v-if="card.items" :items="card.items"></item-list>
                </template>
            </section>
        `
    });
    app.component('card-heading', {
        props: { card: { type: Object, required: true } },
        template: '<h3><i class="fas" :class="card.icon"></i> {{ card.title }}</h3>'
    });
    app.component('external-link', {
        inheritAttrs: false,
        props: {
            href: { type: String, required: true },
            external: { type: Boolean, default: true }
        },
        template: '<a v-bind="$attrs" :href="href" :target="external ? \'_blank\' : undefined" :rel="external ? \'noopener noreferrer\' : undefined"><slot></slot></a>'
    });
    app.component('item-list', {
        props: { items: { type: Array, required: true } },
        template: '<ul><li v-for="item in items" :key="item.label">{{ item.label }}: {{ item.value }}</li></ul>'
    });
    app.component('project-list', {
        props: { projects: { type: Array, required: true } },
        template: `<ul class="project-list"><li v-for="project in projects" :key="project.url" class="project">
            <external-link :href="project.url"><i :class="project.icon"></i><span>{{ project.name }}</span></external-link>
            <p>{{ project.description }}</p>
        </li></ul>`
    });
    app.config.compilerOptions.isCustomElement = tag => tag === 'meting-js';
    homepageApp = app;
    app.mount(homepage);
}

function refreshBusuanzi() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/penndu@16.0.0/bsz.js'; // jsdelivr 域名证书有效，避免控制台证书错误
    script.defer = true;
    script.setAttribute('data-prefix', 'busuanzi_value');
    document.body.appendChild(script);
    script.onload = () => setTimeout(() => {
        const ids = ['busuanzi_value_site_pv', 'busuanzi_value_site_uv'];
        for (let i = 0; i < ids.length; i++) { const el = document.getElementById(ids[i]); if (el) el.style.display = ''; }
    }, 1000);
}

function renderFooterApp(config) {
    const mount = document.getElementById('footer-app');
    if (!mount || !window.Vue) return;
    footerApp?.unmount();
    const blog = config?.header?.links?.find(link => link.text === '博客')?.url || '#';
    const app = Vue.createApp({
        data: () => ({
            copyright: config?.footer?.copyright || '',
            startDate: config?.siteInfo?.startDate || '',
            runtimeDays: 0,
            blog,
            dark: isDark()
        }),
        mounted() {
            this.darkModeHandler = event => { this.dark = event.detail; };
            document.addEventListener('darkmodechange', this.darkModeHandler);
            this.updateRuntime();
            runtimeTimer = setInterval(() => this.updateRuntime(), 36e5);
        },
        beforeUnmount() {
            document.removeEventListener('darkmodechange', this.darkModeHandler);
            if (runtimeTimer) { clearInterval(runtimeTimer); runtimeTimer = null; }
        },
        methods: {
            updateRuntime() {
                const start = new Date(this.startDate);
                this.runtimeDays = Number.isNaN(start.getTime()) ? 0 : Math.floor((Date.now() - start) / 864e5);
            },
            goTo(section) {
                showSection(section);
            },
            toggleTheme() {
                toggleDarkMode();
            },
            scrollTop() {
                scrollToTop();
            }
        },
        template: `
            <div class="footer-content">
                <div class="footer-info">
                    <p class="copyright">{{ copyright }}</p>
                    <p class="runtime">✨ 网站已运行 <span>{{ runtimeDays }}</span> 天</p>
                </div>
                <div class="footer-links">
                    <a :href="blog" aria-label="博客" target="_blank" rel="noopener noreferrer">
                        <i class="fa-solid fa-blog"></i>
                    </a>
                    <a href="#home" @click.prevent="goTo('homepage')" aria-label="主页">
                        <i class="fas fa-home"></i>
                    </a>
                    <a href="#nav" @click.prevent="goTo('navpage')" aria-label="导航">
                        <i class="fas fa-compass"></i>
                    </a>
                    <button type="button" @click="toggleTheme" aria-label="切换暗色模式">
                        <i class="fas" :class="dark ? 'fa-sun' : 'fa-moon'"></i>
                    </button>
                    <button type="button" @click="scrollTop" aria-label="返回顶部">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                </div>
            </div>
        `
    });
    footerApp = app;
    app.mount(mount);
}

/* ===== Loading Component ===== */
/* 加载动画持续到内容就绪（app-ready 事件）为止，4 秒兜底强制淡出 */
function markAppReady() {
    document.body.classList.add('app-ready');
    document.dispatchEvent(new CustomEvent('app-ready'));
}

function renderLoadingApp() {
    const mount = document.getElementById('loading-app');
    if (!mount || !window.Vue) return;
    const app = Vue.createApp({
        data: () => ({ active: true, done: false }),
        methods: {
            dismiss() {
                if (this.done) return;
                this.done = true;
                this.active = false;
                this.removeTimer = setTimeout(() => {
                    app.unmount();
                    loadingApp = null;
                }, 500);
            }
        },
        mounted() {
            document.addEventListener('app-ready', this.dismiss, { once: true });
            this.dismissTimer = setTimeout(() => this.dismiss(), 4000); // 兜底：资源异常时不永久遮挡
        },
        beforeUnmount() {
            document.removeEventListener('app-ready', this.dismiss);
            clearTimeout(this.dismissTimer);
            clearTimeout(this.removeTimer);
        },
        template: `
            <div class="loading-container" :class="{ 'fade-out': !active }">
                <div class="loading-animation">
                    <div class="circle"></div><div class="circle"></div><div class="circle"></div>
                    <div class="shadow"></div><div class="shadow"></div><div class="shadow"></div>
                </div>
            </div>
        `
    });
    loadingApp = app;
    app.mount(mount);
}

function dismissLoading() {
    const el = document.querySelector('.loading-container');
    if (el) el.classList.add('fade-out');
}

/* ===== Lazy third-party libs (依 config 按需加载，未启用的组件不下载) ===== */
const LAZY_LIBS = {
    twikoo: 'https://cdn.jsdelivr.net/npm/twikoo@1.6.41/dist/twikoo.min.js',
    aplayerCss: 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css',
    aplayer: 'https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js',
    meting: 'https://cdn.jsdelivr.net/npm/meting@2.0.1/dist/Meting.min.js'
};
let twikooReady = null, playerReady = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.onload = resolve;
        el.onerror = reject;
        document.body.appendChild(el);
    });
}

function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
        const el = document.createElement('link');
        el.rel = 'stylesheet';
        el.href = href;
        el.onload = resolve;
        el.onerror = reject;
        document.head.appendChild(el);
    });
}

function initLazyThirdParty(config) {
    const cards = config.homepage?.cards || [];
    const enabled = type => cards.some(card => card.type === type && card.enabled !== false);
    if (enabled('comments')) {
        twikooReady = loadScript(LAZY_LIBS.twikoo);
    }
    if (enabled('music')) {
        // APlayer 样式 → APlayer → Meting 顺序加载；Meting 定义自定义元素后会自动升级页面中已有的 <meting-js>
        playerReady = loadStylesheet(LAZY_LIBS.aplayerCss)
            .then(() => loadScript(LAZY_LIBS.aplayer))
            .then(() => loadScript(LAZY_LIBS.meting))
            .catch(() => {});
        playerReady.then(() => { patchAplayerA11y(); observeAplayerA11y(); });
    }
}

/* Twikoo 渲染的输入框与图标链接缺少可访问名，补齐以满足无障碍审计；
   Twikoo 会整体替换挂载点且状态更新时重渲染，故挂在稳定的评论卡片上，
   用 MutationObserver 在变化后重新补齐 */
let twikooA11yTimer = null;

function patchTwikooA11y() {
    const box = document.querySelector('.card.comments') || document.getElementById('tcomment');
    if (!box) return;
    box.querySelector('.el-textarea__inner')?.setAttribute('aria-label', '评论输入框');
    box.querySelector('.tk-input input')?.setAttribute('aria-label', '输入昵称或邮箱');
    // tk-submit-action-icon 是可点击的 div（generic 角色禁止 aria-label），升级为 button 语义
    box.querySelectorAll('.tk-submit-action-icon').forEach(a => {
        a.setAttribute('role', 'button');
        a.setAttribute('tabindex', '0');
        a.setAttribute('aria-label', a.getAttribute('alt') || '插入评论附件');
    });
    box.querySelectorAll('.tk-action-link').forEach((a, i) => {
        a.setAttribute('aria-label', '插入表情或图片 ' + (i + 1));
    });
}

function observeTwikooA11y() {
    const card = document.querySelector('.card.comments');
    if (!card || twikooA11yTimer) return;
    const obs = new MutationObserver(() => {
        clearTimeout(twikooA11yTimer);
        twikooA11yTimer = setTimeout(patchTwikooA11y, 300);
    });
    obs.observe(card, { childList: true, subtree: true });
}

/* APlayer 内部按钮缺少可访问名且目标偏小，补齐以满足无障碍审计 */
function patchAplayerA11y() {
    const box = document.getElementById('aplayer');
    if (!box || !box.querySelector('button')) return;
    const names = [['loop', '循环播放'], ['menu', '播放列表'], ['down', '减小音量'], ['up', '增大音量']];
    box.querySelectorAll('button').forEach(b => {
        const hit = names.find(([k]) => b.className.includes(k));
        b.setAttribute('aria-label', hit ? hit[1] : '播放器控制');
    });
}

function observeAplayerA11y() {
    const box = document.getElementById('aplayer');
    if (!box) return;
    new MutationObserver(() => patchAplayerA11y()).observe(box, { childList: true, subtree: true });
}

function loadConfigs() {
    const loadJson = url => fetch(url).then(response => {
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.json();
    });
    return Promise.all([loadJson('config.json'), loadJson('nav.json')]);
}

function initStaticEvents() {
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            showSection(link.dataset.section);
        });
    });
}

/* ===== Global Bindings ===== */
Object.assign(window, {
    startTimer,
    clearTimer,
    showSection,
    toggleDarkMode,
    applySiteTheme,
    applyBgFilter,
    applyAnimation,
    scrollToTop,
    disposeVueApps,
});

/* ===== Init ===== */
initDarkMode();
window.addEventListener('beforeunload', disposeVueApps, { once: true });

document.addEventListener('DOMContentLoaded', () => {
    renderLoadingApp();
    initClock();
    initStaticEvents();
    loadConfigs().then(([config, navData]) => {
        if (!config || !navData) return;
        window.siteConfig = config;
        initSiteWithConfig(config);
        initSiteTheme(config.theme?.default);
        initHeaderAndFooter(config);
        renderHeaderApp(config);
        renderFooterApp(config);
        initBackgroundImage(config.backgroundImages);
        initAnimation();
        initLazyThirdParty(config);
        if (config.carousel?.images) {
            setCarouselImages(config.carousel.images);
            setAutoSlideInterval(config.carousel.interval || 10000);
        }
        if (config.homepage?.cards) renderHomepageCards(config.homepage.cards);
        initJinrishici();
        if (navData.cards) renderNavigationApp(navData.cards);
        initNavigation();
    }).catch(error => {
        console.error('Unable to load site configuration.', error);
        markAppReady();
        dismissLoading();
    });
});
