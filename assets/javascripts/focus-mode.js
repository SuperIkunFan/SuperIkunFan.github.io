document.addEventListener("DOMContentLoaded", function () {
  // 创建专注模式按钮
  const button = document.createElement("button");
  button.innerText = "专注模式";
  button.style.position = "fixed";
  button.style.top = "10px";
  button.style.right = "10px";
  button.style.zIndex = "999";
  button.style.padding = "8px 12px";
  button.style.backgroundColor = "#0066cc";
  button.style.color = "white";
  button.style.border = "none";
  button.style.borderRadius = "4px";
  button.style.cursor = "pointer";

  button.addEventListener("click", function () {
    const sidebar = document.querySelector("[data-md-component='sidebar']");
    const toc = document.querySelector("[data-md-component='toc']");

    if (sidebar) sidebar.hidden = !sidebar.hidden;
    if (toc) toc.hidden = !toc.hidden;
  });

  document.body.appendChild(button);
});
