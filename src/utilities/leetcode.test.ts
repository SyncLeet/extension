import { fetchSubmission } from "./leetcode";

test("fetchSubmission.toPass.01", async () => {
  const session = process.env.LEETCODE_SESSION;
  const submission = await fetchSubmission(session, 1320811270);
  expect(submission).toBeDefined();
  expect(submission.question).toBeDefined();
  expect(submission.question.title).toBe("Number of Atoms");
  expect(submission.question.questionId).toBe("726");
  expect(submission.question.titleSlug).toBe("number-of-atoms");
  expect(submission.totalCorrect).toBe(31);
  expect(submission.totalTestcases).toBe(31);
  expect(submission.runtimeDisplay).toBe("30 ms");
  expect(submission.memoryDisplay).toBe("16.7 MB");
  expect(submission.code).toContain("class Solution:");
  expect(submission.lang).toBeDefined();
  expect(submission.lang.name).toBe("python3");
});
