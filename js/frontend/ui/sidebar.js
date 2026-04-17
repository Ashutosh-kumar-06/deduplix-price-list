// ==================== SIDEBAR MANAGEMENT ====================
import { showInfoToast } from "./toast.js";
import {
  getCurrentAuthUser,
  clearAuth,
  clearDemoMode,
} from "../auth/authState.js";

export function initSidebar(onNavigate) {
  window.navigateFunc = onNavigate;
}

export function updateUserDisplay() {
  const authUser = getCurrentAuthUser();
  const avatar = document.getElementById("user-av");
  const nameEl = document.getElementById("user-name");

  if (authUser && authUser.name) {
    const normalizedName = String(authUser.name).trim();
    if (avatar) {
      avatar.textContent = (normalizedName[0] || "U").toUpperCase();
    }
    if (nameEl) {
      nameEl.textContent = normalizedName || "User";
    }
    return;
  }

  if (avatar) {
    avatar.textContent = "U";
  }
  if (nameEl) {
    nameEl.textContent = "User";
  }
}

export function logout() {
  clearAuth();
  clearDemoMode();
  if (window.navigate) {
    window.navigate("landing");
  }
  showInfoToast("Logged out successfully");
}

export function setActiveNavItem(page) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    if (item.getAttribute("data-page") === page) {
      item.classList.add("active");
    }
  });
}

export function updateDuplicateBadge(count) {
  const badge = document.getElementById("dup-badge");
  if (badge) {
    badge.textContent = count;
  }
}

function reRenderCurrentPage() {
  if (window.renderCurrentPageFunc) {
    window.renderCurrentPageFunc();
  }
}
