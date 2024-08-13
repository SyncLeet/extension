import { fetchHistory } from "./leetcode";
import { EXTENSION } from "./leetcode";

// Handle fetching all submission history
export function handleFetchAllSubmissionHistory(button: HTMLInputElement): void {
  button.disabled = true;
  const originalButtonText = button.textContent;
  const syncHistoryElement = document.getElementById("fetchAllHistoriesBtn");
  const progressContainer = createProgressContainer();

  syncHistoryElement.insertAdjacentElement("beforebegin", progressContainer);

  chrome.cookies.get(
    { url: "https://leetcode.com", name: "LEETCODE_SESSION" },
    (cookie) => {
      fetchHistory(cookie.value, (m, n) => {
        updateProgressBar(
          progressContainer,
          parseFloat(((m / n) * 100).toFixed(2))
        );
      })
        .then(async ([progress, submissions]) => {
          const batchSize = 50;
          const totalBatches = Math.ceil(submissions.length / batchSize);

          for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const start = batchIndex * batchSize;
            const end = Math.min(start + batchSize, submissions.length);
            const batchSubmissions = submissions.slice(start, end);
            const batchProgress = progress.slice(start, end);
            const changes: { path: string; content: string }[] = [];
            const message = `Synchronize existing submission history (${batchIndex + 1}/${totalBatches})`;

            for (let i = 0; i < batchSubmissions.length; i++) {
              const { topicTags: topics } = batchProgress[i];
              const submission = batchSubmissions[i];
              if (submission === null) {
                continue;
              }
              const { titleSlug, language } = submission;
              for (const topicSlug of topics) {
                changes.push({
                  path: `${topicSlug}/${titleSlug}.${EXTENSION[language]}`,
                  content: submission.code,
                });
              }
            }

            // Notify the user of the successful push
            await chrome.runtime.sendMessage({
              type: "commitFiles",
              payload: { message, changes },
            });
            chrome.storage.local.get(
              "shouldNotify",
              (data: { shouldNotify: boolean }): void => {
                if (data.shouldNotify) {
                  chrome.notifications.create({
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("asset/image/logox128.png"),
                    title: "SyncLeet: Pushed to GitHub",
                    message: `Synced ${batchSubmissions.length} submissions (${batchIndex + 1}/${totalBatches}).`,
                  });
                }
              }
            );

            console.log("Waiting for 10 seconds before next batch...");
            await new Promise((resolve) => setTimeout(resolve, 10000));
          }
        })
        .then(() => {
          progressContainer.remove();
        })
        .catch((error) => handleError(button, originalButtonText, error))
        .finally(() => {
          startCountdown(button, originalButtonText);
        });
    }
  );
}

// Create progress container element
function createProgressContainer(): HTMLDivElement {
  const progressContainer = document.createElement("div");
  progressContainer.className =
    "progress-container justify-content-between align-items-center";

  const infoRow = createInfoRow();
  progressContainer.appendChild(infoRow);

  const progressBarRow = createProgressBarRow();
  progressContainer.appendChild(progressBarRow);

  const bottomText = createBottomText();
  progressContainer.appendChild(bottomText);

  return progressContainer;
}

// Create info row element
function createInfoRow(): HTMLDivElement {
  const infoRow = document.createElement("div");
  infoRow.className = "info-row";
  infoRow.style.display = "flex";
  infoRow.style.justifyContent = "space-between";
  infoRow.style.alignItems = "center";

  const percentageText = createPercentageText();
  infoRow.appendChild(percentageText);

  const middleText = createMiddleText();
  infoRow.appendChild(middleText);

  const countdownText = createCountdownText();
  infoRow.appendChild(countdownText);

  return infoRow;
}

// Create progress bar row element
function createProgressBarRow(): HTMLDivElement {
  const progressBarRow = document.createElement("div");
  progressBarRow.className = "progress-bar-row";

  const progressDiv = createProgressDiv();
  progressBarRow.appendChild(progressDiv);

  return progressBarRow;
}

// Create percentage text element
function createPercentageText(): HTMLParagraphElement {
  const percentageText = document.createElement("p");
  percentageText.className = "percentage-text";
  percentageText.textContent = "0%";
  return percentageText;
}

// Create middle text element
function createMiddleText(): HTMLParagraphElement {
  const middleText = document.createElement("p");
  middleText.className = "middle-text";
  middleText.textContent = "Sync in progress...";
  return middleText;
}

