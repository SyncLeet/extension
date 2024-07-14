import { fetchSubmission } from "./leetcode";
import { fetchProgressAt, fetchProgress } from "./leetcode";

describe("LeetCode Module", () => {
  test(
    "fetchSubmission.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const submission = await fetchSubmission(session, 1320811270);
      expect(submission).toBeDefined();
      expect(submission.title).toBe("Number of Atoms");
      expect(submission.titleSlug).toBe("number-of-atoms");
      expect(submission.accepted).toBe(true);
      expect(submission.runtime).toBe("30 ms");
      expect(submission.memory).toBe("16.7 MB");
      expect(submission.language).toBe("python3");
      expect(submission.code).toContain("class Solution:");
    },
    1 * 1000
  );

  test(
    "fetchSubmission.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const submission = await fetchSubmission(session, 700806193);
      expect(submission).toBeDefined();
      expect(submission.title).toBe("Regular Expression Matching");
      expect(submission.titleSlug).toBe("regular-expression-matching");
      expect(submission.accepted).toBe(false);
      expect(submission.runtime).toBe("N/A");
      expect(submission.memory).toBe("N/A");
      expect(submission.language).toBe("python3");
      expect(submission.code).toContain("class Solution:");
    },
    1 * 1000
  );

  test(
    "fetchSubmission.toFail.01",
    async () => {
      const session = "Invalid LeetCode Session";
      const promise = fetchSubmission(session, 1320811270);
      await expect(promise).rejects.toThrow("fetchSubmission, empty response");
    },
    1 * 1000
  );

  test(
    "fetchProgressAt.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const [hasMore, history] = await fetchProgressAt(session, 0);
      expect(hasMore).toBe(true);
      for (const item of history) {
        expect(item.titleSlug).toBeDefined();
        expect(item.titleSlug).not.toBe("");
        expect(item.topicTags).toBeDefined();
        for (const tag of item.topicTags) {
          expect(tag).toBeDefined();
          expect(tag).not.toBe("");
        }
      }
    },
    1 * 1000
  );

  test(
    "fetchProgressAt.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const [hasMore, history] = await fetchProgressAt(session, 1);
      expect(hasMore).toBe(true);
      for (const item of history) {
        expect(item.titleSlug).toBeDefined();
        expect(item.titleSlug).not.toBe("");
        expect(item.topicTags).toBeDefined();
        for (const tag of item.topicTags) {
          expect(tag).toBeDefined();
          expect(tag).not.toBe("");
        }
      }
    },
    1 * 1000
  );

  test(
    "fetchProgressAt.toFail.01",
    async () => {
      const session = "Invalid LeetCode Session";
      const promise = fetchProgressAt(session, 0);
      await expect(promise).rejects.toThrow("fetchProgressAt, empty response");
    },
    1 * 1000
  );

  test(
    "fetchProgress.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const history = await fetchProgress(session);
      for (const item of history) {
        expect(item.titleSlug).toBeDefined();
        expect(item.titleSlug).not.toBe("");
        expect(item.topicTags).toBeDefined();
        for (const tag of item.topicTags) {
          expect(tag).toBeDefined();
          expect(tag).not.toBe("");
        }
      }
    },
    10 * 1000
  );
});
