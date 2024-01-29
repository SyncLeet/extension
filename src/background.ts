import { getAccessToken } from "./modules/service";
import { getUserEmail, getUserIdentity } from "./modules/service";
import { GraghQueryRequest } from "./modules/interface";
import { Message } from "./modules/message";

/**
 * React to LeetCode Activities
 */

const submittedIds = new Set<number>();

const launchSubmissionListener = () => {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const match = details.url.match(/detail\/(.*?)\/check/);
      submittedIds.add(parseInt(match[1], 10));
    },
    { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
  );
};

const launchGraphQueryListener = () => {
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const encoded = details.requestBody.raw[0].bytes;
      const decoder = new TextDecoder("utf-8");
      const decoded = decoder.decode(encoded);
      const request: GraghQueryRequest = JSON.parse(decoded);
      if (request.operationName == "submissionDetails") {
        const sid = request.variables.submissionId;
        if (submittedIds.delete(sid)) {
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

/**
 * @example console.log(message.payload.details)
 * {
 *   "runtimeDisplay": "36 ms",
 *   "runtimePercentile": 91.8451,
 *   "memoryDisplay": "17.5 MB",
 *   "memoryPercentile": 45.47570000000001,
 *   "code": "class Solution:\n    def hIndex(self, citations: List[int]) -> int:\n        citations.sort()\n        n, h = len(citations), 0\n        for i, x in enumerate(citations):\n            papersLeft = n - i\n            for y in range(h, x):\n                if papersLeft >= y:\n                    h = y\n            if papersLeft >= x:\n                h = x\n                continue\n            break\n        return h",
 *   "lang": {
 *     "name": "python3"
 *   },
 *   "question": {
 *     "questionId": "274",
 *     "titleSlug": "h-index"
 *   }
 * }
 */

const repo = "leetcode";

const launchMessageListener = (
  accessToken: string,
  name: string,
  login: string,
  email: string
) => {
  chrome.runtime.onMessage.addListener((message: Message) => {
    switch (message.type) {
      case "responseDetails":
        const { details } = message.payload;
        fetch(
          `https://api.github.com/repos/${login}/${repo}/contents/${details.question.titleSlug}.txt`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        ).then((response) => {
          if (response.ok) {
            return response.json().then((data) => {
              fetch(
                `https://api.github.com/repos/${login}/${repo}/contents/${details.question.titleSlug}.txt`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({
                    message: `${details.question.titleSlug}; ${details.runtimeDisplay}; ${details.memoryDisplay}`,
                    committer: { name, email },
                    content: btoa(details.code),
                    sha: data.sha,
                  }),
                }
              );
            });
          }
          fetch(
            `https://api.github.com/repos/${login}/${repo}/contents/${details.question.titleSlug}.txt`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                message: `${details.question.titleSlug}; ${details.runtimeDisplay}; ${details.memoryDisplay}`,
                committer: { name, email },
                content: btoa(details.code),
              }),
            }
          );
        });
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

const webAuthFlowCallback = async (responseURL: string) => {
  const match = responseURL.match(/code=(.*)/);
  const { accessToken } = await getAccessToken(match[1]);
  const [{ name, login }, { email }] = await Promise.all([
    getUserIdentity(accessToken),
    getUserEmail(accessToken),
  ]);
  launchSubmissionListener();
  launchGraphQueryListener();
  launchMessageListener(accessToken, name, login, email);
};

chrome.identity.launchWebAuthFlow(webAuthFlowOptions, webAuthFlowCallback);
