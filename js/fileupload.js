const bgUpload = document.getElementById("bg-upload");
const blurSlider = document.getElementById("blur-slider");
const opacitySlider = document.getElementById("opacity-slider");
const clearBtn = document.getElementById("clear-bg");
const controlsPanel = document.getElementById("controls-panel");
const toggleBtn = document.getElementById("toggle-controls");
const controlsContent = document.getElementById("controls-content");

// 应用背景图到 body::before 伪元素
function applyBackground(imageDataUrl) {
  document.body.style.setProperty("--bg-image", `url('${imageDataUrl}')`);
}

// 更新模糊和透明度
function updateFilters() {
  const blur = blurSlider.value;
  const opacity = opacitySlider.value;
  document.body.style.setProperty("--bg-blur", `${blur}px`);
  document.body.style.setProperty("--bg-opacity", opacity);
  // 保存设置
  localStorage.setItem("bg-blur", blur);
  localStorage.setItem("bg-opacity", opacity);
}

// 上传图片并保存
bgUpload.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageData = e.target.result;
    applyBackground(imageData);
    localStorage.setItem("bg-image", imageData); // 保存图片数据
    // 上传成功后显示控制面板
    controlsPanel.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

// 滑块调节模糊与透明度
blurSlider.addEventListener("input", updateFilters);
opacitySlider.addEventListener("input", updateFilters);

// 清除背景和设置
clearBtn.addEventListener("click", () => {
  document.body.style.removeProperty("--bg-image");
  document.body.style.removeProperty("--bg-blur");
  document.body.style.removeProperty("--bg-opacity");
  localStorage.removeItem("bg-image");
  localStorage.removeItem("bg-blur");
  localStorage.removeItem("bg-opacity");
  blurSlider.value = 0;
  opacitySlider.value = 1;
  controlsPanel.classList.add("hidden");
});

// 折叠面板开关
toggleBtn.addEventListener("click", () => {
  if (controlsContent.style.display === "none" || !controlsContent.style.display) {
    controlsContent.style.display = "block";
    toggleBtn.textContent = "精调▲";
  } else {
    controlsContent.style.display = "none";
    toggleBtn.textContent = "精调▼";
  }
});

// 页面加载时应用保存设置
window.addEventListener("DOMContentLoaded", () => {
  const savedImage = localStorage.getItem("bg-image");
  const savedBlur = localStorage.getItem("bg-blur") || "0";
  const savedOpacity = localStorage.getItem("bg-opacity") || "1";

  if (savedImage) {
    applyBackground(savedImage);
    controlsPanel.classList.remove("hidden"); // 显示控制面板
  } else {
    controlsPanel.classList.add("hidden"); // 隐藏控制面板
  }

  blurSlider.value = savedBlur;
  opacitySlider.value = savedOpacity;
  updateFilters();
});
