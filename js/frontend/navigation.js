// ==================== NAVIGATION & ROUTING ====================
import { updateTopbar } from "./ui/topbar.js";
import { setActiveNavItem, updateUserDisplay } from "./ui/sidebar.js";
import { renderDashboard } from "./pages/dashboardPage.js";
import { renderRecords } from "./pages/recordsPage.js";
import { renderUpload } from "./pages/uploadPage.js";
import { renderDuplicates } from "./pages/duplicatesPage.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderSignupPage } from "./pages/signupPage.js";
import { isAuthenticated } from "./auth/authState.js";

const pageRenderers = {
  dashboard: renderDashboard,
  records: renderRecords,
  upload: renderUpload,
  duplicates: renderDuplicates,
  login: renderLoginPage,
  signup: renderSignupPage,
};

const pageNames = {
  dashboard: "Dashboard",
  records: "PL Records",
  upload: "Upload",
  duplicates: "Duplicate Review",
  login: "Login",
  signup: "Sign Up",
};

const authPages = ["login", "signup"];
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
  if (!authPages.includes(page) && !isAuthenticated()) {
    navigate("login");
    return;
  }

  currentPage = page;
  window.currentPage = currentPage;

  if (!authPages.includes(page)) {
    setActiveNavItem(page);
    updateUserDisplay();
  }
  const title = pageNames[page] || page;
  updateTopbar(title, title);

  // Hide/show sidebar based on auth page
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    if (authPages.includes(page)) {
      sidebar.style.display = "none";
    } else {
      sidebar.style.display = "flex"; // Dashboard layout fix ke liye flex
    }
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