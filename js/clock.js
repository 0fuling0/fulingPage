/**
 * 更新时钟显示
 */
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
        let dateElement = clockElement.querySelector('.clock-date');
        let timeElement = clockElement.querySelector('.clock-time');

        if (!dateElement) {
            clockElement.innerHTML = `
                <div class="clock-date"></div>
                <div class="clock-time"></div>
            `;
            dateElement = clockElement.querySelector('.clock-date');
            timeElement = clockElement.querySelector('.clock-time');
        }

        dateElement.textContent = dateString;
        timeElement.textContent = timeString;
    });
}

/**
 * 初始化时钟功能
 */
function initClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

/**
 * 更新网站运行时间信息
 * @param {string} startDate - 网站开始运行的日期
 */
function updateRuntimeInfo(startDate) {
    if (!startDate) {
        return;
    }
    
    try {
        const startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
            return;
        }
        
        const currentDate = new Date();
        
        // 计算年月日差异
        let years = currentDate.getFullYear() - startDateObj.getFullYear();
        let months = currentDate.getMonth() - startDateObj.getMonth();
        let days = currentDate.getDate() - startDateObj.getDate();
        
        // 处理日期进位
        if (days < 0) {
            months--;
            const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
            days += previousMonth.getDate();
        }
        
        // 处理月份进位
        if (months < 0) {
            years--;
            months += 12;
        }
        
        // 格式化显示字符串
        const yearString = years > 0 ? `${years} 年 ` : '';
        const monthString = months > 0 ? `${months} 月 ` : '';
        const dayString = `${days} 天`;
        
        // 更新DOM
        const runtimeInfoContainer = document.getElementById('runtime-info-container');
        if (runtimeInfoContainer) {
            runtimeInfoContainer.innerHTML = `
                <strong>网站运行时间：</strong>
                ${yearString}${monthString}${dayString}
            `;
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * 初始化运行时间信息
 * @param {Object} config - 网站配置对象
 */
function initRuntimeInfo(config) {
    if (!config || !config.siteInfo || !config.siteInfo.startDate) {
        return;
    }
    // 每天更新一次运行时间
    setInterval(() => {
        updateRuntimeInfo(startDate);
    }, 86400000); // 24小时
    
}

export default {
    updateClock,
    initClock,
    updateRuntimeInfo,
    initRuntimeInfo
};
