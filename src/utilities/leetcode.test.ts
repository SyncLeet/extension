import { fetchSubmissionById } from "./leetcode";
import { fetchTopicsBySlug } from "./leetcode";
import { fetchProgressAtPage } from "./leetcode";
import { fetchLastAcceptedId } from "./leetcode";
import { fetchHistory } from "./leetcode";

describe("LeetCode Module", () => {
  test(
    "fetchSubmissionById.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const submission = await fetchSubmissionById(session, 1320811270);
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
    "fetchSubmissionById.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const submission = await fetchSubmissionById(session, 700806193);
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
    "fetchSubmissionById.toFail.01",
    async () => {
      const session = "Invalid LeetCode Session";
      const promise = fetchSubmissionById(session, 1320811270);
      await expect(promise).rejects.toThrow(
        "fetchSubmissionById, empty response"
      );
    },
    2 * 1000
  );

  test(
    "fetchTopicsBySlug.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const topics = await fetchTopicsBySlug(session, "number-of-atoms");
      expect(topics).toBeDefined();
      expect(topics).toContain("stack");
      expect(topics).toContain("string");
      expect(topics).toContain("hash-table");
      expect(topics).toContain("sorting");
    },
    2 * 1000
  );

  test(
    "fetchTopicsBySlug.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const topics = await fetchTopicsBySlug(
        session,
        "regular-expression-matching"
      );
      expect(topics).toBeDefined();
      expect(topics).toContain("string");
      expect(topics).toContain("dynamic-programming");
      expect(topics).toContain("recursion");
    },
    2 * 1000
  );

  test(
    "fetchTopicsBySlug.toFail.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const promise = fetchTopicsBySlug(
        session,
        "invalidtitleslugthatdoesnotexist"
      );
      await expect(promise).rejects.toThrow(
        "fetchTopicsBySlug, empty response"
      );
    },
    2 * 1000
  );

  test(
    "fetchProgressAtPage.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const [hasMore, history] = await fetchProgressAtPage(session, 0);
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
    "fetchProgressAtPage.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const [hasMore, history] = await fetchProgressAtPage(session, 1);
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
    "fetchProgressAtPage.toFail.01",
    async () => {
      const session = "Invalid LeetCode Session";
      const promise = fetchProgressAtPage(session, 0);
      await expect(promise).rejects.toThrow(
        "fetchProgressAtPage, empty response"
      );
    },
    2 * 1000
  );

  test(
    "fetchLastAcceptedId.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const titleSlug = "number-of-atoms";
      const submissionId = await fetchLastAcceptedId(session, titleSlug);
      expect(submissionId).toBeDefined();
      expect(submissionId).toBeGreaterThan(0);
    },
    2 * 1000
  );

  test(
    "fetchLastAcceptedId.toPass.02",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const titleSlug = "regular-expression-matching";
      const submissionId = await fetchLastAcceptedId(session, titleSlug);
      expect(submissionId).toBeDefined();
      expect(submissionId).toBeGreaterThan(0);
    },
    2 * 1000
  );

  test(
    "fetchLastAcceptedId.toFail.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const titleSlug = "invalidtitleslugthatdoesnotexist";
      const promise = fetchLastAcceptedId(session, titleSlug);
      await expect(promise).rejects.toThrow(
        "fetchLastAcceptedId, empty response"
      );
    },
    2 * 1000
  );

  test(
    "fetchHistory.toPass.01",
    async () => {
      const session = process.env.LEETCODE_SESSION;
      const [progress, history] = await fetchHistory(session, () => {});
      expect(progress).toBeDefined();
      expect(history).toBeDefined();
      expect(progress.length).toBe(history.length);
      for (let i = 0; i < progress.length; i++) {
        expect(progress[i].titleSlug).toBe(history[i].titleSlug);
        expect(history[i].accepted).toBe(true);
      }
    },
    180 * 1000
  );
});
