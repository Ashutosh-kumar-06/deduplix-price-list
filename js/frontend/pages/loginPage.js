import { setAuth } from "../auth/authState.js";
// Firebase login function import karein (Path sahi check kar lena)
import { loginWithGoogle } from "../firebaseConfig.js";

let apiClient;

export function renderLoginPage() {
  const container = document.getElementById("content");
  container.innerHTML = `
    <div class="auth-shell">
      <div class="auth-hero">
        <div class="auth-brand">DeDupliX</div>
        <h1>Keep every Price List number clean, traceable, and ready for audit.</h1>
        <p>
          Sign in to inspect duplicate groups, resolve collisions, and protect
          data integrity with a focused review workflow.
        </p>
        <div class="auth-points">
          <span>Duplicate detection</span>
          <span>Review queue</span>
          <span>Clean export</span>
        </div>
      </div>
      <div class="auth-card">
        <div class="auth-card-head">
          <h2>Login</h2>
        </div>
        
        <button type="button" id="googleLoginBtn" class="btn google-btn" style="width: 100%; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google">
          Continue with Google
        </button>

        <div style="text-align: center; margin-bottom: 1rem; color: #666;">— OR —</div>

        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>
          <p class="auth-note">Demo: alex@example.com / admin123</p>
          <div class="form-actions">
            <button type="submit" class="btn primary">Login</button>
            <button type="button" id="signupBtn" class="btn ghost">Create Account</button>
          </div>
          <div id="loginError" class="error-message" style="display: none;"></div>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("loginForm");
  const errorDiv = document.getElementById("loginError");
  const signupBtn = document.getElementById("signupBtn");
  const googleLoginBtn = document.getElementById("googleLoginBtn");

  // --- Google Login Handler ---
  googleLoginBtn.addEventListener("click", async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        // Firebase se user mil gaya, ab use auth state mein set karein
        // Note: Hum ek dummy token de rahe hain ya user.accessToken use kar sakte hain
        setAuth(user.accessToken || "firebase-auth-token", {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          image: user.photoURL
        });

        if (!localStorage.getItem("deduplix_tour_completed")) {
          localStorage.setItem("deduplix_tour_pending", "dashboard");
        }

        if (window.navigate) {
          window.navigate("dashboard");
        }
      }
    } catch (error) {
      errorDiv.textContent = "Google Login Error: " + error.message;
      errorDiv.style.display = "block";
    }
  });

  // --- Normal Email/Password Login Handler ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const mod = await import("../api/client.js");
      apiClient = mod.default;

      const response = await apiClient.auth.login({ email, password });
      if (response.token && response.user) {
        setAuth(response.token, response.user);
        if (!localStorage.getItem("deduplix_tour_completed")) {
          localStorage.setItem("deduplix_tour_pending", "dashboard");
        }
        if (window.navigate) {
          window.navigate("dashboard");
        }
      } else {
        errorDiv.textContent = response.error || "Login failed";
        errorDiv.style.display = "block";
      }
    } catch (error) {
      errorDiv.textContent = "Network error: " + error.message;
      errorDiv.style.display = "block";
    }
  });

  signupBtn.addEventListener("click", () => {
    if (window.navigate) {
      window.navigate("signup");
    }
  });
}