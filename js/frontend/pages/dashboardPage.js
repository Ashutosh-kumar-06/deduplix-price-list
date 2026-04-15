import apiClient from "../api/client.js";
import { showErrorToast } from "../ui/toast.js";

export async function renderDashboard() {
  const c = document.getElementById("content");
  c.innerHTML = `<div class="card">Loading dashboard...</div>`;

  try {
    const [statsResponse, duplicatesResponse] = await Promise.all([
      apiClient.prices.getStats(),
      apiClient.prices.getDuplicates(),
    ]);

    const stats = statsResponse.data;
    const duplicates = duplicatesResponse.data.duplicates || [];
    const totalEntries = Number(stats.totalEntries || 0);
    const activeEntries = Number(stats.active || 0);
    const duplicateCount = Number(stats.duplicatesFound || 0);
    const resolvedCount = Number(stats.resolvedCount || 0);
    const healthScore = totalEntries
      ? Math.max(
          0,
          Math.min(100, Math.round((activeEntries / totalEntries) * 100)),
        )
      : 0;

    c.innerHTML = `
    <div class="hero-card" id="tour-hero">
      <div class="hero-copy">
        <div class="hero-kicker">DeDupliX control center</div>
        <h1>Detect duplicates before they distort your Price List data.</h1>
        <p>
          Monitor records, resolve collisions, and keep every PL number clean
          with a guided workflow built for data integrity.
        </p>
        <div class="hero-actions">
          <button class="btn ghost" type="button" onclick="window.navigate?.('duplicates')">Review duplicates</button>
        </div>
      </div>
      <div class="hero-panel">
        <div class="hero-panel-label">Integrity snapshot</div>
        <div class="hero-panel-value">${healthScore}% health</div>
        <div class="hero-panel-sub">${duplicateCount} duplicate groups tracked</div>
        <div class="hero-panel-meter">
          <div class="hero-panel-meter-fill" style="width:${healthScore}%"></div>
        </div>
        <div class="hero-panel-list">
          <div class="hero-panel-row">
            <span>Total entries</span>
            <strong>${totalEntries}</strong>
          </div>
          <div class="hero-panel-row">
            <span>Active entries</span>
            <strong>${activeEntries}</strong>
          </div>
          <div class="hero-panel-row">
            <span>Resolved issues</span>
            <strong>${resolvedCount}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-4" id="tour-stats" style="margin:20px 0">
      <div class="stat-card blue">
        <div class="stat-label">Total Entries</div>
        <div class="stat-value">${stats.totalEntries}</div>
        <div class="stat-sub">Uploaded records</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Active</div>
        <div class="stat-value">${stats.active}</div>
        <div class="stat-sub">Clean records</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-label">Duplicates Found</div>
        <div class="stat-value">${stats.duplicatesFound}</div>
        <div class="stat-sub">Exact groups</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Resolved</div>
        <div class="stat-value">${stats.resolvedCount}</div>
        <div class="stat-sub">Delete or merge actions</div>
      </div>
    </div>

    ${renderDuplicatePreview(duplicates)}
    `;

    if (
      localStorage.getItem("deduplix_tour_pending") === "dashboard" &&
      !localStorage.getItem("deduplix_tour_completed")
    ) {
      localStorage.removeItem("deduplix_tour_pending");
      setTimeout(() => {
        window.startTour?.("dashboard");
      }, 0);
    }
  } catch (error) {
    c.innerHTML = `<div class="card">Failed to load dashboard</div>`;
    showErrorToast(error.message || "Failed to load dashboard");
  }
}

function renderDuplicatePreview(duplicates) {
  const preview = duplicates.slice(0, 4);

  if (!preview.length) {
    return `
      <div class="card" id="tour-preview">
        <div class="section-title">Duplicate Preview</div>
        <div class="section-sub">No duplicate groups found</div>
      </div>
    `;
  }

  return `
    <div class="card" id="tour-preview">
      <div class="section-header">
        <div>
          <div class="section-title">Duplicate Preview</div>
          <div class="section-sub">Top exact duplicate groups</div>
        </div>
        <button class="btn sm" onclick="window.navigate?.('duplicates')">Review all →</button>
      </div>
      ${preview
        .map((group) => {
          const first = group.records[0];
          const second = group.records[1];
          return `
            <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;gap:12px">
              <div>
                <div class="mono" style="font-size:12px">${first.plNumber} ↔ ${second.plNumber}</div>
                <div style="font-size:11px;color:var(--text3)">Group key: ${group.key}</div>
              </div>
              <span class="tag review">${group.records.length} records</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}
