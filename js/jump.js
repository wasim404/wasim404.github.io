// 获取当前路径（只取文件名，不含参数）
const currentPage = window.location.pathname.split("/").pop() || "index.html";

// 映射页面名和导航链接的 id
const pageToIdMap = {
  "index.html": "nav-index",
  "notebook.html": "nav-notebook",
  "study.html": "nav-study",
  "treasure.html": "nav-treasure",
  "letter.html": "nav-letter",
  "log.html": "nav-log"
};

// 找到对应的导航项，添加 active 样式
const activeNavId = pageToIdMap[currentPage];
if (activeNavId) {
  document.getElementById(activeNavId).classList.add("active");
}