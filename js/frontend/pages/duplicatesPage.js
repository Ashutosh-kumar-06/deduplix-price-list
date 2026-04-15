import apiClient from "../api/client.js";
import { updateDuplicateBadge } from "../ui/sidebar.js";
import { showErrorToast, showSuccessToast } from "../ui/toast.js";

let dupFilter = "all";

export async function renderDuplicates() {
  const c = document.getElementById("content");

  c.innerHTML = `<div class="card">Loading duplicates...</div>`;

  try {
    const response = await apiClient.prices.getDuplicates();
    const groups = response.data.duplicates || [];
    const filtered =
      dupFilter === "all"
        ? groups
        : groups.filter((group) =>
            group.records.some((record) => record.status === dupFilter),
          );

    updateDuplicateBadge(groups.length);

    c.innerHTML = `
      <div class="section-header" id="tour-duplicates-head">
        <div>
          <div class="section-title">Duplicate Review</div>
          <div class="section-sub">${groups.length} duplicate groups found</div>
        </div>
      </div>

      <div class="tabs">
        ${["all", "active", "merged", "deleted"]
          .map(
            (tab) => `
            <div class="tab ${dupFilter === tab ? "active" : ""}" onclick="window.setDupFilterFunc?.('${tab}')">
              ${tab.charAt(0).toUpperCase() + tab.slice(1)}
            </div>
          `,
          )
          .join("")}
      </div>

      ${
        filtered.length
          ? filtered.map((group) => renderDuplicateGroup(group)).join("")
          : `<div class="empty-state"><div class="empty-icon">✓</div><div class="empty-title">No duplicate groups in this category</div></div>`
      }
    `;

    window.setDupFilterFunc = (filter) => {
      dupFilter = filter;
      renderDuplicates();
    };

    window.mergeDuplicateFunc = async (keepId, removeId) => {
      try {
        await apiClient.prices.resolve({
          keepId,
          removeId,
          action: "merge",
          performedBy: "Alex Doshi",
        });
        showSuccessToast("Duplicates merged");
        renderDuplicates();
      } catch (error) {
        showErrorToast(error.message || "Merge failed");
      }
    };

    window.deleteDuplicateFunc = async (id) => {
      try {
        await apiClient.prices.removeDuplicate(id, {
          performedBy: "Alex Doshi",
        });
        showSuccessToast("Duplicate removed");
        renderDuplicates();
      } catch (error) {
        showErrorToast(error.message || "Delete failed");
      }
    };
  } catch (error) {
    c.innerHTML = `<div class="card">Failed to load duplicates</div>`;
    showErrorToast(error.message || "Failed to load duplicates");
  }
}

function renderDuplicateGroup(group) {
  const [first, second] = group.records;
  if (!first || !second) {
    return "";
  }

  return `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="tag review">EXACT</span>
          <span style="font-size:12px;color:var(--text3)">Key: ${group.norm}</span>
        </div>
        <span class="tag review">${group.count} records</span>
      </div>
      <div class="diff-card">
        <div class="diff-col keep">
          <div class="diff-field">Keep</div>
          <div class="diff-value mono">${first.plNumber}</div>
          <div class="diff-value" style="font-size:12px;color:var(--text2)">${first.description || "-"}</div>
        </div>
        <div class="diff-sep">↔</div>
        <div class="diff-col remove">
          <div class="diff-field">Resolve</div>
          <div class="diff-value mono">${second.plNumber}</div>
          <div class="diff-value" style="font-size:12px;color:var(--text2)">${second.description || "-"}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid var(--border)">
        <button class="btn success sm" onclick="window.mergeDuplicateFunc?.('${first._id}', '${second._id}')">Merge</button>
        <button class="btn danger sm" onclick="window.deleteDuplicateFunc?.('${second._id}')">Delete Duplicate</button>
      </div>
    </div>
  `;
}
