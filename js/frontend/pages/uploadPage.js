import apiClient from "../api/client.js";
import { showErrorToast, showSuccessToast } from "../ui/toast.js";

const PL_HEADER_CANDIDATES = ["plnumber", "plno", "pl", "pricelistnumber"];

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
        <div id="upload-dropzone" class="upload-dropzone">
          <input class="input" type="file" id="upload-file" accept=".csv,.json" />
          <div class="upload-drop-copy">Drag and drop CSV/JSON here, or click to browse.</div>
        </div>
      </div>
      <div class="upload-progress" id="upload-progress" style="display:none">
        <div class="upload-progress-bar" id="upload-progress-bar"></div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn primary" id="upload-submit-btn" onclick="window.processUploadFunc?.()">Upload and Process</button>
        <button class="btn" id="go-records-btn" style="display:none" onclick="window.goToRecordsFunc?.()">Go to PL Records</button>
      </div>
      <div id="upload-result" style="margin-top:14px;color:var(--text2);font-size:12px"></div>
    </div>
  </div>
  `;

  bindUploadDropzone();
  window.processUploadFunc = processUpload;
  window.downloadCleanedFunc = () => apiClient.prices.downloadCleaned();
  window.goToRecordsFunc = () => window.navigate?.("records");
}

function bindUploadDropzone() {
  const dropzone = document.getElementById("upload-dropzone");
  const fileInput = document.getElementById("upload-file");

  if (!dropzone || !fileInput) return;

  const setActive = (active) => {
    dropzone.classList.toggle("dragover", !!active);
  };

  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    setActive(true);
  });

  dropzone.addEventListener("dragleave", () => setActive(false));

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    setActive(false);
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
  });
}

function getNormalizedHeader(value = "") {
  return String(value)
    .trim()
    .replace(/^\uFEFF/, "")
    .replace(/^"|"$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function detectDelimiter(headerLine) {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = -1;

  for (const delimiter of candidates) {
    const count = headerLine.split(delimiter).length - 1;
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }

  return best;
}

function validateCSVContent(content) {
  const [headerLine] = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!headerLine) {
    return "CSV file is empty";
  }

  const delimiter = detectDelimiter(headerLine);
  const headers = headerLine.split(delimiter).map(getNormalizedHeader);
  const hasPL = headers.some((header) => PL_HEADER_CANDIDATES.includes(header));

  if (!hasPL) {
    return "Missing column: plNumber (accepted: PL Number, PL No, pl_number, plnumber, pl)";
  }

  return null;
}

function validateJSONContent(content) {
  let records;
  try {
    records = JSON.parse(content);
  } catch {
    return "JSON format is invalid";
  }

  if (!Array.isArray(records) || !records.length) {
    return "JSON file must contain an array with at least one record";
  }

  const first = records[0] || {};
  const keys = Object.keys(first).map((k) => k.toLowerCase());
  const hasPL = keys.some((key) => {
    const normalized = key.replace(/[^a-z0-9]/g, "").trim();
    return PL_HEADER_CANDIDATES.includes(normalized);
  });

  if (!hasPL) {
    return "Missing key: plNumber (accepted: plNumber, PLNo, pl_number, pl number, pl)";
  }

  return null;
}

function setProgress(value) {
  const progress = document.getElementById("upload-progress");
  const bar = document.getElementById("upload-progress-bar");

  if (!progress || !bar) return;
  progress.style.display = "block";
  bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
}

function setUploadingState(uploading) {
  const button = document.getElementById("upload-submit-btn");
  if (!button) return;
  button.disabled = uploading;
  button.textContent = uploading ? "Uploading..." : "Upload and Process";
}

async function processUpload() {
  const fileInput = document.getElementById("upload-file");
  const formatSelect = document.getElementById("upload-format");
  const result = document.getElementById("upload-result");
  const goRecordsBtn = document.getElementById("go-records-btn");

  if (!fileInput.files.length) {
    showErrorToast("Please select a file");
    return;
  }

  const file = fileInput.files[0];
  const format = formatSelect.value;

  try {
    setUploadingState(true);
    setProgress(15);

    const content = await file.text();
    setProgress(35);

    const validationError =
      format === "csv"
        ? validateCSVContent(content)
        : validateJSONContent(content);

    if (validationError) {
      setProgress(0);
      showErrorToast(`File validation failed: ${validationError}`);
      result.textContent = `✖ ${validationError}`;
      return;
    }

    result.textContent = "✔ File valid";
    setProgress(60);

    const response = await apiClient.prices.upload({
      format,
      content,
      createdBy: "Alex Doshi",
    });

    setProgress(100);

    showSuccessToast(response.message || "Upload completed");
    const skipped = Number(response.skipped || 0);
    result.textContent =
      skipped > 0
        ? `Uploaded: ${response.count ?? 0} records | Skipped: ${skipped}`
        : `Uploaded: ${response.count ?? 0} records`;

    if (goRecordsBtn) {
      goRecordsBtn.style.display = "inline-flex";
      goRecordsBtn.focus();
    }

    showSuccessToast("Upload complete. View records now?");
  } catch (error) {
    setProgress(0);
    showErrorToast(error.message || "Upload failed");
  } finally {
    setUploadingState(false);
  }
}
