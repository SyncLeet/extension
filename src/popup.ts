document.addEventListener("DOMContentLoaded", function (): void {
  let checkbox = document.getElementById("shouldNotify") as HTMLInputElement;

  chrome.storage.sync.get(
    "shouldNotify",
    function (data: { shouldNotify: boolean }): void {
      checkbox.checked = data.shouldNotify;
    }
  );

  checkbox.addEventListener("change", function (): void {
    chrome.storage.sync.set({ shouldNotify: this.checked });
  });
});
