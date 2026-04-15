import apiClient from "../api/client.js";
import { renderModal, closeModal } from "../ui/modal.js";
import { showErrorToast, showSuccessToast } from "../ui/toast.js";

let recSearch = "";
let recFilter = "active";

export async function renderRecords() {
  const c = document.getElementById("content");

  c.innerHTML = `<div class="card">Loading records...</div>`;

  try {
    const response = await apiClient.prices.getAll({
      search: recSearch,
      status: recFilter,
    });
    const records = response.data || [];

    c.innerHTML = `
      <div class="section-header">
        <div>
          <div class="section-title">PL Records</div>
          <div class="section-sub">${records.length} records found</div>
        </div>
        <button class="btn primary" id="tour-record-add" onclick="window.openAddModalFunc?.()">+ New Record</button>
      </div>

      <div class="search-row">
        <div class="search-wrap" id="tour-record-search">
          <span class="search-icon">⌕</span>
          <input
            class="input"
            placeholder="Search number or description..."
            value="${recSearch}"
            oninput="window.updateRecordsFunc?.(this.value, 'search')"
          >
        </div>
        <select class="input" style="width:150px" id="tour-record-filter" onchange="window.updateRecordsFunc?.(this.value, 'filter')">
          <option value="all" ${recFilter === "all" ? "selected" : ""}>All statuses</option>
          <option value="active" ${recFilter === "active" ? "selected" : ""}>Active</option>
          <option value="duplicate" ${recFilter === "duplicate" ? "selected" : ""}>Duplicate</option>
          <option value="removed" ${recFilter === "removed" ? "selected" : ""}>Removed</option>
        </select>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PL Number</th>
                <th>Normalized</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created By</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                records.length
                  ? records
                      .map(
                        (record) => `
                  <tr>
                    <td class="mono">${record.plNumber}</td>
                    <td class="mono" style="color:var(--text3);font-size:11px">${record.norm}</td>
                    <td>${record.description || "-"}</td>
                    <td><span class="tag ${record.status}">${record.status}</span></td>
                    <td>${record.createdBy || "System"}</td>
                    <td style="text-align:right">
                      <button class="btn ghost sm" onclick="window.openEditModalFunc?.('${record._id}', '${escapeQuote(record.plNumber)}', '${escapeQuote(record.description || "")}')">Edit</button>
                      <button class="btn danger sm" onclick="window.confirmDeleteFunc?.('${record._id}')">Delete</button>
                    </td>
                  </tr>
                `,
                      )
                      .join("")
                  : `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">◻</div><div class="empty-title">No records found</div></div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    bindRecordActions();
  } catch (error) {
    c.innerHTML = `<div class="card">Failed to load records</div>`;
    showErrorToast(error.message || "Failed to load records");
  }
}

function bindRecordActions() {
  window.updateRecordsFunc = (value, type) => {
    if (type === "search") {
      recSearch = value;
    } else {
      recFilter = value;
    }
    renderRecords();
  };

  window.openAddModalFunc = openAddModal;

  window.openEditModalFunc = (id, plNumber, description) => {
    renderModal(
      "Edit PL Record",
      `
      <div class="form-row">
        <label class="form-label">PL Number *</label>
        <input class="input" id="edit-num" value="${plNumber}">
      </div>
      <div class="form-row">
        <label class="form-label">Description</label>
        <input class="input" id="edit-desc" value="${description}">
      </div>
      `,
      `
      <div class="divider"></div>
      <div style="display:flex;gap:8px">
        <button class="btn primary" onclick="window.saveEditRecordFunc?.('${id}')">Save</button>
        <button class="btn ghost" onclick="window.closeModalFunc?.()">Cancel</button>
      </div>
      `,
    );
  };

  window.saveEditRecordFunc = async (id) => {
    try {
      await apiClient.prices.update(id, {
        plNumber: document.getElementById("edit-num").value.trim(),
        description: document.getElementById("edit-desc").value.trim(),
      });
      closeModal();
      showSuccessToast("Record updated");
      renderRecords();
    } catch (error) {
      showErrorToast(error.message || "Update failed");
    }
  };

  window.confirmDeleteFunc = async (id) => {
    try {
      await apiClient.prices.delete(id, { performedBy: "Alex Doshi" });
      showSuccessToast("Record deleted");
      renderRecords();
    } catch (error) {
      showErrorToast(error.message || "Delete failed");
    }
  };
}

export function openAddModal() {
  renderModal(
    "Add PL Record",
    `
    <div class="form-row">
      <label class="form-label">PL Number *</label>
      <input class="input" id="new-num" placeholder="e.g. PL-99001">
    </div>
    <div class="form-row">
      <label class="form-label">Description</label>
      <input class="input" id="new-desc" placeholder="Short description">
    </div>
    `,
    `
    <div class="divider"></div>
    <div style="display:flex;gap:8px">
      <button class="btn primary" onclick="window.saveNewRecordFunc?.()">Add Record</button>
      <button class="btn ghost" onclick="window.closeModalFunc?.()">Cancel</button>
    </div>
    `,
  );

  window.saveNewRecordFunc = saveNewRecord;
}

async function saveNewRecord() {
  const plNumber = document.getElementById("new-num").value.trim();
  const description = document.getElementById("new-desc").value.trim();

  if (!plNumber) {
    showErrorToast("PL Number is required");
    return;
  }

  try {
    await apiClient.prices.create({
      plNumber,
      description,
      createdBy: "Alex Doshi",
    });
    closeModal();
    showSuccessToast(`Record ${plNumber} added successfully`);
    renderRecords();
  } catch (error) {
    showErrorToast(error.message || "Create failed");
  }
}

function escapeQuote(value) {
  return String(value).replace(/'/g, "&#39;");
}
