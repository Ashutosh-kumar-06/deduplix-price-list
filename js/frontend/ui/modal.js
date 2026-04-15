// ==================== MODAL MANAGEMENT ====================
export function closeModal() {
  const modalArea = document.getElementById("modal-area");
  if (modalArea) {
    modalArea.innerHTML = "";
  }
}

export function renderModal(title, content, footer = "") {
  const modalArea = document.getElementById("modal-area");
  const html = `
    <div class="modal-overlay" onclick="if(event.target===this) window.closeModalFunc?.()">
      <div class="modal">
        <div class="modal-title">
          ${title}
          <button class="modal-close" onclick="window.closeModalFunc?.()">✕</button>
        </div>
        ${content}
        ${footer ? `<div style="margin-top:16px">${footer}</div>` : ""}
      </div>
    </div>
  `;
  modalArea.innerHTML = html;
  window.closeModalFunc = closeModal;
}

export function renderConfirmModal(
  title,
  message,
  confirmText,
  confirmAction,
  cancelAction = closeModal,
) {
  const content = `<p style="color:var(--text2);margin-bottom:16px">${message}</p>`;
  const footer = `
    <div style="display:flex;gap:8px">
      <button class="btn primary" onclick="(${String(confirmAction)})()">
        ${confirmText}
      </button>
      <button class="btn ghost" onclick="(${String(cancelAction)})()">Cancel</button>
    </div>
  `;
  renderModal(title, content, footer);
}

export function renderFormModal(
  title,
  formContent,
  submitText,
  submitAction,
  cancelAction = closeModal,
) {
  const footer = `
    <div class="divider"></div>
    <div style="display:flex;gap:8px">
      <button class="btn primary" onclick="(${String(submitAction)})()">
        ${submitText}
      </button>
      <button class="btn ghost" onclick="(${String(cancelAction)})()">Cancel</button>
    </div>
  `;
  renderModal(title, formContent, footer);
}
