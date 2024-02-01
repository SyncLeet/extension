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
        const { titleSlug } = submissionDetails.question;
        const { runtimeDisplay, memoryDisplay } = submissionDetails;
        const { difficulty } = questionDetails;
        const extension = extensionLookup[submissionDetails.lang.name] || "";
        const file = `${difficulty}/${titleSlug}.${extension}`;
        // Prepare payload with base64-encoded content
        const payload = {
          owner: user.login,
          repo: "LeetCode",
          path: file,
          message:
            submissionDetails.totalCorrect == submissionDetails.totalTestcases
              ? `:white_check_mark: ${titleSlug} [${runtimeDisplay}; ${memoryDisplay}]`
              : `:x: ${titleSlug}`,
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
            chrome.storage.local.set({ options });
            const octokit = new Octokit(options);
            await newSyncingRepository(octokit);
            launchSubmissionListener();
            launchGraphQueryListener();
            await launchMessageListener(octokit);
        }
      }
    );
  } else {
    const octokit = new Octokit(items.options);
    launchSubmissionListener();
    launchGraphQueryListener();
    await launchMessageListener(octokit);
  }
});
