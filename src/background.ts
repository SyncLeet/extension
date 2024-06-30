import { newOctokit, commitFiles } from "./utilities/github";
import { Message } from "./utilities/message";

const runGitHubHandler = async () => {
  const octokit = await newOctokit();
  chrome.runtime.onMessage.addListener(async (request: Message) => {
    switch (request.action) {
      case "commitFiles": {
        const { message, changes } = request.params;
        await commitFiles(octokit, message, changes);
        break;
      }
      case "createNotifications": {
        const { title, message } = request.params;
        chrome.notifications.create({
          type: "basic",
          iconUrl: chrome.runtime.getURL("asset/image/logox128.png"),
          title,
          message,
        });
        break;
      }
    }
    return true;
  });
};

const runLeetCodeHandler = async () => {
  const submitted = new Set<number>();
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const match = details.url.match(/detail\/(.*?)\/check/);
      submitted.add(parseInt(match[1], 10));
    },
    { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
  );
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const encoded = details.requestBody.raw[0].bytes;
      const decoder = new TextDecoder("utf-8");
      const decoded = decoder.decode(encoded);
      const request = JSON.parse(decoded);
      if (request.operationName == "submissionDetails") {
        const submissionId = request.variables.submissionId;
        if (submitted.delete(submissionId)) {
          chrome.tabs.sendMessage(details.tabId, {
            action: "fetchSubmissionDetails",
            params: { submissionId },
          });
        }
      }
    },
    { urls: ["https://leetcode.com/graphql/"] },
    ["requestBody"]
  );
};

const runMain = async () => {
  await runGitHubHandler();
  await runLeetCodeHandler();
};

const onError = (error: Error) => {
  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("asset/image/logox128.png"),
    title: "SyncLeet: Error",
    message: error.message,
  });
  chrome.storage.local.set({ backgroundError: error.message });
  console.error(error);
};

runMain().catch(onError);
