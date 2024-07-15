import { fetchHistory } from "./utilities/leetcode";
import { commitFiles, newOctokit } from "./utilities/github";
import { EXTENSION } from "./utilities/leetcode";

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
  chrome.storage.local.get("shouldNotify", (data: { shouldNotify: boolean }): void => {
    checkbox.checked = data.shouldNotify;
  });
  checkbox.addEventListener("change", function (): void {
    chrome.storage.local.set({ shouldNotify: this.checked });
  });
}

// Setup button functionality
function setupButton(): void {
  const button = document.getElementById("fetchAllHistoriesBtn") as HTMLInputElement;
  if (!button) {
    console.error("Button not found");
    return;
  }
  button.addEventListener("click", () => handleFetchAllSubmissionHistory(button));
}

// Handle fetching all submission history
function handleFetchAllSubmissionHistory(button: HTMLInputElement): void {
  button.disabled = true;
  const originalButtonText = button.textContent;
  const syncHistoryElement = document.getElementById("fetchAllHistoriesBtn");
  const progressContainer = createProgressContainer();

  syncHistoryElement.insertAdjacentElement('beforebegin', progressContainer);

  chrome.cookies.get(
    {'url': 'https://leetcode.com', 'name': 'LEETCODE_SESSION'},
    (cookie) => {
      fetchHistory(cookie.value, (m, n) => {
        updateProgressBar(progressContainer, parseFloat((m / n * 100).toFixed(2)));
    })
        .then(async ([progress, submissions]) => {
          const octokit = await newOctokit();
          const changes: {path: string, content: string}[] = [];
          const message = "Synchronize exisiting submission history";
          for (let i = 0; i < progress.length; i++) {
            const { topicTags: topics } = progress[i];
            const submission = submissions[i];
            // Synchronize to GitHub on a topic-by-topic basis
            const { titleSlug, language } = submission;
            for (const topicSlug of topics) {
              changes.push({
                path: `${topicSlug}/${titleSlug}.${EXTENSION[language]}`,
                content: submission.code,
              });
            }
          }
          // Notify the user of the successful push
          await commitFiles(octokit, message, changes);
          chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("asset/image/logox128.png"),
            title: "SyncLeet: Pushed to GitHub",
            message: `Existing ${progress.length} submission histories.`,
          });
        })
        .then(() => {
          progressContainer.remove();
        })
        .catch((error) => handleError(button, originalButtonText, error))
        .finally(() => {
          startCountdown(button, originalButtonText);
        });
    }
  )
}

// Create progress container element
function createProgressContainer(): HTMLDivElement {
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container justify-content-between align-items-center';

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
  const infoRow = document.createElement('div');
  infoRow.className = 'info-row';
  infoRow.style.display = 'flex';
  infoRow.style.justifyContent = 'space-between';
  infoRow.style.alignItems = 'center';

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
  const progressBarRow = document.createElement('div');
  progressBarRow.className = 'progress-bar-row';

  const progressDiv = createProgressDiv();
  progressBarRow.appendChild(progressDiv);

  return progressBarRow;
}

// Create percentage text element
function createPercentageText(): HTMLParagraphElement {
  const percentageText = document.createElement('p');
  percentageText.className = 'percentage-text';
  percentageText.textContent = '0%';
  return percentageText;
}

// Create middle text element
function createMiddleText(): HTMLParagraphElement {
  const middleText = document.createElement('p');
  middleText.className = 'middle-text';
  middleText.textContent = 'Sync in progress...';
  return middleText;
}

// Create countdown text element
function createCountdownText(): HTMLParagraphElement {
  const countdownText = document.createElement('p');
  countdownText.className = 'countdown-text';
  countdownText.textContent = 's left';
  return countdownText;
}

// Create progress div element
function createProgressDiv(): HTMLDivElement {
  const progressDiv = document.createElement('div');
  progressDiv.className = 'progress';

  const progressBar = createProgressBar();
  progressDiv.appendChild(progressBar);

  return progressDiv;
}

// Create progress bar element
function createProgressBar(): HTMLDivElement {
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
  progressBar.setAttribute('role', 'progressbar');
  progressBar.setAttribute('aria-valuenow', '0');
  progressBar.setAttribute('aria-valuemin', '0');
  progressBar.setAttribute('aria-valuemax', '100');
  progressBar.style.width = '0%';
  progressBar.style.setProperty('color', '#FFA115', 'important');
  return progressBar;
}

// Create bottom text element
function createBottomText(): HTMLParagraphElement {
  const bottomText = document.createElement('p');
  bottomText.textContent = 'Do not close this popup while synchronizing';
  bottomText.style.color = 'grey';
  bottomText.style.textAlign = 'center';
  return bottomText;
}

// Global variable for start time
let startTime: number | null = null;

// Update progress bar
function updateProgressBar(progressContainer: HTMLDivElement, progress: number): void {
  if (!startTime) startTime = Date.now();

  const progressBar = progressContainer.querySelector('.progress-bar') as HTMLDivElement;
  const percentageText = progressContainer.querySelector('.percentage-text') as HTMLParagraphElement;
  const countdownText = progressContainer.querySelector('.countdown-text') as HTMLParagraphElement;

  if (!progressBar || !percentageText || !countdownText) {
    console.error('A required progress element was not found');
    return;
  }

  progressBar.style.width = `${progress}%`;
  progressBar.setAttribute('aria-valuenow', progress.toString());
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
function startCountdown(button: HTMLInputElement, originalButtonText: string): void {
  // Calculate target end time instead of countdown
  chrome.storage.local.get(['endTime'], (result) => {
    let endTime = result.endTime;
    if (!endTime) {
      const countdownDuration = 60 * 1000;
      endTime = Date.now() + countdownDuration;
      chrome.storage.local.set({ endTime: endTime });
    }
    updateCountdown(button, originalButtonText, endTime);
  });
}

function updateCountdown(button: HTMLInputElement, originalButtonText: string, endTime: number): void {
  const update = () => {
    const currentTime = Date.now();
    let countdown = Math.ceil((endTime - currentTime) / 1000);

    if (countdown > 0) {
      button.textContent = `${originalButtonText} (${countdown}s)`;
    } else {
      clearInterval(interval);
      chrome.storage.local.remove(['endTime'], () => {
        button.textContent = originalButtonText;
        button.disabled = false;
      });
    }
  };

  update(); // Update immediately to avoid delay
  const interval = setInterval(update, 1000);
}

// Function to continue countdown if needed
function continueCountdownIfNeeded(): void {
  const button = document.getElementById("fetchAllHistoriesBtn") as HTMLInputElement;
  const originalButtonText = button.textContent || "Fetch All Histories";

  chrome.storage.local.get(['endTime'], (result) => {
    if (result.endTime && Date.now() < result.endTime) {
      button.disabled = true;
      updateCountdown(button, originalButtonText, result.endTime);
    }
  });
}

// Handle error
function handleError(button: HTMLInputElement, originalButtonText: string, error: Error): void {
  console.error("Failed to fetch all submission history:", error);
  button.value = originalButtonText;
  button.disabled = false;
}