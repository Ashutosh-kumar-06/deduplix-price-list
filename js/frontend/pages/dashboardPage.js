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
        <div class="stat-sub">Exact + fuzzy groups</div>
      </div>
      <div class="stat-card red">
        <div class="stat-label">Resolved</div>
        <div class="stat-value">${stats.resolvedCount}</div>
        <div class="stat-sub">Delete or merge actions</div>
      </div>
    </div>

    <div class="grid-2" style="margin:20px 0">
      <div class="card">
        <div class="section-title">Upload Trends (7 days)</div>
        <div class="section-sub">Records uploaded per day</div>
        ${renderUploadTrendChart(stats.uploadTrend || [])}
      </div>
      <div class="card">
        <div class="section-title">Data Quality Breakdown</div>
        <div class="section-sub">Clean vs duplicate vs removed</div>
        ${renderQualityBreakdownChart(stats.qualityBreakdown || [], stats.qualityPercent || 0)}
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

function renderUploadTrendChart(trend) {
  if (!trend.length) {
    return `<div class="empty-state" style="padding:20px 0">No trend data available</div>`;
  }

  const maxCount = Math.max(
    ...trend.map((point) => Number(point.count || 0)),
    1,
  );

  return `
    <div class="trend-bars">
      ${trend
        .map((point) => {
          const count = Number(point.count || 0);
          const height = Math.max(8, Math.round((count / maxCount) * 100));
          return `
            <div class="trend-col">
              <div class="trend-count">${count}</div>
              <div class="trend-bar-wrap">
                <div class="trend-bar" style="height:${height}%"></div>
              </div>
              <div class="trend-label">${point.label}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderQualityBreakdownChart(breakdown, qualityPercent) {
  if (!breakdown.length) {
    return `<div class="empty-state" style="padding:20px 0">No breakdown data available</div>`;
  }

  const total = breakdown.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );
  const clean = Number(
    breakdown.find((item) => item.label === "Clean")?.value || 0,
  );
  const dup = Number(
    breakdown.find((item) => item.label === "Duplicate")?.value || 0,
  );
  const removed = Number(
    breakdown.find((item) => item.label === "Removed")?.value || 0,
  );

  const cleanPct = total ? Math.round((clean / total) * 100) : 0;
  const dupPct = total ? Math.round((dup / total) * 100) : 0;
  const removedPct = Math.max(0, 100 - cleanPct - dupPct);

  return `
    <div class="quality-ring-wrap">
      <div class="quality-ring" style="background: conic-gradient(var(--green) 0 ${cleanPct}%, var(--accent) ${cleanPct}% ${cleanPct + dupPct}%, var(--red) ${cleanPct + dupPct}% 100%)">
        <div class="quality-ring-inner">
          <strong>${qualityPercent}%</strong>
          <span>Quality</span>
        </div>
      </div>
      <div class="quality-legend">
        <div><span class="dot clean"></span> Clean: ${clean}</div>
        <div><span class="dot dup"></span> Duplicate: ${dup}</div>
        <div><span class="dot removed"></span> Removed: ${removed}</div>
      </div>
    </div>
    <div class="quality-meter">
      <div class="quality-meter-fill" style="width:${Math.max(0, Math.min(100, qualityPercent))}%"></div>
    </div>
    <div class="section-sub" style="margin-top:8px">Clean records ratio among active records</div>
  `;
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
          <div class="section-sub">Top exact and fuzzy duplicate groups</div>
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
                <div style="font-size:11px;color:var(--text3)">Group key: ${group.norm} • ${(group.type || "exact").toUpperCase()} • ${group.matchScore || 100}%</div>
              </div>
              <span class="tag review">${group.records.length} records</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}
