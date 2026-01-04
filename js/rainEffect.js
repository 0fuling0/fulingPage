/**
 * 雨滴效果模块 - 可交互版
 * 点击/触摸产生涟漪，背景持续下雨，与卡片互动
 */

let canvas = null;
let ctx = null;
let drops = [];
let ripples = [];
let splashes = []; // 卡片上的水花
let animationId = null;
let isRunning = false;
let cardElements = []; // 缓存卡片元素位置

// 配置
const config = {
    dropCount: 80,        // 雨滴数量
    dropSpeed: 8,         // 下落速度
    dropLength: 35,       // 雨滴长度
    dropWidth: 2.5,       // 雨滴宽度
    rippleSpeed: 3,       // 涟漪扩散速度
    rippleMaxRadius: 100, // 涟漪最大半径
    color: 'rgba(174, 194, 224, 0.5)', // 雨滴颜色
    rippleColor: 'rgba(174, 194, 224, 0.6)', // 涟漪颜色
    splashColor: 'rgba(174, 194, 224, 0.7)' // 水花颜色
};

/**
 * 创建画布
 */
function createCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'rain-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    `;
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext('2d');
    resizeCanvas();
}

/**
 * 调整画布大小
 */
function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

/**
 * 创建雨滴
 */
function createDrop() {
    return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        speed: config.dropSpeed + Math.random() * 5,
        length: config.dropLength + Math.random() * 10,
        opacity: 0.3 + Math.random() * 0.4
    };
}

/**
 * 创建涟漪
 */
function createRipple(x, y) {
    ripples.push({
        x,
        y,
        radius: 0,
        opacity: 0.8,
        lineWidth: 2
    });
}

/**
 * 创建水花（卡片上的小涟漪）
 */
function createSplash(x, y) {
    splashes.push({
        x,
        y,
        radius: 0,
        opacity: 0.6,
        particles: Array.from({ length: 4 }, () => ({
            angle: Math.random() * Math.PI * 2,
            speed: 1 + Math.random() * 2,
            size: 2 + Math.random() * 2,
            life: 1
        }))
    });
}

/**
 * 更新卡片位置缓存
 */
function updateCardPositions() {
    const cards = document.querySelectorAll('.card, header, footer');
    cardElements = Array.from(cards).map(card => {
        const rect = card.getBoundingClientRect();
        return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom
        };
    });
}

/**
 * 检查点是否在卡片上
 */
function isOnCard(x, y) {
    return cardElements.some(card => 
        x >= card.left && x <= card.right && 
        y >= card.top && y <= card.bottom
    );
}

/**
 * 更新雨滴
 */
function updateDrops() {
    drops.forEach(drop => {
        drop.y += drop.speed;
        
        // 检测是否落在卡片上
        const dropBottom = drop.y + drop.length;
        if (!drop.hitCard && isOnCard(drop.x, dropBottom)) {
            drop.hitCard = true;
            // 在卡片边缘产生水花
            if (Math.random() > 0.7) {
                createSplash(drop.x, dropBottom);
            }
        }
        
        // 重置到顶部
        if (drop.y > canvas.height) {
            drop.y = -drop.length;
            drop.x = Math.random() * canvas.width;
            drop.hitCard = false;
        }
    });
}

/**
 * 更新涟漪
 */
function updateRipples() {
    ripples = ripples.filter(ripple => {
        ripple.radius += config.rippleSpeed;
        ripple.opacity -= 0.015;
        ripple.lineWidth = Math.max(0.5, 2 - ripple.radius / 50);
        return ripple.opacity > 0 && ripple.radius < config.rippleMaxRadius;
    });
}

/**
 * 更新水花
 */
function updateSplashes() {
    splashes = splashes.filter(splash => {
        splash.radius += 2;
        splash.opacity -= 0.03;
        splash.particles.forEach(p => {
            p.life -= 0.05;
        });
        return splash.opacity > 0;
    });
}

/**
 * 绘制雨滴
 */
function drawDrops() {
    ctx.strokeStyle = config.color;
    ctx.lineCap = 'round';
    ctx.lineWidth = config.dropWidth;
    
    drops.forEach(drop => {
        ctx.beginPath();
        ctx.globalAlpha = drop.opacity;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
    });
    
    ctx.globalAlpha = 1;
}

