// ==================== TOAST NOTIFICATION ====================
export function showToast(msg, type = "info") {
  const container = document.getElementById("toasts");
  const el = document.createElement("div");
  el.className = "toast " + type;

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  const colors = {
    success: "var(--green)",
    error: "var(--red)",
    info: "var(--blue)",
  };

  el.innerHTML = `<span style="color:${colors[type] || colors.info}">${icons[type] || icons.info}</span> ${msg}`;
  container.appendChild(el);

  // Auto-remove after 3.2 seconds
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.3s";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

export function showSuccessToast(msg) {
  showToast(msg, "success");
}

export function showErrorToast(msg) {
  showToast(msg, "error");
}

export function showInfoToast(msg) {
  showToast(msg, "info");
}
