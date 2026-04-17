import apiClient from "../api/client.js";
import { updateDuplicateBadge } from "../ui/sidebar.js";
import { showErrorToast, showSuccessToast } from "../ui/toast.js";
import { closeModal, renderModal } from "../ui/modal.js";

let dupFilter = "all";
let selectedDuplicateGroups = new Set();
let duplicateGroups = [];

export async function renderDuplicates() {
  const c = document.getElementById("content");

  c.innerHTML = `<div class="card">Loading duplicates...</div>`;

  await fetchAndRenderDuplicates();
}

async function fetchAndRenderDuplicates() {
  const c = document.getElementById("content");
  if (!c) return;

  try {
    const response = await apiClient.prices.getDuplicates();
    duplicateGroups = response.data.duplicates || [];

    const validKeys = new Set(
      duplicateGroups.map((group) => getGroupKey(group)),
    );
    selectedDuplicateGroups = new Set(
      [...selectedDuplicateGroups].filter((key) => validKeys.has(key)),
    );

    renderDuplicatesView();
    updateDuplicateBadge(duplicateGroups.length);
  } catch (error) {
    c.innerHTML = `<div class="card">Failed to load duplicates</div>`;
    showErrorToast(error.message || "Failed to load duplicates");
  }
}

function renderDuplicatesView() {
  const c = document.getElementById("content");
  if (!c) return;

  const filtered =
    dupFilter === "all"
      ? duplicateGroups
      : duplicateGroups.filter(
          (group) => (group.type || "exact") === dupFilter,
        );

  c.innerHTML = `
    <div class="section-header" id="tour-duplicates-head">
      <div>
        <div class="section-title">Duplicate Review</div>
        <div class="section-sub">${duplicateGroups.length} duplicate groups found</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn" onclick="window.downloadDuplicateReportFunc?.()">Export Duplicate Report</button>
        <button class="btn success" id="bulk-merge-btn" onclick="window.bulkMergeSelectedFunc?.()">Bulk Merge Selected</button>
        <button class="btn danger" id="bulk-delete-btn" onclick="window.bulkDeleteSelectedFunc?.()">Bulk Delete Selected</button>
      </div>
    </div>

    <div class="tabs">
      ${["all", "exact", "fuzzy"]
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

  updateBulkButtons();
  bindDuplicateActions();
}

function updateBulkButtons() {
  const mergeBtn = document.getElementById("bulk-merge-btn");
  const deleteBtn = document.getElementById("bulk-delete-btn");
  const selectedCount = selectedDuplicateGroups.size;

  if (mergeBtn) {
    mergeBtn.disabled = selectedCount === 0;
    mergeBtn.textContent =
      selectedCount > 0
        ? `Bulk Merge Selected (${selectedCount})`
        : "Bulk Merge Selected";
  }

  if (deleteBtn) {
    deleteBtn.disabled = selectedCount === 0;
    deleteBtn.textContent =
      selectedCount > 0
        ? `Bulk Delete Selected (${selectedCount})`
        : "Bulk Delete Selected";
  }
}

function bindDuplicateActions() {
  window.setDupFilterFunc = (filter) => {
    dupFilter = filter;
    renderDuplicatesView();
  };

  window.toggleDupGroupSelectionFunc = (groupKey) => {
    if (selectedDuplicateGroups.has(groupKey)) {
      selectedDuplicateGroups.delete(groupKey);
    } else {
      selectedDuplicateGroups.add(groupKey);
    }
    updateBulkButtons();
  };

  window.downloadDuplicateReportFunc = () => {
    apiClient.prices.downloadDuplicateReport();
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
      await fetchAndRenderDuplicates();
    } catch (error) {
      showErrorToast(error.message || "Merge failed");
    }
  };

  window.deleteDuplicateFunc = async (id) => {
    try {
      await apiClient.prices.removeDuplicate(id, {
        action: "delete",
        performedBy: "Alex Doshi",
      });
      showSuccessToast("Duplicate removed");
      await fetchAndRenderDuplicates();
    } catch (error) {
      showErrorToast(error.message || "Delete failed");
    }
  };

  window.bulkMergeSelectedFunc = async () => {
    const selectedGroups = duplicateGroups.filter((group) =>
      selectedDuplicateGroups.has(getGroupKey(group)),
    );

    const items = selectedGroups
      .map((group) => ({
        keepId: group.records?.[0]?._id,
        removeId: group.records?.[1]?._id,
      }))
      .filter((item) => item.keepId && item.removeId);

    if (!items.length) {
      showErrorToast("No valid duplicate pairs selected");
      return;
    }

    openBulkConfirmModal({
      title: "Confirm Bulk Merge",
      message: `Merge ${items.length} duplicate pairs? This will keep one record and remove the paired duplicate entries.`,
      confirmLabel: "Merge Selected",
      confirmClass: "success",
      onConfirm: async () => {
        try {
          await apiClient.prices.bulkResolve({
            action: "merge",
            items,
            performedBy: "Alex Doshi",
          });
          selectedDuplicateGroups.clear();
          showSuccessToast("Selected duplicates merged");
          await fetchAndRenderDuplicates();
        } catch (error) {
          showErrorToast(error.message || "Bulk merge failed");
        }
      },
    });
  };

  window.bulkDeleteSelectedFunc = async () => {
    const ids = duplicateGroups
      .filter((group) => selectedDuplicateGroups.has(getGroupKey(group)))
      .map((group) => group.records?.[1]?._id)
      .filter(Boolean);

    if (!ids.length) {
      showErrorToast("No valid duplicate records selected");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${ids.length} selected duplicate records? This will mark them as removed.`,
    );
    if (!confirmed) {
      return;
    }

    try {
      const response = await apiClient.prices.bulkResolve({
        action: "delete",
        ids,
        performedBy: "Alex Doshi",
      });
      selectedDuplicateGroups.clear();

      if ((response?.modified || 0) === 0) {
        showErrorToast(
          "No duplicates were deleted. Please refresh and try again.",
        );
      } else {
        showSuccessToast(`Deleted ${response.modified} duplicate records`);
      }

      await fetchAndRenderDuplicates();
    } catch (error) {
      showErrorToast(error.message || "Bulk delete failed");
    }
  };
}

