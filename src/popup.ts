document.addEventListener("DOMContentLoaded", function (): void {
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
});
