import { fetchAllSubmissionHistory } from "./utilities/leetcode";

document.addEventListener("DOMContentLoaded", function (): void {
  // notificationStatus
  let checkbox = document.getElementById(
    "notificationStatus"
  ) as HTMLInputElement;

  chrome.storage.sync.get(
    "notificationStatus",
    function (data: { notificationStatus: boolean }): void {
      checkbox.checked = data.notificationStatus;
    }
  );

  checkbox.addEventListener("change", function (): void {
    chrome.storage.sync.set({ notificationStatus: this.checked });
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
