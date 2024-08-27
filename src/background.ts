import { newOctokit, commitFiles, newRepository, getAndStoreUserPlan } from "./utilities/github";
import { fetchSubmissionById, fetchTopicsBySlug } from "./utilities/leetcode";
import { EXTENSION } from "./utilities/leetcode";

const runMain = async () => {
  /**
   * Prepare GitHub client and repository.
   */
  const octokit = await newOctokit();
  await newRepository(octokit);

  // Get and store the user's GitHub plan
  const plan = await getAndStoreUserPlan(octokit);
  
  /**
   * Listen for files commit
   */
  chrome.runtime.onMessage.addListener(async (message) => {
    const { type, payload } = message;
    switch (type) {
      case "commitFiles": {
        const { message, changes } = payload;
        await commitFiles(octokit, message, changes);
        break;
      }
    }
    return true;
  });

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
          // Fetch the session cookie from LeetCode
          chrome.cookies.get(
            {
              url: "https://leetcode.com",
              name: "LEETCODE_SESSION",
            },
            async (cookie) => {
              // Fetch the submission and its question topics
              const submission = await fetchSubmissionById(
                cookie.value,
                submissionId
              );
              const topics = await fetchTopicsBySlug(
                cookie.value,
                submission.titleSlug
              );
              // Synchronize to GitHub on a topic-by-topic basis
              const { titleSlug, runtime, memory, language } = submission;
              const prefix = plan === "pro" ? "LC-" : ":ballot_box_with_check: ";
              const message = `${prefix}${titleSlug} [Runtime: ${runtime}; Memory: ${memory}]`;

              const changes: { path: string; content: string }[] = [];
              for (const topicSlug of topics) {
                changes.push({
                  path: `${topicSlug}/${titleSlug}.${EXTENSION[language]}`,
                  content: submission.code,
                });
              }
              // Notify the user of the successful push
              await commitFiles(octokit, message, changes);
              chrome.storage.local.get(
                "shouldNotify",
                (data: { shouldNotify: boolean }): void => {
                  if (data.shouldNotify) {
                    chrome.notifications.create({
                      type: "basic",
                      iconUrl: chrome.runtime.getURL(
                        "asset/image/logox128.png"
                      ),
                      title: "SyncLeet: Pushed to GitHub",
                      message: `Question: ${submission.title}`,
                    });
                  }
                }
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

const onError = (error: Error) => {
  chrome.storage.local.get(
    "shouldNotify",
    (data: { shouldNotify: boolean }): void => {
      if (data.shouldNotify) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("asset/image/logox128.png"),
          title: "SyncLeet: An Error Occurred",
          message: `Report with https://github.com/SyncLeet/extension/issues\nError:${error.message}`,
        });
      }
    }
  );
};

runMain().catch(onError);