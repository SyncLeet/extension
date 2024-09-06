import { newOctokit } from './github';

/**
 * Retry a function with full-jitter exponential backoff
 * @param fn Function to retry
 * @param minDelay Minimum delay in seconds
 * @param maxRetry Maximum number of retries
 * @returns The result of the function
 * @throws An error if the function fails after all retries
 * @reference https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  minDelay: number = 8,
  maxRetry: number = 16
): Promise<T> => {
  for (let i = 0; i < maxRetry; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        const delay = Math.max(minDelay, Math.random() * 2 ** i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (i === maxRetry - 1) {
          throw error;
        }
      }
    }
  }
};

/**
 * Display an alert with a customizable message and hyperlink
 * @param type The type of alert to display ('leetcode' or 'github')
 * @param customMessage An optional custom message to display in the alert
 */
export function showAlert(type: 'leetcode' | 'custom', customMessage?: string): void {
  const alertDiv = document.getElementById("alert-danger");
  const alertMessage = document.getElementById("alert-message");

  if (alertDiv && alertMessage) {
    alertDiv.style.setProperty('display', 'flex', 'important');

    let message;
    if (type === 'custom' && customMessage) {
      message = customMessage;
    } else if (type === 'leetcode') {
      message = 'Please <a href="https://leetcode.com/accounts/login/" class="alert-link" target="_blank">login</a> to LeetCode first.';
    }

    alertMessage.innerHTML = message;
  }
}