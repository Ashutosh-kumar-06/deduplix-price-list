import { setAuth } from "../auth/authState.js";
// Firebase import
import { loginWithGoogle } from "../firebaseConfig.js";

let apiClient;

export function renderSignupPage() {
  const container = document.getElementById("content");
  container.innerHTML = `
    <div class="auth-shell">
      <div class="auth-hero">
        <div class="auth-brand">DeDupliX</div>
        <h1>Build cleaner Price List workflows from the first record.</h1>
        <p>
          Create an account to manage uploads, review duplicates, and maintain a
          reliable source of truth.
        </p>
        <div class="auth-points">
          <span>Role-based access</span>
          <span>Duplicate resolution</span>
          <span>Fast onboarding</span>
        </div>
      </div>
      <div class="auth-card">
        <div class="auth-card-head">
          <h2>Create Account</h2>
          <button type="button" class="btn ghost sm" id="loginBtn">Back to Login</button>
        </div>

        <button type="button" id="googleSignupBtn" class="btn google-btn" style="width: 100%; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="Google">
          Continue with Google
        </button>

        <div style="text-align: center; margin-bottom: 1rem; color: #666; font-size: 0.9rem;">
          <span>— or —</span>
        </div>

        <form id="signupForm">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" name="name" class="input" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" class="input" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" class="input" required />
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" class="input" required />
          </div>
          <div class="form-actions" style="flex-direction: column; gap: 10px;">
            <button type="submit" class="btn primary" style="width: 100%;">Sign Up</button>
            <button type="button" id="loginBtnAlt" class="btn ghost" style="width: 100%;">Already have an account?</button>
          </div>
          <div id="signupError" class="error-message" style="display: none; color: #ff4d4d; margin-top: 10px;"></div>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("signupForm");
  const errorDiv = document.getElementById("signupError");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnAlt = document.getElementById("loginBtnAlt");
  const googleSignupBtn = document.getElementById("googleSignupBtn");

  // --- Google Signup Handler ---
  googleSignupBtn.addEventListener("click", async () => {
    googleSignupBtn.disabled = true;
    try {
      const user = await loginWithGoogle();
      if (user) {
        setAuth(user.accessToken || "firebase-auth-token", {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          image: user.photoURL,
        });

        if (window.navigate) {
          window.navigate("dashboard");
        }
      }
    } catch (error) {
      if (error?.code !== "auth/cancelled-popup-request") {
        errorDiv.textContent = "Google Signup Error: " + error.message;
        errorDiv.style.display = "block";
      }
    } finally {
      googleSignupBtn.disabled = false;
    }
  });

  // --- Email/Password Signup Handler ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      errorDiv.textContent = "Passwords do not match";
      errorDiv.style.display = "block";
      return;
    }

    try {
      const mod = await import("../api/client.js");
      apiClient = mod.default;

      const response = await apiClient.auth.register({ name, email, password });
      if (response.token && response.user) {
        setAuth(response.token, response.user);
        if (window.navigate) {
          window.navigate("dashboard");
        }
      } else {
        errorDiv.textContent = response.error || "Signup failed";
        errorDiv.style.display = "block";
      }
    } catch (error) {
      errorDiv.textContent = "Network error: " + error.message;
      errorDiv.style.display = "block";
    }
  });

  const handleLoginNav = () => {
    if (window.navigate) window.navigate("login");
  };

  loginBtn.addEventListener("click", handleLoginNav);
  loginBtnAlt.addEventListener("click", handleLoginNav);
}
