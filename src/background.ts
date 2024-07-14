import { newOctokit, commitFiles, newRepository } from "./utilities/github";
import { fetchSubmissionById } from "./utilities/leetcode";

const runMain = async () => {
  /**
   * Prepare GitHub client and repository.
   */
  const octokit = await newOctokit();
  await newRepository(octokit);

  /**
   * Listen for submission checks
   */
  const submitted = new Set<number>();
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const match = details.url.match(/detail\/(.*?)\/check/);
      submitted.add(parseInt(match[1], 10));
    },
    { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
  );

  /**
   * Listen for submission details once checked
   */
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const encoded = details.requestBody.raw[0].bytes;
      const decoder = new TextDecoder("utf-8");
      const decoded = decoder.decode(encoded);
      const request = JSON.parse(decoded);
      if (request.operationName == "submissionDetails") {
        const submissionId = request.variables.submissionId;
        if (submitted.delete(submissionId)) {
          chrome.cookies.get(
            {
              url: "https://leetcode.com",
              name: "LEETCODE_SESSION",
            },
            async (cookie) => {
              const submission = await fetchSubmissionById(
                cookie.value,
                submissionId
              );
            }
          );
        }
      }
    },
    { urls: ["https://leetcode.com/graphql/"] },
    ["requestBody"]
  );
};

runMain();
