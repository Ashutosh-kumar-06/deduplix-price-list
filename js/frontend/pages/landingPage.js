import apiClient from "../api/client.js";
import { setDemoMode } from "../auth/authState.js";
import { showErrorToast, showSuccessToast } from "../ui/toast.js";

const SAMPLE_CSV = `plNumber,description
PL-1001,Apple iPhone 14 128GB
PL1001,Apple iPhone14 128 GB
PL-2002,Samsung Galaxy S23 256GB
PL 2002,Samsung Galaxy-S23 256 GB
PL-3005,Dell Inspiron 15 Laptop
PL-3006,HP Pavilion 14 Laptop`;

export function renderLandingPage() {
  const c = document.getElementById("content");

  c.innerHTML = `
    <div class="landing-wrap">
      <section class="landing-hero">
        <div class="landing-kicker">Data quality platform</div>
        <h1>AI-powered Price List Deduplication</h1>
        <p>
          Upload -> Detect duplicates -> Review -> Clean data. Turn messy vendor lists
          into trusted, audit-ready records in minutes.
        </p>
        <div class="landing-actions">
          <button class="btn primary" id="start-login-btn">Get Started</button>
          <button class="btn" id="start-signup-btn">Create Account</button>
          <button class="btn ghost" id="start-demo-btn">Try Sample CSV</button>
        </div>
      </section>

      <section class="landing-panel-grid">
        <article class="landing-panel">
          <h3>Features</h3>
          <ul>
            <li>Fuzzy duplicate matching with confidence score</li>
            <li>Side-by-side review and one-click resolution</li>
            <li>Clean CSV export for downstream systems</li>
          </ul>
        </article>
        <article class="landing-panel">
          <h3>Demo Workflow</h3>
          <ol>
            <li>Load sample dataset</li>
            <li>Inspect exact and fuzzy collisions</li>
            <li>Resolve duplicates and export cleaned data</li>
          </ol>
        </article>
      </section>

      <section>
        <div class="section-header" style="margin-top:14px">
          <div>
            <div class="section-title">Screenshots</div>
            <div class="section-sub">Core workflow highlights</div>
          </div>
        </div>
        <div class="landing-shot-grid">
          <div class="landing-shot-card">
            <div class="landing-shot-title">Dashboard Intelligence</div>
            <p>Track total records, duplicate load, and data quality health in one view.</p>
          </div>
          <div class="landing-shot-card">
            <div class="landing-shot-title">Duplicate Review Desk</div>
            <p>Compare records side by side with score and reasoned match signals.</p>
          </div>
          <div class="landing-shot-card">
            <div class="landing-shot-title">Export Clean Outputs</div>
            <p>Push standardized, deduplicated CSV files into your business flow.</p>
          </div>
        </div>
      </section>
    </div>
  `;

  const loginBtn = document.getElementById("start-login-btn");
  const signupBtn = document.getElementById("start-signup-btn");
  const demoBtn = document.getElementById("start-demo-btn");

  loginBtn?.addEventListener("click", () => window.navigate?.("login"));
  signupBtn?.addEventListener("click", () => window.navigate?.("signup"));
  demoBtn?.addEventListener("click", seedDemoData);
}

async function seedDemoData() {
  const button = document.getElementById("start-demo-btn");
  if (button) {
    button.disabled = true;
    button.textContent = "Preparing demo...";
  }

  try {
    await apiClient.prices.upload({
      format: "csv",
      content: SAMPLE_CSV,
      createdBy: "Demo Mode",
    });

    setDemoMode(true);
    showSuccessToast("Demo dataset loaded");
    window.navigate?.("dashboard");
  } catch (error) {
    showErrorToast(error.message || "Failed to load demo dataset");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Try Sample CSV";
    }
  }
}
