import apiClient from "../api/client.js";
import { showErrorToast, showSuccessToast } from "../ui/toast.js";

export function renderUpload() {
  const c = document.getElementById("content");
  c.innerHTML = `
  <div style="max-width:760px">
    <div class="section-header" id="tour-upload-head">
      <div>
        <div class="section-title">Upload Price List</div>
        <div class="section-sub">Upload CSV or JSON and detect duplicates</div>
      </div>
      <button class="btn" onclick="window.downloadCleanedFunc?.()">Download Cleaned</button>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="form-row">
        <label class="form-label">File Type</label>
        <select class="input" id="upload-format" style="max-width:220px">
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
      </div>
      <div class="form-row">
        <label class="form-label">Select File</label>
        <input class="input" type="file" id="upload-file" accept=".csv,.json" />
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn primary" onclick="window.processUploadFunc?.()">Upload and Process</button>
      </div>
      <div id="upload-result" style="margin-top:14px;color:var(--text2);font-size:12px"></div>
    </div>
  </div>
  `;

  window.processUploadFunc = processUpload;
  window.downloadCleanedFunc = () => apiClient.prices.downloadCleaned();
}

async function processUpload() {
  const fileInput = document.getElementById("upload-file");
  const formatSelect = document.getElementById("upload-format");
  const result = document.getElementById("upload-result");

  if (!fileInput.files.length) {
    showErrorToast("Please select a file");
    return;
  }

  const file = fileInput.files[0];
  const format = formatSelect.value;

  try {
    const content = await file.text();
    const response = await apiClient.prices.upload({
      format,
      content,
      createdBy: "Alex Doshi",
    });

    showSuccessToast(response.message || "Upload completed");
    result.textContent = `Uploaded: ${response.count ?? 0} records`;
  } catch (error) {
    showErrorToast(error.message || "Upload failed");
  }
}
