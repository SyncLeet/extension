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
