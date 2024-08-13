import { handleFetchAllSubmissionHistory, continueCountdownIfNeeded } from "./utilities/fetchHistoryHandler";
declare const bootstrap: any;

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", initialize);

// Initialization function
function initialize(): void {
  initializeTooltips();
  setupCheckbox();
  setupButton();
  continueCountdownIfNeeded();
  addBadgeIfBeforeDate();
}

// Initialize tooltips
function initializeTooltips(): void {
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  const tooltipList = tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// Setup checkbox functionality
function setupCheckbox(): void {
  const checkbox = document.getElementById("shouldNotify") as HTMLInputElement;
  chrome.storage.local.get(
    "shouldNotify",
    (data: { shouldNotify: boolean }): void => {
      checkbox.checked = data.shouldNotify;
    }
  );
  checkbox.addEventListener("change", function (): void {
    chrome.storage.local.set({ shouldNotify: this.checked });
  });
}

// Setup button functionality
function setupButton(): void {
  const button = document.getElementById(
    "fetchAllHistoriesBtn"
  ) as HTMLInputElement;
  if (!button) {
    console.error("Button not found");
    return;
  }
  button.addEventListener("click", () =>
    handleFetchAllSubmissionHistory(button)
  );
}

function addBadgeIfBeforeDate(): void {
  const endDate = new Date("2024-10-27T23:59:59");
  const currentDate = new Date();

  if (currentDate <= endDate) {
    const settingsContainer = document.querySelector(".fetch-history-container");
    if (settingsContainer) {
      const badgeHTML = `
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
          New
        </span>`;
      const h6Element = settingsContainer.querySelector("h6.position-relative");
      if (h6Element) {
        h6Element.innerHTML += badgeHTML;
      }
    }
  }
}