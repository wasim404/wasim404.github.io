// 计算进度函数集合
const progressCalculators = {
    year: function() {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear() + 1, 0, 1);
      return ((now - start) / (end - start)) * 100;
    },
    month: function() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return ((now - start) / (end - start)) * 100;
    },
    week: function() {
      const now = new Date();
      const day = now.getDay() || 7; // 周日是0，转成7
      const start = new Date(now);
      start.setHours(0,0,0,0);
      start.setDate(now.getDate() - day + 1); // 本周一
      const end = new Date(start);
      end.setDate(start.getDate() + 7); // 下周一
      return ((now - start) / (end - start)) * 100;
    },
    day: function() {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      return ((now - start) / (end - start)) * 100;
    }
  };
  
  // 更新进度条和百分比显示
  function updateProgress(type = 'year') {
    const bar = document.getElementById("progress-bar");
    const arrow = document.getElementById("progress-arrow");
    const numberSpan = document.getElementById("progress-number");
    if (!bar || !arrow || !numberSpan) return;
  
    const progress = progressCalculators[type]();
    const progressClamped = Math.min(Math.max(progress, 0), 100);
    const progressPercent = progressClamped.toFixed(2) + "%";
  
    bar.style.width = progressPercent;
    arrow.style.left = progressPercent;
    numberSpan.textContent = progressPercent;
  }
  
  
  let currentType = 'year';   // 当前显示类型
  let updateInterval = null;  // 定时器句柄
  
  function startAutoUpdate(type) {
    if (updateInterval) clearInterval(updateInterval);
    currentType = type;
  
    updateProgress(type);
  
    updateInterval = setInterval(() => {
      updateProgress(currentType);
    }, 1000);
  }
  
  // 初始化切换按钮事件
  function initSwitcher() {
    const buttons = document.querySelectorAll("#progress-switcher button");
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        button.classList.add("active");
  
        const type = button.getAttribute("data-type");
        startAutoUpdate(type);
      });
    });
  }
  
  // 页面加载完成时初始化
  document.addEventListener("DOMContentLoaded", () => {
    initSwitcher();
    startAutoUpdate('year'); // 默认启动自动更新年进度
  });
  