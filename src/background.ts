import { Octokit } from "octokit";
import { newOctokitOptions, newSyncingRepository } from "./modules/service";
import { GraghQueryRequest } from "./modules/interface";
import { Message } from "./modules/message";
import { extensionLookup } from "./modules/constant";

/**
 * React to LeetCode Activities
 */

const submittedIds = new Set<number>();

const launchSubmissionListener = () => {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      // Extract submission id from url
      const match = details.url.match(/detail\/(.*?)\/check/);
      submittedIds.add(parseInt(match[1], 10));
    },
    { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
  );
};

const launchGraphQueryListener = () => {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      // Decode request body
      const encoded = details.requestBody.raw[0].bytes;
      const decoder = new TextDecoder("utf-8");
      const decoded = decoder.decode(encoded);
      const request: GraghQueryRequest = JSON.parse(decoded);
      // Check if request is for submission details
      if (request.operationName == "submissionDetails") {
        const sid = request.variables.submissionId;
        if (submittedIds.delete(sid)) {
          // Ask content script to retrieve those details
          chrome.tabs.sendMessage(details.tabId, {
            type: "requestDetails",
            payload: {
              id: sid,
            },
          });
        }
      }
    },
    { urls: ["https://leetcode.com/graphql/"] },
    ["requestBody"]
  );
};

/**
 * React to Incoming Messages
 */

const launchMessageListener = async (octokit: Octokit) => {
  const { data: user } = await octokit.rest.users.getAuthenticated();
  chrome.runtime.onMessage.addListener(async (message: Message) => {
    switch (message.type) {
      case "responseDetails":
        // Extract details from message
        const { submissionDetails, questionDetails } = message.payload;
        const { titleSlug, title } = submissionDetails.question;
        const { runtimeDisplay, memoryDisplay } = submissionDetails;
        const { topicTags } = questionDetails;
        const extension = extensionLookup[submissionDetails.lang.name] || "";
        // Check if the submission is successful
        if (submissionDetails.totalCorrect != submissionDetails.totalTestcases) {
          break;
        }
        // Sync to GitHub by topic tags
        for (const tag of topicTags) {
          const file = `${tag.slug}/${titleSlug}.${extension}`;
          // Prepare payload with base64-encoded content
          const payload = {
            owner: user.login,
            repo: "LeetCode",
            path: file,
            message: `:white_check_mark: ${titleSlug} [${runtimeDisplay}; ${memoryDisplay}]`,
            content: btoa(submissionDetails.code),
          };
          // Update if file exists, create otherwise
          try {
            const { data } = await octokit.rest.repos.getContent({
              owner: user.login,
              repo: "LeetCode",
              path: file,
            });
            switch (Array.isArray(data) ? data[0].type : data.type) {
              case "file":
                octokit.rest.repos.createOrUpdateFileContents({
                  ...payload,
                  sha: Array.isArray(data) ? data[0].sha : data.sha,
                });
            }
          } catch (error) {
            octokit.rest.repos.createOrUpdateFileContents(payload);
          }
        }
        // Send notification after successful operation
        const notificationID = `${titleSlug}-${Date.now()}`
        chrome.notifications.create(notificationID, {
          type: "basic",
          iconUrl: "logo.png",
          title: "SyncLeet",
          message: `Question "${title}" synced to GitHub`,
        });
        break;
    }
    return true;
  });
};

/**
 * Handle OAuth2 flow with GitHub
 */

const authParams = new URLSearchParams({
  client_id: process.env.CLIENT_ID,
  redirect_uri: chrome.identity.getRedirectURL(),
  scope: "repo user:email",
});

const webAuthFlowOptions = {
  url: `https://github.com/login/oauth/authorize?${authParams}`,
  interactive: true,
};

const launchListeners = async (octokit: Octokit) => {
  await newSyncingRepository(octokit);
  launchSubmissionListener();
  launchGraphQueryListener();
  await launchMessageListener(octokit);
};

chrome.storage.local.get("options", async (items) => {
  if (!items.options) {
    chrome.identity.launchWebAuthFlow(
      webAuthFlowOptions,
      async (responseURL) => {
        const code = new URL(responseURL).searchParams.get("code");
        switch (code) {
          case null:
            throw new Error("Failed to Retrieve Authorization Code");
          default:
            const options = await newOctokitOptions(code);
            await chrome.storage.local.set({ options });
            const octokit = new Octokit(options);
            await launchListeners(octokit);
        }
      }
    );
  } else {
    const octokit = new Octokit(items.options);
    await launchListeners(octokit);
  }
});
