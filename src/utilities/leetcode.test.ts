import { fetchSubmission } from "./leetcode";
import { fetchProgressListAt, fetchProgressList } from "./leetcode";
import { fetchLastSubmitted } from "./leetcode";

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
    2 * 1000
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
    2 * 1000
  );

  test(
    "fetchSubmission.toFail.01",
    async () => {
      const session = "Invalid LeetCode Session";
      const promise = fetchSubmission(session, 1320811270);
      await expect(promise).rejects.toThrow("fetchSubmission, empty response");
    },
    2 * 1000
  );

  test(
    "fetchProgressListAt.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const [hasMore, history] = await fetchProgressListAt(session, 0);
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
    2 * 1000
  );

  test(
    "fetchProgressListAt.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const [hasMore, history] = await fetchProgressListAt(session, 1);
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
    2 * 1000
  );

  test(
    "fetchProgressListAt.toFail.01",
    async () => {
      const session = "Invalid LeetCode Session";
      const promise = fetchProgressListAt(session, 0);
      await expect(promise).rejects.toThrow(
        "fetchProgressListAt, empty response"
      );
    },
    2 * 1000
  );

  test(
    "fetchProgressList.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const history = await fetchProgressList(session);
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
    8 * 1000
  );

  test(
    "fetchLastSubmitted.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const titleSlug = "number-of-atoms";
      const submissionId = await fetchLastSubmitted(session, titleSlug);
      expect(submissionId).toBeDefined();
      expect(submissionId).toBeGreaterThan(0);
    },
    2 * 1000
  );

  test(
    "fetchLastSubmitted.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const titleSlug = "regular-expression-matching";
      const submissionId = await fetchLastSubmitted(session, titleSlug);
      expect(submissionId).toBeDefined();
      expect(submissionId).toBeGreaterThan(0);
    },
    2 * 1000
  );

  test(
    "fetchLastSubmitted.toFail.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const titleSlug = "invalidtitleslugthatdoesnotexist";
      const promise = fetchLastSubmitted(session, titleSlug);
      await expect(promise).rejects.toThrow(
        "fetchLastSubmitted, empty response"
      );
    },
    2 * 1000
  );
});
