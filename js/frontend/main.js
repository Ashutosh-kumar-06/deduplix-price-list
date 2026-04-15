// ==================== MAIN INITIALIZATION ====================
import { navigate } from "./navigation.js";
import { isAuthenticated } from "./auth/authState.js";
import { logout } from "./ui/sidebar.js";
import { bindTourGuide } from "./ui/tour.js";

// API Client instance - export for use in pages
import apiClient from "./api/client.js";
export { apiClient };

export function initializeApp() {
  // Initialize navigation
  window.navigate = navigate;
  window.logout = logout;
  bindTourGuide();

  // Check if authenticated
  if (!isAuthenticated()) {
    // Not logged in - show login page
    navigate("login");
  } else {
    // Logged in - show dashboard
    navigate("dashboard");
  }
}


export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("deduplix_theme", newTheme);
}

// Page load par purana theme apply karein
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("deduplix_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
});


// Export all page renderers for accessibility
export { renderDashboard } from "./pages/dashboardPage.js";
export { renderRecords, openAddModal } from "./pages/recordsPage.js";
export { renderUpload } from "./pages/uploadPage.js";
export { renderDuplicates } from "./pages/duplicatesPage.js";
export { renderLoginPage } from "./pages/loginPage.js";
export { renderSignupPage } from "./pages/signupPage.js";
export { showToast, showSuccessToast, showErrorToast } from "./ui/toast.js";
export { updateTopbar } from "./ui/topbar.js";
