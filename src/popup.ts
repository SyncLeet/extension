import { handleFetchAllSubmissionHistory, continueCountdownIfNeeded } from "./utilities/fetchHistoryHandler";

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", initialize);

// Initialization function
function initialize(): void {
  setupCheckbox();
  setupButton();
  continueCountdownIfNeeded();
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