// Create countdown text element
function createCountdownText(): HTMLParagraphElement {
  const countdownText = document.createElement("p");
  countdownText.className = "countdown-text";
  countdownText.textContent = "s left";
  return countdownText;
}

// Create progress div element
function createProgressDiv(): HTMLDivElement {
  const progressDiv = document.createElement("div");
  progressDiv.className = "progress";

  const progressBar = createProgressBar();
  progressDiv.appendChild(progressBar);

  return progressDiv;
}

// Create progress bar element
function createProgressBar(): HTMLDivElement {
  const progressBar = document.createElement("div");
  progressBar.className =
    "progress-bar progress-bar-striped progress-bar-animated";
  progressBar.setAttribute("role", "progressbar");
  progressBar.setAttribute("aria-valuenow", "0");
  progressBar.setAttribute("aria-valuemin", "0");
  progressBar.setAttribute("aria-valuemax", "100");
  progressBar.style.width = "0%";
  progressBar.style.setProperty("color", "#FFA115", "important");
  return progressBar;
}

// Create bottom text element
function createBottomText(): HTMLParagraphElement {
  const bottomText = document.createElement("p");
  bottomText.textContent = "Do not close this popup while synchronizing";
  bottomText.style.color = "grey";
  bottomText.style.textAlign = "center";
  return bottomText;
}

// Global variable for start time
let startTime: number | null = null;

// Update progress bar
function updateProgressBar(
  progressContainer: HTMLDivElement,
  progress: number
): void {
  if (!startTime) startTime = Date.now();

  const progressBar = progressContainer.querySelector(
    ".progress-bar"
  ) as HTMLDivElement;
  const percentageText = progressContainer.querySelector(
    ".percentage-text"
  ) as HTMLParagraphElement;
  const countdownText = progressContainer.querySelector(
    ".countdown-text"
  ) as HTMLParagraphElement;

  if (!progressBar || !percentageText || !countdownText) {
    console.error("A required progress element was not found");
    return;
  }

  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute("aria-valuenow", progress.toString());
  percentageText.textContent = `${progress}%`;

  if (progress > 0) {
    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
    const estimatedTotalTime = elapsedTime / (progress / 100);
    const timeLeft = estimatedTotalTime - elapsedTime;
    countdownText.textContent = `${Math.ceil(timeLeft)}s left`;
  }

  if (progress === 100) {
    progressContainer.remove();
    startTime = null; // Reset startTime for the next operation
  }
}

// Start countdown
function startCountdown(
  button: HTMLInputElement,
  originalButtonText: string
): void {
  // Calculate target end time instead of countdown
  chrome.storage.local.get(["endTime"], (result) => {
    let endTime = result.endTime;
    if (!endTime) {
      const countdownDuration = 60 * 1000;
      endTime = Date.now() + countdownDuration;
      chrome.storage.local.set({ endTime: endTime });
    }
    updateCountdown(button, originalButtonText, endTime);
  });
}

function updateCountdown(
  button: HTMLInputElement,
  originalButtonText: string,
  endTime: number
): void {
  const update = () => {
    const currentTime = Date.now();
    let countdown = Math.ceil((endTime - currentTime) / 1000);

    if (countdown > 0) {
      button.textContent = `${originalButtonText} (${countdown}s)`;
    } else {
      clearInterval(interval);
      chrome.storage.local.remove(["endTime"], () => {
        button.textContent = originalButtonText;
        button.disabled = false;
      });
    }
  };

  update(); // Update immediately to avoid delay
  const interval = setInterval(update, 1000);
}

// Function to continue countdown if needed
export function continueCountdownIfNeeded(): void {
  const button = document.getElementById(
    "fetchAllHistoriesBtn"
  ) as HTMLInputElement;
  const originalButtonText = button.textContent || "Fetch All Histories";

  chrome.storage.local.get(["endTime"], (result) => {
    if (result.endTime && Date.now() < result.endTime) {
      button.disabled = true;
      updateCountdown(button, originalButtonText, result.endTime);
    }
  });
}

// Handle error
function handleError(
  button: HTMLInputElement,
  originalButtonText: string,
  error: Error
): void {
  console.error("Failed to fetch all submission history:", error);
  button.value = originalButtonText;
  button.disabled = false;
}
