// ==================== TOPBAR MANAGEMENT ====================
export function updateTopbar(title, breadcrumb) {
  const titleEl = document.getElementById("page-title");
  const bcEl = document.getElementById("bc");

  if (titleEl) titleEl.textContent = title;
  if (bcEl) bcEl.textContent = breadcrumb;
}

export function setTopbarTitle(title) {
  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.textContent = title;
}

export function setTopbarBreadcrumb(breadcrumb) {
  const bcEl = document.getElementById("bc");
  if (bcEl) bcEl.textContent = breadcrumb;
}
