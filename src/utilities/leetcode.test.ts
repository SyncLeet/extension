import { fetchSubmission } from "./leetcode";

test("fetchSubmission.toPass.01", async () => {
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
}, 2000);

test("fetchSubmission.toPass.02", async () => {
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
}, 2000);

test("fetchSubmission.toFail.01", async () => {
  const session = process.env.LEETCODE_SESSION;
  const promise = fetchSubmission(session, -1);
  await expect(promise).rejects.toThrow("fetchSubmission, empty response");
}, 2000);
