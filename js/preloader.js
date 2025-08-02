const messages = [
    "记得微笑",
    "wasim正尝试加速网络",
    "一蓑烟雨任平生",
    "等待是网速最纯情的告白",
    "注意照顾好自己的身体和心情",
    "放轻松，人生只是一场体验"
  ];
  let progress = 0; 
  const loadingText = document.getElementById('loading-text');
  const progressBar = document.getElementById('progress-bar');
  const preloader = document.getElementById('preloader');
  
  const interval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 95) progress = 95;
  
    // 从 messages 数组随机选一句话
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
  
    loadingText.textContent = `${randomMsg} ${Math.floor(progress)}%`;
    progressBar.style.width = progress + '%';
  }, 1000);
  
  window.addEventListener('load', () => {
    clearInterval(interval);
    loadingText.textContent = `沉潜静心`;
    progressBar.style.width = '100%';
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 500);
  });
  