const TOUR_STORAGE_KEY = "deduplix_tour_completed";

const STEP_SETS = {
  dashboard: [
    {
      selector: "#sidebar [data-page='records']",
      title: "Step 1: Manage your records",
      body: "Open PL Records to search, edit, or add individual Price List numbers.",
    },
    {
      selector: "#sidebar [data-page='upload']",
      title: "Step 2: Upload new data",
      body: "Use Upload when you have CSV or JSON files. The system imports records and checks for duplicates automatically.",
    },
    {
      selector: "#sidebar [data-page='duplicates']",
      title: "Step 3: Resolve duplicates",
      body: "Open Duplicate Review to merge matching records or remove duplicate entries.",
    },
    {
      selector: "#tour-hero",
      title: "Step 4: Read dashboard status",
      body: "This area summarizes current data quality so you can decide what to fix first.",
    },
    {
      selector: "#tour-preview",
      title: "Step 5: Start from this preview",
      body: "Review these highlighted duplicate groups first, then click Review all to complete cleanup.",
    },
  ],
  records: [
    {
      selector: "#tour-record-search",
      title: "Search by number or text",
      body: "Type any PL number or description keyword to quickly find matching records.",
    },
    {
      selector: "#tour-record-filter",
      title: "Filter by status",
      body: "Switch between Active, Duplicate, or Removed to focus on the records you need to work on.",
    },
    {
      selector: "#tour-record-add",
      title: "Add a new PL record",
      body: "Use this button to add one record manually when you do not need bulk upload.",
    },
  ],
  upload: [
    {
      selector: "#tour-upload-head",
      title: "Bulk upload and validate",
      body: "Choose file type, upload data, and let DeDupliX detect duplicate PL numbers during import.",
    },
  ],
  duplicates: [
    {
      selector: "#tour-duplicates-head",
      title: "Resolve queue",
      body: "Work through each duplicate group, keep the correct record, and remove or merge the extra entries.",
    },
  ],
  login: [
    {
      selector: "#content .auth-hero",
      title: "Welcome to DeDupliX",
      body: "The app is built to keep Price List records consistent and easy to audit.",
    },
    {
      selector: "#content .auth-card",
      title: "Sign in",
      body: "Use your credentials to enter the workspace and start reviewing data.",
    },
  ],
};

let overlayRoot = null;
let currentSteps = [];
let currentIndex = 0;

export function bindTourGuide() {
  const trigger = document.getElementById("tourBtn");
  if (trigger) {
    trigger.addEventListener("click", () => startTour());
  }
  window.startTour = startTour;
}

export function startTour(page = window.currentPage || "dashboard") {
  const steps = STEP_SETS[page] || STEP_SETS.dashboard;
  if (!steps.length) {
    return;
  }

  closeTour();
  currentSteps = steps;
  currentIndex = 0;

  overlayRoot = document.createElement("div");
  overlayRoot.className = "tour-overlay";
  overlayRoot.innerHTML = `
    <div class="tour-backdrop"></div>
    <div class="tour-spotlight"></div>
    <div class="tour-tooltip" role="dialog" aria-live="polite"></div>
  `;

  document.body.appendChild(overlayRoot);
  overlayRoot
    .querySelector(".tour-backdrop")
    .addEventListener("click", closeTour);
  renderStep();
}

function renderStep() {
  const step = currentSteps[currentIndex];
  if (!step) {
    completeTour();
    return;
  }

  const target = document.querySelector(step.selector);
  const spotlight = overlayRoot.querySelector(".tour-spotlight");
  const tooltip = overlayRoot.querySelector(".tour-tooltip");

  if (!target) {
    currentIndex += 1;
    renderStep();
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });

  requestAnimationFrame(() => {
    const rect = target.getBoundingClientRect();
    const padding = 10;
    spotlight.style.display = "block";
    spotlight.style.top = `${Math.max(rect.top - padding, 8)}px`;
    spotlight.style.left = `${Math.max(rect.left - padding, 8)}px`;
    spotlight.style.width = `${Math.min(rect.width + padding * 2, window.innerWidth - 16)}px`;
    spotlight.style.height = `${Math.min(rect.height + padding * 2, window.innerHeight - 16)}px`;

    const tooltipWidth = Math.min(360, window.innerWidth - 24);
    const preferredLeft = rect.left + rect.width + 18;
    const left =
      preferredLeft + tooltipWidth <= window.innerWidth
        ? preferredLeft
        : Math.max(12, rect.left);
    const top = Math.min(Math.max(rect.top, 12), window.innerHeight - 160);

    tooltip.style.display = "block";
    tooltip.style.width = `${tooltipWidth}px`;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.innerHTML = `
      <div class="tour-step-meta">Step ${currentIndex + 1} of ${currentSteps.length}</div>
      <h3>${step.title}</h3>
      <p>${step.body}</p>
      <div class="tour-actions">
        <button class="btn ghost sm" type="button" data-tour-action="back" ${currentIndex === 0 ? "disabled" : ""}>Back</button>
        <button class="btn ghost sm" type="button" data-tour-action="skip">Skip</button>
        <button class="btn primary sm" type="button" data-tour-action="next">${currentIndex === currentSteps.length - 1 ? "Finish" : "Next"}</button>
      </div>
    `;

    tooltip
      .querySelector('[data-tour-action="back"]')
      ?.addEventListener("click", () => {
        currentIndex = Math.max(0, currentIndex - 1);
        renderStep();
      });

    tooltip
      .querySelector('[data-tour-action="skip"]')
      ?.addEventListener("click", closeTour);
    tooltip
      .querySelector('[data-tour-action="next"]')
      ?.addEventListener("click", () => {
        currentIndex += 1;
        renderStep();
      });
  });
}

function completeTour() {
  localStorage.setItem(TOUR_STORAGE_KEY, "true");
  closeTour();
}

function closeTour() {
  if (overlayRoot) {
    overlayRoot.remove();
    overlayRoot = null;
  }
  currentSteps = [];
  currentIndex = 0;
}