/**
 * 绘制涟漪
 */
function drawRipples() {
    ripples.forEach(ripple => {
        ctx.beginPath();
        ctx.strokeStyle = config.rippleColor;
        ctx.globalAlpha = ripple.opacity;
        ctx.lineWidth = ripple.lineWidth;
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内圈
        if (ripple.radius > 10) {
            ctx.beginPath();
            ctx.globalAlpha = ripple.opacity * 0.5;
            ctx.arc(ripple.x, ripple.y, ripple.radius * 0.6, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    
    ctx.globalAlpha = 1;
}

/**
 * 绘制水花
 */
function drawSplashes() {
    splashes.forEach(splash => {
        // 小涟漪
        ctx.beginPath();
        ctx.strokeStyle = config.splashColor;
        ctx.globalAlpha = splash.opacity;
        ctx.lineWidth = 1;
        ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // 水滴粒子
        ctx.fillStyle = config.splashColor;
        splash.particles.forEach(p => {
            if (p.life > 0) {
                const px = splash.x + Math.cos(p.angle) * splash.radius * p.speed * 0.5;
                const py = splash.y + Math.sin(p.angle) * splash.radius * p.speed * 0.3 - splash.radius * 0.5;
                ctx.globalAlpha = splash.opacity * p.life;
                ctx.beginPath();
                ctx.arc(px, py, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    });
    
    ctx.globalAlpha = 1;
}

/**
 * 动画循环
 */
function animate() {
    if (!isRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateDrops();
    updateRipples();
    updateSplashes();
    drawDrops();
    drawRipples();
    drawSplashes();
    
    animationId = requestAnimationFrame(animate);
}

/**
 * 处理点击/触摸
 */
function handleInteraction(e) {
    const x = e.clientX || e.touches?.[0]?.clientX;
    const y = e.clientY || e.touches?.[0]?.clientY;
    
    if (x !== undefined && y !== undefined) {
        // 创建多个涟漪
        createRipple(x, y);
        setTimeout(() => createRipple(x + 5, y + 5), 100);
        setTimeout(() => createRipple(x - 3, y + 3), 200);
    }
}

/**
 * 处理鼠标移动（轻微涟漪）
 */
let lastMoveTime = 0;
function handleMouseMove(e) {
    const now = Date.now();
    if (now - lastMoveTime < 100) return; // 节流
    lastMoveTime = now;
    
    if (Math.random() > 0.7) { // 30% 概率产生涟漪
        createRipple(e.clientX, e.clientY);
    }
}

/**
 * 初始化
 */
function init(options = {}) {
    // 合并配置
    Object.assign(config, options);
    
    // 创建画布
    createCanvas();
    
    // 初始化雨滴
    for (let i = 0; i < config.dropCount; i++) {
        drops.push(createDrop());
    }
    
    // 初始化卡片位置缓存
    updateCardPositions();
    
    // 事件监听
    window.addEventListener('resize', () => {
        resizeCanvas();
        updateCardPositions();
    }, { passive: true });
    window.addEventListener('scroll', updateCardPositions, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // 定期更新卡片位置（处理动态内容）
    setInterval(updateCardPositions, 2000);
    
    // 页面可见性控制
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stop();
        } else {
            updateCardPositions();
            start();
        }
    }, { passive: true });
    
    // 启动动画
    start();
}

/**
 * 启动动画
 */
function start() {
    if (isRunning) return;
    isRunning = true;
    animate();
}

/**
 * 停止动画
 */
function stop() {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

/**
 * 销毁
 */
function destroy() {
    stop();
    if (canvas) {
        canvas.remove();
        canvas = null;
        ctx = null;
    }
    drops = [];
    ripples = [];
    splashes = [];
}

/**
 * 设置是否启用
 */
function setEnabled(enabled) {
    if (enabled) {
        if (!canvas) init();
        else start();
        canvas.style.display = 'block';
    } else {
        stop();
        if (canvas) canvas.style.display = 'none';
    }
}

export default {
    init,
    start,
    stop,
    destroy,
    setEnabled,
    createRipple,
    createSplash
};
