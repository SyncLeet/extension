import { fetchAllSubmissionHistory } from "./utilities/leetcode";

document.addEventListener("DOMContentLoaded", function (): void {
  // shouldNotify
  let checkbox = document.getElementById(
    "shouldNotify"
  ) as HTMLInputElement;

  chrome.storage.sync.get(
    "shouldNotify",
    function (data: { shouldNotify: boolean }): void {
      checkbox.checked = data.shouldNotify;
    }
  );

  checkbox.addEventListener("change", function (): void {
    chrome.storage.sync.set({ shouldNotify: this.checked });
  });

  // fetchAllHistoriesBtn
  const button = document.getElementById(
    "fetchAllHistoriesBtn"
  ) as HTMLInputElement;

  if (button) {
    button.addEventListener("click", () => {
      // chrome.runtime.sendMessage({ action: "fetchAllHistory" });
      fetchAllSubmissionHistory().then(console.dir);
    });
  } else {
    console.error("Button not found");
  }
});
