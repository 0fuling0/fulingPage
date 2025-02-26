let currentHitokoto = '你好，又见面了！';
let hitokotoInterval;

/**
 * 初始化一言功能
 */
function initHitokoto() {
    updateAllHitokotoContainers(window.siteConfig?.hitokoto?.messages?.loading || '正在加载一言...');
    getHitokoto();
    
    if (hitokotoInterval) clearInterval(hitokotoInterval);
    const interval = window.siteConfig?.hitokoto?.interval || 10000;
    
    hitokotoInterval = setInterval(getHitokoto, interval);
}

/**
 * 更新所有一言容器
 */
function updateAllHitokotoContainers(content) {
    document.querySelectorAll('.hitokoto-container').forEach(container => {
        container.textContent = content;
    });
}

/**
 * 获取一言
 */
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
            currentHitokoto = content;
            updateAllHitokotoContainers(content);
        })
        .catch(error => {
            console.warn('Error fetching hitokoto:', error);
            updateAllHitokotoContainers(window.siteConfig?.hitokoto?.messages?.error || '获取一言失败，请稍后再试...');
        });
}

export default {
    initHitokoto,
    getHitokoto,
    updateAllHitokotoContainers
};
