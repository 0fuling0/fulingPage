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
let runtimeInfo = {
    startDateObj: null,
    years: 0,
    months: 0,
    days: 0
};

function updateRuntimeInfo(startDate) {
    if (!runtimeInfo.startDateObj) {
        runtimeInfo.startDateObj = new Date(startDate);
    }

    const currentDate = new Date();

    let years = currentDate.getFullYear() - runtimeInfo.startDateObj.getFullYear();
    let months = currentDate.getMonth() - runtimeInfo.startDateObj.getMonth();
    let days = currentDate.getDate() - runtimeInfo.startDateObj.getDate();

    if (days < 0) {
        months--;
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        days += previousMonth.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    if (years !== runtimeInfo.years || months !== runtimeInfo.months || days !== runtimeInfo.days) {
        runtimeInfo.years = years;
        runtimeInfo.months = months;
        runtimeInfo.days = days;

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
}

/**
 * 初始化运行时间信息
 */
function initRuntimeInfo(config) {
    if (config && config.siteInfo && config.siteInfo.startDate) {
        updateRuntimeInfo(config.siteInfo.startDate);
        setInterval(() => {
            updateRuntimeInfo(config.siteInfo.startDate);
        }, 60000); // 每分钟更新一次
    }
}

export default {
    updateClock,
    initClock,
    updateRuntimeInfo,
    initRuntimeInfo
};