function openBulkConfirmModal({
  title,
  message,
  confirmLabel,
  confirmClass = "primary",
  onConfirm,
}) {
  window.confirmBulkDuplicateActionFunc = async () => {
    closeModal();
    await onConfirm();
  };

  renderModal(
    title,
    `<p style="color:var(--text2)">${message}</p>`,
    `
      <div class="divider"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn ${confirmClass}" onclick="window.confirmBulkDuplicateActionFunc?.()">${confirmLabel}</button>
        <button class="btn ghost" onclick="window.closeModalFunc?.()">Cancel</button>
      </div>
    `,
  );
}

function getGroupKey(group) {
  const firstId = group?.records?.[0]?._id || "x";
  const secondId = group?.records?.[1]?._id || "y";
  return `${group?.norm || "none"}-${firstId}-${secondId}`;
}

function renderDuplicateGroup(group) {
  const [first, second] = group.records;
  if (!first || !second) {
    return "";
  }

  const firstNorm = (first.norm || first.plNumber || "").toLowerCase();
  const secondNorm = (second.norm || second.plNumber || "").toLowerCase();
  const firstDesc = (first.description || "").trim().toLowerCase();
  const secondDesc = (second.description || "").trim().toLowerCase();

  const numberDifferent = firstNorm !== secondNorm;
  const descDifferent = firstDesc !== secondDesc;
  const groupKey = getGroupKey(group);
  const isSelected = selectedDuplicateGroups.has(groupKey);

  return `
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text2)">
          <input type="checkbox" ${isSelected ? "checked" : ""} onchange="window.toggleDupGroupSelectionFunc?.('${groupKey}')">
          Select for bulk actions
        </label>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="tag review">${(group.type || "exact").toUpperCase()}</span>
          <span style="font-size:12px;color:var(--text3)">Key: ${group.norm}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="tag review">${group.count} records</span>
          <span class="tag review">Match Score: ${group.matchScore || 100}%</span>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Reason: ${group.reason || "PL number matches after normalization"}</div>
      <div class="diff-card">
        <div class="diff-col keep">
          <div class="diff-field">Keep</div>
          <div class="diff-value mono ${numberDifferent ? "diff-highlight" : ""}">${first.plNumber}</div>
          <div class="diff-value ${descDifferent ? "diff-highlight" : ""}" style="font-size:12px;color:var(--text2)">${first.description || "-"}</div>
        </div>
        <div class="diff-sep">↔</div>
        <div class="diff-col remove">
          <div class="diff-field">Resolve</div>
          <div class="diff-value mono ${numberDifferent ? "diff-highlight" : ""}">${second.plNumber}</div>
          <div class="diff-value ${descDifferent ? "diff-highlight" : ""}" style="font-size:12px;color:var(--text2)">${second.description || "-"}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid var(--border)">
        <button class="btn success sm" onclick="window.mergeDuplicateFunc?.('${first._id}', '${second._id}')">Merge</button>
        <button class="btn danger sm" onclick="window.deleteDuplicateFunc?.('${second._id}')">Delete Duplicate</button>
      </div>
    </div>
  `;
}
