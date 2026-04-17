// ==================== NAVIGATION & ROUTING ====================
import { updateTopbar } from "./ui/topbar.js";
import { setActiveNavItem, updateUserDisplay } from "./ui/sidebar.js";
import { renderDashboard } from "./pages/dashboardPage.js";
import { renderRecords } from "./pages/recordsPage.js";
import { renderUpload } from "./pages/uploadPage.js";
import { renderDuplicates } from "./pages/duplicatesPage.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderSignupPage } from "./pages/signupPage.js";
import { renderLandingPage } from "./pages/landingPage.js";
import { isAuthenticated, isDemoMode } from "./auth/authState.js";

const pageRenderers = {
  dashboard: renderDashboard,
  records: renderRecords,
  upload: renderUpload,
  duplicates: renderDuplicates,
  landing: renderLandingPage,
  login: renderLoginPage,
  signup: renderSignupPage,
};

const pageNames = {
  dashboard: "Dashboard",
  records: "PL Records",
  upload: "Upload",
  duplicates: "Duplicate Review",
  landing: "Home",
  login: "Login",
  signup: "Sign Up",
};

const publicPages = ["landing", "login", "signup"];
let currentPage = "dashboard";

// --- THEME LOGIC START ---
export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";

  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("deduplix_theme", next);

  // Custom event taaki agar koi aur component theme change sunna chahe
  window.dispatchEvent(new Event("themeChanged"));
}

function initTheme() {
  const savedTheme = localStorage.getItem("deduplix_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}

// Initializing theme on load
initTheme();
// --- THEME LOGIC END ---

export function navigate(page) {
  // Require auth for non-auth pages
  if (!publicPages.includes(page) && !isAuthenticated() && !isDemoMode()) {
    navigate("landing");
    return;
  }

  currentPage = page;
  window.currentPage = currentPage;

  if (!publicPages.includes(page)) {
    setActiveNavItem(page);
    updateUserDisplay();
  }
  const title = pageNames[page] || page;
  updateTopbar(title, title);

  // Hide/show sidebar and topbar on public pages.
  const sidebar = document.getElementById("sidebar");
  const topbar = document.querySelector(".topbar");
  const main = document.querySelector(".main");
  if (sidebar) {
    if (publicPages.includes(page)) {
      sidebar.style.display = "none";
    } else {
      sidebar.style.display = "flex"; // Dashboard layout fix ke liye flex
    }
  }

  if (topbar) {
    topbar.style.display = publicPages.includes(page) ? "none" : "flex";
  }

  if (main) {
    main.style.marginLeft = publicPages.includes(page) ? "0" : "220px";
  }

  render(page);
}

function render(page) {
  const content = document.getElementById("content");
  const renderer = pageRenderers[page] || renderDashboard;
  content.innerHTML = "";
  renderer();
}

// Global window access
window.navigate = navigate;
window.toggleTheme = toggleTheme; // Isse HTML button se call kar payenge
window.renderCurrentPageFunc = () => render(currentPage);
window.currentPage = currentPage;

// Show fixed current user info in simplified mode
updateUserDisplay();
