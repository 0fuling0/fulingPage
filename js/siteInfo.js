import clock from './clock.js';
import carousel from './carousel.js';

/**
 * 初始化网站配置
 * @param {Object} config - 网站配置对象
 */
function initSiteWithConfig(config) {
    if (!config) {
        console.error('Configuration not loaded');
        return;
    }

    try {
        // 设置网站基本信息
        if (config.siteInfo) {
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
        
        // 设置页眉链接
        if (config.header && config.header.links) {
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
        
        // 设置页脚信息
        if (config.footer) {
            const footerP = document.querySelector('footer p');
            if (footerP) {
                footerP.innerHTML = config.footer.copyright;
            }
        }
        
        // 初始化音乐播放器
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
        
        // 初始化评论系统
        if (config.comments && config.comments.system === 'twikoo' && window.twikoo) {
            twikoo.init(config.comments.settings);
        }
        
        // 初始化网站运行时间
        if (config.siteInfo && config.siteInfo.startDate) {
            clock.initRuntimeInfo(config);
        }
        
    } catch (error) {
        console.error('Error initializing site with config:', error);
    }
}

/**
 * 渲染项目列表
 * @param {Array} projects - 项目数据数组
 */
function renderProjects(projects) {
    const projectList = document.querySelector('#homepage .project-list');
    if (!projectList) {
        console.debug('No .project-list found in #homepage, waiting for DOM updates...');
        return;
    }
    projectList.innerHTML = projects.map(project => `
        <li class="project">
            <a href="${project.url}" target="_blank">
                <i class="${project.icon}"></i>
                <span>${project.name}</span>
            </a>
            <p>${project.description}</p>
        </li>
    `).join('');
}

/**
 * 渲染主页卡片
 * @param {Array} cards - 卡片数据数组
 */
function renderHomepageCards(cards) {
    const homepage = document.getElementById('homepage');
    if (!homepage) return;
    
    homepage.innerHTML = '';

    const cardOrder = window.siteConfig?.homepage?.cardOrder || [];

    cardOrder.forEach(cardType => {
        const card = cards.find(c => c.type === cardType);
        if (!card) return;

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
                clock.updateClock();
                break;

            case 'profile':
                section.innerHTML = `
                    <img src="${card.avatar}" alt="头像">
                    <div class="profile-info">
                        <h2>${card.name}</h2>
                        <p>${card.nickname}</p>
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
                        <li>大学: ${card.university}</li>
                        <li>专业: ${card.major}</li>
                        <li>年份: ${card.year}</li>
                    </ul>
                `;
                break;

            case 'projects':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <ul class="project-list">
                        ${card.list.map(project => `
                            <li class="project">
                                <a href="${project.url}" target="_blank">
                                    <i class="${project.icon}"></i>
                                    <span>${project.name}</span>
                                </a>
                                <p>${project.description}</p>
                            </li>
                        `).join('')}
                    </ul>
                `;
                break;

            case 'carousel':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br><br>
                    <div class="carousel-card">
                        <button class="next-btn">❯</button>
                        <button class="prev-btn">❮</button>
                        <div class="carousel-container">
                            <img class="carousel-img" alt="轮播图片" style="opacity: 0">
                        </div>
                    </div>
                `;
                carousel.setCarouselImages(card.images);
                
                // 确保DOM已渲染并且图片元素已存在
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        carousel.resetCarousel(); // 使用新增的重置方法初始化
                    }, 200);
                });
                break;

            case 'music':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3>
                    <br><br>
                    <div id="aplayer"></div>
                `;
                if (card.settings) {
                    const metingJs = document.createElement('meting-js');
                    Object.entries(card.settings).forEach(([key, value]) => {
                        metingJs.setAttribute(key, value);
                    });
                    section.querySelector('#aplayer').appendChild(metingJs);
                }
                break;

            case 'comments':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <div id="tcomment"></div>
                `;
                break;

            case 'contact':
                section.innerHTML = `
                    <h3><i class="fas ${card.icon}"></i> ${card.title}</h3><br>
                    <div class="contact-options">
                        <a href="${card.links.email}">
                            <i class="fas fa-at"></i>
                            <span>电子邮件</span><br>
                        </a>
                        <a href="${card.links.github}" target="_blank">
                            <i class="fab fa-github"></i>
                            <span>Github</span><br>
                        </a>
                        <a href="${card.links.bilibili}" target="_blank">
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
                        <li><strong>本站总访问量：</strong><span id="busuanzi_value_site_pv">0</span> 次</li>
                        <li><strong>本站总访客数：</strong><span id="busuanzi_value_site_uv">0</span> 人</li>
                        ` : ''}
                        ${card.showRuntime ? `<li id="runtime-info-container"></li>` : ''}
                    </ul>
                `;
                clock.initRuntimeInfo(window.siteConfig);
                refreshBusuanzi();
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

    // 初始化评论卡片
    const commentsCard = cards.find(card => card.type === 'comments');
    if (commentsCard && commentsCard.settings && window.twikoo) {
        setTimeout(() => {
            twikoo.init({
                envId: commentsCard.settings.envId,
                el: '#tcomment',
            });
        }, 100);
    }
}

/**
 * 刷新不蒜子访问统计
 */
function refreshBusuanzi() {
    const script = document.createElement('script');
    script.src = 'https://busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
    script.async = true;
    document.body.appendChild(script);
    
    script.onload = function() {
        setTimeout(() => {
            const pv = document.getElementById('busuanzi_value_site_pv');
            const uv = document.getElementById('busuanzi_value_site_uv');
            if (pv) pv.style.display = '';
            if (uv) uv.style.display = '';
        }, 1000);
    };
}

export default {
    initSiteWithConfig,
    renderProjects,
    renderHomepageCards,
    refreshBusuanzi
};
